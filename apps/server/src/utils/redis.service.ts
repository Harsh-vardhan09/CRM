import { URL } from "url";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const parsedUrl = new URL(redisUrl);

export const redisConnection = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || "6379"),
  password: parsedUrl.password || undefined,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
