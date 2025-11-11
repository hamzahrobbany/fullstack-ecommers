-- Add tenantId to Stock table
ALTER TABLE "Stock" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

UPDATE "Stock" AS s
SET "tenantId" = p."tenantId"
FROM "Product" AS p
WHERE p."id" = s."productId" AND s."tenantId" IS NULL;

ALTER TABLE "Stock"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Stock"
  ADD CONSTRAINT "Stock_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Stock_tenantId_idx" ON "Stock"("tenantId");
CREATE INDEX IF NOT EXISTS "Stock_tenantId_productId_idx" ON "Stock"("tenantId", "productId");

-- Add tenantId to OrderItem table
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

UPDATE "OrderItem" AS oi
SET "tenantId" = o."tenantId"
FROM "Order" AS o
WHERE o."id" = oi."orderId" AND oi."tenantId" IS NULL;

ALTER TABLE "OrderItem"
  ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "OrderItem_tenantId_idx" ON "OrderItem"("tenantId");
