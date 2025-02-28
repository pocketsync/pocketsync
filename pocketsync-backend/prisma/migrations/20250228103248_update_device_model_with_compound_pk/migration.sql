/*
  Warnings:

  - The primary key for the `devices` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "change_logs" DROP CONSTRAINT "change_logs_device_id_fkey";

-- AlterTable
ALTER TABLE "devices" DROP CONSTRAINT "devices_pkey",
ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("device_id", "user_identifier");

-- AddForeignKey
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_device_id_user_identifier_fkey" FOREIGN KEY ("device_id", "user_identifier") REFERENCES "devices"("device_id", "user_identifier") ON DELETE RESTRICT ON UPDATE CASCADE;
