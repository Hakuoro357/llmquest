import type { FastifyReply, FastifyRequest } from "fastify";

export type FastifyRouteHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<unknown>;

export const asyncHandler =
  (handler: FastifyRouteHandler) =>
  async (request: FastifyRequest, reply: FastifyReply) => {
    return handler(request, reply);
  };

