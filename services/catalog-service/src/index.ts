import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { lenses } from "./db/schema";
import { eq } from "drizzle-orm";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "SuiLens Catalog Service API",
          version: "1.0.0",
          description:
            "API for managing the lens catalog in the SuiLens rental platform",
        },
        tags: [
          { name: "Lenses", description: "Lens catalog endpoints" },
          { name: "Health", description: "Service health check" },
        ],
      },
    })
  )
  .get("/api/lenses", async () => {
    return db.select().from(lenses);
  }, {
    detail: {
      tags: ["Lenses"],
      summary: "Get all lenses",
      description: "Retrieve a list of all available lenses in the catalog",
      responses: {
        200: {
          description: "List of lenses retrieved successfully",
        },
      },
    },
  })
  .get("/api/lenses/:id", async ({ params }) => {
    const results = await db
      .select()
      .from(lenses)
      .where(eq(lenses.id, params.id));
    if (!results[0]) {
      return new Response(JSON.stringify({ error: "Lens not found" }), {
        status: 404,
      });
    }
    return results[0];
  }, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Lens UUID" }),
    }),
    detail: {
      tags: ["Lenses"],
      summary: "Get lens by ID",
      description: "Retrieve a specific lens by its UUID",
      responses: {
        200: { description: "Lens found" },
        404: { description: "Lens not found" },
      },
    },
  })
  .get("/health", () => ({ status: "ok", service: "catalog-service" }), {
    detail: {
      tags: ["Health"],
      summary: "Health check",
      description: "Check if the catalog service is running",
    },
  })
  .listen(3001);

console.log(`Catalog Service running on port ${app.server?.port}`);
