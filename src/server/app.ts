import Fastify from "fastify";
import sensible from "@fastify/sensible";

import { env } from "../config/env.js";
import { registerAdminRoutes } from "../modules/admin/routes.js";
import { registerBillingRoutes } from "../modules/billing/routes.js";
import { registerCharactersRoutes } from "../modules/characters/routes.js";
import { registerHealthRoutes } from "../modules/health/routes.js";
import { registerSessionsRoutes } from "../modules/sessions/routes.js";
import { registerUsersRoutes } from "../modules/users/routes.js";
import { registerWorldsRoutes } from "../modules/worlds/routes.js";
import { ApiError } from "../lib/api-error.js";

export const buildApp = () => {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL
    }
  });

  app.register(sensible);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
    }

    app.log.error(error);

    return reply.status(500).send({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected server error.",
        details: null
      }
    });
  });

  app.get("/", async () => {
    return {
      name: "llmquest-backend",
      status: "ok"
    };
  });

  app.register(registerHealthRoutes, { prefix: "/api/v1" });
  app.register(registerUsersRoutes, { prefix: "/api/v1" });
  app.register(registerWorldsRoutes, { prefix: "/api/v1" });
  app.register(registerCharactersRoutes, { prefix: "/api/v1" });
  app.register(registerSessionsRoutes, { prefix: "/api/v1" });
  app.register(registerBillingRoutes, { prefix: "/api/v1" });
  app.register(registerAdminRoutes, { prefix: "/api/v1" });

  return app;
};

