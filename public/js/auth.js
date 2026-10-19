(() => {
  "use strict";

  const formLogin = document.querySelector("#login-form");

  formLogin.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = formLogin.querySelector('[name="email"]').value.trim();
    const senha = formLogin.querySelector('[name="senha"]').value;

    if (email === "admin@admin.com" && senha === "admin") {
      window.location.href = "dashboard.html";
      return;
    }

    alert("E-mail ou senha inválidos.");
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
