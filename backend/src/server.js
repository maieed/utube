require("dotenv").config();

const path = require("path");
const { createApp } = require("./app");
const { TelegramCatalogService } = require("./services/telegramCatalog");

const bootstrap = async () => {
  const catalogPath = path.resolve(process.cwd(), process.env.CATALOG_PATH || "./data/video-catalog.json");
  const catalogService = new TelegramCatalogService({
    token: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
    catalogPath
  });

  await catalogService.init();

  const syncIntervalMs = Math.max(15_000, Number(process.env.SYNC_INTERVAL_MS || 45_000));
  if (catalogService.isConfigured()) {
    setInterval(() => {
      catalogService.syncNow().catch((error) => {
        console.error("Background sync failed:", error.message);
      });
    }, syncIntervalMs);
  } else {
    console.warn("Telegram integration is not configured. Serving demo catalog only.");
  }

  const app = createApp({ catalogService });
  const port = Number(process.env.PORT || 4000);

  app.listen(port, () => {
    console.log(`MmsHub backend running on http://localhost:${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
