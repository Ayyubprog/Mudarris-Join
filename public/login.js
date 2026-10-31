(()=>{
  const $ = (selector) => document.querySelector(selector);
  const loginForm = $("#login-form");
  const registerForm = $("#register-form");
  const loginTab = $("#login-tab");
  const registerTab = $("#register-tab");
  const error = $("#error");
  const note = $("#system-status");
  const loginGoogle = $('[data-google-flow="login"]');
  const signupGoogle = $('[data-google-flow="signup"]');

  function setMode(mode) {
    const registering = mode === "register";
    loginForm.hidden = registering;
    loginForm.style.display = registering ? "none" : "block";
    registerForm.hidden = !registering;
    registerForm.style.display = registering ? "block" : "none";
    loginGoogle.hidden = registering;
    loginGoogle.style.display = registering ? "none" : "grid";
    signupGoogle.hidden = !registering;
    signupGoogle.style.display = registering ? "grid" : "none";
    loginTab.classList.toggle("active", !registering);
    registerTab.classList.toggle("active", registering);
    loginTab.setAttribute("aria-selected", String(!registering));
    registerTab.setAttribute("aria-selected", String(registering));
    error.textContent = "";
  }

  loginTab.addEventListener("click", () => setMode("login"));
  registerTab.addEventListener("click", () => setMode("register"));
  setMode("login");

  async function submitAuth(form, path, payload, successMessage) {
    const button = form.querySelector('button[type="submit"],button:not([type])');
    const oldLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Tekshirilmoqda...";
    error.textContent = "";
    try {
      const response = await fetch("/api/" + path, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {"content-type":"application/json"},
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "So‘rov bajarilmadi. Qayta urinib ko‘ring.");
      button.textContent = successMessage;
      location.assign("/teacher.html");
    } catch (err) {
      error.textContent = err && err.message ? err.message : "Internet yoki server bilan bog‘lanishda xatolik.";
      button.disabled = false;
      button.textContent = oldLabel;
    }
  }

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuth(loginForm, "auth/login", {
      email: $("#email").value.trim(),
      password: $("#password").value
    }, "Kirish...");
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    submitAuth(registerForm, "auth/register", {
      name: $("#name").value.trim(),
      email: $("#new-email").value.trim(),
      password: $("#new-password").value
    }, "Account ochilmoqda...");
  });

  async function checkSystem() {
    try {
      const response = await fetch("/api/auth/status", {credentials:"same-origin",cache:"no-store"});
      const status = await response.json();
      const messages = [];
      if (!status.googleEnabled) messages.push("Google orqali kirish hozircha sozlanmagan. Elektron pochta va paroldan foydalaning.");
      if (!status.hasTeacherAccounts) messages.push("Hali akkaunt yo‘q. Birinchi accountni “Account ochish” orqali yarating.");
      if (messages.length) {
        note.textContent = messages.join(" ");
        note.hidden = false;
      } else {
        note.hidden = true;
      }
    } catch {
      note.textContent = "Server holatini tekshirib bo‘lmadi. Sahifani yangilang.";
      note.hidden = false;
    }
  }

  const params = new URLSearchParams(location.search);
  const errors = {
    google_setup: "Google orqali kirish hali sozlanmagan. Elektron pochta va paroldan foydalaning.",
    no_account: "Bu Google akkaunti bilan hali account ochilmagan. “Account ochish” bo‘limidan Google bilan account oching.",
    not_invited: "Bu Google akkauntiga maktab administratori tomonidan ruxsat berilmagan.",
    unverified: "Google elektron pochtasi tasdiqlanmagan. Tasdiqlangan akkauntdan foydalaning.",
    google_state: "Google kirish sessiyasi muddati tugagan. Qayta urinib ko‘ring.",
    google: "Google orqali kirishda xatolik yuz berdi. Qayta urinib ko‘ring."
  };
  if (params.has("error")) error.textContent = errors[params.get("error")] || "Kirishda xatolik yuz berdi. Qayta urinib ko‘ring.";
  checkSystem();
})();
