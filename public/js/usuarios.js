(() => {
  "use strict";

  // Impede requisições antes do redirecionamento feito por auth.js.
  if (sessionStorage.IS_ADMIN !== "1") return;

  const modal = document.querySelector("#user-modal");
  const form = document.querySelector("#user-crud-form");
  const modalFeedback = document.querySelector("[data-modal-feedback]");
  const pageFeedback = document.querySelector("[data-users-feedback]");
  const submitBtn = document.querySelector("#save-user-btn");
  const lista = document.querySelector("#user-list");

  if (!modal || !form || !lista) return;

  let usuarios = [];
  let cargos = [];

  function formatarTelefone(valor) {
    return String(valor || "")
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
  }

  function formatarCpf(valor) {
    return String(valor || "")
      .replace(/\D/g, "")
      .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  function mostrarFeedbackModal(mensagem, sucesso = false) {
    if (!modalFeedback) return;
    modalFeedback.textContent = mensagem;
    if (mensagem) {
      modalFeedback.classList.add("is-visible");
    } else {
      modalFeedback.classList.remove("is-visible");
    }
    if (sucesso) {
      modalFeedback.style.color = "#4ade80";
    } else {
      modalFeedback.style.color = "#f87171";
    }
  }

  function abrirModal(usuario = null) {
    const editando = Boolean(usuario);
    form.reset();
    mostrarFeedbackModal("");

    form.querySelectorAll("[data-password]").forEach((input) => {
      input.type = "password";
    });
    form.querySelectorAll("[data-toggle-password]").forEach((btn) => {
      btn.textContent = "Mostrar";
      btn.setAttribute("aria-label", "Mostrar senha");
    });

    if (editando) {
      form.elements.id.value = String(usuario.id);
      form.elements.nome.value = usuario.nome;
      form.elements.cargo.value = usuario.cargo;
      form.elements.telefone.value = formatarTelefone(usuario.telefone);
      form.elements.cpf.value = formatarCpf(usuario.cpf);
      form.elements.email.value = usuario.email;

      form.elements.senha.placeholder = "Deixe em branco para manter";
      form.elements.confirmar_senha.placeholder = "Repita apenas se alterar";
      document.querySelector("#user-modal-title").textContent = "Editar usuário";
      document.querySelector("#user-modal-subtitle").textContent =
        "Atualize os dados ou o cargo do colaborador selecionado.";
      document.querySelector("#user-modal-hint").textContent =
        "Deixe os campos de senha em branco para manter a senha atual.";
      submitBtn.innerHTML = 'Salvar alterações <span aria-hidden="true">↗</span>';
    } else {
      form.elements.id.value = "";
      form.elements.senha.placeholder = "Mínimo de 8 caracteres";
      form.elements.confirmar_senha.placeholder = "Repita a senha do funcionário";
      document.querySelector("#user-modal-title").textContent = "Cadastrar funcionário";
      document.querySelector("#user-modal-subtitle").textContent =
        "Preencha os dados do colaborador para liberar o acesso à plataforma.";
      document.querySelector("#user-modal-hint").textContent =
        "O colaborador será vinculado automaticamente à empresa do gestor autenticado.";
      submitBtn.innerHTML = 'Cadastrar usuário <span aria-hidden="true">↗</span>';
    }

    modal.showModal();
    form.elements.nome.focus();
  }

  const fecharModal = () => {
    if (modal.open) modal.close();
    form.reset();
    mostrarFeedbackModal("");
  };

  function renderizarTabela() {
    const total = usuarios.length;
    const admins = usuarios.filter((usuario) => Boolean(usuario.isAdmin)).length;
    document.querySelector("[data-kpi-total]").textContent = String(total);
    document.querySelector("[data-kpi-admins]").textContent = String(admins);
    document.querySelector("[data-kpi-ops]").textContent = String(total - admins);

    let textoQuantidade = "usuários";
    if (total === 1) {
      textoQuantidade = "usuário";
    }
    document.querySelector("#user-count").textContent = `${total} ${textoQuantidade}`;

    if (!total) {
      lista.innerHTML = '<tr><td colspan="6">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    lista.innerHTML = "";
    usuarios.forEach((usuario) => {
      let classeCargo = "badge--neutral";
      if (usuario.isAdmin) {
        classeCargo = "badge--admin";
      }

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td class="users-table__name"></td>
        <td><span class="badge ${classeCargo}"></span></td>
        <td class="users-table__muted"></td>
        <td class="users-table__muted"></td>
        <td class="users-table__muted"></td>
        <td>
          <div class="users-table-actions">
            <button type="button" class="btn btn--secondary btn--sm" data-action="edit" data-id="${usuario.id}">Editar</button>
            <button type="button" class="btn btn--danger btn--sm" data-action="delete" data-id="${usuario.id}">Excluir</button>
          </div>
        </td>
      `;
      const celulas = linha.querySelectorAll("td");
      celulas[0].textContent = usuario.nome;
      celulas[1].querySelector("span").textContent = usuario.cargo;
      celulas[2].textContent = usuario.email;
      celulas[3].textContent = formatarTelefone(usuario.telefone);
      celulas[4].textContent = formatarCpf(usuario.cpf);
      lista.append(linha);
    });
  }

  const carregarUsuarios = async () => {
    const empresaId = sessionStorage.EMPRESA_ID;
    if (!empresaId) {
      lista.innerHTML = '<tr><td colspan="6">Empresa não identificada na sessão.</td></tr>';
      return;
    }

    try {
      const resposta = await fetch(`/usuarios/listar/${empresaId}`);
      if (!resposta.ok) {
        lista.innerHTML = '<tr><td colspan="6">Não foi possível carregar os usuários.</td></tr>';
        return;
      }
      usuarios = await resposta.json();
      renderizarTabela();
    } catch {
      lista.innerHTML = '<tr><td colspan="6">Erro de conexão ao buscar usuários.</td></tr>';
    }
  };

  const carregarCargos = async () => {
    const select = form.elements.cargo;
    try {
      const resposta = await fetch("/cargos/listar");
      if (!resposta.ok) return;
      cargos = await resposta.json();
      select.innerHTML = '<option value="" disabled selected>Selecione o cargo do funcionário</option>';
      cargos.forEach((cargoItem) => {
        const option = document.createElement("option");
        option.value = cargoItem.nome;
        option.textContent = cargoItem.nome;
        select.append(option);
      });
    } catch {
      // Sem conexão com o servidor para listar cargos.
    }
  };

  const botaoAbrirModal = document.querySelector("#open-user-modal");
  if (botaoAbrirModal) {
    botaoAbrirModal.addEventListener("click", () => {
      abrirModal();
    });
  }
  document.querySelectorAll("[data-close-user-modal]").forEach((btn) => btn.addEventListener("click", fecharModal));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) fecharModal();
  });

  lista.addEventListener("click", async (event) => {
    const botao = event.target.closest("button[data-action]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    if (botao.dataset.action === "edit") {
      abrirModal(usuario);
      return;
    }

    if (botao.dataset.action === "delete") {
      if (Number(sessionStorage.ID_USUARIO) === id) {
        pageFeedback.textContent = "Você não pode excluir o próprio usuário logado.";
        pageFeedback.hidden = false;
        return;
      }

      if (!window.confirm(`Deseja excluir o usuário "${usuario.nome}"?`)) {
        return;
      }

      const empresaId = sessionStorage.EMPRESA_ID;
      if (!empresaId) {
        pageFeedback.textContent = "Sessão expirada. Faça login novamente.";
        pageFeedback.hidden = false;
        return;
      }

      try {
        const resposta = await fetch(`/usuarios/deletar/${id}/${empresaId}`, {
          method: "DELETE",
        });

        if (!resposta.ok) {
          const mensagemErro = await resposta.text();
          if (mensagemErro) {
            pageFeedback.textContent = mensagemErro;
          } else {
            pageFeedback.textContent = "Não foi possível excluir o usuário.";
          }
          pageFeedback.hidden = false;
          return;
        }

        await carregarUsuarios();
        pageFeedback.textContent = `Usuário "${usuario.nome}" excluído com sucesso!`;
        pageFeedback.hidden = false;
      } catch {
        pageFeedback.textContent = "Erro de conexão com o servidor.";
        pageFeedback.hidden = false;
      }
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const idEdicao = Number(form.elements.id.value);
    const nome = form.elements.nome.value.trim();
    const cargo = form.elements.cargo.value.trim();
    const telefone = form.elements.telefone.value.replace(/\D/g, "");
    const cpf = form.elements.cpf.value.replace(/\D/g, "");
    const email = form.elements.email.value.trim();
    const senha = form.elements.senha.value;
    const confirmarSenha = form.elements.confirmar_senha.value;

    if (!nome || !cargo || !telefone || !cpf || !email) {
      return mostrarFeedbackModal("Preencha todos os campos obrigatórios.");
    }
    if (!form.elements.email.checkValidity()) {
      return mostrarFeedbackModal("Informe um e-mail válido.");
    }
    if (telefone.length < 10 || telefone.length > 11) {
      return mostrarFeedbackModal("Telefone inválido. Digite DDD + número completo.");
    }
    if (cpf.length !== 11) {
      return mostrarFeedbackModal("CPF inválido. Digite os 11 dígitos do documento.");
    }

    let precisaValidarSenha = false;
    if (!idEdicao || senha !== "" || confirmarSenha !== "") {
      precisaValidarSenha = true;
    }

    if (precisaValidarSenha && senha.length < 8) {
      return mostrarFeedbackModal("A senha deve conter no mínimo 8 caracteres.");
    }
    if (precisaValidarSenha && senha !== confirmarSenha) {
      return mostrarFeedbackModal("As senhas não coincidem.");
    }

    const empresaId = sessionStorage.EMPRESA_ID;
    if (!empresaId) {
      return mostrarFeedbackModal("Sessão expirada. Faça login novamente.");
    }

    let url = "/usuarios/cadastrar";
    let metodo = "POST";
    let mensagemCarregando = "Cadastrando funcionário...";
    let mensagemErroPadrao = "Não foi possível cadastrar o funcionário.";
    let mensagemSucesso = `Funcionário "${nome}" cadastrado com sucesso!`;

    if (idEdicao) {
      url = `/usuarios/editar/${idEdicao}`;
      metodo = "PUT";
      mensagemCarregando = "Salvando alterações...";
      mensagemErroPadrao = "Não foi possível atualizar o funcionário.";
      mensagemSucesso = `Usuário "${nome}" atualizado com sucesso!`;
    }

    submitBtn.disabled = true;
    mostrarFeedbackModal(mensagemCarregando, true);

    try {
      const resposta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeServer: nome,
          telefoneServer: telefone,
          cpfServer: cpf,
          emailServer: email,
          senhaServer: senha,
          empresaIdServer: empresaId,
          cargoServer: cargo,
        }),
      });

      if (!resposta.ok) {
        const mensagemErro = await resposta.text();
        if (mensagemErro) {
          mostrarFeedbackModal(mensagemErro);
        } else {
          mostrarFeedbackModal(mensagemErroPadrao);
        }
        return;
      }

      fecharModal();
      await carregarUsuarios();
      pageFeedback.textContent = mensagemSucesso;
      pageFeedback.hidden = false;
    } catch {
      mostrarFeedbackModal("Erro de conexão com o servidor.");
    } finally {
      submitBtn.disabled = false;
    }
  });

  carregarCargos();
  carregarUsuarios();
})();
