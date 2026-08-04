-- Colunas presentes no schema Prisma que não foram incluídas na migration
-- anterior de Empreendimento. As verificações tornam a correção segura também
-- para bancos que já receberam essas colunas via `prisma db push`.
SET @has_endereco := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Empreendimento' AND COLUMN_NAME = 'endereco'
);
SET @sql := IF(@has_endereco = 0,
  'ALTER TABLE `Empreendimento` ADD COLUMN `endereco` VARCHAR(191) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_latitude := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Empreendimento' AND COLUMN_NAME = 'latitude'
);
SET @sql := IF(@has_latitude = 0,
  'ALTER TABLE `Empreendimento` ADD COLUMN `latitude` DOUBLE NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_longitude := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Empreendimento' AND COLUMN_NAME = 'longitude'
);
SET @sql := IF(@has_longitude = 0,
  'ALTER TABLE `Empreendimento` ADD COLUMN `longitude` DOUBLE NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_data_lancamento := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Empreendimento' AND COLUMN_NAME = 'dataLancamento'
);
SET @sql := IF(@has_data_lancamento = 0,
  'ALTER TABLE `Empreendimento` ADD COLUMN `dataLancamento` DATETIME(3) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_data_previsao := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Empreendimento' AND COLUMN_NAME = 'dataPrevisaoConstrucao'
);
SET @sql := IF(@has_data_previsao = 0,
  'ALTER TABLE `Empreendimento` ADD COLUMN `dataPrevisaoConstrucao` DATETIME(3) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
