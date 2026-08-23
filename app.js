(function(){
"use strict";
const SUPABASE_URL="https://kwiqjwojrowwooukmjih.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_di373iSfOTaPUlSfcasZbg_RHvQJDle";
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});


const DBKEY="nitek_v31_db";
const db=loadDB();

function loadDB(){
  try{
    const x=JSON.parse(localStorage.getItem(DBKEY)||"null");
    if(x)return x;
  }catch(e){}
  return {customers:[],services:[],customBrands:{}};
}
function saveDB(){localStorage.setItem(DBKEY,JSON.stringify(db))}
function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function byId(id){return document.getElementById(id)}

async function requireAuth(){
  const {data}=await sb.auth.getSession();
  if(!data.session){ location.replace("login.html"); return false; }
  window.NITEK_SESSION=data.session;
  return true;
}

function showPage(id){
  document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden"));
  const p=byId(id);
  if(p)p.classList.remove("hidden");
  if(id==="faults")renderFaults();
  if(id==="customers")renderCustomers();
  if(id==="service")initService();
}
window.showPage=showPage;

async function logout(){
  await sb.auth.signOut();
  location.replace("login.html");
}
window.logout=logout;

function init(){
  const u=window.NITEK_SESSION?.user?.email||"";
  byId("userName").textContent=u;
  renderSummary();
  fillDeviceBrands("serviceDevice","serviceBrand","serviceModel");
  renderFaults();
}
window.init=init;

function renderSummary(){
  byId("summary").innerHTML=
    "<b>"+db.services.length+"</b> servis kaydı<br>"+
    "<b>"+db.customers.length+"</b> müşteri";
}

function getCatalog(device){
  const base=(window.NITEK_DATA.brands[device]||{});
  const custom=(db.customBrands[device]||{});
  return Object.assign({},base,custom);
}

function fillDeviceBrands(deviceId,brandId,modelId){
  const d=byId(deviceId),b=byId(brandId),m=byId(modelId);
  if(!d||!b||!m)return;
  const cat=getCatalog(d.value);
  b.innerHTML='<option value="">Marka seçin</option>'+
    Object.keys(cat).sort((a,z)=>a.localeCompare(z,"tr")).map(x=>"<option>"+esc(x)+"</option>").join("");
  fillModels(d.value,b.value,m);
}
function fillModels(device,brand,modelEl){
  const cat=getCatalog(device);
  modelEl.innerHTML='<option value="">Model seçin</option>'+
    ((cat[brand]||[])).map(x=>"<option>"+esc(x)+"</option>").join("");
}
function serviceBrands(){
  fillDeviceBrands("serviceDevice","serviceBrand","serviceModel");
}
window.serviceBrands=serviceBrands;

function serviceModels(){
  fillModels(byId("serviceDevice").value,byId("serviceBrand").value,byId("serviceModel"));
}
window.serviceModels=serviceModels;

function serviceTypeChanged(){
  const type=byId("serviceType").value;
  byId("maintenanceBox").classList.toggle("hidden",type!=="Bakım");
  byId("faultBox").classList.toggle("hidden",type!=="Arıza");
  if(type==="Bakım")renderMaintenance();
}
window.serviceTypeChanged=serviceTypeChanged;

function renderMaintenance(){
  const device=byId("serviceDevice").value;
  const items=window.NITEK_DATA.maintenance[device]||window.NITEK_DATA.maintenance.Diğer;
  byId("maintenanceChecks").innerHTML=items.map((x,i)=>
    '<label class="check"><input type="checkbox" data-maint="'+i+'"><span>'+esc(x)+'</span></label>'
  ).join("");
}
window.renderMaintenance=renderMaintenance;

function checkAll(v){document.querySelectorAll("[data-maint]").forEach(x=>x.checked=v)}
window.checkAll=checkAll;

function saveService(){
  const customer=byId("serviceCustomer").value.trim();
  if(!customer){alert("Müşteri adı gerekli.");return}
  const type=byId("serviceType").value;
  const device=byId("serviceDevice").value;
  const items=window.NITEK_DATA.maintenance[device]||window.NITEK_DATA.maintenance.Diğer;
  const checks=type==="Bakım"?items.filter((x,i)=>byId("maintenanceChecks").querySelector('[data-maint="'+i+'"]')?.checked):[];
  const rec={
    id:Date.now(),customer,
    phone:byId("servicePhone").value.trim(),
    address:byId("serviceAddress").value.trim(),
    type,device,brand:byId("serviceBrand").value,model:byId("serviceModel").value,
    complaint:byId("serviceComplaint").value.trim(),
    checks,work:byId("serviceWork").value.trim(),
    date:byId("serviceDate").value,time:byId("serviceTime").value,
    price:byId("servicePrice").value||"0"
  };
  db.services.unshift(rec);
  let c=db.customers.find(x=>x.name.toLocaleLowerCase("tr-TR")===customer.toLocaleLowerCase("tr-TR"));
  if(!c){
    c={id:Date.now()+1,name:customer,phone:rec.phone,address:rec.address};
    db.customers.unshift(c);
  }else{
    c.phone=rec.phone;c.address=rec.address;
  }
  saveDB();
  renderSummary();
  alert("Servis kaydedildi.");
  createPDF(rec);
}
window.saveService=saveService;

function createPDF(r){
  const w=window.open("","_blank");
  if(!w){alert("PDF formu için açılır pencereye izin ver.");return}
  const checks=r.checks.length?
    "<h3>Yapılan Bakım İşlemleri</h3><ul>"+r.checks.map(x=>"<li>✓ "+esc(x)+"</li>").join("")+"</ul>":"";
  const complaint=r.complaint?"<h3>Müşteri Şikâyeti</h3><p>"+esc(r.complaint)+"</p>":"";
  const work=r.work?"<h3>Yapılan İşlem / Not</h3><p>"+esc(r.work)+"</p>":"";
  w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>NİTEK Servis Formu</title>
  <style>body{font-family:Arial;padding:30px;color:#172033}h1{margin-bottom:4px}li{margin:7px 0}.btn{position:fixed;right:20px;top:20px;padding:12px 18px}@media print{.btn{display:none}}</style>
  </head><body><button class="btn" onclick="window.print()">🖨️ PDF / Yazdır</button>
  <h1>NİTEK TEKNİK SERVİS</h1><p>Servis Formu</p>
  <p><b>Müşteri:</b> ${esc(r.customer)}<br><b>Telefon:</b> ${esc(r.phone)}<br><b>Adres:</b> ${esc(r.address)}</p>
  <p><b>İşlem:</b> ${esc(r.type)}<br><b>Cihaz:</b> ${esc(r.device)}<br><b>Marka/Model:</b> ${esc(r.brand)} ${esc(r.model)}<br><b>Tarih:</b> ${esc(r.date)} ${esc(r.time)}<br><b>Ücret:</b> ${esc(r.price)} ₺</p>
  ${complaint}${checks}${work}
  <div style="margin-top:60px;display:flex;justify-content:space-between"><span>Müşteri İmzası: __________</span><span>Teknisyen: __________</span></div>
  </body></html>`);
  w.document.close();
  setTimeout(()=>{try{w.focus();w.print()}catch(e){}},400);
}
window.createPDF=createPDF;

function initService(){
  const d=new Date();
  byId("serviceDate").value=d.toISOString().slice(0,10);
  byId("serviceTime").value=d.toTimeString().slice(0,5);
  serviceBrands();
  serviceTypeChanged();
}
window.initService=initService;

function addBrandModel(){
  const device=byId("catalogDevice").value;
  const brand=byId("newBrand").value.trim();
  const model=byId("newModel").value.trim();
  if(!brand||!model){alert("Marka ve model gir.");return}
  db.customBrands[device]=db.customBrands[device]||{};
  db.customBrands[device][brand]=db.customBrands[device][brand]||[];
  if(!db.customBrands[device][brand].includes(model))db.customBrands[device][brand].push(model);
  saveDB();alert("Marka/model eklendi.");
  byId("newBrand").value="";byId("newModel").value="";
}
window.addBrandModel=addBrandModel;

function renderFaults(){
  const q=(byId("faultSearch")?.value||"").toLocaleLowerCase("tr-TR");
  byId("faultList").innerHTML=window.NITEK_DATA.faults.filter(x=>x.join(" ").toLocaleLowerCase("tr-TR").includes(q))
    .map(x=>'<div class="list-item"><b>'+esc(x[0])+"</b> — "+esc(x[1])+'<p class="muted">'+esc(x[2])+"</p></div>").join("")||"<p>Arıza kodu bulunamadı.</p>";
}
window.renderFaults=renderFaults;

function renderCustomers(){
  const q=(byId("customerSearch").value||"").toLocaleLowerCase("tr-TR");
  const list=byId("customerList");
  const arr=db.customers.filter(c=>(c.name+" "+c.phone).toLocaleLowerCase("tr-TR").includes(q));
  list.innerHTML=arr.map(c=>{
    const services=db.services.filter(s=>s.customer.toLocaleLowerCase("tr-TR")===c.name.toLocaleLowerCase("tr-TR"));
    return '<div class="list-item"><b>'+esc(c.name)+'</b><br>📞 '+esc(c.phone)+'<br>📍 '+esc(c.address)+
      '<div class="actions"><button class="blue" onclick="openCustomerService('+c.id+')">Yeni Servis</button>'+
      '<button class="light" onclick="customerHistory('+c.id+')">Geçmiş ('+services.length+')</button></div></div>';
  }).join("")||"<p>Henüz müşteri yok.</p>";
}
window.renderCustomers=renderCustomers;

function newCustomer(){
  const name=prompt("Müşteri adı soyadı:");
  if(!name?.trim())return;
  const phone=prompt("Telefon:")||"",address=prompt("Adres:")||"";
  db.customers.unshift({id:Date.now(),name:name.trim(),phone,address});
  saveDB();renderCustomers();
}
window.newCustomer=newCustomer;

function openCustomerService(id){
  const c=db.customers.find(x=>x.id===id);if(!c)return;
  showPage("service");
  setTimeout(()=>{byId("serviceCustomer").value=c.name;byId("servicePhone").value=c.phone;byId("serviceAddress").value=c.address},50);
}
window.openCustomerService=openCustomerService;

function customerHistory(id){
  const c=db.customers.find(x=>x.id===id);if(!c)return;
  const arr=db.services.filter(s=>s.customer===c.name);
  byId("historyTitle").innerHTML="<b>"+esc(c.name)+"</b><br>"+esc(c.phone);
  byId("historyList").innerHTML=arr.map(s=>
    '<div class="list-item"><b>'+esc(s.type)+" • "+esc(s.device)+"</b><br>"+esc(s.date)+" "+esc(s.time)+"<br>"+
    esc(s.brand)+" "+esc(s.model)+"<br>💰 "+esc(s.price)+" ₺<br>"+esc(s.work||s.complaint||"")+
    '<div class="actions"><button class="light" onclick="createPDFById('+s.id+')">PDF</button></div></div>'
  ).join("")||"<p>Servis geçmişi yok.</p>";
  showPage("history");
}
window.customerHistory=customerHistory;

function createPDFById(id){
  const r=db.services.find(x=>x.id===id);if(r)createPDF(r);
}
window.createPDFById=createPDFById;

window.addEventListener("DOMContentLoaded",async()=>{
  if(await requireAuth()) init();
});
sb.auth.onAuthStateChange((_event,session)=>{
  if(!session && location.pathname.endsWith("index.html")) location.replace("login.html");
});
})();