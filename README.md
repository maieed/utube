# MmsHub

MmsHub is a YouTube-style video web app that uses a Telegram group/channel as the video source.

- No user authentication
- YouTube-like home feed + watch page UI
- Custom web player controls
- Telegram-backed catalog ingestion and media streaming proxy

## Project Structure

- `backend/` Express API + Telegram sync + media proxy
- `frontend/` React + Vite app (MmsHub UI)

## Backend Setup

1. Open `backend/.env.example` and copy it to `.env`
2. Fill:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
3. Install and run:

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:4000`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Telegram Requirements

1. Create a bot using `@BotFather`
2. Add bot to your target group/channel
3. Give the bot permission to read messages
4. For groups, disable privacy mode in `@BotFather` so the bot receives regular messages
5. Post videos in that chat; backend sync will pick them up

## API Endpoints

- `GET /api/health`
- `GET /api/videos?search=...&limit=...`
- `GET /api/videos/:id`
- `GET /api/videos/:id/stream`
- `GET /api/videos/:id/thumb`
- `POST /api/videos/sync`

## Deploy on Render

Deploy as 2 services: backend web service + frontend static site.

### 1) Deploy Backend (Web Service)

1. In Render dashboard, click **New +** -> **Web Service**
2. Connect repo: `https://github.com/maieed/utube`
3. Configure:
   - Root Directory: `backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables:
   - `PORT=10000` (Render default, safe to set explicitly)
   - `ALLOWED_ORIGINS=https://<your-frontend-domain.onrender.com>`
   - `TELEGRAM_BOT_TOKEN=<your-bot-token>`
   - `TELEGRAM_CHAT_ID=<your-chat-id>`
   - `SYNC_INTERVAL_MS=45000`
5. Deploy and copy backend URL, example:
   - `https://mmshub-backend.onrender.com`

### 2) Deploy Frontend (Static Site)

1. In Render dashboard, click **New +** -> **Static Site**
2. Connect same repo
3. Configure:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL=https://<your-backend-domain.onrender.com>`
5. Deploy

### 3) Final CORS Update

After frontend deploy, update backend `ALLOWED_ORIGINS` to your exact static-site URL and redeploy backend once.

## Notes

- If Telegram env vars are missing, backend serves demo videos so UI still works.
- Telegram files are proxied from backend, so bot token is not exposed in frontend code.
- `TELEGRAM_CHAT_ID` supports both numeric id (example `-1001234567890`) and handle (example `@mychannel`).
- Bot API can only read posts after bot is added; older channel posts will not auto-import.

## Telegram Troubleshooting

1. Open `GET /api/videos/debug/status` on your backend URL.
2. Check:
   - `configured` is `true`
   - `lastSyncError` is `null`
   - `resolvedChatId` is set
   - `recentChats` contains your target channel/group id
   - `totalVideos` is greater than `0` after posting a new video
3. If `totalVideos` stays `0`, post a brand new video in channel and call `POST /api/videos/sync`.
4. If `lastSyncError` mentions webhook conflict, redeploy backend (code now auto-disables webhook mode for polling).
5. If your channel appears in `recentChats` but ids differ from your `TELEGRAM_CHAT_ID`, replace env with that exact `id` and redeploy.
