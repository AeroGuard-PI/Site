USE AeroGuard;

-- 1. Localizações
INSERT INTO localizacao (estado, cidade, cep, numero) VALUES 
('SP', 'Guarulhos', '07141970', 'S/N'),
('SP', 'São Paulo', '04626911', 'S/N');

-- 2. Cargos
INSERT INTO cargo (nome) VALUES 
('Analista de Sistemas'),
('Técnico de Infraestrutura');

-- 3. Empresas (Aeroportos)
INSERT INTO empresa (cnpj, razao_social, codigoIATA, codigoAutenticacao, fkLocalizacao) VALUES 
('02575686000148', 'Aeroporto de Guarulhos', 'GRU', 'A0001', 1),
('60872504000123', 'Aeroporto de Congonhas', 'CGH', 'A0002', 2);

-- 4. Usuários
INSERT INTO usuario (nome, telefone, email, cpf, senha, empresa_id, cargo_id) VALUES 
('João Silva', '11982273526', 'joao.silva@email.com', '38433829392', 'SenhaSegura123', 1, 1),
('Maria Oliveira', '11977665544', 'maria.oliveira@email.com', '12345678901', 'SenhaSegura456', 2, 2);

-- 5. Máquinas
INSERT INTO maquina (hostname, so, macAddress, fkEmpresa) VALUES 
('DESKTOP-OP-01', 'Windows 11 Pro', '00:1A:3F:F1:4C:C6', 1),
('SRV-CHECKIN-02', 'Ubuntu Server 22.04', '00:1B:44:11:3A:B7', 2);

-- 6. Componentes Base
INSERT INTO componentes (nome) VALUES 
('CPU'),
('Memória'),
('Disco'),
('Rede');

-- 7. Níveis de Discretização (Alertas)
INSERT INTO discretizacao (limite, nivel_alerta) VALUES 
(80, 'ALERTA'),
(90, 'CRÍTICO');

-- 8. Configuração de Máquina (disponibilidade: 1 = ativo, 0 = inativo)
INSERT INTO configuracao_maquina (disponibilidade, maquina_captura_id, componentes_id) VALUES 
(1, 1, 1), -- Máquina 1 com CPU
(1, 1, 2), -- Máquina 1 com Memória
(1, 2, 3); -- Máquina 2 com Disco

-- 9. Capturas de Telemetria
INSERT INTO captura (tipo, valor, unidade_medida, maquina_id, componentes_id, configuracao_maquina_maquina_id, configuracao_maquina_componentes_id) VALUES 
('Uso de CPU', 84.5, '%', 1, 1, 1, 1),
('Uso de Memória', 92.8, '%', 1, 2, 2, 2),
('Uso de Disco', 45.0, '%', 2, 3, 3, 3);

-- 10. Histórico de Alertas (vinculado às capturas 1 e 2 que ultrapassaram 80% e 90%)
INSERT INTO historico_alerta (maquina_captura_id, componentes_captura_id, discretizacao_id) VALUES 
(1, 1, 1), -- Captura 1 (84.5%) gerou nível 1 (ALERTA)
(2, 2, 2); -- Captura 2 (92.8%) gerou nível 2 (CRÍTICO)