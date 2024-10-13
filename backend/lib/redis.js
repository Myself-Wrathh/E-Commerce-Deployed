import Redis from "ioredis"

export const redis = new Redis("rediss://default:AXJKAAIjcDE3YTE5NzJkNzI4NmI0MGQ0OGEyODZhNmFkOTA3ZGY2NXAxMA@notable-cod-29258.upstash.io:6379");
await redis.set('foo2', 'bar2');