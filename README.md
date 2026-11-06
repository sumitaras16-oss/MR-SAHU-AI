# MR SAHU AI — ChatGPT-inspired AI assistant

A black-and-white responsive chat interface with a server-side OpenAI Responses API connection. The API key stays on the server and is never placed in browser JavaScript.

## Current working features
- Real AI text chat through `POST /api/chat` when a valid server API key is configured.
- Conversation context while a chat is open.
- Up to 10 recent chats retained in memory in the current browser tab (not cloud-saved; refreshing the page clears them).
- Copy assistant responses.
- Basic IP rate limiting, request-size limits, Helmet security headers and an API health endpoint.
- Browser speech recognition + speech playback for voice-message-style interaction (browser/device/language support varies).

## Features not connected yet
AI photo editing and image generation, PDF upload/reading, user accounts, cloud-saved history, and true real-time two-way voice are not implemented in this version. Photo selection currently previews the image only.

## Run locally
Requires Node.js 20 or newer.

1. Open this folder in a terminal.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Put the API secret in `.env` on the server only: `OPENAI_API_KEY=...`.
5. Run `npm start`.
6. Open `http://localhost:3000`.

Never put the API key in `index.html`, `app.js`, GitHub, screenshots, or a public chat. Do not send the key in a message. API usage may cost money; a parent/guardian should manage the API account, billing, spending limits and deployment.

## Public deployment
This app needs a Node.js host; GitHub Pages alone cannot run `server.js`. A `render.yaml` blueprint is included as a deployment starting point. Before making it public, have a parent/guardian review hosting and billing, configure a strict provider spending limit, and add stronger abuse protection (for example, bot protection and per-user quotas). A public unauthenticated endpoint can be abused and create unexpected API costs. Do not collect visitors' personal details unless necessary.

## API endpoints
- `GET /api/health` — reports server status and whether the key is configured (does not reveal the key).
- `POST /api/chat` — accepts `{ "message": "...", "history": [{"role":"user|assistant","content":"..."}] }`.

The model defaults to `gpt-5.5`; set `OPENAI_MODEL` on the server if needed and available to your API account.
