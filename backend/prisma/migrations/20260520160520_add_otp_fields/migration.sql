-- AlterTable
ALTER TABLE `users` ADD COLUMN `passwordOtp` VARCHAR(191) NULL,
    ADD COLUMN `passwordOtpExpires` DATETIME(3) NULL;
