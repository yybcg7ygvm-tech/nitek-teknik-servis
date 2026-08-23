(function () {
  "use strict";

  function getData() {
    return (window.NITEK_FAULT_GUIDE && window.NITEK_FAULT_GUIDE.models) || {};
  }

  function esc(v) {
    return String(v).replace(/[&<>"']/g, function(c) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  window.faultModelList = function () {
    var data = getData();
    var brand = document.getElementById("faultBrand");
    var model = document.getElementById("faultModel");
    var code = document.getElementById("faultCode");
    var detail = document.getElementById("faultDetail");
    if (!brand || !model || !code) return;

    var models = data[brand.value] || {};
    model.innerHTML = '<option value="">Model seç</option>' +
      Object.keys(models).map(function(name) {
        return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
      }).join("");

    code.innerHTML = '<option value="">Önce model seç</option>';
    model.disabled = !brand.value;
    code.disabled = true;
    if (detail) detail.innerHTML = "";
    var list = document.getElementById("faultList");
    if (list) list.innerHTML = "";
  };

  window.faultCodeList = function () {
    var data = getData();
    var brand = document.getElementById("faultBrand");
    var model = document.getElementById("faultModel");
    var code = document.getElementById("faultCode");
    var detail = document.getElementById("faultDetail");
    if (!brand || !model || !code) return;

    var item = data[brand.value] && data[brand.value][model.value];
    var codes = (item && item.codes) || [];

    code.innerHTML = '<option value="">Arıza kodu seç</option>' +
      codes.map(function(x, i) {
        return '<option value="' + i + '">' + esc(x[0]) + ' — ' + esc(x[1]) + '</option>';
      }).join("");

    code.disabled = !model.value;

    var list = document.getElementById("faultList");
    if (list) {
      list.innerHTML = codes.length
        ? '<div class="muted">' + codes.length + ' doğrulanmış arıza kaydı bulundu.</div>'
        : '<div class="muted">Bu model için doğrulanmış kod bulunamadı.</div>';
    }
    if (detail) detail.innerHTML = "";
  };

  window.faultShowCode = function () {
    var data = getData();
    var brand = document.getElementById("faultBrand");
    var model = document.getElementById("faultModel");
    var code = document.getElementById("faultCode");
    var detail = document.getElementById("faultDetail");
    if (!brand || !model || !code || !detail) return;

    var item = data[brand.value] && data[brand.value][model.value];
    var codes = (item && item.codes) || [];
    var x = codes[Number(code.value)];

    if (!x) {
      detail.innerHTML = "";
      return;
    }

    detail.innerHTML =
      '<div class="card">' +
      '<h3>🔴 ' + esc(x[0]) + '</h3>' +
      '<p><b>Arıza:</b> ' + esc(x[1]) + '</p>' +
      '<p><b>Muhtemel neden:</b> ' + esc(x[2]) + '</p>' +
      '<p><b>Kontrol / rehber:</b> ' + esc(x[3]) + '</p>' +
      '<p class="muted">Bu bölüm servis kaydına aktarılmaz.</p>' +
      '</div>';
  };

  window.faultSearchRender = function () {
    var q = (document.getElementById("faultSearch") || {}).value || "";
    q = q.toLowerCase().trim();

    var data = getData();
    var list = [];
    Object.keys(data).forEach(function(brand) {
      Object.keys(data[brand] || {}).forEach(function(model) {
        ((data[brand][model] && data[brand][model].codes) || []).forEach(function(x) {
          var text = (brand + " " + model + " " + x.join(" ")).toLowerCase();
          if (!q || text.indexOf(q) !== -1) {
            list.push({brand: brand, model: model, x: x});
          }
        });
      });
    });

    var box = document.getElementById("faultList");
    if (!box) return;

    box.innerHTML = list.length
      ? list.map(function(r) {
          return '<div class="card"><b>' + esc(r.brand) + ' → ' +
            esc(r.model) + ' → ' + esc(r.x[0]) + '</b><p>' +
            esc(r.x[1]) + '</p></div>';
        }).join("")
      : '<div class="muted">Arama sonucu bulunamadı.</div>';
  };

  function init() {
    var data = getData();
    var brand = document.getElementById("faultBrand");
    if (!brand || !Object.keys(data).length) return false;

    brand.innerHTML = '<option value="">Marka seç</option>' +
      Object.keys(data).map(function(name) {
        return '<option value="' + esc(name) + '">' + esc(name) + '</option>';
      }).join("");

    var model = document.getElementById("faultModel");
    var code = document.getElementById("faultCode");
    if (model) {
      model.innerHTML = '<option value="">Önce marka seç</option>';
      model.disabled = true;
    }
    if (code) {
      code.innerHTML = '<option value="">Önce model seç</option>';
      code.disabled = true;
    }
    return true;
  }

  function boot() {
    if (init()) return;
    var n = 0;
    var timer = setInterval(function() {
      if (init() || ++n > 50) clearInterval(timer);
    }, 200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();