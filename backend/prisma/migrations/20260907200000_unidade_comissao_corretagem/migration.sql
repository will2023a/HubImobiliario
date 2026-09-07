-- Comissão de corretagem embutida no negócio da unidade (vinda da tabela de venda
-- estilo Anapro: "Valor total do negócio" − "Comissão" = "Valor contratual").

ALTER TABLE `Unidade` ADD COLUMN `comissaoCorretagem` DOUBLE NULL;
