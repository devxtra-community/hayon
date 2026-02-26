export const PLAN_LIMITS = {
  free: {
    maxPosts: 30,
    maxCaptionGenerations: 15,
  },
  pro: {
    maxPosts: 60,
    maxCaptionGenerations: 30,
  },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;
