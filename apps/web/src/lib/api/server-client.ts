/**
 * API client configuration helper for server-side calls (SSR, NextAuth, etc.)
 *
 * Server-side code talks directly to the backend over the Docker internal
 * network using INTERNAL_API_URL. This never goes through the public internet.
 *
 * INTERNAL_API_URL  — set to http://api:8888/api in Docker / Dokploy
 *                     defaults to http://localhost:8888/api for local dev
 */

export function getApiUrl(): string {
  return process.env.INTERNAL_API_URL || "http://localhost:8888/api";
}

/**
 * Alias kept for backwards compatibility.
 */
export function getBaseUrl(): string {
  return getApiUrl();
}
