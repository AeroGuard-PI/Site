FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 py3-pip tzdata
COPY relatorios/redes/requirements.txt /tmp/relatorio-requirements.txt
RUN python3 -m venv /opt/relatorios \
    && /opt/relatorios/bin/pip install --no-cache-dir -r /tmp/relatorio-requirements.txt
ENV RELATORIO_PYTHON=/opt/relatorios/bin/python
COPY . .
RUN npm install
EXPOSE 8080
CMD ["npm", "start"]
