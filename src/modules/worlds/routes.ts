import type { FastifyInstance } from "fastify";

export const registerWorldsRoutes = async (app: FastifyInstance) => {
  app.get("/worlds", async () => {
    return {
      items: [],
      message: "Stub endpoint. Implement world listing from Prisma next."
    };
  });

  app.post("/worlds", async () => {
    return {
      message: "Stub endpoint. Implement world creation and hidden cap enforcement next."
    };
  });
};

