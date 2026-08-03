-- Add default commission percentage to Imobiliaria when missing.
SET @has_comissao_percent := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Imobiliaria'
    AND COLUMN_NAME = 'comissaoPercent'
);

SET @sql := IF(
  @has_comissao_percent = 0,
  'ALTER TABLE `Imobiliaria` ADD COLUMN `comissaoPercent` DOUBLE NOT NULL DEFAULT 5.0',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
