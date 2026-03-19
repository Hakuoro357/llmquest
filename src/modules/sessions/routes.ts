import type { FastifyInstance } from "fastify";

import { buildTurnPipelinePlaceholder } from "./turn-pipeline.js";

export const registerSessionsRoutes = async (app: FastifyInstance) => {
  app.get("/sessions", async () => {
    return {
      items: [],
      message: "Stub endpoint. Implement session listing from Prisma next."
    };
  });

  app.post("/sessions", async () => {
    return {
      message: "Stub endpoint. Implement session creation and resume behavior next."
    };
  });

  app.post("/sessions/:sessionId/turns", async () => {
    return {
      message: "Turn pipeline scaffold is in place but not wired yet.",
      pipeline: buildTurnPipelinePlaceholder()
    };
  });
};

