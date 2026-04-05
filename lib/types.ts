// String union types replacing Prisma enums (SQLite doesn't support native enums)

export type Role = "ADMIN" | "MANAGER" | "MEMBER";
export type Visibility = "PRIVATE" | "TEAM" | "PUBLIC";
export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type SLAStatus = "OK" | "AT_RISK" | "BREACHED";
export type SyncDirection = "BOTH" | "TO_PLANNER" | "FROM_PLANNER";
