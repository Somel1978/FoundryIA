// PM2 process file for FoundryVTTAI.
//
//   pnpm build            # build first (and after every update)
//   pnpm pm2:start        # start / keep running in the background
//   pnpm pm2:logs         # follow logs
//
// Runs `next start` directly (not through pnpm/turbo) so PM2's signals and
// memory/crash monitoring apply to the real server process.
//
// Keep ONE instance (fork mode): the SQLite database and the in-memory login
// rate limiter live in a single process.
const path = require("node:path");

const root = __dirname;

module.exports = {
  apps: [
    {
      name: "foundryvttai",
      cwd: path.join(root, "apps/web"),
      script: path.join(root, "apps/web/node_modules/next/dist/bin/next"),
      args: "start --hostname 0.0.0.0",
      interpreter: "node",
      exec_mode: "fork",
      instances: 1,

      env: {
        NODE_ENV: "production",
        // Must be a real env var (Next binds before reading .env files).
        PORT: process.env.PORT || "3000",
        // Secrets (ADMIN_PASSWORD_HASH, SESSION_SECRET, …) come from the
        // repo-root .env created by `pnpm setup-env`; don't put them here.
      },

      // Crash recovery: restart with an exponential back-off (100ms → 15s)
      // so a crash loop doesn't hammer the machine. The back-off resets once
      // the app has stayed up for a while.
      autorestart: true,
      exp_backoff_restart_delay: 100,
      min_uptime: "30s",
      max_restarts: 50,
      // Restart if memory leaks past this.
      max_memory_restart: "1G",
      // Give in-flight requests/uploads time to finish on stop/reload.
      kill_timeout: 10000,

      out_file: path.join(root, "logs/out.log"),
      error_file: path.join(root, "logs/error.log"),
      merge_logs: true,
      time: true,
    },
  ],
};
