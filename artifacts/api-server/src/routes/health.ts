import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { serverStats } from "../lib/serverStats.js";
import { getManager } from "../sockets/index.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok", server: "online" });
});

// ── Live server metrics (used by load balancer, Railway health checks, admin) ──
router.get("/stats", (_req, res) => {
  const roomStats = getManager()?.getStats() ?? { rooms: 0, players: 0 };
  serverStats.setRoomStats(roomStats.rooms, roomStats.players);
  res.json({
    status: "ok",
    ...serverStats.snapshot(),
  });
});

export default router;
