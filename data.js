window.NITEK_DATA = {
  faults: [
    ["E01","Ateşleme / alev oluşmuyor","Gaz beslemesi, ateşleme ve iyonizasyon sistemi kontrol edilir."],
    ["E02","Aşırı ısınma","Pompa, su dolaşımı, filtre ve sıcaklık sensörleri kontrol edilir."],
    ["E03","Baca / hava akışı","Fan, baca hattı ve hava basınç sistemi kontrol edilir."],
    ["E04","İyonizasyon / alev sinyali","İyonizasyon elektrodu ve topraklama kontrol edilir."],
    ["E05","Kalorifer sıcaklık sensörü","Kalorifer NTC ve bağlantısı kontrol edilir."],
    ["E06","Kullanım suyu sensörü","Kullanım suyu NTC ve bağlantısı kontrol edilir."],
    ["E10","Düşük su basıncı","Tesisat basıncı ve olası kaçaklar kontrol edilir."],
    ["E25","Pompa / sirkülasyon","Pompa, hava ve tesisat akışı kontrol edilir."],
    ["F28","Ateşleme başarısız","Gaz, ateşleme ve iyonizasyon sistemi kontrol edilir."],
    ["F29","Çalışma sırasında alev kesilmesi","Gaz, baca ve iyonizasyon kontrol edilir."]
  ],

  brands: {
    "Kombi": {
      "Demirdöküm":["Neva","Nitron","Atron","Nitromix"],
      "Baymak":["Luna","Duo Tec","Star Bridge Extra"],
      "E.C.A.":["Proteus Premix","Confeo Premix"],
      "Vaillant":["ecoTEC"],
      "Bosch":["Condens"],
      "Buderus":["Logamax Plus"],
      "Viessmann":["Vitodens 100"],
      "Ariston":["Clas","Genus"],
      "Alarko":["Serena"],
      "Protherm":["Lynx"],
      "Ferroli":["Divacondens"],
      "Immergas":["Eolo Star","Victrix"],
      "Airfel":["Digifel Premix"],
      "Warmhaus":["Enerwa"]
    },
    "Klima": {
      "Daikin":["FTXF"],
      "Mitsubishi Electric":["MSZ"],
      "Mitsubishi Heavy":["SRK"],
      "Arçelik":["12325"],
      "Beko":["31225"],
      "Vestel":["Flora"],
      "Samsung":["WindFree"],
      "LG":["DualCool"]
    },
    "Şofben": {
      "Demirdöküm":["Atron"],
      "Baymak":["BT"],
      "E.C.A.":["SH"],
      "Ariston":["Fast"]
    },
    "Diğer": {}
  },

  maintenance: {
    "Kombi":[
      "Cihaz genel kontrolü","Baca kontrolü","Baca bağlantısı kontrolü",
      "Baca gazı / yanma kontrolü","Brülör kontrolü","Eşanjör kontrolü / temizliği",
      "Fan kontrolü","Pompa kontrolü","Genleşme tankı kontrolü",
      "Su basıncı kontrolü","Gaz bağlantıları kontrolü","Kalorifer filtresi kontrolü",
      "Sıcak su testi","Kalorifer testi","Sızdırmazlık kontrolü","Son çalışma testi"
    ],
    "Klima":[
      "Filtre temizliği","Evaporatör kontrolü","Kondenser kontrolü",
      "Fan kontrolü","Drenaj kontrolü","Elektrik bağlantıları kontrolü",
      "Gaz / basınç kontrolü","Kumanda testi","Soğutma / ısıtma testi"
    ],
    "Şofben":[
      "Genel cihaz kontrolü","Baca kontrolü","Gaz bağlantısı kontrolü",
      "Su akışı kontrolü","Yanma kontrolü","Sıcaklık kontrolü",
      "Sızdırmazlık kontrolü","Çalışma testi"
    ],
    "Diğer":[
      "Genel kontrol","Elektrik kontrolü","Çalışma testi","Sızdırmazlık kontrolü"
    ]
  }
};