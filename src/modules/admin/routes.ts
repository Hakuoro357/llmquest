import type { FastifyInstance } from "fastify";

export const registerAdminRoutes = async (app: FastifyInstance) => {
  app.get("/admin/health", async () => {
    return {
      message: "Admin scaffold is alive."
    };
  });
};
