SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS AeroGuard CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
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
    nome VARCHAR(45) NOT NULL,
    is_admin TINYINT(1) NOT NULL DEFAULT 0
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
    hostname VARCHAR(50) NOT NULL,
    so VARCHAR(50) NOT NULL,
    macAddress VARCHAR(17) NOT NULL,
    fkEmpresa INT NOT NULL,
    CONSTRAINT uq_maquina_empresa_mac UNIQUE (fkEmpresa, macAddress),
    CONSTRAINT fk_empresa
        FOREIGN KEY (fkEmpresa) REFERENCES empresa(id)
);

CREATE TABLE componentes(
	id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL
);

CREATE TABLE configuracao_maquina (
	id INT NOT NULL AUTO_INCREMENT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    disponibilidade TINYINT UNSIGNED NOT NULL,
    maquina_captura_id INT NOT NULL,
    componentes_id INT NOT NULL,
    CONSTRAINT pk_maquina_componente
		PRIMARY KEY (id, maquina_captura_id, componentes_id),
    CONSTRAINT uq_configuracao_id UNIQUE (id),
    CONSTRAINT ck_configuracao_disponibilidade CHECK (disponibilidade IN (0, 1)),
	CONSTRAINT fk_maquina_captura
		FOREIGN KEY (maquina_captura_id) REFERENCES maquina(id),
	CONSTRAINT fk_componentes
		FOREIGN KEY (componentes_id) REFERENCES componentes(id)
);


CREATE TABLE captura (
	id 	INT NOT NULL AUTO_INCREMENT,
    tipo VARCHAR(60) NOT NULL,
    valor DOUBLE NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unidade_medida CHAR(10) NOT NULL,
    maquina_id INT NOT NULL,
    componentes_id INT NOT NULL,
    configuracao_maquina_maquina_id INT NOT NULL,
    configuracao_maquina_componentes_id INT NOT NULL,
    CONSTRAINT pk_maquina_componentes
		PRIMARY KEY (id, maquina_id, componentes_id, configuracao_maquina_maquina_id, configuracao_maquina_componentes_id),
    CONSTRAINT uq_captura_id UNIQUE (id),
    CONSTRAINT fk_config_maquina_maquina
		FOREIGN KEY (configuracao_maquina_maquina_id) REFERENCES configuracao_maquina(id),
	CONSTRAINT fk_config_maquina_componentes
		FOREIGN KEY (configuracao_maquina_componentes_id) REFERENCES configuracao_maquina(id)
);

CREATE TABLE discretizacao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    config_maquina_id INT NOT NULL,
    limite INT NOT NULL,
    nivel_alerta VARCHAR(20) NOT NULL,
    CONSTRAINT fk_discretizacao_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresa(id),
    CONSTRAINT fk_config_maquina
        FOREIGN KEY (config_maquina_id) REFERENCES configuracao_maquina(id),
    CONSTRAINT uq_discretizacao_config_nivel
        UNIQUE (config_maquina_id, nivel_alerta)
);

CREATE TABLE historico_alerta(
	id INT NOT NULL AUTO_INCREMENT,
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

CREATE TABLE configuracao_slack (
    id INT PRIMARY KEY AUTO_INCREMENT,
    empresa_id INT NOT NULL UNIQUE,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    canal VARCHAR(80) NOT NULL DEFAULT '#alertas-criticos',
    modo VARCHAR(20) NOT NULL DEFAULT 'CONFIGURADO' CHECK (modo IN ('TUDO', 'CONFIGURADO')),
    nivel_minimo VARCHAR(10) NOT NULL DEFAULT 'ALERTA' CHECK (nivel_minimo IN ('ALERTA', 'CRITICO')),
    cooldown_min INT NOT NULL DEFAULT 60,
    CONSTRAINT fk_config_slack_empresa
        FOREIGN KEY (empresa_id) REFERENCES empresa(id)
);

CREATE TABLE IF NOT EXISTS captura_rede (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    maquina_id INT NOT NULL,
    config_maquina_id INT NOT NULL,
    interface_nome VARCHAR(49) COLLATE utf8mb4_0900_as_cs NOT NULL,
    interface_mac VARCHAR(17) NOT NULL,
    inicio_em DATETIME(6),
    coletado_em DATETIME(6) NOT NULL,
    recebido_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    duracao_ns BIGINT UNSIGNED,
    delta_rx_bytes BIGINT UNSIGNED,
    delta_tx_bytes BIGINT UNSIGNED,
    delta_rx_erros BIGINT UNSIGNED,
    delta_tx_erros BIGINT UNSIGNED,
    delta_rx_descartes BIGINT UNSIGNED,
    estado_operacional VARCHAR(32) NOT NULL,
    motivo_intervalo VARCHAR(32),
    CONSTRAINT uq_rede_maquina_interface_instante
        UNIQUE (maquina_id, interface_nome, coletado_em),
    CONSTRAINT fk_rede_maquina FOREIGN KEY (maquina_id) REFERENCES maquina(id),
    CONSTRAINT fk_rede_configuracao FOREIGN KEY (config_maquina_id) REFERENCES configuracao_maquina(id),
    CONSTRAINT ck_rede_intervalo CHECK (
        (duracao_ns IS NULL AND inicio_em IS NULL) OR
        (duracao_ns IS NOT NULL AND inicio_em IS NOT NULL AND duracao_ns > 0 AND inicio_em < coletado_em)
    )
);
