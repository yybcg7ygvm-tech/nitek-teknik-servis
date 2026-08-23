const cfg = window.NITEK_CONFIG || {};
const db = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

let user=null, customerData=[], serviceData=[];
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const money=v=>Number(v||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})+" TL";

window.show=function(page){
  document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id===page));
  document.querySelectorAll(".bottom button").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  if(page==="service") brandList();
  if(page==="customers") customers();
  if(page==="services") services();
  if(page==="faults") faults();
  if(page==="reports") reports();
};

window.logout=async function(){
  const {error}=await db.auth.signOut();
  if(error) alert(error.message); else location.href="login.html";
};

async function boot(){
  const {data,error}=await db.auth.getSession();
  if(error){alert(error.message);return;}
  applySession(data.session);
  db.auth.onAuthStateChange((_event,session)=>applySession(session));
}
async function applySession(session){
  user=session?.user||null;
  if(!user){location.href="login.html";return;}
  await loadAll();
}
async function loadAll(){
  const c=await db.from("customers").select("*").order("created_at",{ascending:false});
  if(c.error){alert("Müşteriler yüklenemedi: "+c.error.message);return;}
  customerData=c.data||[];
  const s=await db.from("services").select("*").order("service_date",{ascending:false}).order("created_at",{ascending:false});
  if(s.error){alert("Servisler yüklenemedi: "+s.error.message);return;}
  serviceData=s.data||[];
  renderHome(); customers(); services(); reports();
}
function renderHome(){
  const h=$("homeStats");
  if(h) h.innerHTML=`<div class="grid"><div class="card"><b>${customerData.length}</b><div>Müşteri</div></div><div class="card"><b>${serviceData.length}</b><div>Servis</div></div></div>`;
  const r=$("recent");
  if(r) r.innerHTML=serviceData.slice(0,5).map(serviceCard).join("")||'<div class="empty">Henüz servis kaydı yok.</div>';
}
function serviceCard(s){
  return `<div class="item"><strong>${esc(s.customer_name)}</strong><div>📅 ${esc(s.service_date||"")} ${esc(s.service_time||"")} · ${esc(s.device)} · ${esc(s.brand)} ${esc(s.model)}</div><div class="muted">${esc(s.type)} · ${esc(s.complaint||"")}</div><div class="muted">💰 ${money(s.total)} · ${esc(s.payment||"")}</div><div class="row"><button onclick="openServiceDetail('${s.id}')">Detay</button><button onclick="makePDF('${s.id}')">PDF</button></div></div>`;
}

window.customers=function(){
  const q=($("customerSearch")?.value||"").toLocaleLowerCase("tr-TR");
  const arr=customerData.filter(c=>`${c.name} ${c.phone} ${c.address}`.toLocaleLowerCase("tr-TR").includes(q));
  $("customerList").innerHTML=arr.map(c=>`<div class="item customer-card"><strong>${esc(c.name)}</strong><div>📞 ${esc(c.phone)} · ${esc(c.address)}</div><div class="muted">${esc(c.note||"")}</div><div class="row"><button onclick="openCustomerHistory('${c.id}')">📋 Geçmiş</button><button onclick="startServiceFor('${c.id}')">🔧 Servis</button><button class="danger" onclick="deleteCustomer('${c.id}')">Sil</button></div></div>`).join("")||'<div class="empty">Müşteri bulunamadı.</div>';
};

window.addCustomer=function(){
  const name=prompt("Müşteri adı soyadı:");
  if(!name?.trim()) return;
  const phone=prompt("Telefon:")||"";
  const address=prompt("Adres:")||"";
  const note=prompt("Not:")||"";
  saveCustomer({name:name.trim(),phone,address,note});
};
async function saveCustomer(x){
  const {error}=await db.from("customers").insert({...x,user_id:user.id});
  if(error){alert("Müşteri kaydedilemedi: "+error.message);return;}
  await loadAll(); show("customers"); alert("Müşteri kaydedildi.");
}
window.deleteCustomer=async function(id){
  if(!confirm("Bu müşteriyi silmek istiyor musun?"))return;
  const {error}=await db.from("customers").delete().eq("id",id);
  if(error) alert(error.message); else {await loadAll();show("customers");}
};
window.openCustomerHistory=function(id){
  const c=customerData.find(x=>x.id===id);if(!c)return;
  const arr=serviceData.filter(s=>s.customer_id===id);
  $("historyTitle").innerHTML=`<h2>📋 ${esc(c.name)} — Servis Geçmişi</h2><p>${esc(c.phone)} · ${esc(c.address)}</p>`;
  $("historyList").innerHTML=arr.map(serviceCard).join("")||'<div class="empty">Bu müşteriye ait servis kaydı yok.</div>';
  show("history");
};
window.startServiceFor=function(id){
  $("customer").value=customerData.find(c=>c.id===id)?.name||"";
  $("phone").value=customerData.find(c=>c.id===id)?.phone||"";
  $("address").value=customerData.find(c=>c.id===id)?.address||"";
  show("service");
};

window.brandList=function(){
  const dev=$("device")?.value,b=$("brand");if(!b)return;
  const brands=(window.NITEK_DATA?.brands||{})[dev]||{};
  const names=Object.keys(brands);
  b.innerHTML=names.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("")||'<option value="">Marka yok</option>';
  modelList();
};
window.modelList=function(){
  const dev=$("device")?.value,brand=$("brand")?.value,m=$("model");if(!m)return;
  const models=((window.NITEK_DATA?.brands||{})[dev]||{})[brand]||[];
  m.innerHTML=models.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("")||'<option value="">Model yok</option>';
};
window.serviceType=function(){
  const isM=$("type")?.value==="Bakım";
  $("maintBox")?.classList.toggle("hidden",!isM);
  $("faultBox")?.classList.toggle("hidden",isM);
  if(isM) renderChecks();
};
function renderChecks(){
  const dev=$("device")?.value,box=$("checks");
  const items=(window.NITEK_DATA?.maintenance||{})[dev]||[];
  box.innerHTML=items.map((x,i)=>`<label class="check"><input type="checkbox" data-check="${esc(x)}"> ${esc(x)}</label>`).join("")||"Bu cihaz için bakım kontrolü yok.";
}
window.allChecks=function(v){document.querySelectorAll("#checks input[type=checkbox]").forEach(x=>x.checked=v);};

window.saveService=async function(){
  const customerName=$("customer").value.trim();
  if(!customerName){alert("Müşteri adı gerekli.");return;}
  const phone=$("phone").value.trim(),address=$("address").value.trim();
  const type=$("type").value,device=$("device").value,brand=$("brand").value||"",model=$("model").value||"";
  const checks=[...document.querySelectorAll("#checks input:checked")].map(x=>x.dataset.check);
  const labor=Number($("labor").value||0),parts=Number($("parts").value||0);
  const existing=customerData.find(c=>c.name.toLocaleLowerCase("tr-TR")===customerName.toLocaleLowerCase("tr-TR") && (c.phone||"")===phone);
  let customerId=existing?.id;
  if(!customerId){
    const ins=await db.from("customers").insert({user_id:user.id,name:customerName,phone,address,note:$("note").value.trim()}).select().single();
    if(ins.error){alert("Müşteri kaydedilemedi: "+ins.error.message);return;}
    customerId=ins.data.id;
  }
  const row={user_id:user.id,customer_id:customerId,customer_name:customerName,phone,address,type,device,brand,model,complaint:$("complaint").value.trim(),done_checks:checks,work:$("work").value.trim(),parts_text:$("partsText").value.trim(),labor,parts,total:labor+parts,payment:$("payment").value,note:$("note").value.trim(),service_date:$("date").value||new Date().toISOString().slice(0,10),service_time:$("time").value||new Date().toTimeString().slice(0,5)};
  const {error}=await db.from("services").insert(row);
  if(error){alert("Servis kaydedilemedi: "+error.message);return;}
  alert("Servis başarıyla kaydedildi.");
  await loadAll();
  show("services");
};

window.services=function(){
  const q=($("serviceSearch")?.value||"").toLocaleLowerCase("tr-TR");
  const arr=serviceData.filter(s=>`${s.customer_name} ${s.phone} ${s.complaint} ${s.work} ${s.device} ${s.brand} ${s.model}`.toLocaleLowerCase("tr-TR").includes(q));
  $("serviceList").innerHTML=arr.map(serviceCard).join("")||'<div class="empty">Servis bulunamadı.</div>';
};
window.openServiceDetail=function(id){
  const s=serviceData.find(x=>x.id===id);if(!s)return;
  const checks=Array.isArray(s.done_checks)?s.done_checks:[];
  $("detail").innerHTML=`<div class="card"><button class="light" onclick="show('services')">← Geri</button><h2>📋 Servis Detayı</h2><p><b>Müşteri:</b> ${esc(s.customer_name)}</p><p><b>Telefon:</b> ${esc(s.phone)}</p><p><b>Adres:</b> ${esc(s.address)}</p><p><b>Tür:</b> ${esc(s.type)} · <b>Cihaz:</b> ${esc(s.device)} · ${esc(s.brand)} ${esc(s.model)}</p><p><b>Şikâyet:</b> ${esc(s.complaint)}</p><p><b>Yapılan işler:</b><br>${esc(s.work)}</p><p><b>Değişen parça:</b><br>${esc(s.parts_text)}</p>${checks.length?`<h3>🛠️ Yapılan Bakım Kontrolleri</h3><ul>${checks.map(x=>`<li>☑️ ${esc(x)}</li>`).join("")}</ul>`:""}<p><b>Toplam:</b> ${money(s.total)} · <b>Ödeme:</b> ${esc(s.payment)}</p><p><b>Tarih:</b> ${esc(s.service_date)} ${esc(s.service_time)}</p><button class="primary" onclick="makePDF('${s.id}')">📄 PDF Oluştur</button></div>`;
  show("detail");
};

window.faults=function(){
  const q=($("faultSearch")?.value||"").toLocaleLowerCase("tr-TR");
  const list=(window.NITEK_DATA?.faults||[]).filter(x=>x.join(" ").toLocaleLowerCase("tr-TR").includes(q));
  $("faultList").innerHTML=list.map(x=>`<div class="item"><strong>🔥 ${esc(x[0])}</strong><div>${esc(x[1])}</div><small>${esc(x[2])}</small></div>`).join("")||'<div class="empty">Arıza kodu bulunamadı.</div>';
};

window.reports=function(){
  const total=serviceData.reduce((a,s)=>a+Number(s.total||0),0);
  const counts={};serviceData.forEach(s=>counts[s.type]=(counts[s.type]||0)+1);
  $("report").innerHTML=`<div class="grid"><div class="card"><b>${customerData.length}</b><div>Müşteri</div></div><div class="card"><b>${serviceData.length}</b><div>Servis</div></div><div class="card"><b>${money(total)}</b><div>Toplam Ciro</div></div></div><div class="card"><h3>Servis Türleri</h3>${Object.entries(counts).map(([k,v])=>`<div>${esc(k)}: <b>${v}</b></div>`).join("")||"Henüz kayıt yok."}</div>`;
};

window.makePDF=function(id){
  const s=serviceData.find(x=>x.id===id);if(!s)return;
  const checks=Array.isArray(s.done_checks)?s.done_checks:[];
  const html=`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>NİTEK Servis Formu</title><style>@page{size:A4;margin:12mm}body{font-family:Arial;color:#14233d}.head{display:flex;align-items:center;border-bottom:3px solid #c71920;padding-bottom:15px}.logo{width:85px;height:85px;object-fit:contain;margin-right:18px}.sec{border:1px solid #d5dbe2;margin:16px 0;border-radius:8px;overflow:hidden}.sec h2{margin:0;background:#10203a;color:#fff;padding:9px;font-size:13px}.body{padding:12px}.row{margin:7px 0}.total{font-size:18px;font-weight:bold}.actions{position:fixed;right:15px;top:15px}@media print{.actions{display:none}}</style></head><body><div class="actions"><button onclick="print()">PDF / Yazdır</button></div><div class="head"><img class="logo" src="logo.jpg"><div><h1>NİTEK TEKNİK SERVİS</h1><div>Kombi • Klima • Bakım • Onarım • Montaj</div></div></div><div class="sec"><h2>MÜŞTERİ</h2><div class="body"><div class="row"><b>Ad Soyad:</b> ${esc(s.customer_name)}</div><div class="row"><b>Telefon:</b> ${esc(s.phone)}</div><div class="row"><b>Adres:</b> ${esc(s.address)}</div></div></div><div class="sec"><h2>SERVİS</h2><div class="body"><div class="row"><b>Tür:</b> ${esc(s.type)}</div><div class="row"><b>Cihaz:</b> ${esc(s.device)} · ${esc(s.brand)} ${esc(s.model)}</div><div class="row"><b>Tarih:</b> ${esc(s.service_date)} ${esc(s.service_time)}</div><div class="row"><b>Şikâyet:</b> ${esc(s.complaint)}</div><div class="row"><b>Yapılan İşler:</b><br>${esc(s.work)}</div><div class="row"><b>Değişen Parça:</b><br>${esc(s.parts_text)}</div>${checks.length?`<div class="row"><b>Bakım Kontrolleri:</b><ul>${checks.map(x=>`<li>☑️ ${esc(x)}</li>`).join("")}</ul></div>`:""}</div></div><div class="sec"><h2>ÜCRET</h2><div class="body"><div class="row">İşçilik: ${money(s.labor)}</div><div class="row">Parça: ${money(s.parts)}</div><div class="row total">Toplam: ${money(s.total)}</div><div class="row">Ödeme: ${esc(s.payment)}</div></div></div></body></html>`;
  const w=window.open("","_blank");if(!w){alert("Açılır pencereye izin ver.");return;}w.document.write(html);w.document.close();
};

document.addEventListener("DOMContentLoaded",()=>{
  const d=new Date();if($("date"))$("date").value=d.toISOString().slice(0,10);if($("time"))$("time").value=d.toTimeString().slice(0,5);
  brandList();serviceType();boot();
});
