-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `imobiliariaId` INTEGER NULL,
    `diretorId` INTEGER NULL,
    `gerenteId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Imobiliaria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `plan` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permissao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` VARCHAR(191) NOT NULL,
    `recurso` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `permitido` BOOLEAN NOT NULL DEFAULT true,
    `imobiliariaId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Permissao_role_recurso_acao_imobiliariaId_key`(`role`, `recurso`, `acao`, `imobiliariaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Imovel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `valor` DOUBLE NOT NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `cidade` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `imobiliariaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lead` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `origem` VARCHAR(191) NOT NULL,
    `corretorId` INTEGER NULL,
    `imobiliariaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Atendimento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `leadId` INTEGER NOT NULL,
    `corretorId` INTEGER NULL,
    `mensagem` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Empreendimento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `tipoUnidade` VARCHAR(191) NOT NULL,
    `quantidadeUnidades` INTEGER NOT NULL,
    `imagemUrl` VARCHAR(191) NULL,
    `bairro` VARCHAR(191) NOT NULL,
    `cidade` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `dataLancamento` DATETIME(3) NULL,
    `dataPrevisaoConstrucao` DATETIME(3) NULL,
    `contatoGerente1` VARCHAR(191) NULL,
    `nomeGerente1` VARCHAR(191) NULL,
    `contatoGerente2` VARCHAR(191) NULL,
    `nomeGerente2` VARCHAR(191) NULL,
    `contatoGerente3` VARCHAR(191) NULL,
    `nomeGerente3` VARCHAR(191) NULL,
    `contatoGerente4` VARCHAR(191) NULL,
    `nomeGerente4` VARCHAR(191) NULL,
    `contatoGerente5` VARCHAR(191) NULL,
    `nomeGerente5` VARCHAR(191) NULL,
    `imobiliariaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Unidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empreendimentoId` INTEGER NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `valorBase` DOUBLE NOT NULL,
    `juros` DOUBLE NOT NULL DEFAULT 0,
    `valorTotal` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'disponivel',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proposta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `empreendimentoId` INTEGER NOT NULL,
    `unidadeId` INTEGER NOT NULL,
    `corretorId` INTEGER NOT NULL,
    `clienteNome` VARCHAR(191) NOT NULL,
    `clienteSobrenome` VARCHAR(191) NOT NULL,
    `clienteRg` VARCHAR(191) NOT NULL,
    `clienteCpf` VARCHAR(191) NOT NULL,
    `clienteProfissao` VARCHAR(191) NOT NULL,
    `clienteRemuneracao` DOUBLE NOT NULL,
    `valorAVista` DOUBLE NULL,
    `valor30Dias` DOUBLE NULL,
    `valor60Dias` DOUBLE NULL,
    `valor90Dias` DOUBLE NULL,
    `valorMensais` DOUBLE NULL,
    `valorSemestrais` DOUBLE NULL,
    `valorAnuais` DOUBLE NULL,
    `valorUnico` DOUBLE NULL,
    `saldoFinanciar` DOUBLE NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_diretorId_fkey` FOREIGN KEY (`diretorId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_gerenteId_fkey` FOREIGN KEY (`gerenteId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Imovel` ADD CONSTRAINT `Imovel_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_corretorId_fkey` FOREIGN KEY (`corretorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Atendimento` ADD CONSTRAINT `Atendimento_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Atendimento` ADD CONSTRAINT `Atendimento_corretorId_fkey` FOREIGN KEY (`corretorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Empreendimento` ADD CONSTRAINT `Empreendimento_imobiliariaId_fkey` FOREIGN KEY (`imobiliariaId`) REFERENCES `Imobiliaria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Unidade` ADD CONSTRAINT `Unidade_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposta` ADD CONSTRAINT `Proposta_empreendimentoId_fkey` FOREIGN KEY (`empreendimentoId`) REFERENCES `Empreendimento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposta` ADD CONSTRAINT `Proposta_unidadeId_fkey` FOREIGN KEY (`unidadeId`) REFERENCES `Unidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Proposta` ADD CONSTRAINT `Proposta_corretorId_fkey` FOREIGN KEY (`corretorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
