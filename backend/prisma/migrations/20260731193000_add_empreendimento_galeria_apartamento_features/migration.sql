-- Expand image storage and apartment setup fields
ALTER TABLE `Empreendimento`
  MODIFY `imagemUrl` LONGTEXT NULL,
  ADD COLUMN `blocosCount` INT NULL,
  ADD COLUMN `andaresPorBloco` INT NULL,
  ADD COLUMN `apartamentosPorAndar` INT NULL;

ALTER TABLE `GaleriaImagem`
  MODIFY `url` LONGTEXT NOT NULL,
  ADD COLUMN `isCapa` BOOLEAN NOT NULL DEFAULT false;
