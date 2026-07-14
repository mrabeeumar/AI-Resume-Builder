import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

const loggerInfoMock = vi.fn();
vi.mock("@/lib/logger", () => ({
  logger: { info: (...args: unknown[]) => loggerInfoMock(...args) },
}));

const handleRouteErrorMock = vi.fn();
vi.mock("@/lib/api-error", () => ({
  handleRouteError: (...args: unknown[]) => handleRouteErrorMock(...args),
}));

const { withRequestLog } = await import("@/lib/api-log");

describe("withRequestLog", () => {
  beforeEach(() => {
    authMock.mockReset();
    loggerInfoMock.mockClear();
    handleRouteErrorMock.mockClear();
  });

  it("logs route, userId, status, and duration on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    const handler = withRequestLog(
      "GET /api/resumes",
      async (_request: Request) =>
        NextResponse.json({ ok: true }, { status: 200 }),
    );

    const response = await handler(new Request("http://localhost/api/resumes"));

    expect(response.status).toBe(200);
    expect(loggerInfoMock).toHaveBeenCalledWith(
      "api_request",
      expect.objectContaining({
        route: "GET /api/resumes",
        userId: "user-1",
        status: 200,
      }),
    );
  });

  it("logs without a userId when there is no session", async () => {
    authMock.mockResolvedValue(null);
    const handler = withRequestLog(
      "POST /api/auth/register",
      async (_request: Request) =>
        NextResponse.json({ ok: true }, { status: 201 }),
    );

    await handler(new Request("http://localhost/api/auth/register"));

    expect(loggerInfoMock).toHaveBeenCalledWith(
      "api_request",
      expect.objectContaining({ userId: undefined, status: 201 }),
    );
  });

  it("still logs a response when session lookup itself throws", async () => {
    authMock.mockRejectedValue(new Error("session lookup failed"));
    const handler = withRequestLog(
      "GET /api/resumes",
      async (_request: Request) =>
        NextResponse.json({ ok: true }, { status: 200 }),
    );

    const response = await handler(new Request("http://localhost/api/resumes"));

    expect(response.status).toBe(200);
    expect(loggerInfoMock).toHaveBeenCalledWith(
      "api_request",
      expect.objectContaining({ userId: undefined }),
    );
  });

  it("routes handler errors through handleRouteError and still logs", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    handleRouteErrorMock.mockReturnValue(
      NextResponse.json({ error: "Something went wrong." }, { status: 500 }),
    );
    const handler = withRequestLog(
      "POST /api/resumes",
      async (_request: Request) => {
        throw new Error("boom");
      },
    );

    const response = await handler(new Request("http://localhost/api/resumes"));

    expect(response.status).toBe(500);
    expect(handleRouteErrorMock).toHaveBeenCalledWith(
      expect.any(Error),
      "POST /api/resumes",
    );
    expect(loggerInfoMock).toHaveBeenCalledWith(
      "api_request",
      expect.objectContaining({ status: 500 }),
    );
  });
});
