SET NAMES utf8mb4;

USE AeroGuard;

INSERT INTO componentes (nome) VALUES ('CPU'), ('Memória'), ('Disco'), ('Rede');

INSERT INTO discretizacao (limite, nivel_alerta) VALUES (80, 'ALERTA'), (90, 'CRÍTICO');
