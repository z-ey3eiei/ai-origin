import { bindings, defineConfig, defineWorker } from "cf/config";

/**
 * NEW Worker only: oneai-origin on *.workers.dev.
 * Do NOT rename to one-origin / do not attach 1origin.dev or custom routes here.
 */
export default defineConfig({
  accountId: "2d92bd5b25768fa9093d6adc0a8887fc",
  worker: defineWorker({
    name: "oneai-origin",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-01",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
