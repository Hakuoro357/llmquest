import type { FastifyInstance } from "fastify";

import { PLAN_CAPS } from "../../lib/caps.js";

export const registerUsersRoutes = async (app: FastifyInstance) => {
  app.get("/me", async () => {
    return {
      message: "Stub endpoint. Wire auth/session lookup next.",
      data: null
    };
  });

  app.get("/usage", async () => {
    return {
      message: "Stub endpoint. Wire usage period lookup next.",
      caps: PLAN_CAPS
    };
  });
};

