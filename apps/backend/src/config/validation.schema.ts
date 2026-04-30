import Joi from "joi";

const defaultCorsOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3002",
].join(",");

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),

  PORT: Joi.number().default(3001),

  CORS_ORIGINS: Joi.string().default(defaultCorsOrigins),
  BACKEND_PUBLIC_URL: Joi.string().uri().default("http://localhost:3001"),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),

  CLERK_SECRET_KEY: Joi.string().invalid("clerk_secret_key").required(),
  CLERK_WEBHOOK_SECRET: Joi.string().invalid("clerk_webhook_secret").required(),
  CLERK_PUBLISHABLE_KEY: Joi.string()
    .invalid("clerk_publishable_key")
    .required(),

  REDIS_URL: Joi.string().uri().optional(),
  REDIS_HOST: Joi.string().default("localhost"),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow("").optional(),

  POSTHOG_API_KEY: Joi.string().required(),
  POSTHOG_HOST: Joi.string().uri().default("https://app.posthog.com"),

  R2_ACCOUNT_ID: Joi.string().required(),
  R2_ACCESS_KEY_ID: Joi.string().required(),
  R2_SECRET_ACCESS_KEY: Joi.string().required(),
  R2_BUCKET: Joi.string().required(),
  R2_PUBLIC_BASE_URL: Joi.string().uri().allow("").optional(),

  SUPERADMIN_EMAILS: Joi.string().allow("").optional(),

  USE_REDIS_CACHING: Joi.boolean().default(true),
});