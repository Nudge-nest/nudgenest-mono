-- CreateTable
CREATE TABLE "BillingCharge" (
    "id" STRING NOT NULL,
    "shop" STRING NOT NULL,
    "chargeId" STRING NOT NULL,
    "name" STRING NOT NULL,
    "price" FLOAT8 NOT NULL,
    "status" STRING NOT NULL,
    "test" BOOL NOT NULL DEFAULT true,
    "billingOn" TIMESTAMP(3),
    "trialEndsOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCharge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingCharge_chargeId_key" ON "BillingCharge"("chargeId");
