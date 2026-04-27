import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rawPort = process.env.PORT;
const devPort =
  rawPort && !Number.isNaN(Number(rawPort)) ? Number(rawPort) : 5173;
const apiTarget = "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    // `vercel dev` sets PORT for the framework dev server; bind here or Vercel
    // never finishes wiring and :3000 never serves /api (proxy hangs / ECONNREFUSED).
    port: devPort,
    strictPort: Boolean(
      rawPort && !Number.isNaN(Number(rawPort)),
    ),
    // api/*.js runs in `vercel dev` — forward when using plain `vite` + proxy.
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
        timeout: 60_000,
        configure(proxy) {
          proxy.on("error", (err, req, res) => {
            console.error(
              `[vite] /api proxy -> ${apiTarget} failed (${req?.url}):`,
              err?.message || err,
            );
            if (res && !res.headersSent && typeof res.writeHead === "function") {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  ok: false,
                  error: "api_proxy_unreachable",
                  hint: "Run `vercel dev --listen 3000` (e.g. npm run dev:full) so /api is served.",
                }),
              );
            }
          });
        },
      },
    },
  },
});
