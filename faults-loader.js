// NİTEK marka dosyalarını doğru marka > model yapısında birleştirir.
(function(){
  const d=window.NITEK_FAULTS_DEMIRDOKUM;
  const b=window.NITEK_FAULTS_BOSCH;
  window.NITEK_FAULT_GUIDE={
    version:"brand-files-test-2.0",
    description:"Marka dosyaları ayrı yüklenir.",
    models:{
      ...(d?.models ? {"Demirdöküm":d.models} : {}),
      ...(b?.models ? {"Bosch":b.models} : {})
    }
  };
})();
