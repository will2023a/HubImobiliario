ALTER TABLE `Empreendimento`
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'planejamento',
  ADD COLUMN `destaque` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `videoUrl` VARCHAR(191) NULL,
  ADD COLUMN `quartosMin` INTEGER NULL, ADD COLUMN `quartosMax` INTEGER NULL,
  ADD COLUMN `suitesMin` INTEGER NULL, ADD COLUMN `suitesMax` INTEGER NULL,
  ADD COLUMN `vagasMin` INTEGER NULL, ADD COLUMN `vagasMax` INTEGER NULL,
  ADD COLUMN `areaMin` DOUBLE NULL, ADD COLUMN `areaMax` DOUBLE NULL;

ALTER TABLE `Unidade`
  ADD COLUMN `identificacao` VARCHAR(191) NULL, ADD COLUMN `tipo` VARCHAR(191) NULL,
  ADD COLUMN `area` DOUBLE NULL, ADD COLUMN `andar` INTEGER NULL,
  ADD COLUMN `quartos` INTEGER NULL, ADD COLUMN `suites` INTEGER NULL, ADD COLUMN `vagas` INTEGER NULL;

UPDATE `Unidade` SET `identificacao` = `numero` WHERE `identificacao` IS NULL;
UPDATE `Unidade` SET `status` = 'reservada' WHERE `status` = 'reservado';

CREATE TABLE `DocumentoEmpreendimento` (
  `id` INTEGER NOT NULL AUTO_INCREMENT, `empreendimentoId` INTEGER NOT NULL,
  `nome` VARCHAR(191) NOT NULL, `tipo` VARCHAR(191) NOT NULL DEFAULT 'outro',
  `url` LONGTEXT NOT NULL, `publico` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `DocumentoEmpreendimento_empreendimentoId_idx` (`empreendimentoId`), PRIMARY KEY (`id`),
  CONSTRAINT `DocumentoEmpreendimento_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CompartilhamentoEmpreendimento` (
  `id` INTEGER NOT NULL AUTO_INCREMENT, `token` VARCHAR(191) NOT NULL, `empreendimentoId` INTEGER NOT NULL,
  `createdById` INTEGER NOT NULL, `clienteNome` VARCHAR(191) NULL, `clienteEmail` VARCHAR(191) NULL,
  `permitirPrecos` BOOLEAN NOT NULL DEFAULT false, `permitirUnidades` BOOLEAN NOT NULL DEFAULT true,
  `ativo` BOOLEAN NOT NULL DEFAULT true, `expiresAt` DATETIME(3) NULL,
  `visualizacoes` INTEGER NOT NULL DEFAULT 0, `lastViewedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `CompartilhamentoEmpreendimento_token_key` (`token`),
  INDEX `CompartilhamentoEmpreendimento_empreendimentoId_ativo_idx` (`empreendimentoId`, `ativo`), PRIMARY KEY (`id`),
  CONSTRAINT `CompartilhamentoEmpreendimento_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CompartilhamentoEmpreendimento_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReservaUnidade` (
  `id` INTEGER NOT NULL AUTO_INCREMENT, `unidadeId` INTEGER NOT NULL, `createdById` INTEGER NOT NULL,
  `clienteNome` VARCHAR(191) NOT NULL, `clienteCpf` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ativa', `expiresAt` DATETIME(3) NOT NULL,
  `cancelledAt` DATETIME(3) NULL, `motivoCancelamento` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ReservaUnidade_unidadeId_status_expiresAt_idx` (`unidadeId`, `status`, `expiresAt`), PRIMARY KEY (`id`),
  CONSTRAINT `ReservaUnidade_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ReservaUnidade_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `UnidadeStatusHistorico` (
  `id` INTEGER NOT NULL AUTO_INCREMENT, `unidadeId` INTEGER NOT NULL,
  `statusAnterior` VARCHAR(191) NOT NULL, `statusNovo` VARCHAR(191) NOT NULL,
  `changedById` INTEGER NULL, `motivo` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `UnidadeStatusHistorico_unidadeId_createdAt_idx` (`unidadeId`, `createdAt`), PRIMARY KEY (`id`),
  CONSTRAINT `UnidadeStatusHistorico_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `UnidadeStatusHistorico_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
