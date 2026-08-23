const SUPABASE_URL="https://kwiqjwojrowwooukmjih.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_di373iSfOTaPUlSfcasZbg_RHvQJDle";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const $=id=>document.getElementById(id);
let user=null,customers=[],services=[],stock=[],settings={};
let servicePhotos=[];

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function money(v){return Number(v||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})+" TL";}
function toast(t,err=false){$("toast").textContent=t;$("toast").className=err?"show errtoast":"show";setTimeout(()=>$("toast").className="",2500)}
function showTab(t){document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===t));document.querySelectorAll(".tab").forEach(s=>s.classList.toggle("active",s.id==="tab-"+t));if(t==="calendar")renderCalendar();if(t==="reports")renderReports();if(t==="stock")renderStock();if(t==="faultcodes")renderFaultCodes()}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>showTab(b.dataset.tab));

async function boot(){const {data:{session}}=await db.auth.getSession();apply(session);db.auth.onAuthStateChange((_e,s)=>setTimeout(()=>apply(s),0));}
async function apply(s){user=s?.user||null;if(!user){$("authView").classList.remove("hidden");$("appView").classList.add("hidden");$("logoutBtn").classList.add("hidden");return}
$("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");$("accountLabel").textContent=user.email||"";await loadAll();}
$("loginBtn").onclick=async()=>{const {error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});if(error)alert(error.message)};
$("signupBtn").onclick=async()=>{const p=$("password").value;if(p.length<6)return alert("Şifre en az 6 karakter.");const {data,error}=await db.auth.signUp({email:$("email").value.trim(),password:p});if(error)alert(error.message);else alert(data.session?"Hesap oluşturuldu.":"E-postanı doğrula, sonra giriş yap.")};
$("logoutBtn").onclick=()=>db.auth.signOut();

async function loadAll(){
 const c=await db.from("musteriler").select("*").order("created_at",{ascending:false}); if(c.error)return alert(c.error.message);customers=c.data||[];
 const s=await db.from("servis_kayitlari").select("*").order("servis_tarihi",{ascending:false}).order("created_at",{ascending:false});if(s.error)return alert(s.error.message);services=s.data||[];
 const st=await db.from("stok_parcalari").select("*").order("parca_adi");stock=st.error?[]:(st.data||[]);
 const a=await db.from("isletme_ayarlari").select("*").eq("user_id",user.id).maybeSingle();settings=a.data||{};
 if(settings.isletme_adi){$("bizName").value=settings.isletme_adi;$("bizPhone").value=settings.telefon||"";$("bizWhatsapp").value=settings.whatsapp||"";$("bizAddress").value=settings.adres||"";$("bizTax").value=settings.vergi_no||""}
 renderAll();
}
function renderAll(){renderCustomers();renderServices();renderDashboard();renderStock();renderReports();renderCalendar();}


function nextYear(v){if(!v)return null;const d=new Date(v+"T00:00:00");d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10)}
function reminderDate(c){if(!c?.sonraki_bakim_tarihi)return null;const d=new Date(c.sonraki_bakim_tarihi+"T00:00:00");d.setDate(d.getDate()-Number(c.bakim_hatirlatma_gun||30));return d.toISOString().slice(0,10)}
function reminderItems(){
 const now=new Date();now.setHours(0,0,0,0);
 return customers.filter(c=>{
   if(!c.bakim_hatirlatma||!c.sonraki_bakim_tarihi)return false;
   const r=new Date(reminderDate(c)+"T00:00:00"); return r<=now;
 }).sort((a,b)=>String(a.sonraki_bakim_tarihi).localeCompare(String(b.sonraki_bakim_tarihi)));
}
function renderTodayCalls(){
 const arr=reminderItems();
 $("todayCalls").innerHTML=`<h3>📞 Bugün Aranacak Müşteriler</h3>`+
 (arr.length?arr.map(c=>`<div class="item"><strong>${esc(c.ad_soyad)}</strong>
 <div>${esc(c.cihaz_turu||"Cihaz")} · Sonraki bakım: <b>${esc(c.sonraki_bakim_tarihi)}</b></div>
 <div class="row"><button onclick="call('${encodeURIComponent(c.telefon||"")}')">📞 Ara</button>
 <button onclick="sendMaintenanceWhatsApp('${c.id}')">💬 WhatsApp</button></div></div>`).join("")
 :'<div class="empty">Bugün aranacak bakım müşterisi yok. 🎉</div>');
}
window.sendMaintenanceWhatsApp=id=>{
 const c=customers.find(x=>x.id===id);if(!c)return;
 const phone=String(c.telefon||"").replace(/\D/g,"");
 const cihaz=c.cihaz_turu||"cihazınız";
 const text=`Merhaba ${c.ad_soyad}, NİTEK Teknik Servis olarak ${cihaz} yıllık bakım zamanınızın geldiğini hatırlatmak isteriz. Uygun olduğunuz zamanı bildirirseniz randevunuzu oluşturabiliriz.`;
 window.open((phone?`https://wa.me/${phone}`:"https://wa.me/")+"?text="+encodeURIComponent(text),"_blank");
};

function renderDashboard(){
 $("statCustomers").textContent=customers.length;
 const today=new Date().toISOString().slice(0,10);
 $("statToday").textContent=services.filter(s=>s.servis_tarihi===today).length;
 $("statPending").textContent=services.filter(s=>s.servis_durumu!=="Tamamlandı").length;
 $("statRevenue").textContent=money(services.reduce((a,s)=>a+Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0),0));
 renderTodayCalls();
 $("recentServices").innerHTML=services.slice(0,5).map(serviceCard).join("")||'<div class="empty">Henüz servis yok.</div>';
}
function serviceCard(s){const c=customers.find(x=>x.id===s.musteri_id);return `<div class="item"><strong>${esc(c?.ad_soyad||"Müşteri")}</strong><div>📅 ${esc(s.servis_tarihi||"")} · 🕐 ${esc(s.servis_saati||"")} · ${esc(s.cihaz_turu||c?.cihaz_turu||"")} · ${esc(s.marka||c?.marka||"")}</div><div class="muted">📍 ${esc(s.servis_adresi||c?.adres||"")}</div><span class="badge">${esc(s.servis_durumu||"")}</span><div class="muted">${esc(s.ariza||"")}</div><div class="row"><button onclick="makePDF('${s.id}')">🧾 PDF</button><button onclick="whatsappService('${s.id}')">💬 WhatsApp</button></div></div>`}
function renderCustomers(){
 const q=($("customerSearch").value||"").toLocaleLowerCase("tr-TR");
 const arr=customers.filter(c=>(c.ad_soyad+" "+c.telefon+" "+c.marka+" "+c.model).toLocaleLowerCase("tr-TR").includes(q));
 $("customerList").innerHTML=arr.map(c=>`<div class="item customer-card" onclick="openCustomerHistory('${c.id}')"><strong>${esc(c.ad_soyad)}</strong><div>${esc(c.telefon)} · ${esc(c.cihaz_turu)} · ${esc(c.marka)} ${esc(c.model)}</div><div class="muted">${esc(c.adres)} · Seri: ${esc(c.seri_no)}</div><div class="muted">Yıllık bakım: ${c.bakim_hatirlatma?"✅ Aktif":"❌ Kapalı"}${c.sonraki_bakim_tarihi?" · Sonraki: "+esc(c.sonraki_bakim_tarihi):""}</div><div class="row"><button onclick="event.stopPropagation();call('${encodeURIComponent(c.telefon)}')">📞 Ara</button><button onclick="event.stopPropagation();openCustomerHistory('${c.id}')">📋 Geçmiş</button><button onclick="event.stopPropagation();openServiceForm('${c.id}')">🔧 Servis</button><button class="danger" onclick="event.stopPropagation();deleteCustomer('${c.id}')">Sil</button></div></div>`).join("")||'<div class="empty">Müşteri bulunamadı.</div>';
}
function renderServices(){
 const q=($("serviceSearch").value||"").toLocaleLowerCase("tr-TR"),f=$("serviceFilter").value;
 const arr=services.filter(s=>{const c=customers.find(x=>x.id===s.musteri_id);return (!f||s.servis_durumu===f)&&((c?.ad_soyad+" "+c?.telefon+" "+s.ariza+" "+s.yapilan_islem).toLocaleLowerCase("tr-TR").includes(q))});
 $("serviceList").innerHTML=arr.map(s=>serviceCard(s)).join("")||'<div class="empty">Servis bulunamadı.</div>';
}
$("customerSearch").oninput=renderCustomers;$("serviceSearch").oninput=renderServices;$("serviceFilter").onchange=renderServices;
$("calendarDate").value=new Date().toISOString().slice(0,10);$("calendarDate").onchange=renderCalendar;
function renderCalendar(){const d=$("calendarDate").value,arr=services.filter(s=>s.servis_tarihi===d);$("calendarList").innerHTML=arr.map(serviceCard).join("")||'<div class="empty">Bu tarihte servis yok.</div>'}

function openModal(html){$("modalContent").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden");$("modalContent").innerHTML=""}
window.closeModal=closeModal;
window.openCustomerForm=()=>openModal(`<h2>Yeni Müşteri</h2><form id="mForm">
<input id="mName" required placeholder="Ad Soyad">
<input id="mPhone" required placeholder="Telefon">
<textarea id="mAddress" placeholder="Adres"></textarea>
<select id="mType"><option>Kombi</option><option>Klima</option></select>
<input id="mBrand" placeholder="Marka">
<input id="mModel" placeholder="Model">
<input id="mSerial" placeholder="Seri No">
<textarea id="mNote" placeholder="Not"></textarea>
<div class="card reminderBox"><b>🔔 Yıllık bakım hatırlatması</b>
<label class="check"><input id="mReminder" type="checkbox"> Müşteri yıllık bakım hatırlatması istiyor</label>
<select id="mReminderDays"><option value="30">30 gün önce</option><option value="15">15 gün önce</option><option value="7">7 gün önce</option><option value="0">Bakım günü</option></select>
<label>Son bakım tarihi <input id="mLastService" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
</div>
<button type="submit" class="primary">☁️ Kaydet</button></form>`);
document.addEventListener("submit",async e=>{
 if(e.target.id!=="mForm")return;
 e.preventDefault();
 const row={
  user_id:user.id,
  ad_soyad:$("mName").value.trim(),
  telefon:$("mPhone").value.trim(),
  adres:$("mAddress").value.trim(),
  cihaz_turu:$("mType").value,
  marka:$("mBrand").value.trim(),
  model:$("mModel").value.trim(),
  seri_no:$("mSerial").value.trim(),
  notlar:$("mNote").value.trim(),
  bakim_hatirlatma:$("mReminder")?.checked||false,
  bakim_hatirlatma_gun:Number($("mReminderDays")?.value||30),
  son_bakim_tarihi:$("mLastService")?.value||null,
  sonraki_bakim_tarihi:$("mReminder")?.checked?nextYear($("mLastService")?.value):null
 };
 let result=await db.from("musteriler").insert(row);
 if(result.error){
   // If V10 migration has not yet been run, save the customer with the original columns.
   const basic={user_id:row.user_id,ad_soyad:row.ad_soyad,telefon:row.telefon,adres:row.adres,cihaz_turu:row.cihaz_turu,marka:row.marka,model:row.model,seri_no:row.seri_no,notlar:row.notlar};
   const retry=await db.from("musteriler").insert(basic);
   if(retry.error){toast("Müşteri kaydedilemedi: "+retry.error.message,true);return;}
   closeModal();toast("Müşteri kaydedildi. Bakım hatırlatması için V10 SQL'i Supabase'de çalıştır.");
 }else{
   closeModal();toast("Müşteri kaydedildi");
 }
 await loadAll();
});

window.openServiceForm=(cid="")=>{const opts=customers.map(c=>`<option value="${c.id}" ${c.id===cid?"selected":""}>${esc(c.ad_soyad)} - ${esc(c.telefon)}</option>`).join("");openModal(`<h2>🔧 Yeni Servis / Randevu</h2><form id="sForm"><select id="sCustomer" required><option value="">Müşteri seç</option>${opts}</select><button type="button" class="secondary" onclick="openQuickCustomer()">＋ Yeni Müşteri Oluştur</button><div class="grid2"><label>Tarih<input id="sDate" type="date" value="${new Date().toISOString().slice(0,10)}" required></label><label>Saat<input id="sTime" type="time" value="09:00" required></label></div><textarea id="sAddress" placeholder="📍 Servis adresi"></textarea><select id="sDevice"><option>Kombi</option><option>Klima</option><option>Şofben</option><option>Diğer</option></select><div class="grid2"><input id="sBrand" placeholder="Marka"><input id="sModel" placeholder="Model"></div><input id="sCode" placeholder="Arıza kodu (varsa)"><textarea id="sComplaint" placeholder="Müşteri şikâyeti / arıza"></textarea><textarea id="sDiagnosis" placeholder="Tespit / teşhis"></textarea><textarea id="sWork" placeholder="Yapılan işlem"></textarea><input id="sPart" placeholder="Değişen parça"><input id="sParts" type="number" min="0" step=".01" placeholder="Parça ücreti"><input id="sLabor" type="number" min="0" step=".01" placeholder="İşçilik ücreti"><select id="sPay"><option>Ödenmedi</option><option>Ödendi</option><option>Kısmi Ödeme</option></select><select id="sStatus"><option>Randevu Oluşturuldu</option><option>Yolda</option><option>İşlemde</option><option>Parça Bekliyor</option><option>Müşteri Onayı Bekliyor</option><option>Tamamlandı</option></select><input id="sPhoto" type="file" accept="image/*" multiple><label>📸 Servis fotoğrafları</label><h3>Müşteri İmzası</h3><canvas id="sig" class="sig"></canvas><button type="button" class="secondary" onclick="clearSig()">Temizle</button><button class="primary">☁️ Randevuyu / Servisi Kaydet</button></form>`);setTimeout(()=>{initSig();const c=customers.find(x=>x.id===cid);if(c){$("sAddress").value=c.adres||"";$("sDevice").value=c.cihaz_turu||"Kombi";$("sBrand").value=c.marka||"";$("sModel").value=c.model||""}},60)}

window.openQuickCustomer=()=>openModal(`<h2>👤 Yeni Müşteri</h2><form id="quickCustomerForm"><input id="qName" required placeholder="Ad Soyad"><input id="qPhone" required placeholder="Telefon"><textarea id="qAddress" placeholder="Adres"></textarea><select id="qType"><option>Kombi</option><option>Klima</option><option>Şofben</option><option>Diğer</option></select><input id="qBrand" placeholder="Marka"><input id="qModel" placeholder="Model"><button class="primary">Müşteriyi Kaydet ve Servise Dön</button></form>`);
function initSig(){const c=$("sig");if(!c)return;const ctx=c.getContext("2d");ctx.lineWidth=2;ctx.lineCap="round";let down=false;const pos=e=>{const r=c.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)*c.width/r.width,y:(p.clientY-r.top)*c.height/r.height}};c.width=c.clientWidth*2;c.height=c.clientHeight*2;ctx.scale(2,2);c.onpointerdown=e=>{down=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y)};c.onpointermove=e=>{if(!down)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke()};c.onpointerup=()=>down=false}
window.clearSig=()=>{const c=$("sig");if(c)c.getContext("2d").clearRect(0,0,c.width,c.height)};
document.addEventListener("submit",async e=>{if(e.target.id==="quickCustomerForm"){e.preventDefault();const row={user_id:user.id,ad_soyad:$("qName").value.trim(),telefon:$("qPhone").value.trim(),adres:$("qAddress").value.trim(),cihaz_turu:$("qType").value,marka:$("qBrand").value.trim(),model:$("qModel").value.trim(),seri_no:"",notlar:""};const {data,error}=await db.from("musteriler").insert(row).select().single();if(error){toast("Müşteri kaydedilemedi: "+error.message,true);return}await loadAll();openServiceForm(data.id);toast("Müşteri kaydedildi");return}if(e.target.id!=="sForm")return;e.preventDefault();const row={user_id:user.id,musteri_id:$("sCustomer").value,servis_tarihi:$("sDate").value,servis_saati:$("sTime").value,servis_adresi:$("sAddress").value.trim(),cihaz_turu:$("sDevice").value,marka:$("sBrand").value.trim(),model:$("sModel").value.trim(),ariza_kodu:$("sCode").value.trim(),ariza:$("sComplaint").value.trim(),yapilan_islem:$("sDiagnosis").value.trim()+"\n"+$("sWork").value.trim(),degisen_parca:$("sPart").value.trim(),parca_ucreti:Number($("sParts").value||0),iscilik_ucreti:Number($("sLabor").value||0),odeme_durumu:$("sPay").value,servis_durumu:$("sStatus").value,notlar:""};let {data,error}=await db.from("servis_kayitlari").insert(row).select().single();if(error){toast(error.message,true);return}const files=[...$("sPhoto").files];for(const f of files){const path=`${user.id}/${data.id}/${crypto.randomUUID()}-${f.name}`;const up=await db.storage.from("servis-fotolar").upload(path,f,{upsert:false});if(!up.error){const url=db.storage.from("servis-fotolar").getPublicUrl(path).data.publicUrl;await db.from("servis_fotograflari").insert({user_id:user.id,servis_id:data.id,foto_url:url,aciklama:"Servis fotoğrafı"})}}closeModal();toast("Servis kaydedildi");await loadAll();makePDF(data.id)});

window.deleteCustomer=async id=>{if(!confirm("Müşteriyi ve servis geçmişini silmek istiyor musun?"))return;const {error}=await db.from("musteriler").delete().eq("id",id);if(error)alert(error.message);else{toast("Müşteri silindi");loadAll()}}
window.call=t=>location.href="tel:"+decodeURIComponent(t);

function openStockForm(id=null){const p=stock.find(x=>x.id===id)||{};openModal(`<h2>${id?"Parça Düzenle":"Yeni Parça"}</h2><form id="pForm"><input id="pName" value="${esc(p.parca_adi)}" required placeholder="Parça adı"><input id="pBrand" value="${esc(p.marka)}" placeholder="Marka"><input id="pQty" type="number" value="${p.stok||0}" placeholder="Stok"><input id="pCrit" type="number" value="${p.kritik_stok||1}" placeholder="Kritik stok"><input id="pBuy" type="number" step=".01" value="${p.alis_fiyati||0}" placeholder="Alış fiyatı"><input id="pSell" type="number" step=".01" value="${p.satis_fiyati||0}" placeholder="Satış fiyatı"><button class="primary">Kaydet</button></form>`);$("pForm").dataset.id=id||""}
document.addEventListener("submit",async e=>{if(e.target.id!=="pForm")return;e.preventDefault();const id=e.target.dataset.id;const row={user_id:user.id,parca_adi:$("pName").value.trim(),marka:$("pBrand").value.trim(),stok:Number($("pQty").value||0),kritik_stok:Number($("pCrit").value||1),alis_fiyati:Number($("pBuy").value||0),satis_fiyati:Number($("pSell").value||0)};const q=id?db.from("stok_parcalari").update(row).eq("id",id):db.from("stok_parcalari").insert(row);const {error}=await q;if(error)alert(error.message);else{closeModal();loadAll();toast("Stok kaydedildi")}});

function renderStock(){$("stockList").innerHTML=stock.map(p=>`<div class="item"><strong>${esc(p.parca_adi)}</strong><div>${esc(p.marka||"")} · Stok: <b>${p.stok}</b></div><span class="badge ${Number(p.stok)<=Number(p.kritik_stok)?"low":"ok"}">${Number(p.stok)<=Number(p.kritik_stok)?"Kritik stok":"Stok yeterli"}</span><div class="row"><button onclick="openStockForm('${p.id}')">Düzenle</button></div></div>`).join("")||'<div class="empty">Henüz parça eklenmedi.</div>'}

function renderReports(){const done=services.filter(s=>s.servis_durumu==="Tamamlandı");$("repServices").textContent=services.length;$("repCompleted").textContent=done.length;$("repParts").textContent=money(services.reduce((a,s)=>a+Number(s.parca_ucreti||0),0));$("repLabor").textContent=money(services.reduce((a,s)=>a+Number(s.iscilik_ucreti||0),0));const k=customers.filter(c=>c.cihaz_turu==="Kombi").length,kl=customers.filter(c=>c.cihaz_turu==="Klima").length;$("deviceReport").innerHTML=`<p>🔥 Kombi: <b>${k}</b></p><p>❄️ Klima: <b>${kl}</b></p>`}
function downloadReportCSV(){let csv="Tarih,Müşteri,Cihaz,Marka,Arıza,Parça,İşçilik,Toplam,Durum\n";services.forEach(s=>{const c=customers.find(x=>x.id===s.musteri_id);csv+=`"${s.servis_tarihi}","${c?.ad_soyad||""}","${c?.cihaz_turu||""}","${c?.marka||""}","${s.ariza||""}",${s.parca_ucreti||0},${s.iscilik_ucreti||0},${Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0)},"${s.servis_durumu||""}"\n`});const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="nitek-servis-raporu.csv";a.click()}

async function saveSettings(){const row={user_id:user.id,isletme_adi:$("bizName").value.trim()||"NİTEK TEKNİK SERVİS",telefon:$("bizPhone").value.trim(),whatsapp:$("bizWhatsapp").value.trim(),adres:$("bizAddress").value.trim(),vergi_no:$("bizTax").value.trim(),updated_at:new Date().toISOString()};const {error}=await db.from("isletme_ayarlari").upsert(row);if(error)alert(error.message);else{settings=row;toast("Ayarlar kaydedildi")}}

async function makePDF(id){
 const s=services.find(x=>x.id===id); if(!s)return;
 const c=customers.find(x=>x.id===s.musteri_id)||{};
 const total=Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0);
 const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const moneyTR=v=>new Intl.NumberFormat("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v||0))+" TL";
 const no=String(id).slice(0,8).toUpperCase();
 const date=s.servis_tarihi||new Date().toLocaleDateString("tr-TR");
 const logoSrc=new URL("logo.jpg",document.baseURI).href;

 const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8">
 <meta name="viewport" content="width=device-width,initial-scale=1">
 <title>NİTEK Servis Formu ${esc(no)}</title>
 <style>
 @page{size:A4;margin:10mm}
 *{box-sizing:border-box}
 html,body{margin:0;padding:0;background:#fff;color:#14233d}
 body{font-family:Arial,"Helvetica Neue",sans-serif;font-size:11px}
 .page{width:190mm;margin:0 auto;padding:4mm 0}
 .head{display:flex;align-items:center;border-bottom:3px solid #c71920;padding-bottom:7mm}
 .logo{width:28mm;height:28mm;object-fit:contain;margin-right:7mm}
 .brand{flex:1}.brand h1{margin:0;font-size:22px;letter-spacing:2.2px;font-weight:800}
 .brand p{margin:2mm 0 0;font-size:9px;letter-spacing:1.4px;color:#c71920;font-weight:700}
 .title{text-align:right;font-size:18px;letter-spacing:2px;font-weight:800;margin:7mm 0 4mm}
 .meta{display:flex;justify-content:space-between;border-bottom:1px solid #d5dbe2;padding:3mm 0 4mm;margin-bottom:4mm}
 .sec{border:1px solid #d6dce3;border-radius:2mm;overflow:hidden;margin:4mm 0}
 .sec h2{margin:0;background:#10203a;color:#fff;padding:2.5mm 3mm;font-size:9px;letter-spacing:1.8px}
 .grid{display:grid;grid-template-columns:1fr 1fr}
 .cell{padding:3mm;border-bottom:1px solid #e5e8ec;min-height:14mm}
 .cell:nth-child(odd){border-right:1px solid #e5e8ec}
 .full{padding:3mm;border-bottom:1px solid #e5e8ec;min-height:14mm}
 .full:last-child{border-bottom:0}
 .label{font-weight:700;color:#26354b;margin-bottom:1mm}
 .value{white-space:pre-wrap;line-height:1.4;color:#1b2433}
 table{width:100%;border-collapse:collapse}
 td{padding:3mm;border-bottom:1px solid #e5e8ec}
 td:last-child{text-align:right;font-weight:700}
 tr.total td{background:#f1f4f7;font-size:13px;font-weight:800}
 .signs{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:7mm}
 .sig{height:28mm;border:1px solid #cfd5dc;border-radius:2mm;padding:3mm}
 .sigline{margin-top:14mm;border-top:1px solid #777;text-align:center;padding-top:1mm;color:#555;font-size:9px}
 .footer{border-top:1px solid #d5dbe2;text-align:center;margin-top:7mm;padding-top:3mm;font-size:8px;color:#687386}
 .actions{position:fixed;right:12px;top:12px;z-index:5}
 .actions button{padding:10px 14px;border:0;border-radius:9px;background:#10203a;color:#fff;font-weight:700}
 @media print{.actions{display:none}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
 </style></head><body>
 <div class="actions"><button onclick="window.print()">PDF / Yazdır</button></div>
 <main class="page">
 <div class="head"><img class="logo" src="${esc(logoSrc)}"><div class="brand"><h1>NİTEK TEKNİK SERVİS</h1><p>Kombi • Klima • Bakım • Onarım • Montaj</p></div></div>
 <div class="title">SERVİS FORMU</div>
 <div class="meta"><span><b>Servis Tarihi:</b> ${esc(date)}</span><span><b>Servis No:</b> ${esc(no)}</span></div>

 <section class="sec"><h2>MÜŞTERİ BİLGİLERİ</h2><div class="grid">
 <div class="cell"><div class="label">Ad Soyad</div><div class="value">${esc(c.ad_soyad)}</div></div>
 <div class="cell"><div class="label">Telefon</div><div class="value">${esc(c.telefon)}</div></div>
 <div class="full" style="grid-column:1/-1"><div class="label">Adres</div><div class="value">${esc(c.adres)}</div></div>
 </div></section>

 <section class="sec"><h2>CİHAZ BİLGİLERİ</h2><div class="grid">
 <div class="cell"><div class="label">Cihaz Türü</div><div class="value">${esc(c.cihaz_turu)}</div></div>
 <div class="cell"><div class="label">Marka / Model</div><div class="value">${esc((c.marka||"")+" / "+(c.model||""))}</div></div>
 <div class="cell"><div class="label">Seri No</div><div class="value">${esc(c.seri_no||"-")}</div></div>
 <div class="cell"><div class="label">Garanti</div><div class="value">${esc(c.garanti||"-")}</div></div>
 </div></section>

 <section class="sec"><h2>SERVİS DETAYLARI</h2>
 <div class="full"><div class="label">Müşteri Şikâyeti</div><div class="value">${esc(s.ariza||"-")}</div></div>
 <div class="full"><div class="label">Tespit / Yapılan İşlem</div><div class="value">${esc(s.yapilan_islem||"-")}</div></div>
 <div class="full"><div class="label">Değişen Parça</div><div class="value">${esc(s.degisen_parca||"-")}</div></div>
 </section>

 <section class="sec"><h2>ÜCRET BİLGİLERİ</h2><table>
 <tr><td>Parça Ücreti</td><td>${moneyTR(s.parca_ucreti)}</td></tr>
 <tr><td>İşçilik</td><td>${moneyTR(s.iscilik_ucreti)}</td></tr>
 <tr class="total"><td>TOPLAM</td><td>${moneyTR(total)}</td></tr>
 <tr><td>Ödeme Durumu</td><td>${esc(s.odeme_durumu||"Ödenmedi")}</td></tr>
 </table></section>

 <div class="signs"><div class="sig"><b>Müşteri Onayı</b><div class="sigline">Ad Soyad / İmza</div></div>
 <div class="sig"><b>Teknisyen</b><div class="sigline">NİTEK Teknik Servis / İmza</div></div></div>
 <div class="footer">${esc(settings.isletme_adi||"NİTEK TEKNİK SERVİS")} • ${esc(settings.telefon||"")} • ${esc(settings.adres||"")}</div>
 </main>
 <script>window.addEventListener("load",()=>setTimeout(()=>window.print(),500));<\/script>
 </body></html>`;

 const w=window.open("","_blank");
 if(!w){alert("PDF penceresi açılamadı. SPCK/Safari için açılır pencerelere izin ver.");return}
 w.document.open();w.document.write(html);w.document.close();
}
window.makePDF=makePDF;
boot();

window.openCustomerHistory=async id=>{
 const c=customers.find(x=>x.id===id); if(!c)return;
 const list=services.filter(s=>s.musteri_id===id).sort((a,b)=>String(b.servis_tarihi||"").localeCompare(String(a.servis_tarihi||"")));
 const total=list.reduce((n,s)=>n+Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0),0);
 openModal(`<h2>👤 ${esc(c.ad_soyad)}</h2>
 <div class="card customer-summary"><b>${esc(c.telefon)}</b><div>${esc(c.cihaz_turu||"")} · ${esc(c.marka||"")} ${esc(c.model||"")}</div><div class="muted">${esc(c.adres||"")}</div>
 <div class="row"><button onclick="call('${encodeURIComponent(c.telefon||"")}')">📞 Ara</button><button onclick="openServiceForm('${c.id}')">🔧 Yeni Servis</button></div></div>
 <div class="history-head"><h3>📋 Ne Yapıldı?</h3><span class="badge">${list.length} servis · ${money(total)}</span></div>
 ${list.map(s=>`<div class="history-item" onclick="openServiceDetail('${s.id}')">
   <div class="history-date">${esc(s.servis_tarihi||"-")} <span class="badge">${esc(s.servis_durumu||"")}</span></div>
   <strong>${esc(s.ariza||"Servis kaydı")}</strong>
   <div class="muted">${esc((s.yapilan_islem||"").slice(0,180))}</div>
   <div class="history-money">${money(Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0))}</div>
   <div class="history-open">Detayları görmek için dokun →</div>
 </div>`).join("") || '<div class="empty">Bu müşterinin henüz servis geçmişi yok.</div>'}`);
};
window.openServiceDetail=id=>{
 const s=services.find(x=>x.id===id); if(!s)return;
 const c=customers.find(x=>x.id===s.musteri_id);
 openModal(`<h2>🔧 Servis Detayı</h2>
 <div class="card"><b>${esc(c?.ad_soyad||"")}</b><div class="muted">${esc(s.servis_tarihi||"")} · ${esc(c?.cihaz_turu||"")} · ${esc(c?.marka||"")} ${esc(c?.model||"")}</div></div>
 <div class="item"><b>🔴 Müşteri Şikâyeti</b><div>${esc(s.ariza||"-")}</div></div>
 <div class="item"><b>🔎 Tespit / Yapılan İşlem</b><div class="pre">${esc(s.yapilan_islem||"-")}</div></div>
 <div class="item"><b>📦 Değişen Parça</b><div>${esc(s.degisen_parca||"-")}</div></div>
 <div class="card"><div>Parça: <b>${money(s.parca_ucreti)}</b></div><div>İşçilik: <b>${money(s.iscilik_ucreti)}</b></div><div class="total">Toplam: ${money(Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0))}</div><div>Ödeme: <b>${esc(s.odeme_durumu||"-")}</b></div></div>
 <div class="row"><button class="primary" onclick="makePDF('${s.id}')">🧾 PDF</button><button onclick="whatsappService('${s.id}')">💬 WhatsApp</button></div>`);
};
window.whatsappService=id=>{
 const s=services.find(x=>x.id===id); if(!s)return;
 const c=customers.find(x=>x.id===s.musteri_id); if(!c)return;
 const phone=String(c.telefon||"").replace(/\D/g,"");
 const text=`Merhaba ${c.ad_soyad}, NİTEK Teknik Servis servis kaydınız hazır.\nServis tarihi: ${s.servis_tarihi}\nToplam: ${money(Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0))}`;
 window.open((phone?`https://wa.me/${phone}`:"https://wa.me/")+"?text="+encodeURIComponent(text),"_blank");
};

const diagnosisRules=[
 {test:x=>x.code&&/e0?1|f0?1/i.test(x.code),title:"Ateşleme / alev oluşumu ile ilişkili olabilir",checks:["Gaz vanasının açık olduğunu ve cihazın gaz beslemesini kontrol et.","Ateşleme ve alev algılama devresini yetkili servis prosedürüne göre kontrol et.","Gaz kokusu varsa cihazı çalıştırma ve güvenli gaz acil prosedürünü uygula."],priority:"Yüksek"},
 {test:x=>x.code&&/f22|e1?0|e0?4/i.test(x.code),title:"Su basıncı / su dolaşımı ile ilişkili olabilir",checks:["Manometre değerini kontrol et.","Sistemde görünür kaçak olup olmadığını kontrol et.","Pompa, sensör ve dolaşım devresini üretici prosedürüne göre kontrol et."],priority:"Orta"},
 {test:x=>!x.power,title:"Elektrik beslemesi veya kontrol kartı tarafı araştırılmalı",checks:["Priz ve cihaz beslemesini kontrol et.","Sigorta ve bağlantıları güvenli şekilde kontrol et.","Kontrol kartı teşhisini yetkili servis prosedürüne göre yap."],priority:"Orta"},
 {test:x=>x.power&&!x.ignition,title:"Ateşleme / gaz / alev algılama tarafı araştırılmalı",checks:["Gaz beslemesi ve cihazın hata durumunu kontrol et.","Ateşleme elektrodu, iyonizasyon ve ilgili sensörleri üretici prosedürüne göre kontrol et."],priority:"Yüksek"},
 {test:x=>x.hot&&!x.heat,title:"Isıtma devresi / yönlendirme tarafı araştırılmalı",checks:["Isıtma talebini ve çalışma modunu kontrol et.","Pompa, üç yollu vana ve ilgili sensörleri üretici prosedürüne göre kontrol et."],priority:"Orta"},
 {test:x=>!x.pressure,title:"Düşük/yüksek sistem basıncı ihtimali",checks:["Manometreyi kontrol et.","Kaçak belirtisi varsa sistemi zorlamadan servis prosedürünü uygula."],priority:"Orta"},
 {test:x=>x.leak,title:"Su kaçağı ihtimali",checks:["Cihazı ve bağlantıları güvenli şekilde kontrol et.","Aktif kaçak varsa cihazı zorlamadan servis prosedürünü uygula."],priority:"Yüksek"},
 {test:x=>x.noise,title:"Pompa / fan / hidrolik devre kaynaklı ses ihtimali",checks:["Sesin kaynağını güvenli şekilde lokalize et.","Pompa, fan ve bağlantıları üretici prosedürüne göre kontrol et."],priority:"Orta"}
];
window.runSmartDiagnosis=()=>{
 const x={
  device:$("diagDevice").value,brand:$("diagBrand").value,code:$("diagCode").value.trim(),
  power:$("qPower").checked,ignition:$("qIgnition").checked,hot:$("qHot").checked,heat:$("qHeat").checked,
  pressure:$("qPressure").checked,noise:$("qNoise").checked,leak:$("qLeak").checked
 };
 const matches=diagnosisRules.filter(r=>r.test(x)).slice(0,4);
 const codeNote=x.code?`<div class="item"><b>Girilen kod:</b> ${esc(x.code)}<br><span class="muted">Kod anlamı marka/model'e göre değişebilir; üretici servis dokümanı ile doğrula.</span></div>`:"";
 $("diagnosisResult").innerHTML=codeNote+
 `<div class="card"><h3>Olası nedenler</h3>`+
 (matches.length?matches.map((m,i)=>`<div class="item"><strong>${i+1}. ${esc(m.title)}</strong><span class="badge ${m.priority==="Yüksek"?"low":"ok"}">${m.priority} öncelik</span><ul>${m.checks.map(c=>`<li>${esc(c)}</li>`).join("")}</ul></div>`).join(""):'<div class="empty">Daha fazla belirti seçerek teşhisi daraltabilirsin.</div>')+
 `<div class="item"><b>Güvenlik:</b> Gaz kokusu, yoğun su kaçağı, yanık kokusu veya elektriksel tehlike varsa cihazı çalıştırma; güvenliğini önceliklendir ve yetkili/acil prosedürü uygula.</div></div>`;
};

const faultCodes=[{"brand": "Baymak", "model": "Luna 24 Fi", "code": "E01", "title": "Ateşleme / alev oluşmaması", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Luna 24 Fi", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Luna 24 Fi", "code": "E03", "title": "Baca / fan güvenliği", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Luna 24 Fi", "code": "E04", "title": "Düşük su basıncı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Luna 24 Fi", "code": "E05", "title": "Isıtma NTC", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Luna 24 Fi", "code": "E06", "title": "Sıcak su NTC", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Star Bridge Extra", "code": "E01", "title": "Ateşleme / alev", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Star Bridge Extra", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Star Bridge Extra", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Star Bridge Extra", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Luna Avant", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Luna Avant", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baymak", "model": "Luna Avant", "code": "E10", "title": "Su basıncı / sensör", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Nitron", "code": "F01", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Nitron", "code": "F04", "title": "Ateşleme / iyonizasyon", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Nitron", "code": "F05", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Nitron", "code": "F10", "title": "NTC / sensör", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Neva", "code": "F01", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Neva", "code": "F04", "title": "Ateşleme / alev", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Neva", "code": "F05", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Neva", "code": "F10", "title": "Sensör", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Atron", "code": "F01", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Atron", "code": "F04", "title": "Ateşleme / iyonizasyon", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Atron", "code": "F05", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Demirdöküm", "model": "Atron", "code": "F10", "title": "Sensör", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Premix", "code": "E01", "title": "Ateşleme / alev", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Premix", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Premix", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Premix", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Premix", "code": "E05", "title": "Isıtma sensörü", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Plus Blue", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Plus Blue", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Plus Blue", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Proteus Plus Blue", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Confeo Premix", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Confeo Premix", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Confeo Premix", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "E.C.A.", "model": "Confeo Premix", "code": "E05", "title": "Sensör", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "ecoTEC", "code": "F22", "title": "Düşük su basıncı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "ecoTEC", "code": "F28", "title": "Ateşleme başarısız", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "ecoTEC", "code": "F29", "title": "Alev kaybı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "ecoTEC", "code": "F75", "title": "Basınç sensörü / pompa", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "ecoTEC", "code": "F20", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "turboTEC", "code": "F22", "title": "Düşük su basıncı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "turboTEC", "code": "F28", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "turboTEC", "code": "F29", "title": "Alev kaybı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Vaillant", "model": "turboTEC", "code": "F75", "title": "Basınç sensörü / pompa", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Bosch", "model": "Condens", "code": "EA", "title": "Alev oluşmuyor", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Bosch", "model": "Condens", "code": "E9", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Bosch", "model": "Condens", "code": "C6", "title": "Fan / hava akışı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Bosch", "model": "Condens", "code": "C7", "title": "Hava basınç anahtarı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Bosch", "model": "Condens", "code": "A7", "title": "Sıcaklık sensörü", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Bosch", "model": "Classic", "code": "EA", "title": "Alev oluşmuyor", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Bosch", "model": "Classic", "code": "E9", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Bosch", "model": "Classic", "code": "C6", "title": "Fan / hava akışı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Buderus", "model": "Logamax Plus", "code": "EA", "title": "Alev oluşmuyor", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Buderus", "model": "Logamax Plus", "code": "E9", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Buderus", "model": "Logamax Plus", "code": "C6", "title": "Fan / hava akışı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Buderus", "model": "Logamax Plus", "code": "A7", "title": "Sıcaklık sensörü", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Viessmann", "model": "Vitodens 100", "code": "F2", "title": "Brülör / alev", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Viessmann", "model": "Vitodens 100", "code": "F4", "title": "Alev oluşumu", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Viessmann", "model": "Vitodens 100", "code": "F5", "title": "Fan / baca", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Viessmann", "model": "Vitodens 100", "code": "A9", "title": "Sıcak su sensörü", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Viessmann", "model": "Vitodens 050", "code": "F2", "title": "Brülör / alev", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Viessmann", "model": "Vitodens 050", "code": "F4", "title": "Alev oluşumu", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Viessmann", "model": "Vitodens 050", "code": "F5", "title": "Fan / baca", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ariston", "model": "Clas", "code": "501", "title": "Alev yok", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ariston", "model": "Clas", "code": "101", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ariston", "model": "Clas", "code": "108", "title": "Düşük su basıncı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ariston", "model": "Clas", "code": "103", "title": "Dolaşım", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ariston", "model": "Genus", "code": "501", "title": "Alev yok", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ariston", "model": "Genus", "code": "101", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ariston", "model": "Genus", "code": "108", "title": "Düşük su basıncı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ariston", "model": "Genus", "code": "103", "title": "Dolaşım", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Alarko", "model": "Serena", "code": "E01", "title": "Alev yok / sahte alev", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Alarko", "model": "Serena", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Alarko", "model": "Serena", "code": "E04", "title": "Düşük su basıncı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Alarko", "model": "Serena", "code": "E05", "title": "NTC", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Protherm", "model": "Lynx", "code": "F01", "title": "Ateşleme / alev", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Protherm", "model": "Lynx", "code": "F02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Protherm", "model": "Lynx", "code": "F04", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Protherm", "model": "Lynx", "code": "F22", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ferroli", "model": "Divacondens", "code": "A01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ferroli", "model": "Divacondens", "code": "A02", "title": "Sahte alev", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ferroli", "model": "Divacondens", "code": "F37", "title": "Düşük su basıncı", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Ferroli", "model": "Divacondens", "code": "F05", "title": "Fan / baca", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Immergas", "model": "Eolo Star", "code": "01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Immergas", "model": "Eolo Star", "code": "02", "title": "Limit termostat", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Immergas", "model": "Eolo Star", "code": "10", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Immergas", "model": "Eolo Star", "code": "11", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Airfel", "model": "Digifel Premix", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Airfel", "model": "Digifel Premix", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Airfel", "model": "Digifel Premix", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Airfel", "model": "Digifel Premix", "code": "E10", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Warmhaus", "model": "Enerwa", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Warmhaus", "model": "Enerwa", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Warmhaus", "model": "Enerwa", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Warmhaus", "model": "Enerwa", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Arçelik", "model": "DGK", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Arçelik", "model": "DGK", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Arçelik", "model": "DGK", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Arçelik", "model": "DGK", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Beko", "model": "BK", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Beko", "model": "BK", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Beko", "model": "BK", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Beko", "model": "BK", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baykan", "model": "Star", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baykan", "model": "Star", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baykan", "model": "Star", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Baykan", "model": "Star", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Beretta", "model": "Ciao", "code": "A01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Beretta", "model": "Ciao", "code": "A02", "title": "Limit termostat", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Beretta", "model": "Ciao", "code": "A04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Beretta", "model": "Ciao", "code": "A06", "title": "Sıcak su sensörü", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Daikin", "model": "NDJ", "code": "E1", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Daikin", "model": "NDJ", "code": "E2", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Daikin", "model": "NDJ", "code": "E4", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Daikin", "model": "NDJ", "code": "E5", "title": "Sensör", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Termodinamik", "model": "DE", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Termodinamik", "model": "DE", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Termodinamik", "model": "DE", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Termodinamik", "model": "DE", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Termoteknik", "model": "Logic", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Termoteknik", "model": "Logic", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Termoteknik", "model": "Logic", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Termoteknik", "model": "Logic", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Copa", "model": "Econ", "code": "E01", "title": "Ateşleme", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Copa", "model": "Econ", "code": "E02", "title": "Aşırı ısınma", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Copa", "model": "Econ", "code": "E03", "title": "Baca / fan", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}, {"brand": "Copa", "model": "Econ", "code": "E04", "title": "Düşük basınç", "checks": "Üretici servis prosedürüne göre ilgili devre, sensör ve güvenlik elemanları kontrol edilmelidir."}];
window.renderFaultModels=()=>{const b=$("faultBrand")?.value||"";const models=[...new Set(faultCodes.filter(x=>!b||x.brand===b).map(x=>x.model))].sort();$("faultModel").innerHTML='<option value="">Tüm modeller</option>'+models.map(m=>`<option>${esc(m)}</option>`).join("");};
window.renderFaultCodes=()=>{
 const b=$("faultBrand")?.value||"",m=$("faultModel")?.value||"",q=($("faultSearch")?.value||"").toLocaleLowerCase("tr-TR");
 const arr=faultCodes.filter(x=>(!b||x.brand===b)&&(!m||x.model===m)&&((x.code+" "+x.model+" "+x.title+" "+x.checks).toLocaleLowerCase("tr-TR").includes(q)));
 $("faultList").innerHTML=arr.map(x=>`<div class="item"><strong>${esc(x.brand)} — ${esc(x.model)} — ${esc(x.code)}</strong><div>${esc(x.title)}</div><div class="muted">Kontrol: ${esc(x.checks)}</div></div>`).join("")||
 '<div class="empty">Bu arama için kayıt bulunamadı. Kodların marka/model yılına göre değişebileceğini unutma; üretici servis dokümanını esas al.</div>';
};
function goBack(){ if(history.length>1) history.back(); else showTab("dashboard"); }
window.goBack=goBack;


// Initialize authentication/session on page load
boot();
