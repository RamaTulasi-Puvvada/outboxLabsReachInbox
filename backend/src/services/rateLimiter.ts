import { redis } from '../config/clients.js';

export async function checkLimit(senderId: string, limit: number) {
  const now = new Date();
  const key = `rate_limit:${senderId}:${now.toISOString().slice(0, 13)}`;

  const script = `
    local current = redis.call('GET', KEYS[1])
    current = current and tonumber(current) or 0
    
    if current >= tonumber(ARGV[1]) then
      return { current, 0 }
    else
      local next = redis.call('INCR', KEYS[1])
      if next == 1 then
        redis.call('EXPIRE', KEYS[1], 3900)
      end
      return { next, 1 }
    end
  `;

  const result = (await redis.eval(script, 1, key, String(limit))) as [number, number];
  const count = result[0];
  const allowed = result[1] === 1;

  const next = new Date(now);
  next.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);

  return {
    allowed,
    delay: Math.max(1000, next.getTime() - now.getTime()),
    count,
  };
}