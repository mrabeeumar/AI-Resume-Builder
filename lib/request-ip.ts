// Best-effort client IP extraction for rate limiting. Trusts the
// `x-forwarded-for` header, which is safe here because these routes are only
// ever reached behind a reverse proxy/hosting platform that sets it; falls
// back to a shared bucket if neither header is present (e.g. local dev).
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
