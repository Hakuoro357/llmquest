export type UserPlanKey = "FREE" | "PREMIUM";

export type PlanCaps = {
  turnsPerPeriod: number;
  worldsTotal: number;
  charactersTotal: number;
};

export const PLAN_CAPS: Record<UserPlanKey, PlanCaps> = {
  FREE: {
    turnsPerPeriod: 40,
    worldsTotal: 2,
    charactersTotal: 3
  },
  PREMIUM: {
    turnsPerPeriod: 200,
    worldsTotal: 10,
    charactersTotal: 20
  }
};
