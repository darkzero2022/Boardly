-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GlobalNotifConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "allowInApp" BOOLEAN NOT NULL DEFAULT true,
    "allowEmail" BOOLEAN NOT NULL DEFAULT true,
    "allowTeams" BOOLEAN NOT NULL DEFAULT false,
    "allowBrowser" BOOLEAN NOT NULL DEFAULT false,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "vapidPublicKey" TEXT,
    "vapidPrivateKey" TEXT,
    "allowMicrosoftSSO" BOOLEAN NOT NULL DEFAULT true,
    "allowCredentials" BOOLEAN NOT NULL DEFAULT true,
    "setupComplete" BOOLEAN NOT NULL DEFAULT false,
    "appMode" TEXT NOT NULL DEFAULT 'team'
);
INSERT INTO "new_GlobalNotifConfig" ("allowBrowser", "allowCredentials", "allowEmail", "allowInApp", "allowMicrosoftSSO", "allowTeams", "id", "smtpHost", "smtpPass", "smtpPort", "smtpUser", "vapidPrivateKey", "vapidPublicKey") SELECT "allowBrowser", "allowCredentials", "allowEmail", "allowInApp", "allowMicrosoftSSO", "allowTeams", "id", "smtpHost", "smtpPass", "smtpPort", "smtpUser", "vapidPrivateKey", "vapidPublicKey" FROM "GlobalNotifConfig";
DROP TABLE "GlobalNotifConfig";
ALTER TABLE "new_GlobalNotifConfig" RENAME TO "GlobalNotifConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
