const cfg = window.NITEK_CONFIG;

if (!cfg) {
  document.getElementById("msg").textContent =
    "Hata: app-config.js yüklenemedi.";
} else if (!window.supabase) {
  document.getElementById("msg").textContent =
    "Hata: Supabase bağlantısı yüklenemedi.";
} else {

  const sb = window.supabase.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_PUBLISHABLE_KEY
  );

  const msg = document.getElementById("msg");

  function mesaj(text) {
    msg.textContent = text;
  }

  document.getElementById("loginBtn").onclick = async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("pass").value;

    if (!email || !password) {
      mesaj("E-posta ve şifre gerekli.");
      return;
    }

    mesaj("Giriş yapılıyor...");

    const { error } = await sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      mesaj("Hata: " + error.message);
      return;
    }

    window.location.href = "index.html";
  };

  document.getElementById("signupBtn").onclick = async () => {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("pass").value;

    if (!email || password.length < 6) {
      mesaj("E-posta ve en az 6 karakterli şifre gerekli.");
      return;
    }

    mesaj("Kayıt oluşturuluyor...");

    const { data, error } = await sb.auth.signUp({
      email,
      password
    });

    if (error) {
      mesaj("Hata: " + error.message);
      return;
    }

    if (data.session) {
      window.location.href = "index.html";
    } else {
      mesaj("Kayıt tamamlandı. E-postanı doğrula.");
    }
  };

  document.getElementById("resetBtn").onclick = async () => {

    const email = document.getElementById("email").value.trim();

    if (!email) {
      mesaj("Önce e-posta adresini yaz.");
      return;
    }

    mesaj("Gönderiliyor...");

    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo:
        "https://yybcg7ygvm-tech.github.io/nitek-teknik-servis/"
    });

    if (error) {
      mesaj("Hata: " + error.message);
    } else {
      mesaj("Şifre sıfırlama e-postası gönderildi.");
    }
  };
}
