import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8888),
  MONGODB_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('7d'),
  AI_API_KEY: Joi.string().optional(),
  PLATFORM_GEMINI_API_KEY: Joi.string().optional(),
  REDIS_URL: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default('http://localhost:4000'),
  // Polar (billing) — optional in dev so the app boots without billing wired up
  POLAR_ACCESS_TOKEN: Joi.string().optional(),
  POLAR_WEBHOOK_SECRET: Joi.string().optional(),
  POLAR_PRODUCT_ID: Joi.string().optional(),
  POLAR_ENVIRONMENT: Joi.string().valid('sandbox', 'production').default('sandbox'),
  POLAR_SUCCESS_URL: Joi.string().optional(),
  // Optional outbound proxy for the job scanner (helps when sites block datacenter IPs)
  SCRAPING_PROXY_SERVER: Joi.string().optional(),
  SCRAPING_PROXY_USERNAME: Joi.string().optional(),
  SCRAPING_PROXY_PASSWORD: Joi.string().optional(),
  SCRAPING_PROXY_BYPASS: Joi.string().optional(),
});
