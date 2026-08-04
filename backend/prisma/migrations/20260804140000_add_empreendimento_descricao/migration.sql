-- `descricao` existe no model Prisma de Empreendimento, mas não foi criada
-- pela migration inicial. A verificação mantém a migration idempotente para
-- bancos anteriormente sincronizados com `prisma db push`.
SET @has_descricao := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'Empreendimento'
    AND COLUMN_NAME = 'descricao'
);

SET @sql := IF(
  @has_descricao = 0,
  'ALTER TABLE `Empreendimento` ADD COLUMN `descricao` TEXT NULL',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
