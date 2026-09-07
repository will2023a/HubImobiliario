-- Ajuste do motor de análise ao modelo Anapro:
-- novos limites e taxas por empreendimento (captação até habite-se -1, % máx. da parcela
-- mensal, taxa de atratividade antes/após habite-se, GRL, taxa de desconto de fluxo para
-- o PV líquido e a data de referência da linha "captação até a data").

ALTER TABLE `ParametrosAnalise`
  ADD COLUMN `captacaoAteHabiteseMenos1Min` DOUBLE NULL,
  ADD COLUMN `captacaoMensalMaxParcela` DOUBLE NULL,
  ADD COLUMN `taxaAtratividadeAntesHabitese` DOUBLE NULL,
  ADD COLUMN `taxaAtratividadeAposHabitese` DOUBLE NULL,
  ADD COLUMN `grl` DOUBLE NULL,
  ADD COLUMN `taxaDescontoFluxo` DOUBLE NULL,
  ADD COLUMN `dataReferenciaCaptacao` DATETIME(3) NULL;
