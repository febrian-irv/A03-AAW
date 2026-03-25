import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { db } from "./db";
import { orders } from "./db/schema";
import { eq } from "drizzle-orm";
import { publishEvent } from "./events";

const CATALOG_SERVICE_URL =
  process.env.CATALOG_SERVICE_URL || "http://localhost:3001";

interface CatalogLens {
  id: string;
  modelName: string;
  manufacturerName: string;
  dayPrice: string;
}

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "SuiLens Order Service API",
          version: "1.0.0",
          description:
            "API for managing lens rental orders in the SuiLens platform",
        },
        tags: [
          { name: "Orders", description: "Order management endpoints" },
          { name: "Health", description: "Service health check" },
        ],
      },
    })
  )
  .post(
    "/api/orders",
    async ({ body }) => {
      const lensResponse = await fetch(
        `${CATALOG_SERVICE_URL}/api/lenses/${body.lensId}`,
      );
      if (!lensResponse.ok) {
        return new Response(JSON.stringify({ error: "Lens not found" }), {
          status: 404,
        });
      }
      const lens = (await lensResponse.json()) as CatalogLens;

      const start = new Date(body.startDate);
      const end = new Date(body.endDate);
      const days = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days <= 0) {
        return new Response(
          JSON.stringify({ error: "End date must be after start date" }),
          { status: 400 },
        );
      }
      const totalPrice = (days * parseFloat(lens.dayPrice)).toFixed(2);

      const [order] = await db
        .insert(orders)
        .values({
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          lensId: body.lensId,
          lensSnapshot: {
            modelName: lens.modelName,
            manufacturerName: lens.manufacturerName,
            dayPrice: lens.dayPrice,
          },
          startDate: start,
          endDate: end,
          totalPrice,
        })
        .returning();
      if (!order) {
        return new Response(
          JSON.stringify({ error: "Failed to create order" }),
          { status: 500 },
        );
      }

      await publishEvent("order.placed", {
        orderId: order.id,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        lensName: lens.modelName,
      });

      return new Response(JSON.stringify(order), { status: 201 });
    },
    {
      body: t.Object({
        customerName: t.String({ description: "Customer full name" }),
        customerEmail: t.String({
          format: "email",
          description: "Customer email address",
        }),
        lensId: t.String({
          format: "uuid",
          description: "UUID of the lens to rent",
        }),
        startDate: t.String({ description: "Rental start date (ISO format)" }),
        endDate: t.String({ description: "Rental end date (ISO format)" }),
      }),
      detail: {
        tags: ["Orders"],
        summary: "Create a new order",
        description:
          "Create a new lens rental order. Validates lens availability via catalog service, calculates price, and publishes order.placed event.",
        responses: {
          201: { description: "Order created successfully" },
          400: { description: "Invalid date range" },
          404: { description: "Lens not found" },
          500: { description: "Failed to create order" },
        },
      },
    },
  )
  .get("/api/orders", async () => db.select().from(orders), {
    detail: {
      tags: ["Orders"],
      summary: "Get all orders",
      description: "Retrieve a list of all orders",
      responses: {
        200: { description: "List of orders retrieved successfully" },
      },
    },
  })
  .get("/api/orders/:id", async ({ params }) => {
    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.id));
    if (!results[0]) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
      });
    }
    return results[0];
  }, {
    params: t.Object({
      id: t.String({ format: "uuid", description: "Order UUID" }),
    }),
    detail: {
      tags: ["Orders"],
      summary: "Get order by ID",
      description: "Retrieve a specific order by its UUID",
      responses: {
        200: { description: "Order found" },
        404: { description: "Order not found" },
      },
    },
  })
  .get("/health", () => ({ status: "ok", service: "order-service" }), {
    detail: {
      tags: ["Health"],
      summary: "Health check",
      description: "Check if the order service is running",
    },
  })
  .listen(3002);

console.log(`Order Service running on port ${app.server?.port}`);
