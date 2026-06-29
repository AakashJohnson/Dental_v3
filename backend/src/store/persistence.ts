/**
 * MongoDB persistence for the in-memory store.
 *
 * Strategy: keep the synchronous Map-based store for reads/writes, and mirror
 * every mutation to MongoDB through a write-through adapter. On boot we hydrate
 * the Maps from MongoDB so data survives restarts / hot-reloads. If MongoDB is
 * unavailable the caller falls back to a pure in-memory store.
 */
import { Db, MongoClient } from 'mongodb';
import { db as store, setPersistenceAdapter, PersistenceAdapter } from './db.js';

let client: MongoClient | null = null;

/** Serialised write queue so Mongo ops apply in order without blocking reads. */
let chain: Promise<unknown> = Promise.resolve();
function enqueue(op: () => Promise<unknown>): void {
  chain = chain.then(op).catch((e) => {
    // eslint-disable-next-line no-console
    console.error('[persistence] write failed:', (e as Error).message);
  });
}

function makeAdapter(mdb: Db): PersistenceAdapter {
  return {
    upsert(collection, doc) {
      const _id = doc.id;
      enqueue(() =>
        mdb
          .collection<{ _id: string }>(collection)
          .replaceOne({ _id }, { _id, ...doc }, { upsert: true }),
      );
    },
    remove(collection, id) {
      enqueue(() => mdb.collection<{ _id: string }>(collection).deleteOne({ _id: id }));
    },
    clear(collection) {
      enqueue(() => mdb.collection(collection).deleteMany({}));
    },
  };
}

/** Strip Mongo's `_id` so hydrated objects match the domain types exactly. */
function stripMongoId<T>(doc: Record<string, unknown>): T {
  const { _id, ...rest } = doc;
  void _id;
  return rest as T;
}

/**
 * Connect to MongoDB, hydrate the in-memory store from existing data, and
 * attach the write-through adapter. Returns true on success.
 */
export async function connectAndHydrate(uri: string, dbName: string): Promise<boolean> {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 3000 });
  await client.connect();
  const mdb = client.db(dbName);
  // Probe the connection so an unreachable server fails fast.
  await mdb.command({ ping: 1 });

  for (const [name, collection] of Object.entries(store)) {
    const docs = await mdb.collection(name).find({}).toArray();
    (collection as { load: (items: unknown[]) => void }).load(docs.map((d) => stripMongoId(d)));
  }

  setPersistenceAdapter(makeAdapter(mdb));
  return true;
}

/** Wait for all queued writes to flush (useful before a clean shutdown). */
export async function flushWrites(): Promise<void> {
  await chain;
}

export async function disconnect(): Promise<void> {
  await flushWrites();
  await client?.close();
  client = null;
  setPersistenceAdapter(null);
}
