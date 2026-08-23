// ================================
// NİTEK KOMBI ARIZA KODLARI
// ================================

const faultData = [
  ["Baymak","Luna 24 Fi","E01","Ateşleme / alev oluşmaması"],
  ["Baymak","Luna 24 Fi","E02","Aşırı ısınma"],
  ["Baymak","Luna 24 Fi","E10","Su basıncı / sensör"],
  ["Baymak","Star Bridge Extra","E01","Ateşleme / alev"],

  ["Demirdöküm","Nitron","F01","Aşırı ısınma"],
  ["Demirdöküm","Nitron","F04","Ateşleme / iyonizasyon"],
  ["Demirdöküm","Neva","F04","Ateşleme / alev"],

  ["E.C.A.","Proteus Premix","E01","Ateşleme / alev"],
  ["E.C.A.","Proteus Premix","E04","Düşük su basıncı"],

  ["Vaillant","ecoTEC","F22","Düşük su basıncı"],
  ["Vaillant","ecoTEC","F28","Ateşleme başarısız"],
  ["Vaillant","ecoTEC","F29","Alev kaybı"],

  ["Bosch","Condens","EA","Alev oluşmuyor"],
  ["Bosch","Condens","E9","Aşırı ısınma"],

  ["Buderus","Logamax Plus","EA","Alev oluşmuyor"],

  ["Viessmann","Vitodens 100","F4","Alev oluşumu"],

  ["Ariston","Clas","501","Alev yok"],
  ["Ariston","Clas","108","Düşük su basıncı"],

  ["Alarko","Serena","E01","Alev / ateşleme"],

  ["Protherm","Lynx","F22","Düşük basınç"],

  ["Ferroli","Divacondens","A01","Ateşleme"],

  ["Immergas","Eolo Star","01","Ateşleme"],

  ["Airfel","Digifel Premix","E01","Ateşleme"],

  ["Warmhaus","Enerwa","E01","Ateşleme"],

  ["Arçelik","DGK","E01","Ateşleme"],

  ["Beko","BK","E01","Ateşleme"],

  ["Beretta","Ciao","A01","Ateşleme"],

  ["Daikin","NDJ","E1","Ateşleme"],

  ["Termodinamik","DE","E01","Ateşleme"],

  ["Termoteknik","Logic","E01","Ateşleme"],

  ["Copa","Econ","E01","Ateşleme"]
];

function initFaults(){

  const brands = [
    ...new Set(faultData.map(x => x[0]))
  ].sort();

  const brand = document.getElementById("faultBrand");

  if(!brand) return;

  brand.innerHTML =
    '<option value="">Tüm Markalar</option>' +
    brands.map(x =>
      `<option value="${esc(x)}">${esc(x)}</option>`
    ).join("");

  updateModels();
}

function updateModels(){

  const brand =
    document.getElementById("faultBrand")?.value || "";

  const model =
    document.getElementById("faultModel");

  if(!model) return;

  const models = [
    ...new Set(
      faultData
        .filter(x => !brand || x[0] === brand)
        .map(x => x[1])
    )
  ].sort();

  model.innerHTML =
    '<option value="">Tüm Modeller</option>' +
    models.map(x =>
      `<option value="${esc(x)}">${esc(x)}</option>`
    ).join("");
}

function renderFaults(){

  const brand =
    document.getElementById("faultBrand")?.value || "";

  const model =
    document.getElementById("faultModel")?.value || "";

  const search =
    (
      document.getElementById("faultSearch")?.value || ""
    ).toLocaleLowerCase("tr-TR");

  const list = faultData.filter(x => {

    const text =
      x.join(" ").toLocaleLowerCase("tr-TR");

    return (
      (!brand || x[0] === brand) &&
      (!model || x[1] === model) &&
      text.includes(search)
    );

  });

  const container =
    document.getElementById("faultList");

  if(!container) return;

  container.innerHTML =
    list.map(x => `
      <div class="fault card">

        <b>
          🔥 ${esc(x[0])}
          · ${esc(x[1])}
          · ${esc(x[2])}
        </b>

        <p>${esc(x[3])}</p>

        <small>
          Kontrol: üretici servis prosedürüne göre
          ilgili devre ve sensörler kontrol edilmelidir.
        </small>

      </div>
    `).join("")
    ||
    '<div class="empty">Arıza kodu bulunamadı.</div>';
}

// Sayfa hazır olduğunda arıza sistemini başlat
document.addEventListener("DOMContentLoaded", () => {

  setTimeout(() => {

    try {
      initFaults();
      renderFaults();
    } catch(e) {
      console.error("Arıza kodları başlatılamadı:", e);
    }

  }, 500);

});
