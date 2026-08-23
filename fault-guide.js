(function () {
  "use strict";

  function startGuide() {
    const data = window.NITEK_FAULT_GUIDE && window.NITEK_FAULT_GUIDE.models;
    const brand = document.getElementById("faultBrand");
    const model = document.getElementById("faultModel");
    const code = document.getElementById("faultCode");
    const detail = document.getElementById("faultDetail");

    if (!data || !brand || !model || !code) return false;

    const esc = (v) => String(v).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));

    brand.innerHTML = '<option value="">Marka seç</option>' +
      Object.keys(data).map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("");

    model.innerHTML = '<option value="">Önce marka seç</option>';
    code.innerHTML = '<option value="">Önce model seç</option>';

    brand.onchange = function () {
      const models = data[this.value] || {};
      model.innerHTML = '<option value="">Model seç</option>' +
        Object.keys(models).map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join("");
      model.disabled = !this.value;
      code.innerHTML = '<option value="">Önce model seç</option>';
      code.disabled = true;
      if (detail) detail.innerHTML = "";
    };

    model.onchange = function () {
      const list = (data[brand.value] && data[brand.value][this.value] &&
                    data[brand.value][this.value].codes) || [];
      code.innerHTML = '<option value="">Arıza kodu seç</option>' +
        list.map((x,i) => `<option value="${i}">${esc(x[0])} — ${esc(x[1])}</option>`).join("");
      code.disabled = !this.value;
      if (detail) detail.innerHTML = list.length
        ? `<p>${list.length} doğrulanmış arıza kaydı bulundu.</p>`
        : "<p>Bu model için doğrulanmış kod bulunamadı.</p>";
    };

    code.onchange = function () {
      const list = (data[brand.value] && data[brand.value][model.value] &&
                    data[brand.value][model.value].codes) || [];
      const x = list[Number(this.value)];
      if (!detail || !x) return;
      detail.innerHTML =
        `<h3>🔴 ${esc(x[0])}</h3>` +
        `<p><b>Arıza:</b> ${esc(x[1])}</p>` +
        `<p><b>Muhtemel neden:</b> ${esc(x[2])}</p>` +
        `<p><b>Kontrol / rehber:</b> ${esc(x[3])}</p>` +
        `<p>Bu bölüm servis kaydına aktarılmaz.</p>`;
    };

    return true;
  }

  function boot() {
    if (startGuide()) return;
    let tries = 0;
    const timer = setInterval(function () {
      if (startGuide() || ++tries > 50) clearInterval(timer);
    }, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
