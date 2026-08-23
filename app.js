const cfg = window.NITEK_CONFIG || {};
const db = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
});

let user = null, customerData = [], serviceData = [];
const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money = v => Number(v || 0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})+" TL";

window.show = function(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===page));
  document.querySelectorAll(".bottom button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  if(page==="customers") window.customers();
  if(page==="services") window.services();
  if(page==="faults") window.faults();
};

window.logout = async function(){
  const {error}=await db.auth.signOut();
  if(error) alert(error.message);
};

async function boot(){
  const {data,error}=await db.auth.getSession();
  if(error){ alert(error.message); return; }
  applySession(data.session);
  db.auth.onAuthStateChange((_event,session)=>applySession(session));
}

async function applySession(session){
  user=session?.user||null;
  if(!user){
    location.href="login.html";
    return;
  }
  await loadAll();
}

async function loadAll(){
  const c=await db.from("customers").select("*").order("created_at",{ascending:false});
  if(c.error){console.error(c.error); alert("Müşteriler yüklenemedi: "+c.error.message);return;}
  customerData=c.data||[];

  const s=await db.from("services").select("*").order("service_date",{ascending:false}).order("created_at",{ascending:false});
  if(s.error){console.error(s.error); alert("Servisler yüklenemedi: "+s.error.message);return;}
  serviceData=s.data||[];
  renderHome();
  window.customers();
  window.services();
}

function renderHome(){
  const h=$("homeStats");
  if(h) h.innerHTML=`<div class="grid">
    <div class="card"><b>${customerData.length}</b><div>Müşteri</div></div>
    <div class="card"><b>${serviceData.length}</b><div>Servis</div></div>
  </div>`;
  const r=$("recent");
  if(!r)return;
  r.innerHTML=serviceData.slice(0,5).map(serviceCard).join("")||'<div class="empty">Henüz servis kaydı yok.</div>';
}

function serviceCard(s){
  return `<div class="item">
    <strong>${esc(s.customer_name)}</strong>
    <div>📅 ${esc(s.service_date||"")} ${esc(s.service_time||"")} · ${esc(s.device)} · ${esc(s.brand)} ${esc(s.model)}</div>
    <div class="muted">${esc(s.complaint||"")}</div>
    <div class="muted">💰 ${money(Number(s.labor||0)+Number(s.parts||0))} · ${esc(s.payment||"")}</div>
    <div class="row"><button onclick="openServiceDetail('${s.id}')">Detay</button><button onclick="makePDF('${s.id}')">PDF</button></div>
  </div>`;
}

window.customers=function(){
  const q=($("customerSearch")?.value||"").toLocaleLowerCase("tr-TR");
  const arr=customerData.filter(c=>
    `${c.name} ${c.phone} ${c.address}`.toLocaleLowerCase("tr-TR").includes(q)
  );
  $("customerList").innerHTML=arr.map(c=>`<div class="item customer-card">
    <strong>${esc(c.name)}</strong>
    <div>📞 ${esc(c.phone)} · ${esc(c.address)}</div>
    <div class="muted">${esc(c.note||"")}</div>
    <div class="row">
      <button onclick="openCustomerHistory('${c.id}')">📋 Geçmiş</button>
      <button onclick="openServiceForm('${c.id}')">🔧 Servis</button>
      <button class="danger" onclick="deleteCustomer('${c.id}')">Sil</button>
    </div>
  </div>`).join("")||'<div class="empty">Müşteri bulunamadı.</div>';
};

window.addCustomer=function(){
  openModal(`<h2>👤 Yeni Müşteri</h2>
  <form id="customerForm">
    <input id="mName" required placeholder="Ad Soyad">
    <input id="mPhone" placeholder="Telefon">
    <textarea id="mAddress" placeholder="Adres"></textarea>
    <textarea id="mNote" placeholder="Not"></textarea>
    <button class="primary full">💾 Müşteriyi Kaydet</button>
  </form>`);
};

document.addEventListener("click",e=>{
  const b=e.target.closest('button[onclick="addCustomer"]');
  if(b){e.preventDefault();window.addCustomer();}
});

document.addEventListener("submit",async e=>{
  if(e.target.id!=="customerForm") return;
  e.preventDefault();
  const row={user_id:user.id,name:$("mName").value.trim(),phone:$("mPhone").value.trim(),address:$("mAddress").value.trim(),note:$("mNote").value.trim()};
  const {error}=await db.from("customers").insert(row);
  if(error){alert(error.message);return;}
  closeModal(); await loadAll(); show("customers");
});

window.deleteCustomer=async function(id){
  if(!confirm("Bu müşteriyi silmek istiyor musun?"))return;
  const {error}=await db.from("customers").delete().eq("id",id);
  if(error) alert(error.message); else {await loadAll();show("customers");}
};

window.openCustomerHistory=function(id){
  const c=customerData.find(x=>x.id===id); if(!c)return;
  const arr=serviceData.filter(s=>s.customer_id===id);
  $("historyTitle").innerHTML=`<h2>📋 ${esc(c.name)} — Servis Geçmişi</h2><p>${esc(c.phone)} · ${esc(c.address)}</p>`;
  $("historyList").innerHTML=arr.map(serviceCard).join("")||'<div class="empty">Bu müşteriye ait servis kaydı yok.</div>';
  show("history");
};

window.openServiceForm=function(customerId=""){
  const c=customerData.find(x=>x.id===customerId)||{};
  const devices=Object.keys(window.NITEK_DATA?.brands||{});
  openModal(`<h2>🧾 Yeni Servis</h2>
  <form id="serviceForm">
    <label>Müşteri</label><select id="sCustomer" required>
      <option value="">Müşteri seç</option>${customerData.map(x=>`<option value="${x.id}" ${x.id===customerId?"selected":""}>${esc(x.name)} - ${esc(x.phone)}</option>`).join("")}
    </select>
    <label>Servis Türü</label><select id="sType"><option>Arıza</option><option>Bakım</option><option>Montaj</option><option>Kontrol</option><option>Diğer</option></select>
    <label>Cihaz</label><select id="sDevice">${devices.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
    <label>Marka</label><select id="sBrand"></select>
    <label>Model</label><select id="sModel"></select>
    <div id="sFault"><label>Müşteri Şikâyeti / Arıza</label><textarea id="sComplaint"></textarea></div>
    <div id="sChecks" class="card hidden"><h3>🛠️ Bakım Kontrolleri</h3><div id="maintenanceChecks"></div>
      <div class="actions"><button type="button" class="light" onclick="allChecks(true)">☑️ Hepsini</button><button type="button" class="light" onclick="allChecks(false)">Temizle</button></div>
    </div>
    <label>Tarih</label><input id="sDate" type="date" value="${new Date().toISOString().slice(0,10)}">
    <label>Saat</label><input id="sTime" type="time" value="${new Date().toTimeString().slice(0,5)}">
    <label>Yapılan İşlem</label><textarea id="sWork"></textarea>
    <label>Değişen Parça / Malzeme</label><textarea id="sPartsText"></textarea>
    <div class="grid"><div><label>İşçilik</label><input id="sLabor" type="number" min="0" step=".01" value="0"></div>
    <div><label>Parça</label><input id="sParts" type="number" min="0" step=".01" value="0"></div></div>
    <label>Ödeme</label><select id="sPayment"><option>Ödenmedi</option><option>Ödendi</option><option>Nakit</option><option>Kart</option><option>Havale/EFT</option></select>
    <label>Not</label><textarea id="sNote"></textarea>
    <button class="primary full">💾 Servisi Kaydet</button>
  </form>`);
  setTimeout(()=>{brandList();serviceType();},50);
};

function brandList(){
  const dev=$("sDevice")?.value, b=$("sBrand"); if(!b)return;
  const brands=Object.keys((window.NITEK_DATA?.brands||{})[dev]||{});
  b.innerHTML=brands.map(x=>`<option>${esc(x)}</option>`).join("")||'<option value="">Marka yok</option>';
  modelList();
}
function modelList(){
  const dev=$("sDevice")?.value, brand=$("sBrand")?.value, m=$("sModel"); if(!m)return;
  const models=((window.NITEK_DATA?.brands||{})[dev]||{})[brand]||[];
  m.innerHTML=models.map(x=>`<option>${esc(x)}</option>`).join("")||'<option value="">Model yok</option>';
}
window.serviceType=function(){
  const isM=$("sType")?.value==="Bakım";
  $("sChecks")?.classList.toggle("hidden",!isM);
  $("sFault")?.classList.toggle("hidden",isM);
  if(isM)renderChecks();
};
window.allChecks=function(v){document.querySelectorAll("#maintenanceChecks input").forEach(x=>x.checked=v);};
function renderChecks(){
  const dev=$("sDevice")?.value;
  const items=(window.NITEK_DATA?.maintenance||{})[dev]||[];
  $("maintenanceChecks").innerHTML=items.map((x,i)=>`<label class="check"><input type="checkbox" data-check="${esc(x)}"> ${esc(x)}</label>`).join("")||"Kontrol listesi yok.";
}
document.addEventListener("change",e=>{
  if(e.target.id==="sDevice"){brandList();serviceType();}
  if(e.target.id==="sBrand")modelList();
  if(e.target.id==="sType")serviceType();
});

document.addEventListener("submit",async e=>{
  if(e.target.id!=="serviceForm")return;
  e.preventDefault();
  const cid=$("sCustomer").value, c=customerData.find(x=>x.id===cid);
  if(!c){alert("Müşteri seç.");return;}
  const checks=[...document.querySelectorAll("#maintenanceChecks input:checked")].map(x=>x.dataset.check);
  const row={
    user_id:user.id,customer_id:cid,customer_name:c.name,phone:c.phone,address:c.address,
    type:$("sType").value,device:$("sDevice").value,brand:$("sBrand").value||"",
    model:$("sModel").value||"",complaint:$("sComplaint")?.value.trim()||"",
    done_checks:checks,work:$("sWork").value.trim(),parts_text:$("sPartsText").value.trim(),
    labor:Number($("sLabor").value||0),parts:Number($("sParts").value||0),
    total:Number($("sLabor").value||0)+Number($("sParts").value||0),
    payment:$("sPayment").value,note:$("sNote").value.trim(),
    service_date:$("sDate").value,service_time:$("sTime").value
  };
  const {error}=await db.from("services").insert(row);
  if(error){alert("Servis kaydedilemedi: "+error.message);return;}
  closeModal();await loadAll();show("services");alert("Servis kaydedildi.");
});

window.services=function(){
  const q=($("serviceSearch")?.value||"").toLocaleLowerCase("tr-TR");
  const arr=serviceData.filter(s=>`${s.customer_name} ${s.phone} ${s.complaint} ${s.work} ${s.device} ${s.brand}`.toLocaleLowerCase("tr-TR").includes(q));
  $("serviceList").innerHTML=arr.map(serviceCard).join("")||'<div class="empty">Servis bulunamadı.</div>';
};

window.openServiceDetail=function(id){
  const s=serviceData.find(x=>x.id===id);if(!s)return;
  const checks=Array.isArray(s.done_checks)?s.done_checks:[];
  $("detail").innerHTML=`<div class="card">
    <button class="light" onclick="show('services')">← Geri</button>
    <h2>📋 Servis Detayı</h2>
    <p><b>Müşteri:</b> ${esc(s.customer_name)}</p><p><b>Telefon:</b> ${esc(s.phone)}</p><p><b>Adres:</b> ${esc(s.address)}</p>
    <p><b>Tür:</b> ${esc(s.type)} · <b>Cihaz:</b> ${esc(s.device)} · ${esc(s.brand)} ${esc(s.model)}</p>
    <p><b>Şikâyet:</b> ${esc(s.complaint)}</p>
    <p><b>Yapılan işler:</b><br>${esc(s.work)}</p>
    <p><b>Değişen parça:</b><br>${esc(s.parts_text)}</p>
    ${checks.length?`<h3>🛠️ Yapılan Bakım Kontrolleri</h3><ul>${checks.map(x=>`<li>☑️ ${esc(x)}</li>`).join("")}</ul>`:""}
    <p><b>İşçilik:</b> ${money(s.labor)} · <b>Parça:</b> ${money(s.parts)}</p>
    <p><b>Toplam:</b> ${money(s.total)} · <b>Ödeme:</b> ${esc(s.payment)}</p>
    <p><b>Tarih:</b> ${esc(s.service_date)} ${esc(s.service_time)}</p>
    <div class="row"><button class="primary" onclick="makePDF('${s.id}')">📄 PDF Oluştur</button></div>
  </div>`;
  show("detail");
};

window.faults=function(){
  const q=($("faultSearch")?.value||"").toLocaleLowerCase("tr-TR");
  const list=(window.NITEK_DATA?.faults||[]).filter(x=>x.join(" ").toLocaleLowerCase("tr-TR").includes(q));
  $("faultList").innerHTML=list.map(x=>`<div class="item"><strong>🔥 ${esc(x[0])}</strong><div>${esc(x[1])}</div><small>${esc(x[2])}</small></div>`).join("")||'<div class="empty">Arıza kodu bulunamadı.</div>';
};

function openModal(html){$("modal")?.classList.remove("hidden");$("modalContent").innerHTML=html;}
window.closeModal=function(){$("modal")?.classList.add("hidden");$("modalContent").innerHTML="";};

window.makePDF=function(id){
  const s=serviceData.find(x=>x.id===id);if(!s)return;
  const checks=Array.isArray(s.done_checks)?s.done_checks:[];
  const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>NİTEK Servis Formu</title>
  <style>@page{size:A4;margin:12mm}body{font-family:Arial;color:#14233d}.head{display:flex;align-items:center;border-bottom:3px solid #c71920;padding-bottom:15px}.logo{width:85px;height:85px;object-fit:contain;margin-right:18px}h1{margin:0;font-size:24px}.muted{color:#687386}.sec{border:1px solid #d5dbe2;margin:16px 0;border-radius:8px;overflow:hidden}.sec h2{margin:0;background:#10203a;color:#fff;padding:9px;font-size:13px}.body{padding:12px}.row{margin:7px 0}.total{font-size:18px;font-weight:bold}.actions{position:fixed;right:15px;top:15px}.actions button{padding:10px 14px;background:#10203a;color:white;border:0;border-radius:8px}@media print{.actions{display:none}}</style></head><body>
  <div class="actions"><button onclick="print()">PDF / Yazdır</button></div>
  <div class="head"><img class="logo" src="logo.jpg"><div><h1>NİTEK TEKNİK SERVİS</h1><div class="muted">Kombi • Klima • Bakım • Onarım • Montaj</div></div></div>
  <div class="sec"><h2>MÜŞTERİ</h2><div class="body"><div class="row"><b>Ad Soyad:</b> ${esc(s.customer_name)}</div><div class="row"><b>Telefon:</b> ${esc(s.phone)}</div><div class="row"><b>Adres:</b> ${esc(s.address)}</div></div></div>
  <div class="sec"><h2>SERVİS</h2><div class="body"><div class="row"><b>Tür:</b> ${esc(s.type)}</div><div class="row"><b>Cihaz:</b> ${esc(s.device)} · ${esc(s.brand)} ${esc(s.model)}</div><div class="row"><b>Tarih:</b> ${esc(s.service_date)} ${esc(s.service_time)}</div><div class="row"><b>Şikâyet:</b> ${esc(s.complaint)}</div><div class="row"><b>Yapılan İşler:</b><br>${esc(s.work)}</div><div class="row"><b>Değişen Parça:</b><br>${esc(s.parts_text)}</div>${checks.length?`<div class="row"><b>Bakım Kontrolleri:</b><ul>${checks.map(x=>`<li>☑️ ${esc(x)}</li>`).join("")}</ul></div>`:""}</div></div>
  <div class="sec"><h2>ÜCRET</h2><div class="body"><div class="row">İşçilik: ${money(s.labor)}</div><div class="row">Parça: ${money(s.parts)}</div><div class="row total">Toplam: ${money(s.total)}</div><div class="row">Ödeme: ${esc(s.payment)}</div></div></div>
  </body></html>`;
  const w=window.open("","_blank");if(!w){alert("Yeni pencere engellendi. Safari'de açılır pencereye izin ver.");return;}w.document.write(html);w.document.close();
};

document.addEventListener("DOMContentLoaded",()=>{
  $("customerSearch")?.addEventListener("input",window.customers);
  $("serviceSearch")?.addEventListener("input",window.services);
  boot();
});
