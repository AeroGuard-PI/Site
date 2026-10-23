(() => {
  "use strict";

  const formLogin = document.querySelector("#login-form");

  if (formLogin) {
    formLogin.addEventListener("submit", (event) => {
      event.preventDefault();

      const feedback = formLogin.querySelector("[data-form-feedback]");
      const exibirFeedback = (mensagem, sucesso = false) => {
        if (!feedback) return;
        feedback.textContent = mensagem;
        feedback.classList.add("is-visible");
        feedback.style.color = sucesso ? "#4ade80" : "#f87171";
      };

      const email = formLogin.querySelector('[name="email"]').value.trim();
      const senha = formLogin.querySelector('[name="senha"]').value;

      if (!email || !senha) {
        exibirFeedback("Preencha todos os campos.");
        return;
      }

      exibirFeedback("Autenticando...");

      fetch("/usuarios/autenticar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailServer: email,
          senhaServer: senha,
        }),
      })
        .then((resposta) => {
          if (resposta.ok) {
            resposta.json().then((dados) => {
              sessionStorage.ID_USUARIO = dados.id;
              sessionStorage.NOME_USUARIO = dados.nome;
              sessionStorage.EMAIL_USUARIO = dados.email;
              sessionStorage.EMPRESA_ID = dados.empresaId;
              sessionStorage.CARGO_ID = dados.cargoId;

              exibirFeedback("Login realizado com sucesso! Entrando...", true);
              setTimeout(() => {
                window.location.href = "dashboard.html";
              }, 1000);
            });
          } else {
            resposta.text().then((textoErro) => {
              exibirFeedback(textoErro || "E-mail ou senha inválidos.");
            });
          }
        })
        .catch((erro) => {
          console.error("Erro no login:", erro);
          exibirFeedback("Erro de conexão com o servidor.");
        });
    });
  }

  const formCadastro = document.querySelector("#register-form");

  if (formCadastro) {
    const selectCargo = formCadastro.querySelector("#cargo_input");
    if (selectCargo) {
      fetch("/cargos/listar")
        .then((resposta) => resposta.json())
        .then((cargos) => {
          cargos.forEach((c) => {
            const option = document.createElement("option");
            option.value = c.nome;
            option.textContent = c.nome;
            selectCargo.appendChild(option);
          });
        })
        .catch((erro) => console.error("Erro ao listar cargos:", erro));
    }

    formCadastro.addEventListener("submit", (event) => {
      event.preventDefault();

      const feedback = formCadastro.querySelector("[data-form-feedback]");
      const exibirFeedback = (mensagem, sucesso = false) => {
        if (!feedback) return;
        feedback.textContent = mensagem;
        feedback.classList.add("is-visible");
        feedback.style.color = sucesso ? "#4ade80" : "#f87171";
      };

      const nome = formCadastro.querySelector('[name="nome"]').value.trim();
      const cargo = formCadastro.querySelector('[name="cargo"]').value.trim();
      const telefone = formCadastro.querySelector('[name="telefone"]').value.replace(/\D/g, "");
      const cpf = formCadastro.querySelector('[name="cpf"]').value.replace(/\D/g, "");
      const email = formCadastro.querySelector('[name="email"]').value.trim();
      const senha = formCadastro.querySelector('[name="senha"]').value;
      const confirmarSenha = formCadastro.querySelector('[name="confirmar_senha"]').value;
      const codigoEmpresa = formCadastro.querySelector('[name="codigo_empresa"]').value.trim();

      if (!nome || !cargo || !telefone || !cpf || !email || !senha || !confirmarSenha || !codigoEmpresa) {
        exibirFeedback("Preencha todos os campos obrigatórios.");
        return;
      }

      if (telefone.length < 10 || telefone.length > 11) {
        exibirFeedback("Telefone inválido. Digite DDD + número completo.");
        return;
      }

      if (cpf.length !== 11) {
        exibirFeedback("CPF inválido. Digite os 11 dígitos do documento.");
        return;
      }

      if (senha.length < 8) {
        exibirFeedback("A senha deve conter no mínimo 8 caracteres.");
        return;
      }

      if (senha !== confirmarSenha) {
        exibirFeedback("As senhas não coincidem.");
        return;
      }

      exibirFeedback("Processando solicitação...");

      fetch("/usuarios/cadastrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeServer: nome,
          telefoneServer: telefone,
          cpfServer: cpf,
          emailServer: email,
          senhaServer: senha,
          codigoEmpresaServer: codigoEmpresa,
          cargoServer: cargo,
        }),
      })
        .then((resposta) => {
          if (resposta.ok) {
            exibirFeedback("Cadastro realizado com sucesso! Redirecionando...", true);
            formCadastro.reset();
            setTimeout(() => {
              window.location.href = "login.html";
            }, 2000);
          } else {
            resposta.text().then((textoErro) => {
              exibirFeedback(textoErro || "Houve um erro ao realizar o cadastro.");
            });
          }
        })
        .catch((erro) => {
          console.error("Erro no cadastro:", erro);
          exibirFeedback("Não foi possível conectar ao servidor. Tente novamente mais tarde.");
        });
    });
  }

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button
        .closest(".field__control")
        ?.querySelector("[data-password]");
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Ocultar" : "Mostrar";
      button.setAttribute(
        "aria-label",
        show ? "Ocultar senha" : "Mostrar senha",
      );
    });
  });

  const onlyDigits = (value) => value.replace(/\D/g, "");

  document.querySelectorAll("[data-cpf]").forEach((input) => {
    input.addEventListener("input", () => {
      const digits = onlyDigits(input.value).slice(0, 11);
      input.value = digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    });
  });

  document.querySelectorAll("[data-phone]").forEach((input) => {
    input.addEventListener("input", () => {
      const digits = onlyDigits(input.value).slice(0, 11);
      if (digits.length <= 10) {
        input.value = digits
          .replace(/^(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2");
      } else {
        input.value = digits
          .replace(/^(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{5})(\d)/, "$1-$2");
      }
    });
  });

  document.querySelectorAll("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const feedback = form.querySelector("[data-form-feedback]");
      if (feedback) {
        feedback.textContent =
          "Interface pronta. Para autenticar ou registrar usuários, conecte este formulário ao backend da AeroGuard.";
        feedback.classList.add("is-visible");
      }
    });
  });

  document.querySelectorAll("[data-not-ready]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const feedback = document.querySelector("[data-form-feedback]");
      if (feedback) {
        feedback.textContent =
          "A recuperação de senha precisa ser conectada ao serviço de autenticação.";
        feedback.classList.add("is-visible");
      }
    });
  });
})();
