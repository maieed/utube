const express = require("express");

const createSystemRoutes = (catalogService) => {
  const router = express.Router();

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "mmshub-backend",
      now: new Date().toISOString(),
      telegram: catalogService.metadata()
    });
  });

  return router;
};

module.exports = { createSystemRoutes };
