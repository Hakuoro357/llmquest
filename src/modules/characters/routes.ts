import type { FastifyInstance } from "fastify";

export const registerCharactersRoutes = async (app: FastifyInstance) => {
  app.get("/characters", async () => {
    return {
      items: [],
      message: "Stub endpoint. Implement character listing from Prisma next."
    };
  });

  app.post("/characters", async () => {
    return {
      message: "Stub endpoint. Implement character creation with 4/3/2 stat rule next."
    };
  });
};

