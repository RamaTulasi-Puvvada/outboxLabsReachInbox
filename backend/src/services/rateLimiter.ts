import { redis } from '../config/clients.js';

export async function checkLimit(senderId: string, limit: number) {
  const now = new Date();
  const key = `rate_limit:${senderId}:${now.toISOString().slice(0, 13)}`;

  const script = `
    local current = redis.call('GET', KEYS[1])
    if not current then
      current = 0
    else
      current = tonumber(current)
    end
    if current < tonumber(ARGV[1]) then
      local next = redis.call('INCR', KEYS[1])
      if next == 1 then
        redis.call('EXPIRE', KEYS[1], 3900)
      end
      return next
    else
      return current
    end
  `;

  const count = Number(await redis.eval(script, 1, key, String(limit)));

  const next = new Date(now);
  next.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);

  return {
    allowed: count <= limit,
    delay: Math.max(1000, next.getTime() - now.getTime()),
    count,
  };
}