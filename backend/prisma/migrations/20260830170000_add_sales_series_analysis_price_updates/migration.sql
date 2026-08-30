-- ===== Fase 1: Tabela de venda por séries =====

ALTER TABLE `TabelaPreco`
  ADD COLUMN `validadeInicio` DATETIME(3) NULL,
  ADD COLUMN `validadeFim` DATETIME(3) NULL,
  ADD COLUMN `tipologia` VARCHAR(191) NULL;

DROP TABLE IF EXISTS `TabelaPrecoItem`;

CREATE TABLE `TabelaPrecoSerie` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tabelaId` INTEGER NOT NULL,
  `unidadeId` INTEGER NULL,
  `nome` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `inicioMes` INTEGER NOT NULL,
  `inicioAno` INTEGER NOT NULL,
  `valor` DOUBLE NOT NULL,
  `quantidade` INTEGER NOT NULL DEFAULT 1,
  `periodicidade` INTEGER NOT NULL DEFAULT 1,
  `aposHabitese` BOOLEAN NOT NULL DEFAULT false,
  `percentualTotal` DOUBLE NULL,
  `observacao` TEXT NULL,
  `ordem` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `TabelaPrecoSerie_tabelaId_idx` (`tabelaId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `TabelaPrecoSerie_tabelaId_fkey` FOREIGN KEY (`tabelaId`) REFERENCES `TabelaPreco` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ===== Fase 2: Simulação / análise de proposta =====

ALTER TABLE `Proposta`
  MODIFY `clienteSobrenome` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY `clienteRg` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY `clienteCpf` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY `clienteProfissao` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY `clienteRemuneracao` DOUBLE NOT NULL DEFAULT 0,
  MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'rascunho',
  ADD COLUMN `tabelaId` INTEGER NULL,
  ADD COLUMN `tipoAnalise` VARCHAR(191) NOT NULL DEFAULT 'simulacao',
  ADD COLUMN `valorTabela` DOUBLE NULL,
  ADD COLUMN `valorProposta` DOUBLE NULL,
  ADD COLUMN `diferenca` DOUBLE NULL,
  ADD COLUMN `resultadoAnalise` JSON NULL,
  ADD COLUMN `indicadores` JSON NULL,
  ADD COLUMN `requerAprovacao` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `aprovadoPorId` INTEGER NULL,
  ADD COLUMN `aprovadoEm` DATETIME(3) NULL,
  ADD COLUMN `motivoReprovacao` TEXT NULL,
  ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

ALTER TABLE `Proposta`
  ADD CONSTRAINT `Proposta_tabelaId_fkey` FOREIGN KEY (`tabelaId`) REFERENCES `TabelaPreco` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Proposta_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `PropostaSerie` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `propostaId` INTEGER NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `tipo` VARCHAR(191) NOT NULL,
  `inicioMes` INTEGER NOT NULL,
  `inicioAno` INTEGER NOT NULL,
  `quantidade` INTEGER NOT NULL DEFAULT 1,
  `valor` DOUBLE NOT NULL,
  `periodicidade` INTEGER NOT NULL DEFAULT 1,
  `aposHabitese` BOOLEAN NOT NULL DEFAULT false,
  `vencimentoDia` INTEGER NULL,
  `total` DOUBLE NOT NULL DEFAULT 0,
  `ordem` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `PropostaSerie_propostaId_idx` (`propostaId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `PropostaSerie_propostaId_fkey` FOREIGN KEY (`propostaId`) REFERENCES `Proposta` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ParametrosAnalise` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `empreendimentoId` INTEGER NOT NULL,
  `prazoFinanciamentoMax` INTEGER NULL,
  `captacaoAvistaMin` DOUBLE NULL,
  `captacaoAteHabiteseMin` DOUBLE NULL,
  `captacaoMensalMin` DOUBLE NULL,
  `diferencaAvMax` DOUBLE NULL,
  `descontoNominalMax` DOUBLE NULL,
  `exigirIntercalacao` BOOLEAN NOT NULL DEFAULT false,
  `taxaAtratividade` DOUBLE NULL,
  `toleranciaGeral` DOUBLE NOT NULL DEFAULT 0,
  `toleranciasJson` JSON NULL,
  `formasPagamento` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ParametrosAnalise_empreendimentoId_key` (`empreendimentoId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ParametrosAnalise_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ===== Fase 3: Atualização de preço por empreendimento =====

CREATE TABLE `AtualizacaoPreco` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `empreendimentoId` INTEGER NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `justificativa` TEXT NULL,
  `metodo` VARCHAR(191) NOT NULL,
  `valorParametro` DOUBLE NULL,
  `alvo` VARCHAR(191) NOT NULL DEFAULT 'valorBase',
  `executarEm` DATETIME(3) NULL,
  `situacao` VARCHAR(191) NOT NULL DEFAULT 'agendada',
  `qtdUnidades` INTEGER NOT NULL DEFAULT 0,
  `criadoPorId` INTEGER NOT NULL,
  `executadaEm` DATETIME(3) NULL,
  `erroMensagem` TEXT NULL,
  `snapshotJson` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AtualizacaoPreco_situacao_executarEm_idx` (`situacao`, `executarEm`),
  INDEX `AtualizacaoPreco_empreendimentoId_createdAt_idx` (`empreendimentoId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `AtualizacaoPreco_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AtualizacaoPreco_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
