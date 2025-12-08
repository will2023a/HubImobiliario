-- AlterTable
ALTER TABLE `Proposta` ADD COLUMN `imobiliariaId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Unidade` ADD COLUMN `bloco` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Visita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nomeVisitante` VARCHAR(191) NOT NULL,
    `telefoneVisitante` VARCHAR(191) NOT NULL,
    `emailVisitante` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `dataVisita` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `empreendimentoId` INTEGER NOT NULL,
    `unidadeId` INTEGER NULL,
    `imobiliariaId` INTEGER NULL,
    `atendenteId` INTEGER NOT NULL,
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaterialMarketing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` VARCHAR(191) NOT NULL,
    `empreendimentoId` INTEGER NOT NULL,
    `quantidadeInicial` INTEGER NOT NULL,
    `quantidadeEstoque` INTEGER NOT NULL,
    `descricao` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DispensacaoMaterial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `materialId` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL,
    `dispensadoPara` VARCHAR(191) NOT NULL,
    `dispensadoPor` INTEGER NOT NULL,
    `dataDispensacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `observacoes` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Proposta` ADD CONSTRAINT `Proposta_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visita` ADD CONSTRAINT `Visita_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visita` ADD CONSTRAINT `Visita_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visita` ADD CONSTRAINT `Visita_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Visita` ADD CONSTRAINT `Visita_atendenteId_fkey` FOREIGN KEY (`atendenteId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaterialMarketing` ADD CONSTRAINT `MaterialMarketing_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DispensacaoMaterial` ADD CONSTRAINT `DispensacaoMaterial_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `MaterialMarketing`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DispensacaoMaterial` ADD CONSTRAINT `DispensacaoMaterial_dispensadoPor_fkey` FOREIGN KEY (`dispensadoPor`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
