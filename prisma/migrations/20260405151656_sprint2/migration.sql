-- AlterTable
ALTER TABLE "Task" ADD COLUMN "lastRecurredAt" DATETIME;

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskWatcher" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("taskId", "userId"),
    CONSTRAINT "TaskWatcher_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskWatcher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TaskDependency_taskId_idx" ON "TaskDependency"("taskId");

-- CreateIndex
CREATE INDEX "TaskDependency_dependsOnId_idx" ON "TaskDependency"("dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnId_key" ON "TaskDependency"("taskId", "dependsOnId");

-- CreateIndex
CREATE INDEX "TaskWatcher_userId_idx" ON "TaskWatcher"("userId");
