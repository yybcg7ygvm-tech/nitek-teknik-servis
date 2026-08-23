// ================================
// NİTEK KOMBI ARIZA KODLARI
// ================================

const faultData = [

  // BAYMAK
  ["Baymak","Luna 24 Fi","E01","Ateşleme başarısız / alev oluşmuyor"],
  ["Baymak","Luna 24 Fi","E02","Aşırı ısınma emniyet termostatı"],
  ["Baymak","Luna 24 Fi","E10","Düşük su basıncı"],
  ["Baymak","Star Bridge Extra","E01","Ateşleme / alev algılama"],
  ["Baymak","Star Bridge Extra","E03","Aşırı ısınma"],
  ["Baymak","Duo Tec","E01","Ateşleme hatası"],
  ["Baymak","Duo Tec","E10","Su basıncı düşük"],

  // DEMİRDÖKÜM
  ["Demirdöküm","Nitron","F01","Aşırı ısınma"],
  ["Demirdöküm","Nitron","F04","Ateşleme / iyonizasyon hatası"],
  ["Demirdöküm","Nitron","F05","Fan / hava akışı problemi"],
  ["Demirdöküm","Neva","F01","Aşırı ısınma"],
  ["Demirdöküm","Neva","F04","Ateşleme / iyonizasyon"],
  ["Demirdöküm","Neva","F10","Su basıncı / sensör"],
  ["Demirdöküm","Atron","F04","Ateşleme / iyonizasyon"],

  // E.C.A.
  ["E.C.A.","Proteus Premix","E01","Ateşleme / alev oluşmuyor"],
  ["E.C.A.","Proteus Premix","E02","Aşırı ısınma"],
  ["E.C.A.","Proteus Premix","E04","Düşük su basıncı"],
  ["E.C.A.","Confeo Premix","E01","Ateşleme hatası"],
  ["E.C.A.","Confeo Premix","E04","Su basıncı düşük"],

  // VAILLANT
  ["Vaillant","ecoTEC","F22","Sistem su basıncı düşük"],
  ["Vaillant","ecoTEC","F23","Sıcaklık farkı / dolaşım problemi"],
  ["Vaillant","ecoTEC","F28","Ateşleme başarısız"],
  ["Vaillant","ecoTEC","F29","Alev kaybı"],
  ["Vaillant","ecoTEC","F75","Pompa / basınç sensörü problemi"],

  // BOSCH
  ["Bosch","Condens","EA","Alev algılanmıyor"],
  ["Bosch","Condens","E9","Aşırı ısınma"],
  ["Bosch","Condens","C1","Fan / hava akışı problemi"],

  // BUDERUS
  ["Buderus","Logamax Plus","EA","Alev oluşmuyor"],
  ["Buderus","Logamax Plus","E9","Aşırı ısınma"],
  ["Buderus","Logamax Plus","2F","Sıcaklık / sensör problemi"],

  // VIESSMANN
  ["Viessmann","Vitodens 100","F4","Alev oluşumu / iyonizasyon"],
  ["Viessmann","Vitodens 100","F2","Alev kaybı"],
  ["Viessmann","Vitodens 100","F3","Fan / hava akışı"],

  // ARISTON
  ["Ariston","Clas","501","Alev yok"],
  ["Ariston","Clas","108","Yetersiz su basıncı"],
  ["Ariston","Clas","101","Aşırı ısınma"],
  ["Ariston","Genus","501","Alev algılanmıyor"],

  // ALARKO
  ["Alarko","Serena","E01","Ateşleme / alev"],
  ["Alarko","Serena","E02","Aşırı ısınma"],
  ["Alarko","Serena","E03","Baca / fan problemi"],

  // PROTHERM
  ["Protherm","Lynx","F22","Düşük su basıncı"],
  ["Protherm","Lynx","F28","Ateşleme başarısız"],
  ["Protherm","Lynx","F29","Alev kaybı"],

  // FERROLI
  ["Ferroli","Divacondens","A01","Ateşleme başarısız"],
  ["Ferroli","Divacondens","F37","Düşük su basıncı"],
  ["Ferroli","Divacondens","F05","Fan / hava akışı"],

  // IMMERGAS
  ["Immergas","Eolo Star","01","Ateşleme başarısız"],
  ["Immergas","Eolo Star","10","Düşük sistem basıncı"],
  ["Immergas","Victrix","01","Ateşleme hatası"],

  // AIRFEL
  ["Airfel","Digifel Premix","E01","Ateşleme hatası"],
  ["Airfel","Digifel Premix","E03","Aşırı ısınma"],
  ["Airfel","Digifel Premix","E10","Düşük su basıncı"],

  // WARMHAUS
  ["Warmhaus","Enerwa","E01","Ateşleme hatası"],
  ["Warmhaus","Enerwa","E02","Aşırı ısınma"],
  ["Warmhaus","Enerwa","E03","Fan / baca problemi"],

  // ARÇELİK
  ["Arçelik","DGK","E01","Ateşleme hatası"],
  ["Arçelik","DGK","E02","Aşırı ısınma"],
  ["Arçelik","DGK","E10","Düşük su basıncı"],

  // BEKO
  ["Beko","BK","E01","Ateşleme hatası"],
  ["Beko","BK","E02","Aşırı ısınma"],
  ["Beko","BK","E10","Düşük su basıncı"],

  // BERETTA
  ["Beretta","Ciao","A01","Ateşleme hatası"],
  ["Beretta","Ciao","A02","Aşırı ısınma"],
  ["Beretta","Ciao","A06","Sıcak su sensörü"],

  // DAIKIN
  ["Daikin","NDJ","E1","Ateşleme hatası"],
  ["Daikin","NDJ","E7","Fan / hava akışı"],
  ["Daikin","NDJ","E8","Elektronik kart problemi"],

  // TERMODİNAMİK
  ["Termodinamik","DE","E01","Ateşleme hatası"],
  ["Termodinamik","DE","E02","Aşırı ısınma"],
  ["Termodinamik","DE","E10","Düşük su basıncı"],

  // TERMOTEKNİK
  ["Termoteknik","Logic","E01","Ateşleme hatası"],
  ["Termoteknik","Logic","E02","Aşırı ısınma"],
  ["Termoteknik","Logic","E10","Düşük su basıncı"],

  // COPA
  ["Copa","Econ","E01","Ateşleme hatası"],
  ["Copa","Econ","E02","Aşırı ısınma"],
  ["Copa","Econ","E10","Düşük su basıncı"]
];

function renderFaultModels(){

  const brand = $("faultBrand")?.value || "";
  const model = $("faultModel");

  if(!model) return;

  const models = [
    ...new Set(
      faultData
        .filter(x => !brand || x[0] === brand)
        .map(x => x[1])
    )
  ].sort();

  model.innerHTML =
    `<option value="">Tüm modeller</option>` +
    models.map(x =>
      `<option value="${esc(x)}">${esc(x)}</option>`
    ).join("");
}


function renderFaultCodes(){

  const brand = $("faultBrand")?.value || "";
  const model = $("faultModel")?.value || "";
  const search = ($("faultSearch")?.value || "")
    .toLocaleLowerCase("tr-TR");

  const list = faultData.filter(x => {

    const text = x.join(" ")
      .toLocaleLowerCase("tr-TR");

    return (
      (!brand || x[0] === brand) &&
      (!model || x[1] === model) &&
      (!search || text.includes(search))
    );

  });

  const box = $("faultList");

  if(!box) return;

  box.innerHTML = list.map(x => `
    <div class="card fault-item">

      <h3>🔥 ${esc(x[0])}</h3>

      <div>
        <b>Model:</b> ${esc(x[1])}
      </div>

      <div class="fault-code">
        <b>Arıza Kodu: ${esc(x[2])}</b>
      </div>

      <div>
        <b>Açıklama:</b> ${esc(x[3])}
      </div>

    </div>
  `).join("") ||
  `<div class="card">
     <b>Arıza kodu bulunamadı.</b>
   </div>`;
}


// Sayfa açıldığında listeyi hazırla
document.addEventListener("DOMContentLoaded", () => {

  renderFaultModels();
  renderFaultCodes();

});
