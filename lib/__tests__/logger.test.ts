import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger, serializeError } from "@/lib/logger";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function loggedEntry(spy: ReturnType<typeof vi.spyOn>) {
    const [line] = spy.mock.calls[0] as [string];
    return JSON.parse(line);
  }

  it("emits info logs to console.log as structured JSON", () => {
    logger.info("api_request", { route: "GET /api/resumes", status: 200 });

    const entry = loggedEntry(logSpy);
    expect(entry.level).toBe("info");
    expect(entry.message).toBe("api_request");
    expect(entry.route).toBe("GET /api/resumes");
    expect(entry.status).toBe(200);
    expect(typeof entry.timestamp).toBe("string");
  });

  it("emits warn logs to console.warn", () => {
    logger.warn("slow_request", { durationMs: 5000 });

    const entry = loggedEntry(warnSpy);
    expect(entry.level).toBe("warn");
  });

  it("emits error logs to console.error", () => {
    logger.error("api_error", { route: "POST /api/resumes" });

    const entry = loggedEntry(errorSpy);
    expect(entry.level).toBe("error");
  });

  it("redacts sensitive keys before logging", () => {
    logger.info("api_request", {
      route: "POST /api/auth/register",
      password: "hunter2",
      token: "secret-token",
      content: "resume text that must never be logged",
    });

    const entry = loggedEntry(logSpy);
    expect(entry.password).toBe("[redacted]");
    expect(entry.token).toBe("[redacted]");
    expect(entry.content).toBe("[redacted]");
    expect(entry.route).toBe("POST /api/auth/register");
  });

  it("redacts sensitive keys nested inside objects and arrays", () => {
    logger.info("nested", {
      user: { password: "hunter2", name: "ok" },
      items: [{ token: "abc" }],
    });

    const entry = loggedEntry(logSpy);
    expect(entry.user.password).toBe("[redacted]");
    expect(entry.user.name).toBe("ok");
    expect(entry.items[0].token).toBe("[redacted]");
  });
});

describe("serializeError", () => {
  it("extracts name, message, and stack from Error instances", () => {
    const error = new Error("boom");
    const serialized = serializeError(error);

    expect(serialized.name).toBe("Error");
    expect(serialized.message).toBe("boom");
    expect(typeof serialized.stack).toBe("string");
  });

  it("falls back to string coercion for non-Error values", () => {
    expect(serializeError("plain string")).toEqual({ value: "plain string" });
    expect(serializeError(42)).toEqual({ value: "42" });
  });
});
