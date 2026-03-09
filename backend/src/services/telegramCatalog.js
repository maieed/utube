const fs = require("fs/promises");
const path = require("path");
const { Readable } = require("stream");
const { formatDuration, formatNumberShort, formatTimeAgo } = require("../utils/formatters");

const TELEGRAM_API_BASE = "https://api.telegram.org";
const MAX_VIDEOS = 500;

const normalizeChatHandle = (value) => String(value || "").trim().replace(/^@/, "").toLowerCase();
const isNumericLike = (value) => /^-?\d+$/.test(String(value || "").trim());

const DEMO_VIDEOS = [
  {
    id: "demo-1",
    title: "Welcome to MmsHub",
    description: "Connect your Telegram bot + group to replace this demo feed with your own uploads.",
    channelTitle: "MmsHub Demo",
    publishedAt: "2025-12-01T08:00:00.000Z",
    durationSeconds: 596,
    viewCount: 10523,
    tags: ["intro", "demo"],
    source: "demo",
    demoStreamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    demoThumbUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
  },
  {
    id: "demo-2",
    title: "Custom Player Controls Walkthrough",
    description: "The watch page uses a custom HTML5 player with seek, volume, speed and fullscreen controls.",
    channelTitle: "MmsHub Demo",
    publishedAt: "2025-11-28T12:30:00.000Z",
    durationSeconds: 201,
    viewCount: 5732,
    tags: ["player", "web"],
    source: "demo",
    demoStreamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    demoThumbUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg"
  },
  {
    id: "demo-3",
    title: "Telegram Feed Setup Guide",
    description: "Add bot to your group and disable privacy mode so new video posts are indexed automatically.",
    channelTitle: "MmsHub Demo",
    publishedAt: "2025-11-22T09:15:00.000Z",
    durationSeconds: 332,
    viewCount: 8124,
    tags: ["telegram", "setup"],
    source: "demo",
    demoStreamUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    demoThumbUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg"
  }
];

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const fileNameToTitle = (fileName) => {
  if (!fileName) return "";
  return String(fileName)
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

class TelegramCatalogService {
  constructor({ token, chatId, catalogPath }) {
    this.token = String(token || "").trim();
    this.chatIdRaw = String(chatId || "").trim();
    this.chatId = this.chatIdRaw;
    this.chatHandle = normalizeChatHandle(this.chatIdRaw);
    this.expectedChatId = isNumericLike(this.chatIdRaw) ? this.chatIdRaw : "";
    this.resolvedChatId = null;
    this.catalogPath = catalogPath;
    this.filePathCache = new Map();
    this.catalog = {
      lastUpdateId: 0,
      lastSyncedAt: null,
      videos: []
    };
    this.lastSyncError = null;
    this.lastUpdatesCount = 0;
    this.ready = false;
    this.syncPromise = null;
  }

  isConfigured() {
    return Boolean(this.token && this.chatId);
  }

  async init() {
    await this.#loadCatalog();
    this.ready = true;
    if (this.isConfigured()) {
      await this.#disableWebhookMode();
      await this.#resolveExpectedChatId();
      await this.syncNow();
    }
  }

  async syncNow() {
    if (!this.isConfigured()) return;
    if (this.syncPromise) return this.syncPromise;

    this.syncPromise = this.#syncInternal()
      .then(() => {
        this.lastSyncError = null;
      })
      .catch((error) => {
        this.lastSyncError = error.message || "Unknown sync error";
        throw error;
      })
      .finally(() => {
        this.syncPromise = null;
      });
    return this.syncPromise;
  }

  async listVideos({ search = "", limit = 24 }) {
    if (!this.ready) {
      await this.init();
    }
    if (this.isConfigured()) {
      await this.syncNow();
    }

    const term = String(search || "").trim().toLowerCase();
    const max = Math.min(60, Math.max(1, safeNumber(limit, 24)));

    const base = this.isConfigured() && this.catalog.videos.length > 0 ? this.catalog.videos : DEMO_VIDEOS;
    const filtered = term
      ? base.filter((video) => {
        const corpus = `${video.title} ${video.description || ""} ${video.channelTitle || ""} ${(video.tags || []).join(" ")}`.toLowerCase();
        return corpus.includes(term);
      })
      : base;

    return filtered.slice(0, max).map((video) => this.#toPublicVideo(video));
  }

  async getWatchPayload(id) {
    const videoId = String(id || "");
    const items = await this.listVideos({ limit: MAX_VIDEOS });
    const current = items.find((item) => item.id === videoId);
    if (!current) return null;

    const recommended = items.filter((item) => item.id !== current.id).slice(0, 20);
    return { video: current, recommended };
  }

  async proxyVideoById(id, req, res) {
    const video = this.catalog.videos.find((item) => item.id === String(id || ""));
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    return this.#proxyTelegramFile(video.videoFileId, req, res, "video/mp4");
  }

  async proxyThumbById(id, req, res) {
    const video = this.catalog.videos.find((item) => item.id === String(id || ""));
    if (!video || !video.thumbFileId) {
      return res.status(404).json({ error: "Thumbnail not found" });
    }
    return this.#proxyTelegramFile(video.thumbFileId, req, res, "image/jpeg");
  }

  metadata() {
    return {
      configured: this.isConfigured(),
      chatId: this.chatIdRaw || null,
      resolvedChatId: this.resolvedChatId,
      chatHandle: this.chatHandle || null,
      lastUpdateId: this.catalog.lastUpdateId,
      lastUpdatesCount: this.lastUpdatesCount,
      totalVideos: this.catalog.videos.length,
      lastSyncedAt: this.catalog.lastSyncedAt,
      lastSyncError: this.lastSyncError,
      reminder: this.isConfigured()
        ? "Only posts sent after bot addition are available via Bot API getUpdates."
        : null
    };
  }

  async #syncInternal() {
    let offset = safeNumber(this.catalog.lastUpdateId, 0) + 1;
    let hasNewUpdates = false;

    for (let page = 0; page < 8; page += 1) {
      const updates = await this.#telegramCall("getUpdates", {
        offset,
        limit: 100,
        timeout: 0,
        allowed_updates: ["message", "channel_post", "edited_message", "edited_channel_post"]
      });

      if (!Array.isArray(updates) || updates.length === 0) {
        this.lastUpdatesCount = 0;
        break;
      }

      hasNewUpdates = true;
      this.lastUpdatesCount = updates.length;

      for (const update of updates) {
        const message = this.#extractMessage(update);
        if (!message?.chat?.id) continue;
        if (!this.#isExpectedChat(message.chat)) continue;

        const media = this.#extractMedia(message);
        if (!media) continue;

        const record = this.#buildVideoRecord(message, media);
        this.#upsertVideo(record);
      }

      const maxUpdate = Math.max(...updates.map((update) => safeNumber(update.update_id)));
      this.catalog.lastUpdateId = maxUpdate;
      offset = maxUpdate + 1;

      if (updates.length < 100) break;
    }

    if (hasNewUpdates) {
      this.catalog.videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      this.catalog.videos = this.catalog.videos.slice(0, MAX_VIDEOS);
    }

    this.catalog.lastSyncedAt = new Date().toISOString();
    await this.#saveCatalog();
  }

  #isExpectedChat(chat) {
    const chatId = String(chat?.id || "");
    const chatUsername = normalizeChatHandle(chat?.username || "");

    if (this.resolvedChatId && chatId === String(this.resolvedChatId)) {
      return true;
    }

    if (this.expectedChatId && chatId === String(this.expectedChatId)) {
      return true;
    }

    if (this.chatHandle && chatUsername && this.chatHandle === chatUsername) {
      return true;
    }

    return false;
  }

  async #disableWebhookMode() {
    try {
      await this.#telegramCall("deleteWebhook", { drop_pending_updates: false });
    } catch (error) {
      console.warn("Telegram webhook mode check failed:", error.message);
    }
  }

  async #resolveExpectedChatId() {
    if (this.expectedChatId) {
      this.resolvedChatId = String(this.expectedChatId);
      return;
    }

    if (!this.chatHandle) return;

    const chatRef = this.chatIdRaw.startsWith("@") ? this.chatIdRaw : `@${this.chatHandle}`;
    try {
      const chat = await this.#telegramCall("getChat", { chat_id: chatRef });
      if (chat?.id) {
        this.resolvedChatId = String(chat.id);
      }
    } catch (error) {
      console.warn(`Could not resolve chat id for ${chatRef}:`, error.message);
    }
  }

  #extractMessage(update) {
    return update?.channel_post || update?.message || update?.edited_channel_post || update?.edited_message || null;
  }

  #extractMedia(message) {
    if (message.video?.file_id) {
      return {
        fileId: message.video.file_id,
        fileName: message.video.file_name || "",
        durationSeconds: safeNumber(message.video.duration),
        thumbFileId: message.video.thumbnail?.file_id || message.video.thumb?.file_id || null
      };
    }

    if (message.document?.file_id && String(message.document.mime_type || "").startsWith("video/")) {
      return {
        fileId: message.document.file_id,
        fileName: message.document.file_name || "",
        durationSeconds: safeNumber(message.document.duration),
        thumbFileId: message.document.thumbnail?.file_id || message.document.thumb?.file_id || null
      };
    }

    return null;
  }

  #buildVideoRecord(message, media) {
    const caption = String(message.caption || "").trim();
    const lines = caption
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const titleFromCaption = lines.find((line) => !line.startsWith("#")) || "";
    const descriptionLines = lines.filter((line) => line !== titleFromCaption);
    const tags = Array.from(new Set((caption.match(/#[a-zA-Z0-9_]+/g) || []).map((tag) => tag.toLowerCase().replace(/^#/, ""))));

    const title = titleFromCaption || fileNameToTitle(media.fileName) || `Video ${message.message_id}`;
    const publishedAt = new Date(safeNumber(message.date, Math.floor(Date.now() / 1000)) * 1000).toISOString();
    const seededViews = Math.max(50, (safeNumber(message.message_id) * 37) % 1_000_000);

    return {
      id: `${message.chat.id}_${message.message_id}`,
      chatId: String(message.chat.id),
      messageId: safeNumber(message.message_id),
      title,
      description: descriptionLines.join("\n"),
      tags,
      channelTitle: message.chat.title || "MmsHub Channel",
      publishedAt,
      durationSeconds: media.durationSeconds,
      viewCount: seededViews,
      videoFileId: media.fileId,
      thumbFileId: media.thumbFileId,
      source: "telegram"
    };
  }

  #upsertVideo(record) {
    const index = this.catalog.videos.findIndex((video) => video.id === record.id);
    if (index === -1) {
      this.catalog.videos.push(record);
      return;
    }
    this.catalog.videos[index] = { ...this.catalog.videos[index], ...record };
  }

  #toPublicVideo(video) {
    const base = {
      id: video.id,
      title: video.title,
      description: video.description || "",
      channelTitle: video.channelTitle || "MmsHub",
      durationSeconds: safeNumber(video.durationSeconds),
      durationLabel: formatDuration(video.durationSeconds),
      viewCount: safeNumber(video.viewCount),
      viewsLabel: `${formatNumberShort(video.viewCount)} views`,
      publishedAt: video.publishedAt,
      timeAgoLabel: formatTimeAgo(video.publishedAt),
      tags: video.tags || [],
      source: video.source || "telegram"
    };

    if (video.source === "demo") {
      return {
        ...base,
        streamUrl: video.demoStreamUrl,
        thumbnailUrl: video.demoThumbUrl
      };
    }

    return {
      ...base,
      streamUrl: `/api/videos/${encodeURIComponent(video.id)}/stream`,
      thumbnailUrl: video.thumbFileId ? `/api/videos/${encodeURIComponent(video.id)}/thumb` : ""
    };
  }

  async #proxyTelegramFile(fileId, req, res, fallbackType) {
    if (!this.isConfigured()) {
      return res.status(503).json({ error: "Telegram integration is not configured" });
    }
    const filePath = await this.#getTelegramFilePath(fileId);
    const url = `${TELEGRAM_API_BASE}/file/bot${this.token}/${filePath}`;

    const headers = {};
    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const upstream = await fetch(url, { headers });
    const headerWhitelist = ["content-type", "content-length", "content-range", "accept-ranges", "cache-control", "etag", "last-modified"];

    res.status(upstream.status);
    for (const headerName of headerWhitelist) {
      const value = upstream.headers.get(headerName);
      if (value) {
        res.setHeader(headerName, value);
      }
    }

    if (!upstream.headers.get("content-type") && fallbackType) {
      res.setHeader("content-type", fallbackType);
    }

    if (!upstream.body) {
      res.end();
      return;
    }

    Readable.fromWeb(upstream.body).pipe(res);
  }

  async #getTelegramFilePath(fileId) {
    if (this.filePathCache.has(fileId)) {
      return this.filePathCache.get(fileId);
    }

    const fileData = await this.#telegramCall("getFile", { file_id: fileId });
    if (!fileData?.file_path) {
      throw new Error("Telegram did not return a file_path");
    }
    this.filePathCache.set(fileId, fileData.file_path);
    return fileData.file_path;
  }

  async #telegramCall(method, payload = {}) {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${this.token}/${method}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Telegram API ${method} failed with status ${response.status}: ${text}`);
    }

    const json = await response.json();
    if (!json.ok) {
      throw new Error(`Telegram API ${method} returned error: ${json.description || "unknown error"}`);
    }

    return json.result;
  }

  async #loadCatalog() {
    try {
      const file = await fs.readFile(this.catalogPath, "utf8");
      const parsed = JSON.parse(file);
      this.catalog = {
        lastUpdateId: safeNumber(parsed.lastUpdateId, 0),
        lastSyncedAt: parsed.lastSyncedAt || null,
        videos: Array.isArray(parsed.videos) ? parsed.videos : []
      };
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      await fs.mkdir(path.dirname(this.catalogPath), { recursive: true });
      await this.#saveCatalog();
    }
  }

  async #saveCatalog() {
    await fs.mkdir(path.dirname(this.catalogPath), { recursive: true });
    await fs.writeFile(this.catalogPath, JSON.stringify(this.catalog, null, 2), "utf8");
  }
}

module.exports = { TelegramCatalogService };
