# Site AeroGuard

Site e backend em Node.js. O SQL e os seeds ficam em src/database: AeroGuard.sql, seed-componentes.sql e seed-dadosMock.sql.

A instalação da central é feita pelo script-instalacao.sh do repositório [script-instalacao-pi](https://github.com/AeroGuard-PI/script-instalacao-pi). Ele baixa este repositório, prepara MySQL e constrói o site. Os coletores são instalados nas outras EC2s pelo script-instalacao-cliente.sh.

POST /usuarios/instalar recebe emailServer e senhaServer. O backend usa o cadastro do usuário para obter sua empresa e entregar a configuração técnica ao instalador. O usuário não escolhe outra empresa na requisição. GET /saude confere a conexão com o banco.

Para desenvolvimento, .env.example documenta as variáveis usadas pelo site. Na instalação Docker, o script gera a configuração. Não publique arquivos .env com credenciais.

A dashboard permanece no estágio atual do projeto. Esta versão prepara o login da instalação e a persistência dos coletores.
