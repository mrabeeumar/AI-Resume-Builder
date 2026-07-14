// Structured JSON logger for server-side observability. Emits one JSON
// object per line so any log drain (Vercel, Azure Log Analytics, etc.) can
// parse it without extra configuration. Redacts fields that could leak
// secrets or user content before anything is serialized.
type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown>;

const REDACTED = "[redacted]";

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "resume",
  "resumecontent",
  "content",
  "prompt",
  "coverletter",
  "summary",
  "bullet",
  "message",
  "body",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redact(val, depth + 1),
    ]),
  );
}

export function serializeError(error: unknown): LogMeta {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: String(error) };
}

function write(level: LogLevel, message: string, meta?: LogMeta): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta && isPlainObject(meta) ? (redact(meta) as LogMeta) : {}),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, meta?: LogMeta) => write("error", message, meta),
};
