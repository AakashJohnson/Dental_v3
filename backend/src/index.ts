import { createApp } from './app.js';
import { env } from './config/env.js';
import { seed } from './store/seed.js';
import { db, resetDb } from './store/db.js';
import { connectAndHydrate } from './store/persistence.js';

async function boot(): Promise<void> {
  let persistent = false;
  try {
    persistent = await connectAndHydrate(env.mongoUri, env.mongoDb);
    // eslint-disable-next-line no-console
    console.log(`MongoDB connected (${env.mongoUri}/${env.mongoDb}) — data is persistent.`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`MongoDB unavailable — using in-memory store. (${(e as Error).message})`);
  }

  // Seed when the database is empty, or when explicitly asked to reseed.
  if (persistent && env.reseed) {
    resetDb();
    seed();
    // eslint-disable-next-line no-console
    console.log('Database reseeded (RESEED=true).');
  } else if (!persistent || db.users.all().length === 0) {
    seed();
  }

  const app = createApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`DantaDrishti backend listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`Storage: ${persistent ? 'MongoDB (persistent)' : 'in-memory'}. Default password: Passw0rd!`);
  });
}

void boot();

