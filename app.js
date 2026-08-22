const SUPABASE_URL="https://kwiqjwojrowwooukmjih.supabase.co";
const SUPABASE_KEY="sb_publishable_di373iSfOTaPUlSfcasZbg_RHvQJDle";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let user=null,customers=[],services=[],expenses=[];

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const money=v=>(Number(v)||0).toLocaleString("tr-TR",{style:"currency",currency:"TRY"});
const today=()=>new Date().toISOString().slice(0,10);
function toast(t,bad=false){$("toast").textContent=t;$("toast").className=bad?"show bad":"show";setTimeout(()=>$("toast").className="",2800)}
function closeModal(){$("modal").classList.add("hidden")}
function openModal(html){$("modalBody").innerHTML=html;$("modal").classList.remove("hidden")}
function goBack(){if(!$("modal").classList.contains("hidden")){closeModal();return}showTab("dashboard")}

async function login(){
 const {data,error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
 if(error){$("authMsg").textContent=error.message;return} user=data.user;await startApp();
}
async function signup(){
 const {data,error}=await db.auth.signUp({email:$("email").value.trim(),password:$("password").value});
 if(error){$("authMsg").textContent=error.message;return}
 $("authMsg").textContent=data.session?"Hesap oluşturuldu.":"E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et.";
 if(data.session){user=data.user;await startApp()}
}
async function logout(){await db.auth.signOut();location.reload()}

async function startApp(){
 $("auth").classList.add("hidden");$("app").classList.remove("hidden");$("bottomNav").classList.remove("hidden");
 $("calendarDate").value=today();$("reportMonth").value=today().slice(0,7);
 await loadAll();renderAll();
}
async function loadAll(){
 const a=await db.from("musteriler").select("*").order("created_at",{ascending:false});
 const b=await db.from("servisler").select("*").order("servis_tarihi",{ascending:false});
 customers=a.data||[];services=b.data||[];
 if(a.error)toast("Müşteri verileri alınamadı: "+a.error.message,true);
 if(b.error)toast("Servis verileri alınamadı: "+b.error.message,true);
 try{const e=await db.from("giderler").select("*").order("tarih",{ascending:false});expenses=e.data||[]}catch{}
}
function renderAll(){renderDashboard();renderCustomers();renderServices();renderPending();renderCalendar();renderFaults();renderCash();renderReports();}

function showTab(id){
 document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
 $(id).classList.add("active");
 window.scrollTo({top:0,behavior:"smooth"});
 if(id==="dashboard")renderDashboard();
 if(id==="customers")renderCustomers();
 if(id==="services")renderServices();
 if(id==="pending")renderPending();
 if(id==="calendar")renderCalendar();
 if(id==="faultcodes")renderFaults();
 if(id==="cash")renderCash();
 if(id==="reports")renderReports();
}

function renderDashboard(){
 const p=services.filter(s=>!["Tamamlandı","İptal"].includes(s.servis_durumu||"Bekliyor")).length;
 $("qPending").textContent=p;
 const todayServices=services.filter(s=>String(s.servis_tarihi||"").slice(0,10)===today());
 const total=services.filter(s=>String(s.servis_tarihi||"").slice(0,10)===today()).reduce((n,s)=>n+Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0),0);
 $("stats").innerHTML=`<div class="stat"><b>${customers.length}</b><span>Müşteri</span></div><div class="stat"><b>${p}</b><span>Bekleyen</span></div><div class="stat"><b>${todayServices.length}</b><span>Bugünkü Servis</span></div><div class="stat"><b>${money(total)}</b><span>Bugünkü Ciro</span></div>`;
 const calls=customers.filter(c=>c.bakim_hatirlatma&&c.sonraki_bakim_tarihi&&new Date(c.sonraki_bakim_tarihi)<=new Date(new Date().setDate(new Date().getDate()+30)));
 $("todayCalls").innerHTML=`<h3>🔔 Bakımı Yaklaşanlar</h3>${calls.length?calls.slice(0,8).map(c=>`<div class="line"><div><b>${esc(c.ad_soyad)}</b><small>${esc(c.cihaz_turu||"Cihaz")} · ${esc(c.sonraki_bakim_tarihi)}</small></div><button onclick="sendMaintenance('${c.id}')">💬</button></div>`).join(""):'<div class="empty">Yaklaşan bakım yok.</div>'}`;
 $("todayServices").innerHTML=`<h3>📅 Bugünkü Servisler</h3>${todayServices.length?todayServices.map(serviceCard).join(""):'<div class="empty">Bugün servis yok.</div>'}`;
}
function serviceCard(s){
 const c=customers.find(x=>x.id===s.musteri_id)||{};
 return `<div class="line clickable" onclick="openServiceDetail('${s.id}')"><div><b>${esc(c.ad_soyad||"Müşteri")}</b><small>${esc(s.servis_tarihi||"")} ${esc(s.servis_saati||"")} · ${esc(s.ariza||"Servis")} · ${esc(s.servis_durumu||"Bekliyor")}</small></div><span>${money(Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0))}</span></div>`;
}
function renderCustomers(){
 const q=($("customerSearch")?.value||"").toLocaleLowerCase("tr-TR");
 const arr=customers.filter(c=>(`${c.ad_soyad||""} ${c.telefon||""} ${c.marka||""} ${c.model||""}`).toLocaleLowerCase("tr-TR").includes(q));
 $("customerList").innerHTML=arr.map(c=>`<div class="customer card clickable" onclick="openCustomer('${c.id}')"><div class="avatar">👤</div><div class="grow"><b>${esc(c.ad_soyad)}</b><small>${esc(c.telefon)} · ${esc(c.cihaz_turu||"")} · ${esc(c.marka||"")} ${esc(c.model||"")}</small><small>${c.bakim_hatirlatma?"🔔 Yıllık bakım aktif":""}</small></div><span>›</span></div>`).join("")||'<div class="empty">Müşteri bulunamadı.</div>';
}
function renderServices(){
 const q=($("serviceSearch")?.value||"").toLocaleLowerCase("tr-TR");
 const arr=services.filter(s=>{const c=customers.find(x=>x.id===s.musteri_id)||{};return `${c.ad_soyad||""} ${s.ariza||""} ${s.yapilan_islem||""}`.toLocaleLowerCase("tr-TR").includes(q)});
 $("serviceList").innerHTML=arr.map(serviceCard).join("")||'<div class="empty">Servis kaydı yok.</div>';
}
function renderPending(){
 const f=$("pendingFilter")?.value||"all";
 const arr=services.filter(s=>!["Tamamlandı","İptal"].includes(s.servis_durumu||"Bekliyor")&&(f==="all"||s.servis_durumu===f));
 $("pendingCount").textContent=arr.length;
 $("pendingList").innerHTML=arr.map(serviceCard).join("")||'<div class="empty">Bekleyen servis yok. 🎉</div>';
}
function renderCalendar(){
 const d=$("calendarDate").value||today();
 const arr=services.filter(s=>String(s.servis_tarihi||"").slice(0,10)===d);
 $("calendarList").innerHTML=arr.map(serviceCard).join("")||'<div class="empty">Bu tarihte servis yok.</div>';
}

function openCustomerForm(){
 openModal(`<h2>➕ Yeni Müşteri</h2><form onsubmit="saveCustomer(event)">
 <input id="cName" required placeholder="Ad Soyad"><input id="cPhone" required placeholder="Telefon"><textarea id="cAddress" placeholder="Adres"></textarea>
 <select id="cType"><option>Kombi</option><option>Klima</option><option>Diğer</option></select><input id="cBrand" placeholder="Marka"><input id="cModel" placeholder="Model"><input id="cSerial" placeholder="Seri No">
 <div class="card"><b>🔔 Yıllık bakım hatırlatması</b><label class="check"><input id="cReminder" type="checkbox"> Müşteri istiyor</label><select id="cReminderDays"><option value="30">30 gün önce</option><option value="15">15 gün önce</option><option value="7">7 gün önce</option><option value="0">Bakım günü</option></select><label>Son bakım tarihi<input id="cLast" type="date" value="${today()}"></label></div>
 <textarea id="cNote" placeholder="Not"></textarea><button class="primary wide">Kaydet</button></form>`);
}
async function saveCustomer(e){
 e.preventDefault();
 const last=$("cLast").value||null;
 const row={user_id:user.id,ad_soyad:$("cName").value.trim(),telefon:$("cPhone").value.trim(),adres:$("cAddress").value.trim(),cihaz_turu:$("cType").value,marka:$("cBrand").value.trim(),model:$("cModel").value.trim(),seri_no:$("cSerial").value.trim(),notlar:$("cNote").value.trim(),bakim_hatirlatma:$("cReminder").checked,bakim_hatirlatma_gun:Number($("cReminderDays").value),son_bakim_tarihi:last,sonraki_bakim_tarihi:$("cReminder").checked?nextYear(last):null};
 let r=await db.from("musteriler").insert(row);
 if(r.error){toast("Kayıt hatası: "+r.error.message,true);return}
 closeModal();toast("Müşteri kaydedildi");await loadAll();renderAll();
}
function nextYear(v){if(!v)return null;const d=new Date(v+"T00:00:00");d.setFullYear(d.getFullYear()+1);return d.toISOString().slice(0,10)}

function openCustomer(id){
 const c=customers.find(x=>x.id===id);if(!c)return;
 const list=services.filter(s=>s.musteri_id===id).sort((a,b)=>String(b.servis_tarihi).localeCompare(String(a.servis_tarihi)));
 openModal(`<h2>👤 ${esc(c.ad_soyad)}</h2><div class="card"><b>${esc(c.telefon)}</b><small>${esc(c.adres||"")}</small><small>${esc(c.cihaz_turu||"")} · ${esc(c.marka||"")} ${esc(c.model||"")}</small><div class="row"><button onclick="callCustomer('${encodeURIComponent(c.telefon||"")}')">📞 Ara</button><button onclick="mapCustomer('${encodeURIComponent(c.adres||"")}')">📍 Harita</button><button onclick="openServiceForm('${c.id}')">🔧 Servis</button></div></div><h3>📋 Ne Yapıldı?</h3>${list.map(s=>`<div class="history clickable" onclick="openServiceDetail('${s.id}')"><b>${esc(s.servis_tarihi||"")}</b><span class="badge">${esc(s.servis_durumu||"")}</span><div>${esc(s.ariza||"")}</div><small>${esc(s.yapilan_islem||"")}</small><strong>${money(Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0))}</strong></div>`).join("")||'<div class="empty">Servis geçmişi yok.</div>'}`);
}

function openServiceForm(customerId=""){
 const c=customers.find(x=>x.id===customerId);
 openModal(`<h2>➕ Yeni Servis / Randevu</h2>
 <form onsubmit="saveService(event)">
 <label>Müşteri</label>
 <select id="sCustomer" required>${customers.map(x=>`<option value="${x.id}" ${x.id===customerId?"selected":""}>${esc(x.ad_soyad)} · ${esc(x.telefon)}</option>`).join("")}</select>
 <button type="button" class="secondary wide" onclick="closeModal();openCustomerFormForService()">👤 Yeni Müşteri Oluştur</button>
 <div class="grid2"><label>Tarih<input id="sDate" type="date" value="${today()}" required></label><label>Saat<input id="sTime" type="time" value="${new Date().toTimeString().slice(0,5)}" required></label></div>
 <label>Servis Adresi<textarea id="sAddress" placeholder="Müşterinin servis adresi" required>${esc(c?.adres||"")}</textarea></label>
 <div class="grid2"><select id="sDevice"><option>Kombi</option><option>Klima</option><option>Diğer</option></select><input id="sBrand" placeholder="Marka"></div>
 <div class="grid2"><input id="sModel" placeholder="Model"><input id="sCode" placeholder="Arıza kodu (varsa)"></div>
 <textarea id="sComplaint" placeholder="Müşteri şikâyeti / randevu notu" required></textarea>
 <select id="sStatus"><option>Randevu Oluşturuldu</option><option>Yolda</option><option>İşlemde</option><option>Parça Bekliyor</option><option>Müşteri Onayı Bekliyor</option><option>Tamamlandı</option><option>İptal</option></select>
 <button class="primary wide">📅 Randevuyu Kaydet</button></form>`);
}
function openCustomerFormForService(){
 openModal(`<h2>👤 Yeni Müşteri + Randevu</h2>
 <form onsubmit="saveCustomerAndOpenService(event)">
 <input id="ncName" required placeholder="Ad Soyad"><input id="ncPhone" required placeholder="Telefon">
 <textarea id="ncAddress" required placeholder="Adres"></textarea>
 <div class="grid2"><select id="ncType"><option>Kombi</option><option>Klima</option><option>Diğer</option></select><input id="ncBrand" placeholder="Marka"></div>
 <input id="ncModel" placeholder="Model">
 <div class="grid2"><label>Tarih<input id="ncDate" type="date" value="${today()}" required></label><label>Saat<input id="ncTime" type="time" value="${new Date().toTimeString().slice(0,5)}" required></label></div>
 <textarea id="ncComplaint" required placeholder="Müşteri şikâyeti / randevu notu"></textarea>
 <button class="primary wide">Müşteriyi Kaydet ve Randevu Oluştur</button></form>`);
}
async function saveCustomerAndOpenService(e){
 e.preventDefault();
 const row={user_id:user.id,ad_soyad:$("ncName").value.trim(),telefon:$("ncPhone").value.trim(),adres:$("ncAddress").value.trim(),cihaz_turu:$("ncType").value,marka:$("ncBrand").value.trim(),model:$("ncModel").value.trim(),bakim_hatirlatma:false};
 const r=await db.from("musteriler").insert(row).select().single();
 if(r.error){toast("Müşteri kaydedilemedi: "+r.error.message,true);return}
 await loadAll();closeModal();openServiceForm(r.data.id);
 $("sDate").value=$("ncDate")?.value||today();$("sTime").value=$("ncTime")?.value||"09:00";$("sAddress").value=r.data.adres||"";$("sDevice").value=r.data.cihaz_turu||"Kombi";$("sBrand").value=r.data.marka||"";$("sModel").value=r.data.model||"";$("sComplaint").value=$("ncComplaint").value||"";
}

async function saveService(e){
 e.preventDefault();
 const row={user_id:user.id,musteri_id:$("sCustomer").value,servis_tarihi:$("sDate").value,servis_saati:$("sTime").value,servis_adresi:$("sAddress").value.trim(),cihaz_turu:$("sDevice").value,marka:$("sBrand").value.trim(),model:$("sModel").value.trim(),ariza:$("sComplaint").value.trim(),yapilan_islem:"",degisen_parca:"",parca_ucreti:0,iscilik_ucreti:0,odeme_durumu:"Ödenmedi",servis_durumu:$("sStatus").value,ariza_kodu:$("sCode").value.trim()};
 const r=await db.from("servisler").insert(row);if(r.error){toast("Randevu kaydı hatası: "+r.error.message,true);return}
 closeModal();toast("Randevu kaydedildi");await loadAll();renderAll();
}
function openServiceDetail(id){
 const s=services.find(x=>x.id===id);if(!s)return;const c=customers.find(x=>x.id===s.musteri_id)||{};
 const dt=`${String(s.servis_tarihi||"")} ${String(s.servis_saati||"")}`.trim();
 openModal(`<h2>🔧 Servis / Randevu</h2><div class="card"><b>${esc(c.ad_soyad||"")}</b><small>📞 ${esc(c.telefon||"")}</small><small>📅 ${esc(dt)}</small><small>📍 ${esc(s.servis_adresi||c.adres||"")}</small><small>🔧 ${esc(s.cihaz_turu||c.cihaz_turu||"")} · ${esc(s.marka||c.marka||"")} ${esc(s.model||c.model||"")}</small></div><div class="item"><b>Şikâyet / Randevu Notu</b><p>${esc(s.ariza||"-")}</p></div>${s.servis_durumu!=="Tamamlandı"?`<button class="primary wide" onclick="openCompletion('${s.id}')">✅ Servisi Tamamla</button>`:"<div class='badge'>🟢 Servis tamamlandı</div>"}<div class="card"><b>Servis Formu</b><div class="row"><button onclick="printServiceForm('${s.id}')">🧾 PDF / Yazdır</button><button onclick="sendServiceWhatsApp('${s.id}')">💬 WhatsApp</button></div></div><select id="editStatus"><option>Randevu Oluşturuldu</option><option>Yolda</option><option>İşlemde</option><option>Parça Bekliyor</option><option>Müşteri Onayı Bekliyor</option><option>Tamamlandı</option><option>İptal</option></select><button class="wide" onclick="updateStatus('${s.id}')">💾 Durumu Kaydet</button>`);
}
function openCompletion(id){openModal(`<h2>✅ Servisi Tamamla</h2><form onsubmit="completeService(event,'${id}')"><textarea id="fFinding" placeholder="Tespit edilen arıza"></textarea><textarea id="fWork" required placeholder="Yapılan işlem"></textarea><input id="fPart" placeholder="Değişen parça"><div class="grid2"><input id="fPartPrice" type="number" step="0.01" placeholder="Parça ücreti"><input id="fLabor" type="number" step="0.01" placeholder="İşçilik"></div><select id="fPayment"><option>Ödenmedi</option><option>Ödendi</option><option>Kısmi Ödeme</option></select><button class="primary wide">🧾 Servisi Tamamla ve Formu Hazırla</button></form>`)}
async function completeService(e,id){e.preventDefault();const r=await db.from("servisler").update({ariza:$("fFinding").value.trim()||services.find(x=>x.id===id)?.ariza||"",yapilan_islem:$("fWork").value.trim(),degisen_parca:$("fPart").value.trim(),parca_ucreti:Number($("fPartPrice").value||0),iscilik_ucreti:Number($("fLabor").value||0),odeme_durumu:$("fPayment").value,servis_durumu:"Tamamlandı"}).eq("id",id);if(r.error){toast("Servis tamamlanamadı: "+r.error.message,true);return}await loadAll();closeModal();toast("Servis tamamlandı");openServiceDetail(id)}
function printServiceForm(id){const s=services.find(x=>x.id===id);if(!s)return;const c=customers.find(x=>x.id===s.musteri_id)||{},biz=businessProfile||{},total=Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0),w=window.open("","_blank");if(!w){toast("PDF için açılır pencereye izin ver",true);return}w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Servis Formu</title><style>body{font-family:Arial;padding:28px;color:#172033}.head{display:flex;gap:18px;border-bottom:2px solid #172033;padding-bottom:14px}.logo{width:70px;height:70px;object-fit:contain}.muted{color:#667085;font-size:12px}.box{border:1px solid #ccd2da;border-radius:8px;padding:12px;margin:12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}.total{font-size:18px;font-weight:bold}@media print{button{display:none}}</style></head><body><div class="head">${biz.logo_url?`<img class="logo" src="${esc(biz.logo_url)}">`:""}<div><h1>${esc(biz.isletme_adi||"NİTEK TEKNİK SERVİS")}</h1><div class="muted">${esc(biz.telefon||"")} ${biz.email?" · "+esc(biz.email):""}</div><div class="muted">${esc(biz.adres||"")}</div></div></div><h2>TEKNİK SERVİS FORMU</h2><div class="grid"><div class="box"><b>Müşteri</b><br>${esc(c.ad_soyad||"")}<br>${esc(c.telefon||"")}<br>${esc(s.servis_adresi||c.adres||"")}</div><div class="box"><b>Servis</b><br>${esc(`${s.servis_tarihi||""} ${s.servis_saati||""}`)}<br>${esc(s.cihaz_turu||"")} · ${esc(s.marka||"")} ${esc(s.model||"")}<br>Durum: ${esc(s.servis_durumu||"")}</div></div><div class="box"><b>Arıza / Tespit</b><p>${esc(s.ariza||"-")}</p><b>Yapılan İşlem</b><p>${esc(s.yapilan_islem||"-")}</p><b>Değişen Parça</b><p>${esc(s.degisen_parca||"-")}</p></div><div class="box"><div class="row"><span>Parça</span><b>${money(s.parca_ucreti)}</b></div><div class="row"><span>İşçilik</span><b>${money(s.iscilik_ucreti)}</b></div><div class="row total"><span>Toplam</span><b>${money(total)}</b></div><div>Ödeme: ${esc(s.odeme_durumu||"")}</div></div><div class="box"><p>Müşteri Onayı / İmza: __________________________</p><p>Teknisyen: __________________________</p></div><button onclick="window.print()">PDF olarak yazdır / kaydet</button></body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),500)}
async function updateStatus(id){const r=await db.from("servisler").update({servis_durumu:$("editStatus").value}).eq("id",id);if(r.error){toast(r.error.message,true);return}closeModal();await loadAll();renderAll();toast("Durum güncellendi")}

function callCustomer(p){window.location.href="tel:"+decodeURIComponent(p)}
function mapCustomer(a){window.open("https://maps.apple.com/?address="+a,"_blank")}
function sendMaintenance(id){const c=customers.find(x=>x.id===id);if(!c)return;const phone=String(c.telefon||"").replace(/\D/g,"");const msg=`Merhaba ${c.ad_soyad}, NİTEK Teknik Servis olarak ${c.cihaz_turu||"cihazınız"} yıllık bakım zamanınızın geldiğini hatırlatmak isteriz. Randevu için bizimle iletişime geçebilirsiniz.`;window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank")}
function sendServiceWhatsApp(id){const s=services.find(x=>x.id===id),c=customers.find(x=>x.id===s?.musteri_id);if(!c)return;const phone=String(c.telefon||"").replace(/\D/g,"");const msg=`Merhaba ${c.ad_soyad}, NİTEK Teknik Servis servis kaydınız: ${s.servis_tarihi||""}. Toplam: ${money(Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0))}.`;window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank")}

const faultData=[
["Baymak","Luna 24 Fi","E01","Ateşleme / alev oluşmaması"],["Baymak","Luna 24 Fi","E02","Aşırı ısınma"],["Baymak","Luna 24 Fi","E10","Su basıncı / sensör"],["Baymak","Star Bridge Extra","E01","Ateşleme / alev"],["Demirdöküm","Nitron","F01","Aşırı ısınma"],["Demirdöküm","Nitron","F04","Ateşleme / iyonizasyon"],["Demirdöküm","Neva","F04","Ateşleme / alev"],["E.C.A.","Proteus Premix","E01","Ateşleme / alev"],["E.C.A.","Proteus Premix","E04","Düşük basınç"],["Vaillant","ecoTEC","F22","Düşük su basıncı"],["Vaillant","ecoTEC","F28","Ateşleme başarısız"],["Vaillant","ecoTEC","F29","Alev kaybı"],["Bosch","Condens","EA","Alev oluşmuyor"],["Bosch","Condens","E9","Aşırı ısınma"],["Buderus","Logamax Plus","EA","Alev oluşmuyor"],["Viessmann","Vitodens 100","F4","Alev oluşumu"],["Ariston","Clas","501","Alev yok"],["Ariston","Clas","108","Düşük su basıncı"],["Alarko","Serena","E01","Alev / ateşleme"],["Protherm","Lynx","F22","Düşük basınç"],["Ferroli","Divacondens","A01","Ateşleme"],["Immergas","Eolo Star","01","Ateşleme"],["Airfel","Digifel Premix","E01","Ateşleme"],["Warmhaus","Enerwa","E01","Ateşleme"],["Arçelik","DGK","E01","Ateşleme"],["Beko","BK","E01","Ateşleme"],["Beretta","Ciao","A01","Ateşleme"],["Daikin","NDJ","E1","Ateşleme"],["Termodinamik","DE","E01","Ateşleme"],["Termoteknik","Logic","E01","Ateşleme"],["Copa","Econ","E01","Ateşleme"]
];
function initFaults(){const brands=[...new Set(faultData.map(x=>x[0]))].sort();$("faultBrand").innerHTML='<option value="">Tüm markalar</option>'+brands.map(x=>`<option>${esc(x)}</option>`).join("");updateModels()}
function updateModels(){const b=$("faultBrand").value;const models=[...new Set(faultData.filter(x=>!b||x[0]===b).map(x=>x[1]))].sort();$("faultModel").innerHTML='<option value="">Tüm modeller</option>'+models.map(x=>`<option>${esc(x)}</option>`).join("")}
function renderFaults(){const b=$("faultBrand").value,m=$("faultModel").value,q=($("faultSearch").value||"").toLocaleLowerCase("tr-TR");const a=faultData.filter(x=>(!b||x[0]===b)&&(!m||x[1]===m)&&x.join(" ").toLocaleLowerCase("tr-TR").includes(q));$("faultList").innerHTML=a.map(x=>`<div class="fault card"><b>${esc(x[0])} · ${esc(x[1])} · ${esc(x[2])}</b><p>${esc(x[3])}</p><small>Kontrol: üretici servis prosedürüne göre ilgili devre/sensörler kontrol edilmelidir.</small></div>`).join("")||'<div class="empty">Kayıt bulunamadı.</div>'}

function diagnose(){
 const x={code:$("dCode").value.trim().toUpperCase(),power:$("dPower").checked,ignition:$("dIgnition").checked,hot:$("dHot").checked,heat:$("dHeat").checked,pressure:$("dPressure").checked,leak:$("dLeak").checked};
 const out=[];
 if(x.leak)out.push(["Yüksek","Su kaçağı ihtimali","Kaçak kaynağını güvenli şekilde kontrol et; aktif kaçakta cihazı zorlamadan servis prosedürünü uygula."]);
 if(!x.power)out.push(["Orta","Elektrik beslemesi / kontrol tarafı","Besleme, sigorta ve kontrol kartı tarafı üretici prosedürüne göre kontrol edilmeli."]);
 if(x.power&&!x.ignition)out.push(["Yüksek","Ateşleme / gaz / alev algılama","Gaz beslemesi, ateşleme ve alev algılama devresi üretici prosedürüne göre kontrol edilmeli."]);
 if(!x.pressure)out.push(["Orta","Sistem basıncı","Manometre ve olası kaçaklar kontrol edilmeli."]);
 if(x.hot&&!x.heat)out.push(["Orta","Isıtma devresi / yönlendirme","Isıtma talebi, pompa, vana ve sensörler üretici prosedürüne göre kontrol edilmeli."]);
 if(x.code)out.unshift(["Bilgi",`Girilen kod: ${x.code}`,"Kodun kesin anlamı marka/model ve nesle göre doğrulanmalı."]);
 $("diagnosisResult").innerHTML='<div class="card"><h3>Sonuç</h3>'+out.map(o=>`<div class="item"><b>${esc(o[0])} · ${esc(o[1])}</b><p>${esc(o[2])}</p></div>`).join("")+'<p class="muted">⚠️ Bu yardımcı ön değerlendirmedir. Gaz, elektrik ve yanma güvenliği gerektiren işlemlerde üretici prosedürü/yetkili servis kuralları esas alınmalıdır.</p></div>';
}

function openExpenseForm(){openModal(`<h2>💰 Gider Ekle</h2><form onsubmit="saveExpense(event)"><input id="eTitle" required placeholder="Gider açıklaması"><input id="eAmount" type="number" step="0.01" required placeholder="Tutar"><input id="eDate" type="date" value="${today()}"><button class="primary wide">Kaydet</button></form>`)}
async function saveExpense(e){e.preventDefault();const r=await db.from("giderler").insert({user_id:user.id,aciklama:$("eTitle").value.trim(),tutar:Number($("eAmount").value),tarih:$("eDate").value});if(r.error){toast("Gider kaydı için giderler tablosunu kurmalısın: "+r.error.message,true);return}closeModal();await loadAll();renderCash();toast("Gider kaydedildi")}
function renderCash(){const income=services.reduce((n,s)=>n+Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0),0),out=expenses.reduce((n,e)=>n+Number(e.tutar||0),0);$("cashStats").innerHTML=`<div class="stat"><b>${money(income)}</b><span>Toplam Ciro</span></div><div class="stat"><b>${money(out)}</b><span>Gider</span></div><div class="stat"><b>${money(income-out)}</b><span>Net</span></div>`;$("cashList").innerHTML=expenses.map(e=>`<div class="line"><div><b>${esc(e.aciklama)}</b><small>${esc(e.tarih)}</small></div><span>${money(e.tutar)}</span></div>`).join("")||'<div class="empty">Henüz gider yok.</div>'}
function renderReports(){const m=$("reportMonth").value||today().slice(0,7);const ss=services.filter(s=>String(s.servis_tarihi||"").startsWith(m));const revenue=ss.reduce((n,s)=>n+Number(s.parca_ucreti||0)+Number(s.iscilik_ucreti||0),0);$("reportCards").innerHTML=`<div class="stat"><b>${ss.length}</b><span>Servis</span></div><div class="stat"><b>${money(revenue)}</b><span>Ciro</span></div><div class="stat"><b>${money(expenses.filter(e=>String(e.tarih||"").startsWith(m)).reduce((n,e)=>n+Number(e.tutar||0),0))}</b><span>Gider</span></div>`}

async function backup(){
 const data={version:18,created_at:new Date().toISOString(),customers,services,expenses};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`nitek-yedek-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Yedek dosyası hazır")}
async function restore(file){
 if(!file)return;try{const data=JSON.parse(await file.text());if(!confirm(`${data.customers?.length||0} müşteri ve ${data.services?.length||0} servis geri yüklenecek. Devam?`))return;
 for(const c of data.customers||[]) {const x={...c};delete x.id;await db.from("musteriler").insert(x)}
 for(const s of data.services||[]) {const x={...s};delete x.id;await db.from("servisler").insert(x)}
 toast("Geri yükleme tamamlandı");await loadAll();renderAll()}catch(e){toast("Yedek dosyası okunamadı: "+e.message,true)}}

db.auth.getSession().then(async({data})=>{if(data.session){user=data.session.user;await startApp()}});
initFaults();
