/*
  Warnings:

  - You are about to drop the column `id_user` on the `AccountsReceivable` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountsReceivable" DROP CONSTRAINT "AccountsReceivable_id_user_fkey";

-- AlterTable
ALTER TABLE "AccountsReceivable" DROP COLUMN "id_user";
