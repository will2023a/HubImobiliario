-- Models adicionados ao schema ao longo do desenvolvimento sem migrations.
-- IF NOT EXISTS permite aplicar também em bancos já sincronizados por db push.

CREATE TABLE IF NOT EXISTS `EmpreendimentoEquipe` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `empreendimentoId` INTEGER NOT NULL,
  `imobiliariaId` INTEGER NOT NULL,
  `comissaoPercent` DOUBLE NOT NULL DEFAULT 5.0,
  `ativa` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `EmpreendimentoEquipe_empreendimentoId_imobiliariaId_key` (`empreendimentoId`, `imobiliariaId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `EmpreendimentoEquipe_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `EmpreendimentoEquipe_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TabelaPreco` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `empreendimentoId` INTEGER NOT NULL,
  `nome` VARCHAR(191) NOT NULL,
  `grupo` VARCHAR(191) NOT NULL DEFAULT 'padrao',
  `modelo` VARCHAR(191) NOT NULL DEFAULT 'modelo_1',
  `ativa` BOOLEAN NOT NULL DEFAULT true,
  `incluirDesconto` BOOLEAN NOT NULL DEFAULT false,
  `incluirJuros` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `TabelaPreco_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TabelaPrecoItem` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tabelaId` INTEGER NOT NULL,
  `unidadeId` INTEGER NULL,
  `descricao` VARCHAR(191) NOT NULL,
  `valor` DOUBLE NOT NULL,
  `parcelas` INTEGER NULL,
  `valorParcela` DOUBLE NULL,
  `desconto` DOUBLE NULL,
  `juros` DOUBLE NULL,
  `observacao` TEXT NULL,
  `ordem` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `TabelaPrecoItem_tabelaId_fkey` FOREIGN KEY (`tabelaId`) REFERENCES `TabelaPreco` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Conversation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `canal` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'aberta',
  `externalId` VARCHAR(191) NULL,
  `contactName` VARCHAR(191) NOT NULL,
  `contactPhone` VARCHAR(191) NULL,
  `contactEmail` VARCHAR(191) NULL,
  `leadId` INTEGER NULL,
  `assignedToId` INTEGER NULL,
  `imobiliariaId` INTEGER NOT NULL,
  `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `Conversation_imobiliariaId_status_idx` (`imobiliariaId`, `status`),
  INDEX `Conversation_imobiliariaId_canal_idx` (`imobiliariaId`, `canal`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Conversation_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Conversation_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Conversation_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Message` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `conversationId` INTEGER NOT NULL,
  `direction` VARCHAR(191) NOT NULL,
  `content` TEXT NOT NULL,
  `contentType` VARCHAR(191) NOT NULL DEFAULT 'text',
  `mediaUrl` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
  `senderName` VARCHAR(191) NULL,
  `isAI` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MessageTemplate` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(191) NOT NULL,
  `categoria` VARCHAR(191) NOT NULL,
  `conteudo` TEXT NOT NULL,
  `canal` VARCHAR(191) NOT NULL DEFAULT 'todos',
  `imobiliariaId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `MessageTemplate_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Comissao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `propostaId` INTEGER NOT NULL,
  `userId` INTEGER NOT NULL,
  `role` VARCHAR(191) NOT NULL,
  `percentual` DOUBLE NOT NULL,
  `valorVenda` DOUBLE NOT NULL,
  `valorComissao` DOUBLE NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
  `dataPagamento` DATETIME(3) NULL,
  `imobiliariaId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `Comissao_propostaId_fkey` FOREIGN KEY (`propostaId`) REFERENCES `Proposta` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Comissao_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Comissao_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Automation` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(191) NOT NULL,
  `descricao` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'rascunho',
  `gatilho` VARCHAR(191) NOT NULL,
  `nodes` JSON NOT NULL,
  `edges` JSON NOT NULL,
  `imobiliariaId` INTEGER NOT NULL,
  `lastRunAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `Automation_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AutomationExec` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `automationId` INTEGER NOT NULL,
  `leadId` INTEGER NULL,
  `status` VARCHAR(191) NOT NULL,
  `logs` JSON NULL,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `AutomationExec_automationId_fkey` FOREIGN KEY (`automationId`) REFERENCES `Automation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AuditLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `acao` VARCHAR(191) NOT NULL,
  `recurso` VARCHAR(191) NOT NULL,
  `recursoId` INTEGER NULL,
  `detalhes` JSON NULL,
  `ip` VARCHAR(191) NULL,
  `imobiliariaId` INTEGER NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuditLog_imobiliariaId_createdAt_idx` (`imobiliariaId`, `createdAt`),
  INDEX `AuditLog_userId_createdAt_idx` (`userId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AuditLog_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Webhook` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `url` VARCHAR(191) NOT NULL,
  `eventos` JSON NOT NULL,
  `secretKey` VARCHAR(191) NOT NULL,
  `ativo` BOOLEAN NOT NULL DEFAULT true,
  `imobiliariaId` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `Webhook_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `WebhookDelivery` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `webhookId` INTEGER NOT NULL,
  `evento` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `statusCode` INTEGER NULL,
  `response` TEXT NULL,
  `sucesso` BOOLEAN NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `WebhookDelivery_webhookId_fkey` FOREIGN KEY (`webhookId`) REFERENCES `Webhook` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
