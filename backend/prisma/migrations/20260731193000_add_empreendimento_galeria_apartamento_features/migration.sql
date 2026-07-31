-- Expand image storage and apartment setup fields
ALTER TABLE `Empreendimento`
  MODIFY `imagemUrl` LONGTEXT NULL,
  ADD COLUMN IF NOT EXISTS `blocosCount` INT NULL,
  ADD COLUMN IF NOT EXISTS `andaresPorBloco` INT NULL,
  ADD COLUMN IF NOT EXISTS `apartamentosPorAndar` INT NULL;

-- Create the gallery table if it was never created by previous migrations
CREATE TABLE IF NOT EXISTS `GaleriaImagem` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `empreendimentoId` INT NOT NULL,
  `url` LONGTEXT NOT NULL,
  `categoria` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NULL,
  `isCapa` BOOLEAN NOT NULL DEFAULT false,
  `ordem` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `GaleriaImagem`
  ADD CONSTRAINT `GaleriaImagem_empreendimentoId_fkey`
  FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `GaleriaImagem`
  MODIFY `url` LONGTEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS `isCapa` BOOLEAN NOT NULL DEFAULT false;
