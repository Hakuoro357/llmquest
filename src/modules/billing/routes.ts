import type { FastifyInstance } from "fastify";

export const registerBillingRoutes = async (app: FastifyInstance) => {
  app.get("/billing/subscription", async () => {
    return {
      message: "Stub endpoint. Implement effective plan lookup next."
    };
  });

  app.post("/billing/checkout-session", async () => {
    return {
      message: "Stub endpoint. Implement Stripe checkout session creation next."
    };
  });

  app.post("/billing/webhook", async () => {
    return {
      received: true,
      message: "Stub endpoint. Implement Stripe webhook processing next."
    };
  });
};

