-- Expand image storage and apartment setup fields in a MySQL-compatible way.
SET @has_blocos_count := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Empreendimento'
    AND COLUMN_NAME = 'blocosCount'
);
SET @has_andares_por_bloco := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Empreendimento'
    AND COLUMN_NAME = 'andaresPorBloco'
);
SET @has_apartamentos_por_andar := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Empreendimento'
    AND COLUMN_NAME = 'apartamentosPorAndar'
);
SET @sql := 'ALTER TABLE `Empreendimento` MODIFY `imagemUrl` LONGTEXT NULL';
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(@has_blocos_count = 0, 'ALTER TABLE `Empreendimento` ADD COLUMN `blocosCount` INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(@has_andares_por_bloco = 0, 'ALTER TABLE `Empreendimento` ADD COLUMN `andaresPorBloco` INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(@has_apartamentos_por_andar = 0, 'ALTER TABLE `Empreendimento` ADD COLUMN `apartamentosPorAndar` INT NULL', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_galeria_table := (
  SELECT COUNT(*)
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'GaleriaImagem'
);

SET @sql := IF(
  @has_galeria_table = 0,
  'CREATE TABLE `GaleriaImagem` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `empreendimentoId` INT NOT NULL,
    `url` LONGTEXT NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NULL,
    `isCapa` BOOLEAN NOT NULL DEFAULT false,
    `ordem` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    CONSTRAINT `GaleriaImagem_empreendimentoId_fkey`
      FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento`(`id`)
      ON DELETE CASCADE ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
