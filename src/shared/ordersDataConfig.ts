/** S3 public JSON cache is the order ingestion path for Devvit. */
export const ORDERS_DATA_SOURCE = 's3PublicJson' as const;

export const ORDERS_CACHE_OBJECT_KEY = 'orders-cache.json';
export const ORDERS_CACHE_S3_BUCKET = 'superearth-dispatch-orders-live-prod';
export const ORDERS_CACHE_S3_REGION = 'us-east-1';

export const ORDERS_CACHE_URL = `https://${ORDERS_CACHE_S3_BUCKET}.s3.${ORDERS_CACHE_S3_REGION}.amazonaws.com/${ORDERS_CACHE_OBJECT_KEY}`;
