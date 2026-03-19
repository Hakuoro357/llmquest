import type { FastifyInstance } from "fastify";

import { prisma } from "../../lib/prisma.js";

export const registerHealthRoutes = async (app: FastifyInstance) => {
  app.get("/health", async () => {
    return {
      status: "ok"
    };
  });

  app.get("/ready", async () => {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ready",
      services: {
        db: "ok",
        llm: "not-configured"
      }
    };
  });
};

