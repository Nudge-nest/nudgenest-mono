-- CreateTable
CREATE TABLE "BillingCharge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "test" BOOLEAN NOT NULL DEFAULT true,
    "billingOn" DATETIME,
    "trialEndsOn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingCharge_chargeId_key" ON "BillingCharge"("chargeId");
