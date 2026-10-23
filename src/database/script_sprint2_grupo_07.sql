CREATE DATABASE AeroGuard;
USE AeroGuard;

CREATE TABLE localizacao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estado CHAR(2) NOT NULL,
    cidade VARCHAR(100) NOT NULL, 
    cep CHAR(8) NOT NULL,
    numero VARCHAR(10) NOT NULL
);

CREATE TABLE cargo (
	id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(45) NOT NULL
);

CREATE TABLE empresa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cnpj CHAR(14) NOT NULL UNIQUE, 
    razao_social VARCHAR(100) NOT NULL,
    codigoIATA CHAR(3) NOT NULL UNIQUE, 
    codigoAutenticacao CHAR(5) NOT NULL,
    fkLocalizacao INT NOT NULL, 
    CONSTRAINT fk_localizacao_empresa
        FOREIGN KEY (fkLocalizacao) REFERENCES localizacao(id)
);

CREATE TABLE usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    telefone CHAR(11) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE, 
    cpf CHAR(11) NOT NULL UNIQUE, 
    senha VARCHAR(255) NOT NULL, 
    empresa_id INT NOT NULL, 
    cargo_id INT NOT NULL, 
    CONSTRAINT fk_empresa_usuario
        FOREIGN KEY (empresa_id) REFERENCES empresa(id),
	CONSTRAINT fk_cargo_usuario
        FOREIGN KEY (cargo_id) REFERENCES cargo(id)
);

CREATE TABLE maquina (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hostname VARCHAR(50) NOT NULL UNIQUE,  
    so VARCHAR(50) NOT NULL,
    macAddress VARCHAR(17) NOT NULL UNIQUE, 
    fkEmpresa INT NOT NULL,
    CONSTRAINT fk_empresa
        FOREIGN KEY (fkEmpresa) REFERENCES empresa(id)
);

CREATE TABLE componentes(
	id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE configuracao_maquina (
	id INT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    disponibilidade CHAR(8) NOT NULL,
    maquina_captura_id INT NOT NULL, 
    componentes_id INT NOT NULL,
    CONSTRAINT pk_maquina_componente 
		PRIMARY KEY (id, maquina_captura_id, componentes_id),
	CONSTRAINT fk_maquina_captura
		FOREIGN KEY (maquina_captura_id) REFERENCES maquina(id),
	CONSTRAINT fk_componentes
		FOREIGN KEY (componentes_id) REFERENCES componentes(id)
);
    

CREATE TABLE captura (
	id 	INT NOT NULL,
    tipo VARCHAR(60) NOT NULL,
    valor FLOAT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unidade_medida CHAR(10) NOT NULL,
    maquina_id INT NOT NULL,
    componentes_id INT NOT NULL,
    configuracao_maquina_maquina_id INT NOT NULL,
    configuracao_maquina_componentes_id INT NOT NULL,
    CONSTRAINT pk_maquina_componentes
		PRIMARY KEY (id, maquina_id, componentes_id, configuracao_maquina_maquina_id, configuracao_maquina_componentes_id),
    CONSTRAINT fk_config_maquina_maquina
		FOREIGN KEY (configuracao_maquina_maquina_id) REFERENCES configuracao_maquina(id),
	CONSTRAINT fk_config_maquina_componentes
		FOREIGN KEY (configuracao_maquina_componentes_id) REFERENCES configuracao_maquina(id)
);

CREATE TABLE discretizacao (
	id INT PRIMARY KEY AUTO_INCREMENT,
    limite INT NOT NULL,
    nivel_alerta VARCHAR(20) NOT NULL
);
    
CREATE TABLE historico_alerta(
	id INT NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    maquina_captura_id INT NOT NULL,
    componentes_captura_id INT NOT NULL,
    discretizacao_id INT NOT NULL,
    CONSTRAINT pk_maquina_componentes_discretizacao
		PRIMARY KEY (id, maquina_captura_id, componentes_captura_id),
	CONSTRAINT fk_discretizacao
		FOREIGN KEY (discretizacao_id) REFERENCES discretizacao(id),
	CONSTRAINT fk_maquinacaptura
		FOREIGN KEY (maquina_captura_id) REFERENCES captura(id),
	CONSTRAINT fk_componentes_captura
		FOREIGN KEY (componentes_captura_id) REFERENCES captura(id)
);

-- 1. Inserir primeiro a localização
INSERT INTO localizacao (estado, cidade, cep, numero) 
VALUES ('SP', 'Guarulhos', '07141970', 'S/N');

-- 2. Inserir o aeroporto utilizando o ID da localização inserida (assumindo que o ID gerado foi 1)
INSERT INTO empresa (cnpj, razao_social, codigoIATA, codigoAutenticacao, fkLocalizacao) 
VALUES ('02575686000148', 'Aeroporto de Guarulhos', 'GRU', 'A0001', 1);

INSERT INTO cargo (nome) 
VALUES ('Analista de sistemas');


-- Inserindo um usuário vinculado ao aeroporto de ID 1
INSERT INTO usuario (nome, telefone, email, cpf, senha, empresa_id, cargo_id) 
VALUES ('João Silva', '11982273526', 'joao.silva@email.com', '38433829392','SenhaSegura123', 1, 1);

-- Inserindo uma máquina vinculada ao usuário de ID 1
INSERT INTO maquina (hostname, so, macAddress, fkEmpresa) 
VALUES ('DESKTOP-OP-01', 'Windows 11 Pro', '00:1A:3F:F1:4C:C6', 1);

INSERT INTO componentes (nome) VALUES 
('CPU');

INSERT INTO discretizacao (limite, nivel_alerta) VALUES
('90', 'critico');


select*from localizacao;
select*from empresa;
select*from cargo;
select*from usuario;
select*from maquina;
select*from captura;
select*from componentes;
select*from discretizacao;
select*from historico_alerta;


