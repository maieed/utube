const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createSystemRoutes } = require("./routes/systemRoutes");
const { createVideoRoutes } = require("./routes/videoRoutes");

const normalizeOrigin = (origin) => String(origin || "").trim().replace(/\/$/, "");

const createApp = ({ catalogService }) => {
  const app = express();

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || !allowedOrigins.length) return callback(null, true);
        if (allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
        return callback(new Error("CORS origin not allowed"));
      }
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.use("/api", createSystemRoutes(catalogService));
  app.use("/api/videos", createVideoRoutes(catalogService));

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({
      error: error.message || "Internal Server Error"
    });
  });

  return app;
};

module.exports = { createApp };
