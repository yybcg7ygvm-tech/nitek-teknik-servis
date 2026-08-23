(function(){
"use strict";
const SUPABASE_URL="https://kwiqjwojrowwooukmjih.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_di373iSfOTaPUlSfcasZbg_RHvQJDle";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
let pendingEmail="";

function msg(t,error=false){$("loginMsg").textContent=t;$("loginMsg").style.color=error?"#d71920":"#69758b";}
function panel(which){
 $("authLogin").classList.toggle("hidden",which!=="login");
 $("authSignup").classList.toggle("hidden",which!=="signup");
 $("authVerify").classList.toggle("hidden",which!=="verify");
}
$("showSignup").onclick=()=>{panel("signup");msg("")};
$("showLogin").onclick=()=>{panel("login");msg("")};

$("loginBtn").onclick=async()=>{
 const email=$("loginUser").value.trim(),password=$("loginPass").value;
 if(!email||!password){msg("E-posta ve şifre gerekli.",true);return}
 $("loginBtn").disabled=true;msg("Giriş yapılıyor...");
 const {error}=await sb.auth.signInWithPassword({email,password});
 $("loginBtn").disabled=false;
 if(error){msg(error.message,true);return}
 msg("Giriş başarılı...");
 setTimeout(()=>location.href="index.html",300);
};

$("signupBtn").onclick=async()=>{
 const email=$("signupEmail").value.trim(),password=$("signupPass").value;
 if(!email||!password){msg("E-posta ve şifre gerekli.",true);return}
 if(password.length<6){msg("Şifre en az 6 karakter olmalı.",true);return}
 $("signupBtn").disabled=true;msg("Kayıt oluşturuluyor...");
 const {data,error}=await sb.auth.signUp({email,password});
 $("signupBtn").disabled=false;
 if(error){msg(error.message,true);return}
 pendingEmail=email;
 if(data.session){
   msg("Hesap oluşturuldu. Uygulama açılıyor...");
   setTimeout(()=>location.href="index.html",300);
 }else{
   panel("verify");
   msg("E-postana doğrulama kodu gönderildi.");
 }
};

$("verifyBtn").onclick=async()=>{
 const token=$("verifyCode").value.trim();
 if(!pendingEmail||token.length!==6){msg("6 haneli doğrulama kodunu gir.",true);return}
 $("verifyBtn").disabled=true;msg("Kod doğrulanıyor...");
 const {data,error}=await sb.auth.verifyOtp({email:pendingEmail,token,type:"signup"});
 $("verifyBtn").disabled=false;
 if(error){msg(error.message,true);return}
 msg("E-posta doğrulandı. Uygulama açılıyor...");
 setTimeout(()=>location.href="index.html",300);
};

$("resendBtn").onclick=async()=>{
 if(!pendingEmail){msg("Önce kayıt ol.",true);return}
 const {error}=await sb.auth.resend({type:"signup",email:pendingEmail});
 if(error)msg(error.message,true);else msg("Yeni doğrulama kodu gönderildi.");
};

sb.auth.getSession().then(({data})=>{
 if(data.session) location.href="index.html";
});
})();