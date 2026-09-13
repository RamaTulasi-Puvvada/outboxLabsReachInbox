export const log = {
  info: (...a: unknown[]) =>
    console.log(new Date().toISOString(), 'INFO', ...a),

  warn: (...a: unknown[]) =>
    console.warn(new Date().toISOString(), 'WARN', ...a),

  error: (...a: unknown[]) =>
    console.error(new Date().toISOString(), 'ERROR', ...a),
};