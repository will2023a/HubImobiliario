-- AlterTable
ALTER TABLE `Lead` ADD COLUMN `temperatura` VARCHAR(191) NULL DEFAULT 'morno';

-- CreateTable
CREATE TABLE `PipelineStage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `cor` VARCHAR(191) NOT NULL DEFAULT '#3b82f6',
    `imobiliariaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PipelineStage_imobiliariaId_ordem_key`(`imobiliariaId`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadPipeline` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `stageId` INTEGER NOT NULL,
    `temperatura` VARCHAR(191) NOT NULL DEFAULT 'morno',
    `valorPotencial` DOUBLE NULL,
    `enteredStageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `LeadPipeline_leadId_key`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `prioridade` VARCHAR(191) NOT NULL DEFAULT 'media',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `prazo` DATETIME(3) NOT NULL,
    `concluidaEm` DATETIME(3) NULL,
    `userId` INTEGER NOT NULL,
    `leadId` INTEGER NULL,
    `imobiliariaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `mensagem` VARCHAR(191) NOT NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(191) NULL,
    `imobiliariaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_lida_idx`(`userId`, `lida`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConfigImobiliaria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imobiliariaId` INTEGER NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `corPrimaria` VARCHAR(191) NOT NULL DEFAULT '#6366f1',
    `corSecundaria` VARCHAR(191) NOT NULL DEFAULT '#8b5cf6',
    `tema` VARCHAR(191) NOT NULL DEFAULT 'dark',
    `horarioInicio` VARCHAR(191) NOT NULL DEFAULT '08:00',
    `horarioFim` VARCHAR(191) NOT NULL DEFAULT '18:00',
    `comissaoCorretor` DOUBLE NOT NULL DEFAULT 3.0,
    `comissaoGerente` DOUBLE NOT NULL DEFAULT 1.0,
    `comissaoDiretor` DOUBLE NOT NULL DEFAULT 0.5,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ConfigImobiliaria_imobiliariaId_key`(`imobiliariaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PipelineStage` ADD CONSTRAINT `PipelineStage_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadPipeline` ADD CONSTRAINT `LeadPipeline_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadPipeline` ADD CONSTRAINT `LeadPipeline_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `PipelineStage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConfigImobiliaria` ADD CONSTRAINT `ConfigImobiliaria_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
