-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "is_connected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "socket_id" VARCHAR(255);
