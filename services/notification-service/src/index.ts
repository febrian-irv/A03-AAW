import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { startConsumer } from "./consumer";
import { db } from "./db";
import { notifications } from "./db/schema";

// Store connected WebSocket clients
export const wsClients = new Set<any>();

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "SuiLens Notification Service API",
          version: "1.0.0",
          description:
            "API for managing notifications and real-time WebSocket updates in the SuiLens platform",
        },
        tags: [
          {
            name: "Notifications",
            description: "Notification endpoints",
          },
          {
            name: "WebSocket",
            description: "Real-time notification via WebSocket",
          },
          { name: "Health", description: "Service health check" },
        ],
      },
    })
  )
  .get("/api/notifications", async () => {
    return db.select().from(notifications);
  }, {
    detail: {
      tags: ["Notifications"],
      summary: "Get all notifications",
      description: "Retrieve a list of all notifications",
      responses: {
        200: { description: "List of notifications retrieved successfully" },
      },
    },
  })
  .ws("/ws", {
    open(ws) {
      wsClients.add(ws);
      console.log(`WebSocket client connected. Total: ${wsClients.size}`);
    },
    message(_ws, _message) {
      // No-op: server only broadcasts
    },
    close(ws) {
      wsClients.delete(ws);
      console.log(`WebSocket client disconnected. Total: ${wsClients.size}`);
    },
  })
  .get("/health", () => ({ status: "ok", service: "notification-service" }), {
    detail: {
      tags: ["Health"],
      summary: "Health check",
      description: "Check if the notification service is running",
    },
  })
  .listen(3003);

startConsumer().catch(console.error);

console.log(`Notification Service running on port ${app.server?.port}`);
