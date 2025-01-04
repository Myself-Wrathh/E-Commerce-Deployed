import Redis from "ioredis"

export const redis = new Redis("rediss://default:AVidAAIjcDE3MGU5NjUwMGZjODU0OTY4OWNlOTZhMGU1ZThiYmU1MnAxMA@poetic-firefly-22685.upstash.io:6379");
await redis.set('foo2', 'bar2');