-- AlterTable
ALTER TABLE "AccountsReceivable" ALTER COLUMN "internal_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Clients" ALTER COLUMN "internal_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payments" ALTER COLUMN "internal_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "internal_id" DROP NOT NULL;
