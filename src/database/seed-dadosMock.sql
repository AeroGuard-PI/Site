USE AeroGuard;

INSERT INTO localizacao (estado, cidade, cep, numero) VALUES ('SP', 'Guarulhos', '07141970', 'S/N');
SET @local_gru = LAST_INSERT_ID();
INSERT INTO localizacao (estado, cidade, cep, numero) VALUES ('SP', 'São Paulo', '04626911', 'S/N');
SET @local_cgh = LAST_INSERT_ID();

INSERT INTO cargo (nome) VALUES ('Analista de Sistemas');
SET @analista = LAST_INSERT_ID();
INSERT INTO cargo (nome) VALUES ('Técnico de Infraestrutura');
SET @tecnico = LAST_INSERT_ID();

INSERT INTO empresa (cnpj, razao_social, codigoIATA, codigoAutenticacao, fkLocalizacao)
VALUES ('02575686000148', 'Aeroporto de Guarulhos', 'GRU', 'A0001', @local_gru);
SET @gru = LAST_INSERT_ID();
INSERT INTO empresa (cnpj, razao_social, codigoIATA, codigoAutenticacao, fkLocalizacao)
VALUES ('60872504000123', 'Aeroporto de Congonhas', 'CGH', 'A0002', @local_cgh);
SET @cgh = LAST_INSERT_ID();

INSERT INTO usuario (nome, telefone, email, cpf, senha, empresa_id, cargo_id) VALUES
('João Silva', '11982273526', 'joao.silva@email.com', '38433829392', 'SenhaSegura123', @gru, @analista),
('Maria Oliveira', '11977665544', 'maria.oliveira@email.com', '12345678901', 'SenhaSegura456', @cgh, @tecnico);

INSERT INTO maquina (hostname, so, macAddress, fkEmpresa)
VALUES ('DESKTOP-OP-01', 'Windows 11 Pro', '00:1a:3f:f1:4c:c6', @gru);
SET @maquina_gru = LAST_INSERT_ID();
INSERT INTO maquina (hostname, so, macAddress, fkEmpresa)
VALUES ('SRV-CHECKIN-02', 'Ubuntu Server 22.04', '00:1b:44:11:3a:b7', @cgh);
SET @maquina_cgh = LAST_INSERT_ID();

SET @cpu = (SELECT id FROM componentes WHERE nome = 'CPU');
SET @memoria = (SELECT id FROM componentes WHERE nome = 'Memória');
SET @disco = (SELECT id FROM componentes WHERE nome = 'Disco');
SET @alerta = (SELECT id FROM discretizacao WHERE nivel_alerta = 'ALERTA');
SET @critico = (SELECT id FROM discretizacao WHERE nivel_alerta = 'CRÍTICO');

INSERT INTO configuracao_maquina (disponibilidade, maquina_captura_id, componentes_id)
VALUES (1, @maquina_gru, @cpu);
SET @config_cpu = LAST_INSERT_ID();
INSERT INTO configuracao_maquina (disponibilidade, maquina_captura_id, componentes_id)
VALUES (1, @maquina_gru, @memoria);
SET @config_memoria = LAST_INSERT_ID();
INSERT INTO configuracao_maquina (disponibilidade, maquina_captura_id, componentes_id)
VALUES (1, @maquina_cgh, @disco);
SET @config_disco = LAST_INSERT_ID();

INSERT INTO captura (tipo, valor, unidade_medida, maquina_id, componentes_id,
    configuracao_maquina_maquina_id, configuracao_maquina_componentes_id)
VALUES ('Uso CPU', 84.5, '%', @maquina_gru, @cpu, @config_cpu, @config_cpu);
SET @captura_cpu = LAST_INSERT_ID();
INSERT INTO captura (tipo, valor, unidade_medida, maquina_id, componentes_id,
    configuracao_maquina_maquina_id, configuracao_maquina_componentes_id)
VALUES ('Uso Memória', 92.8, '%', @maquina_gru, @memoria, @config_memoria, @config_memoria);
SET @captura_memoria = LAST_INSERT_ID();
INSERT INTO captura (tipo, valor, unidade_medida, maquina_id, componentes_id,
    configuracao_maquina_maquina_id, configuracao_maquina_componentes_id)
VALUES ('Uso Disco', 45.0, '%', @maquina_cgh, @disco, @config_disco, @config_disco);

INSERT INTO historico_alerta (maquina_captura_id, componentes_captura_id, discretizacao_id) VALUES
(@captura_cpu, @captura_cpu, @alerta),
(@captura_memoria, @captura_memoria, @critico);
