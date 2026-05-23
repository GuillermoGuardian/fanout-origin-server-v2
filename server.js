/**
 * Origin minimalista — SOLO responde headers GRIP
 *
 * Este servidor no simula ni publica nada.
 * Su único trabajo es decirle a Fanout:
 *   - Mantener la conexión abierta (Grip-Hold: stream)
 *   - Suscribir al cliente al canal correcto (Grip-Channel)
 *
 * Los eventos los publica cualquier sistema externo:
 *   POST https://api.fastly.com/service/{id}/publish/
 */

import express from "express";
import cors from "cors";
import { ServeGrip } from "@fanoutio/serve-grip";

const app = express();
app.use(cors());

const FASTLY_SERVICE_ID = process.env.FASTLY_SERVICE_ID || "";
const FASTLY_API_TOKEN  = process.env.FASTLY_API_TOKEN  || "";
const IS_LOCAL          = process.env.NODE_ENV !== "production";

const GRIP_URL = IS_LOCAL
  ? "http://localhost:5561/"
  : { control_uri: "http://localhost/" }; // placeholder — publicamos via fetch directo

const serveGrip = new ServeGrip({ grip: GRIP_URL });
app.use(serveGrip);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ service: "Fanout GRIP origin", status: "ok" });
});

// ── SSE: todos los partidos ───────────────────────────────────────────────────
app.get("/stream/live", (req, res) => {
  if (!req.grip?.isProxied) {
    return res.status(200).json({ message: "Accede via Fastly Fanout edge" });
  }

  const grip = res.grip.startInstruct();
  grip.addChannel("live-scores");
  grip.setHoldStream();

  res.setHeader("Content-Type", "text/event-stream");
  res.end(": connected\n\n");
});

// ── SSE: partido específico ───────────────────────────────────────────────────
app.get("/stream/match/:matchId", (req, res) => {
  if (!req.grip?.isProxied) {
    return res.status(200).json({ message: "Accede via Fastly Fanout edge" });
  }

  const channel = `match-${req.params.matchId}`;
  const grip = res.grip.startInstruct();
  grip.addChannel(channel);
  grip.setHoldStream();

  res.setHeader("Content-Type", "text/event-stream");
  res.end(": connected\n\n");
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 GRIP origin corriendo en http://localhost:${PORT}`);
  console.log(`🌐 Modo: ${IS_LOCAL ? "LOCAL" : "PRODUCCIÓN"}`);
  console.log(`\nEste servidor SOLO gestiona suscripciones GRIP.`);
  console.log(`Los eventos se publican externamente al API de Fastly.\n`);
});
