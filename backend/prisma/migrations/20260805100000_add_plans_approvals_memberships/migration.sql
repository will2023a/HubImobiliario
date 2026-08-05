ALTER TABLE `User`
  ADD COLUMN `isApproved` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `approvedAt` DATETIME(3) NULL,
  ADD COLUMN `approvedById` INTEGER NULL,
  ADD COLUMN `lastSeenAt` DATETIME(3) NULL;

-- Contas existentes continuam ativas. Novos cadastros usam o default false.
UPDATE `User` SET `isApproved` = true, `approvedAt` = CURRENT_TIMESTAMP(3);

CREATE TABLE `Plan` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `maxUsers` INTEGER NOT NULL,
  `maxImobiliarias` INTEGER NOT NULL DEFAULT 1,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Plan_code_key` (`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `Plan` (`code`, `name`, `maxUsers`, `maxImobiliarias`, `active`, `updatedAt`) VALUES
  ('users_10', 'Plano 10 usuários', 10, 1, true, CURRENT_TIMESTAMP(3)),
  ('users_20', 'Plano 20 usuários', 20, 1, true, CURRENT_TIMESTAMP(3)),
  ('users_30', 'Plano 30 usuários', 30, 2, true, CURRENT_TIMESTAMP(3)),
  ('users_40', 'Plano 40 usuários', 40, 2, true, CURRENT_TIMESTAMP(3)),
  ('users_50', 'Plano 50 usuários', 50, 3, true, CURRENT_TIMESTAMP(3));

ALTER TABLE `Imobiliaria`
  ADD COLUMN `ownerId` INTEGER NULL,
  ADD COLUMN `planId` INTEGER NULL;

CREATE TABLE `ImobiliariaAdmin` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `imobiliariaId` INTEGER NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ImobiliariaAdmin_userId_imobiliariaId_key` (`userId`, `imobiliariaId`),
  INDEX `ImobiliariaAdmin_imobiliariaId_idx` (`imobiliariaId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ImobiliariaAdmin_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ImobiliariaAdmin_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Imobiliaria`
  ADD CONSTRAINT `Imobiliaria_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Imobiliaria_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE `Imobiliaria`
SET `planId` = (SELECT `id` FROM `Plan` WHERE `code` = 'users_10')
WHERE `planId` IS NULL;

UPDATE `Imobiliaria` i
SET i.`ownerId` = (
  SELECT MIN(u.`id`) FROM `User` u
  WHERE u.`imobiliariaId` = i.`id` AND u.`role` = 'admin_imobiliaria'
)
WHERE i.`ownerId` IS NULL;

INSERT IGNORE INTO `ImobiliariaAdmin` (`userId`, `imobiliariaId`)
SELECT u.`id`, u.`imobiliariaId`
FROM `User` u
WHERE u.`role` = 'admin_imobiliaria' AND u.`imobiliariaId` IS NOT NULL;
