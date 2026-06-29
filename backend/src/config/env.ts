export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dantadrishti-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '12h',
  /** AI confidence below which a finding is routed to human review. */
  aiConfidenceThreshold: Number(process.env.AI_CONFIDENCE_THRESHOLD ?? 0.7),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  /** MongoDB connection (Docker). Falls back to in-memory if unreachable. */
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27018',
  mongoDb: process.env.MONGODB_DB ?? 'dantadrishti',
  /** Set RESEED=true to wipe + reseed the database on boot. */
  reseed: process.env.RESEED === 'true',
};
