/** Runtime settings read from the environment (see .env.example). */

function intEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Largest request body accepted for uploads. Cloudflare rejects bodies over
 * 100 MB on Free/Pro plans (200 MB Business, 500 MB Enterprise), so keep this
 * at or below your plan's limit when serving through a tunnel.
 */
export const MAX_UPLOAD_BYTES = intEnv("MAX_UPLOAD_MB", 100) * 1024 * 1024;
