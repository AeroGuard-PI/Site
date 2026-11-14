USE AeroGuard;

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
