CREATE TABLE `UserAccess` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `page` VARCHAR(191) NOT NULL,
  `canView` BOOLEAN NOT NULL DEFAULT false,
  `canEdit` BOOLEAN NOT NULL DEFAULT false,
  UNIQUE INDEX `UserAccess_userId_page_key`(`userId`, `page`),
  INDEX `UserAccess_userId_idx`(`userId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `UserAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
