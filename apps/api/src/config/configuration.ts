export default () => ({
  port: parseInt(process.env.API_PORT || process.env.PORT || '8888', 10),
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-builder',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || '7d',
  },
  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    apiKey: process.env.AI_API_KEY,
    model: process.env.AI_MODEL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4000',
  },
});
