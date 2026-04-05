-- AlterTable
ALTER TABLE "Column" ADD COLUMN "wipLimit" INTEGER;

-- CreateTable
CREATE TABLE "TimeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimeLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoardTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ColumnTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardTemplateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "order" INTEGER NOT NULL DEFAULT 0,
    "wipLimit" INTEGER,
    CONSTRAINT "ColumnTemplate_boardTemplateId_fkey" FOREIGN KEY ("boardTemplateId") REFERENCES "BoardTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateSLAPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardTemplateId" TEXT NOT NULL,
    "criticalHours" INTEGER NOT NULL DEFAULT 4,
    "highHours" INTEGER NOT NULL DEFAULT 24,
    "mediumHours" INTEGER NOT NULL DEFAULT 72,
    "lowHours" INTEGER NOT NULL DEFAULT 168,
    CONSTRAINT "TemplateSLAPolicy_boardTemplateId_fkey" FOREIGN KEY ("boardTemplateId") REFERENCES "BoardTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "labelIds" TEXT NOT NULL DEFAULT '[]',
    "subtasks" TEXT NOT NULL DEFAULT '[]',
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TimeLog_taskId_idx" ON "TimeLog"("taskId");

-- CreateIndex
CREATE INDEX "TimeLog_userId_idx" ON "TimeLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSLAPolicy_boardTemplateId_key" ON "TemplateSLAPolicy"("boardTemplateId");
