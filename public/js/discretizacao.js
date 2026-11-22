(() => {
  "use strict";

  const empresaId = sessionStorage.EMPRESA_ID;
  const seletor = document.querySelector("#discretizacao-machine");
  const conteudo = document.querySelector("#discretizacao-content");
  const feedback = document.querySelector("[data-discretizacao-feedback]");
  const dialog = document.querySelector("#discretizacao-reset-dialog");
  if (!seletor || !conteudo || !feedback) return;

  const mensagem = (texto, erro = false) => {
    feedback.textContent = texto;
    feedback.classList.toggle("is-visible", Boolean(texto));
    feedback.dataset.state = erro ? "error" : "success";
  };

  const criar = (tag, texto, classe) => {
    const node = document.createElement(tag);
    if (texto !== undefined) node.textContent = texto;
    if (classe) node.className = classe;
    return node;
  };

  function confirmarReset(nomeComponente) {
    return new Promise((resolve) => {
      const descricao = dialog.querySelector("#discretizacao-reset-description");
      const confirmar = dialog.querySelector("[data-confirm-reset]");
      const cancelar = dialog.querySelector("[data-cancel-reset]");
      descricao.textContent = `Os limites de ${nomeComponente} voltarão para ALERTA 80% e CRÍTICO 90%.`;
      const encerrar = (resultado) => {
        if (dialog.open) dialog.close();
        confirmar.removeEventListener("click", sim);
        cancelar.removeEventListener("click", nao);
        dialog.removeEventListener("cancel", escape);
        resolve(resultado);
      };
      const sim = () => encerrar(true);
      const nao = () => encerrar(false);
      const escape = (event) => { event.preventDefault(); nao(); };
      confirmar.addEventListener("click", sim);
      cancelar.addEventListener("click", nao);
      dialog.addEventListener("cancel", escape);
      dialog.showModal();
      cancelar.focus();
    });
  }

  async function requisicao(url, options) {
    const resposta = await fetch(url, options);
    if (resposta.status === 204) return null;
    const corpo = await resposta.text();
    let dados;
    try {
      dados = corpo ? JSON.parse(corpo) : null;
    } catch {
      throw new Error(`A API respondeu HTTP ${resposta.status} em um formato inesperado. Reinicie o servidor para carregar as rotas atuais.`);
    }
    if (!resposta.ok) throw new Error(dados?.mensagem || "Não foi possível concluir a operação.");
    return dados;
  }

  async function carregarMaquinas() {
    if (!empresaId) {
      seletor.disabled = true;
      conteudo.textContent = "Faça login para configurar os limites.";
      return;
    }
    try {
      const maquinas = await requisicao(`/maquinas/listar/${encodeURIComponent(empresaId)}`);
      seletor.replaceChildren(new Option("Selecione uma máquina", ""));
      maquinas.forEach((maquina) => seletor.add(new Option(`${maquina.hostname} (${maquina.macAddress})`, maquina.id)));
      seletor.disabled = !maquinas.length;
      if (!maquinas.length) conteudo.textContent = "Nenhuma máquina cadastrada. Cadastre uma máquina para configurar seus limites.";
      else conteudo.textContent = "Selecione uma máquina para consultar seus componentes.";
    } catch (erro) {
      conteudo.textContent = "Não foi possível carregar as máquinas.";
      mensagem(erro.message, true);
    }
  }

  function renderizarComponente(componente) {
    const article = criar("article", undefined, "discretizacao-item");
    const head = criar("div", undefined, "discretizacao-item__head");
    const title = criar("h3", componente.componente, "discretizacao-item__title");
    const configurado = componente.configurado;
    const status = criar("span", configurado ? "Limites configurados" : "Não configurado", "badge");
    status.classList.toggle("badge--success", configurado);
    head.append(title, status);
    article.append(head);

    if (configurado) {
      const limits = criar("p", `Alerta: ${componente.limiteAlerta}% · Crítico: ${componente.limiteCritico}%`, "discretizacao-limits");
      const range = criar("p", `Normal: abaixo de ${componente.limiteAlerta}% · Alerta: de ${componente.limiteAlerta}% até abaixo de ${componente.limiteCritico}% · Crítico: a partir de ${componente.limiteCritico}% (persistência de 30 segundos no coletor).`, "discretizacao-range");
      article.append(limits, range);
    } else {
      article.append(criar("p", "Cadastre os dois limites para concluir a configuração.", "discretizacao-range"));
    }

    const form = document.createElement("form");
    form.className = "discretizacao-form";
    form.innerHTML = `<label>Limite de alerta (%)<input name="limiteAlerta" type="number" min="0" max="100" step="1" required></label><label>Limite crítico (%)<input name="limiteCritico" type="number" min="0" max="100" step="1" required></label>`;
    if (configurado) {
      form.elements.limiteAlerta.value = componente.limiteAlerta;
      form.elements.limiteCritico.value = componente.limiteCritico;
    }
    const actions = criar("div", undefined, "discretizacao-actions");
    const save = criar("button", configurado ? "Salvar alterações" : "Cadastrar limites", "btn btn--filled");
    save.type = "submit";
    actions.append(save);
    if (configurado) {
      const reset = criar("button", "Restaurar padrão", "btn btn--secondary");
      reset.type = "button";
      reset.addEventListener("click", async () => {
        if (!await confirmarReset(componente.componente)) return;
        reset.disabled = true;
        try {
          await requisicao(`/discretizacao/${componente.configMaquinaId}/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ empresaId: Number(empresaId) }),
          });
          mensagem(`Limites de ${componente.componente} restaurados para 80% e 90%.`);
          await carregarComponentes();
        } catch (erro) {
          mensagem(erro.message, true);
          reset.disabled = false;
        }
      });
      actions.append(reset);
    }
    form.append(actions);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const alerta = Number(form.elements.limiteAlerta.value);
      const critico = Number(form.elements.limiteCritico.value);
      if (!Number.isInteger(alerta) || !Number.isInteger(critico) || alerta < 0 || critico > 100 || alerta >= critico) {
        mensagem("Informe limites inteiros entre 0 e 100, com alerta menor que crítico.", true);
        return;
      }
      save.disabled = true;
      try {
        const editing = componente.configurado;
        await requisicao(editing ? `/discretizacao/${componente.configMaquinaId}` : "/discretizacao", {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ empresaId: Number(empresaId), configMaquinaId: componente.configMaquinaId, limiteAlerta: alerta, limiteCritico: critico }),
        });
        mensagem(`Limites de ${componente.componente} ${editing ? "atualizados" : "cadastrados"}.`);
        await carregarComponentes();
      } catch (erro) {
        mensagem(erro.message, true);
        save.disabled = false;
      }
    });
    article.append(form);
    return article;
  }

  async function carregarComponentes() {
    const maquinaId = seletor.value;
    if (!maquinaId) {
      conteudo.textContent = "Selecione uma máquina para consultar seus componentes.";
      return;
    }
    try {
      const dados = await requisicao(`/discretizacao/maquina/${encodeURIComponent(maquinaId)}/${encodeURIComponent(empresaId)}`);
      conteudo.replaceChildren();
      if (!dados.length) {
        conteudo.textContent = "Esta máquina não possui CPU, Memória ou Disco monitorados.";
        return;
      }
      dados.forEach((item) => conteudo.append(renderizarComponente(item)));
    } catch (erro) {
      conteudo.textContent = "Não foi possível consultar os componentes desta máquina.";
      mensagem(erro.message, true);
    }
  }

  seletor.addEventListener("change", () => { mensagem(""); carregarComponentes(); });
  carregarMaquinas();
})();
