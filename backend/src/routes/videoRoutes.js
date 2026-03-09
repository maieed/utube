const express = require("express");

const createVideoRoutes = (catalogService) => {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const items = await catalogService.listVideos({
        search: req.query.search,
        limit: req.query.limit
      });

      res.json({
        ...catalogService.metadata(),
        total: items.length,
        items,
        warning: catalogService.isConfigured()
          ? null
          : "Telegram is not configured yet. Demo videos are being served."
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/sync", async (_req, res, next) => {
    try {
      await catalogService.syncNow();
      res.json({
        ok: true,
        ...catalogService.metadata()
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const payload = await catalogService.getWatchPayload(req.params.id);
      if (!payload) {
        return res.status(404).json({ error: "Video not found" });
      }
      return res.json(payload);
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id/stream", async (req, res, next) => {
    try {
      await catalogService.proxyVideoById(req.params.id, req, res);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/thumb", async (req, res, next) => {
    try {
      await catalogService.proxyThumbById(req.params.id, req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
};

module.exports = { createVideoRoutes };
