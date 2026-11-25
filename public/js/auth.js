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
        if (sucesso) {
          feedback.style.color = "#4ade80";
        } else {
          feedback.style.color = "#f87171";
        }
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
              if (dados.isAdmin) {
                sessionStorage.IS_ADMIN = "1";
              } else {
                sessionStorage.IS_ADMIN = "0";
              }

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

  const menuCompacto = window.matchMedia("(max-width: 560px)");
  const manterDestinoVisivel = () => {
    const menu = document.querySelector(".dashboard-nav");
    const destino = menu?.querySelector(".is-active");
    if (!menuCompacto.matches || !destino) return;
    const area = menu.getBoundingClientRect(), item = destino.getBoundingClientRect();
    if (item.right > area.right || item.left < area.left) menu.scrollLeft += item.left - area.left;
  };
  document.fonts.ready.then(manterDestinoVisivel);
  window.addEventListener("resize", manterDestinoVisivel, { passive: true });

  if (window.location.pathname.endsWith("cadastro-funcionarios.html") && sessionStorage.IS_ADMIN !== "1") {
    if (sessionStorage.ID_USUARIO) {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "login.html";
    }
    return;
  }

  document.querySelectorAll("[data-user-name]").forEach((elemento) => {
    elemento.textContent = sessionStorage.NOME_USUARIO || "Usuário";
  });

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const campoControle = button.closest(".field__control");
      if (!campoControle) return;
      const input = campoControle.querySelector("[data-password]");
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        button.textContent = "Ocultar";
        button.setAttribute("aria-label", "Ocultar senha");
      } else {
        input.type = "password";
        button.textContent = "Mostrar";
        button.setAttribute("aria-label", "Mostrar senha");
      }
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
