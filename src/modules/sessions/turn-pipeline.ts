import { ApiError } from "../../lib/api-error.js";

export const assertSessionCanAcceptTurn = (status: string) => {
  if (status === "PROCESSING_TURN") {
    throw new ApiError(
      409,
      "SESSION_LOCKED",
      "Current session is already processing another turn."
    );
  }
};

export const buildTurnPipelinePlaceholder = () => {
  return {
    state: "not-implemented",
    nextSteps: [
      "load session and acquire lock in Postgres",
      "normalize player input",
      "resolve rules engine outcome",
      "call narrative model",
      "persist TurnExecution and GameEvent"
    ]
  };
};

