const cfg = window.NITEK_CONFIG;

const sb = window.supabase.createClient(
  cfg.SUPABASE_URL,
  cfg.SUPABASE_PUBLISHABLE_KEY
);

const msg = document.getElementById("msg");

function mesaj(yazi) {
  msg.textContent = yazi;
}

document.getElementById("loginBtn").onclick = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("pass").value;

  if (!email || !password) {
    mesaj("E-posta ve şifre gerekli.");
    return;
  }

  mesaj("Giriş yapılıyor...");

  const { error } = await sb.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    mesaj("Hata: " + error.message);
    return;
  }

  window.location.href = "index.html";
};

document.getElementById("signupBtn").onclick = async function () {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("pass").value;

  if (!email || password.length < 6) {
    mesaj("En az 6 karakterli şifre gir.");
    return;
  }

  mesaj("Kayıt oluşturuluyor...");

  const { data, error } = await sb.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    mesaj("Hata: " + error.message);
    return;
  }

  if (data.session) {
    window.location.href = "index.html";
  } else {
    mesaj("Kayıt tamamlandı. E-postanı doğrula, sonra giriş yap.");
  }
};

document.getElementById("resetBtn").onclick = async function () {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    mesaj("Önce e-postanı yaz.");
    return;
  }

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: "https://yybcg7ygvm-tech.github.io/nitek-teknik-servis/"
  });

  mesaj(
    error
      ? "Hata: " + error.message
      : "Şifre sıfırlama e-postası gönderildi."
  );
};
