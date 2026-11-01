(()=>{
  const $ = selector => document.querySelector(selector);
  const loginForm = $("#login-form");
  const registerForm = $("#register-form");
  const loginTab = $("#login-tab");
  const registerTab = $("#register-tab");
  const loginGoogleWrap = $("#login-google-wrap");
  const signupGoogleWrap = $("#signup-google-wrap");
  const loginGoogle = $('[data-google-flow="login"]');
  const signupGoogle = $('[data-google-flow="signup"]');
  const error = $("#error");
  const note = $("#system-status");

  function setGoogleEnabled(enabled) {
    const entries = [
      [loginGoogle, "/api/auth/google/start?flow=login", "Google bilan kirish"],
      [signupGoogle, "/api/auth/google/start?flow=signup", "Google bilan ro‘yxatdan o‘tish"]
    ];
    for (const [link, href, label] of entries) {
      if (!link) continue;
      link.classList.toggle("google-disabled", !enabled);
      link.setAttribute("aria-disabled", String(!enabled));
      link.tabIndex = enabled ? 0 : -1;
      link.title = enabled ? label : "Google OAuth hali serverda sozlanmagan";
      if (enabled) link.setAttribute("href", href);
      else link.removeAttribute("href");
    }
  }

  function setVisible(element, visible) {
    element.hidden = !visible;
    element.style.display = visible ? "" : "none";
  }

  function setMode(mode) {
    const registering = mode === "register";
    setVisible(loginForm, !registering);
    setVisible(registerForm, registering);
    setVisible(loginGoogleWrap, !registering);
    setVisible(signupGoogleWrap, registering);
    loginTab.classList.toggle("active", !registering);
    registerTab.classList.toggle("active", registering);
    loginTab.setAttribute("aria-selected", String(!registering));
    registerTab.setAttribute("aria-selected", String(registering));
    loginTab.tabIndex = registering ? -1 : 0;
    registerTab.tabIndex = registering ? 0 : -1;
    error.textContent = "";
  }

  [loginGoogle, signupGoogle].forEach(link => link?.addEventListener("click", event => {
    if (link.getAttribute("aria-disabled") === "true") event.preventDefault();
  }));

  loginTab.addEventListener("click", () => setMode("login"));
  registerTab.addEventListener("click", () => setMode("register"));
  setMode("login");
  setGoogleEnabled(false);

  async function submitAuth(form, path, payload, successText) {
    const button = form.querySelector('button[type="submit"]');
    if (!button || button.disabled) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Tekshirilmoqda...";
    error.textContent = "";
    try {
      const response = await fetch("/api/" + path, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {"content-type":"application/json", "accept":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || (response.status >= 500
          ? "Serverda xatolik yuz berdi. Keyinroq qayta urinib ko‘ring."
          : "Ma’lumotlar tekshiruvdan o‘tmadi. Kiritilgan ma’lumotlarni tekshiring.");
        throw new Error(message);
      }
      button.textContent = successText;
      location.replace("/teacher.html");
    } catch (exception) {
      error.textContent = exception?.message || "Internet yoki server bilan bog‘lanishda xatolik yuz berdi.";
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    submitAuth(loginForm, "auth/login", {
      email: $("#email").value.trim(),
      password: $("#password").value
    }, "Kabinet ochilmoqda...");
  });

  registerForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!registerForm.reportValidity()) return;
    submitAuth(registerForm, "auth/register", {
      name: $("#name").value.trim(),
      email: $("#new-email").value.trim(),
      password: $("#new-password").value
    }, "Akkaunt yaratilmoqda...");
  });

  async function checkSystem() {
    try {
      const response = await fetch("/api/auth/status", {
        credentials: "same-origin",
        cache: "no-store",
        headers: {"accept":"application/json"}
      });
      if (!response.ok) throw new Error("Server holatini tekshirib bo‘lmadi.");
      const status = await response.json();
      const googleEnabled = !!status.googleEnabled;
      setGoogleEnabled(googleEnabled);
      note.textContent = googleEnabled
        ? ""
        : "Google orqali kirish hali sozlanmagan. Hozircha e-pochta va parol orqali kiring.";
      note.hidden = googleEnabled;
    } catch {
      setGoogleEnabled(false);
      note.textContent = "Server holatini tekshirib bo‘lmadi. Internet aloqasini tekshiring.";
      note.hidden = false;
    }
  }

  const params = new URLSearchParams(location.search);
  const errors = {
    google_setup: "Google orqali kirish hali sozlanmagan. Hozircha e-pochta va parol bilan davom eting.",
    no_account: "Bu Google akkaunti hali ro‘yxatdan o‘tmagan. Google orqali ro‘yxatdan o‘tish bo‘limidan foydalaning.",
    unverified: "Google elektron pochtasi tasdiqlanmagan. Tasdiqlangan akkauntdan foydalaning.",
    google_state: "Google kirish sessiyasi muddati tugagan. Qayta urinib ko‘ring.",
    google: "Google orqali kirishda xatolik yuz berdi. Qayta urinib ko‘ring."
  };
  if (params.has("error")) error.textContent = errors[params.get("error")] || "Kirishda xatolik yuz berdi. Qayta urinib ko‘ring.";
  checkSystem();
})();