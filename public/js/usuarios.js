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

  const formatarTelefone = (v) =>
    String(v || "").replace(/\D/g, "").replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");

  const formatarCpf = (v) =>
    String(v || "").replace(/\D/g, "").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");

  const mostrarFeedbackModal = (mensagem, sucesso = false) => {
    if (!modalFeedback) return;
    modalFeedback.textContent = mensagem;
    modalFeedback.classList.toggle("is-visible", Boolean(mensagem));
    modalFeedback.style.color = sucesso ? "#4ade80" : "#f87171";
  };

  const abrirModal = (usuario = null) => {
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

    form.elements.id.value = editando ? String(usuario.id) : "";
    if (editando) {
      form.elements.nome.value = usuario.nome;
      form.elements.cargo.value = usuario.cargo;
      form.elements.telefone.value = formatarTelefone(usuario.telefone);
      form.elements.cpf.value = formatarCpf(usuario.cpf);
      form.elements.email.value = usuario.email;
    }

    form.elements.senha.placeholder = editando ? "Deixe em branco para manter" : "Mínimo de 8 caracteres";
    form.elements.confirmar_senha.placeholder = editando ? "Repita apenas se alterar" : "Repita a senha do funcionário";

    document.querySelector("#user-modal-title").textContent = editando ? "Editar usuário" : "Cadastrar funcionário";
    document.querySelector("#user-modal-subtitle").textContent = editando
      ? "Atualize os dados ou o cargo do colaborador selecionado."
      : "Preencha os dados do colaborador para liberar o acesso à plataforma.";
    document.querySelector("#user-modal-hint").textContent = editando
      ? "Deixe os campos de senha em branco para manter a senha atual."
      : "O colaborador será vinculado automaticamente à empresa do gestor autenticado.";
    submitBtn.innerHTML = (editando ? "Salvar alterações" : "Cadastrar usuário") + ' <span aria-hidden="true">↗</span>';

    modal.showModal();
    form.elements.nome.focus();
  };

  const fecharModal = () => {
    if (modal.open) modal.close();
    form.reset();
    mostrarFeedbackModal("");
  };

  const renderizarTabela = () => {
    const total = usuarios.length;
    const admins = usuarios.filter((u) => Boolean(u.isAdmin)).length;
    document.querySelector("[data-kpi-total]").textContent = String(total);
    document.querySelector("[data-kpi-admins]").textContent = String(admins);
    document.querySelector("[data-kpi-ops]").textContent = String(total - admins);
    document.querySelector("#user-count").textContent = `${total} ${total === 1 ? "usuário" : "usuários"}`;

    if (!total) {
      lista.innerHTML = '<tr><td colspan="6">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    lista.replaceChildren();
    usuarios.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="users-table__name"></td>
        <td><span class="badge ${u.isAdmin ? "badge--admin" : "badge--neutral"}"></span></td>
        <td class="users-table__muted"></td>
        <td class="users-table__muted"></td>
        <td class="users-table__muted"></td>
        <td>
          <div class="users-table-actions">
            <button type="button" class="btn btn--secondary btn--sm" data-action="edit" data-id="${u.id}">Editar</button>
            <button type="button" class="btn btn--danger btn--sm" data-action="delete" data-id="${u.id}">Excluir</button>
          </div>
        </td>
      `;
      const td = tr.querySelectorAll("td");
      td[0].textContent = u.nome;
      td[1].querySelector("span").textContent = u.cargo;
      td[2].textContent = u.email;
      td[3].textContent = formatarTelefone(u.telefone);
      td[4].textContent = formatarCpf(u.cpf);
      lista.append(tr);
    });
  };

  const carregarUsuarios = async () => {
    const empresaId = sessionStorage.EMPRESA_ID;
    if (!empresaId) {
      lista.innerHTML = '<tr><td colspan="6">Empresa não identificada na sessão.</td></tr>';
      return;
    }

    try {
      const resposta = await fetch(`/usuarios/listar/${encodeURIComponent(empresaId)}`);
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
      cargos.forEach((c) => {
        const option = document.createElement("option");
        option.value = c.nome;
        option.textContent = c.nome;
        select.append(option);
      });
    } catch {
      // Sem conexão com o servidor para listar cargos.
    }
  };

  document.querySelector("#open-user-modal")?.addEventListener("click", () => abrirModal());
  document.querySelectorAll("[data-close-user-modal]").forEach((btn) => btn.addEventListener("click", fecharModal));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) fecharModal();
  });

  lista.addEventListener("click", (event) => {
    const botao = event.target.closest("button[data-action]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    if (botao.dataset.action === "edit") {
      abrirModal(usuario);
      return;
    }

    if (botao.dataset.action === "delete" && window.confirm(`Deseja excluir o usuário "${usuario.nome}"?`)) {
      // shortcut: exclusão apenas em memória até implementar DELETE no backend.
      usuarios = usuarios.filter((u) => u.id !== id);
      renderizarTabela();
      pageFeedback.textContent = `Usuário "${usuario.nome}" removido da listagem.`;
      pageFeedback.hidden = false;
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

    const validarSenha = !idEdicao || Boolean(senha) || Boolean(confirmarSenha);
    if (validarSenha && senha.length < 8) {
      return mostrarFeedbackModal("A senha deve conter no mínimo 8 caracteres.");
    }
    if (validarSenha && senha !== confirmarSenha) {
      return mostrarFeedbackModal("As senhas não coincidem.");
    }

    if (idEdicao) {
      // shortcut: edição apenas em memória até implementar PUT no backend.
      const cargoEncontrado = cargos.find((c) => c.nome === cargo);
      usuarios = usuarios.map((u) =>
        u.id === idEdicao
          ? { ...u, nome, cargo, email, telefone, cpf, isAdmin: cargoEncontrado ? cargoEncontrado.is_admin : u.isAdmin }
          : u
      );
      fecharModal();
      renderizarTabela();
      pageFeedback.textContent = `Usuário "${nome}" atualizado na listagem.`;
      pageFeedback.hidden = false;
      return;
    }

    const empresaId = sessionStorage.EMPRESA_ID;
    if (!empresaId) {
      return mostrarFeedbackModal("Sessão expirada. Faça login novamente.");
    }

    submitBtn.disabled = true;
    mostrarFeedbackModal("Cadastrando funcionário...", true);

    try {
      const resposta = await fetch("/usuarios/cadastrar", {
        method: "POST",
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
        return mostrarFeedbackModal((await resposta.text()) || "Não foi possível cadastrar o funcionário.");
      }

      fecharModal();
      await carregarUsuarios();
      pageFeedback.textContent = `Funcionário "${nome}" cadastrado com sucesso!`;
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
