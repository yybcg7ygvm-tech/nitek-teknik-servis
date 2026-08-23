(function(){
const cfg=window.NITEK_CONFIG||{}; const $=id=>document.getElementById(id);
const logo=$("logoBox"); logo.innerHTML='<div class="fallback-logo">N</div>';
let pendingEmail="";
function msg(t){$("authMsg").textContent=t} function otpMsg(t){$("otpMsg").textContent=t}
function demoLogin(){localStorage.setItem("nitek_auth","1");localStorage.setItem("nitek_user",pendingEmail);location.href="index.html"}
$("loginBtn").onclick=async()=>{pendingEmail=$("email").value.trim();let p=$("pass").value;if(!pendingEmail||!p)return msg("E-posta ve şifre gerekli.");
 if(cfg.SUPABASE_URL&&cfg.SUPABASE_PUBLISHABLE_KEY){msg("Supabase bağlantısı bu temiz sürümde yapılandırılmayı bekliyor.");return}
 demoLogin()};
$("signupBtn").onclick=()=>{pendingEmail=$("email").value.trim();let p=$("pass").value;if(!pendingEmail||!p)return msg("E-posta ve şifre gerekli.");$("authForm").classList.add("hidden");$("otpForm").classList.remove("hidden");otpMsg("Demo modunda doğrulama için 123456 kodunu kullanabilirsin.")};
$("otpBtn").onclick=()=>{if($("otp").value.trim()==="123456")demoLogin();else otpMsg("Kod yanlış. Demo için 123456 gir.")};
$("backAuth").onclick=()=>{$("otpForm").classList.add("hidden");$("authForm").classList.remove("hidden")};
$("resetBtn").onclick=()=>msg("Şifre sıfırlama, Supabase bağlantısı eklendiğinde gerçek e-posta ile çalışacak.");
})();