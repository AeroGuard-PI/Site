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
              sessionStorage.CARGO_NOME = dados.cargoNome || "";
              sessionStorage.IS_ADMIN = dados.isAdmin ? "1" : "0";

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

  document.querySelectorAll("[data-admin-only]").forEach((elemento) => {
    elemento.hidden = sessionStorage.IS_ADMIN !== "1";
  });

  if (window.location.pathname.endsWith("cadastro-funcionarios.html") && sessionStorage.IS_ADMIN !== "1") {
    window.location.href = sessionStorage.ID_USUARIO ? "dashboard.html" : "login.html";
    return;
  }

  document.querySelectorAll("[data-user-name]").forEach((elemento) => {
    elemento.textContent = sessionStorage.NOME_USUARIO || "Usuário";
  });

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
