-- AlterTable
ALTER TABLE "Clients" ADD COLUMN     "address" TEXT,
ADD COLUMN     "creditLimit" DOUBLE PRECISION,
ADD COLUMN     "riskLevel" TEXT,
ADD COLUMN     "riskProbability" DOUBLE PRECISION,
ADD COLUMN     "riskScore" INTEGER,
ADD COLUMN     "riskUpdatedAt" TIMESTAMP(3);
