const aparati = ["EGT1", "EGT2", "IMP3", "IMP4", "IMP5"];
let podaci = JSON.parse(localStorage.getItem("dailyReports")) || [];

// Postavi današnji datum i učitaj podatke pri učitavanju stranice
window.onload = () => {
  const danas = new Date().toISOString().split("T")[0];
  const reportDate = document.getElementById("reportDate");
  if (!reportDate.value) reportDate.value = danas;

  proveriResetPon(); // Resetuje prethodno stanje ako je ponedeljak

  ucitajTabelu();
  prikaziStanja();
  resetujMesecnoStanje(); // Resetuje mesečno stanje ako je prvi dan u mesecu
};

// Učitaj tabelu sa prethodnim izlazima kao ulazi i praznim izlazima
function ucitajTabelu() {
  const tbody = document.getElementById("machineTableBody");
  tbody.innerHTML = "";

  aparati.forEach((aparat) => {
    const poslednjiIzlaz = dohvatiPoslednjiIzlaz(aparat);
    const red = document.createElement("tr");

    red.innerHTML = `
      <td>${aparat}</td>
      <td><input type="number" id="entry-${aparat}" class="form-control" value="${poslednjiIzlaz}" /></td>
      <td><input type="number" id="exit-${aparat}" class="form-control" /></td>
      <td id="state-${aparat}" class="text-center">-</td>
    `;

    tbody.appendChild(red);
  });
}

// Dohvati poslednji izlaz za dati aparat iz istorije
function dohvatiPoslednjiIzlaz(aparat) {
  for (let i = podaci.length - 1; i >= 0; i--) {
    const entry = podaci[i].entries.find((e) => e.machine === aparat);
    if (entry) return entry.exit || 0;
  }
  return 0;
}

// Prikaži prethodno stanje na ekranu (sabiraj ulaze iz poslednjeg izveštaja)
function prikaziStanja() {
  if (podaci.length === 0) {
    document.getElementById("prethodnoStanje").textContent = "0.00";
    document.getElementById("novoStanje").textContent = "0.00";
    document.getElementById("totalRazlika").textContent = "0.00";
    document.getElementById("mesecnoStanje").textContent = "0.00";
    return;
  }

  // Uzmi poslednji izveštaj
  const poslednji = podaci[podaci.length - 1];
  document.getElementById("prethodnoStanje").textContent =
    poslednji.previous.toFixed(2);
  document.getElementById("novoStanje").textContent =
    poslednji.current.toFixed(2);
  document.getElementById("totalRazlika").textContent =
    poslednji.total.toFixed(2);

  // Izračunaj mesečno stanje
  const poslednjiPonedeljak = dohvatiPoslednjiPonedeljak();
  const mesecniIzvestaji = podaci.filter(
    (r) => new Date(r.date) >= poslednjiPonedeljak
  );
  const mesecno = mesecniIzvestaji.reduce((sum, r) => sum + r.total, 0);
  document.getElementById("mesecnoStanje").textContent = mesecno.toFixed(2);
}

// Izračunaj stanje, sačuvaj izveštaj i prikaži rezultate
function izracunaj() {
  const date = document.getElementById("reportDate").value;
  const shift = document.getElementById("shift").value.trim();
  const worker = document.getElementById("worker").value.trim();

  if (!date || !shift || !worker) {
    alert("Molimo popunite datum, smenu i ime radnika.");
    return;
  }

  let prethodno = 0;
  let novo = 0;

  const izvestaj = {
    date,
    shift,
    worker,
    entries: [],
    previous: 0,
    current: 0,
    total: 0,
  };

  aparati.forEach((aparat) => {
    const ulaz =
      parseFloat(document.getElementById(`entry-${aparat}`).value) || 0;
    const izlaz =
      parseFloat(document.getElementById(`exit-${aparat}`).value) || 0;
    const stanje = ulaz - izlaz;

    // Prikaz stanja u tabeli
    document.getElementById(`state-${aparat}`).textContent = stanje.toFixed(2);

    prethodno += ulaz;
    novo += izlaz;

    izvestaj.entries.push({
      machine: aparat,
      entry: ulaz,
      exit: izlaz,
      total: stanje,
    });
  });

  izvestaj.previous = prethodno;
  izvestaj.current = novo;
  izvestaj.total = novo - prethodno;

  // Prikaži stanja na ekranu
  document.getElementById("prethodnoStanje").textContent = prethodno.toFixed(2);
  document.getElementById("novoStanje").textContent = novo.toFixed(2);
  document.getElementById("totalRazlika").textContent = (
    novo - prethodno
  ).toFixed(2);

  // Izračunaj mesečno stanje od poslednjeg ponedeljka
  const poslednjiPonedeljak = dohvatiPoslednjiPonedeljak();
  const mesecniIzvestaji = podaci.filter(
    (r) => new Date(r.date) >= poslednjiPonedeljak
  );
  const mesecno =
    mesecniIzvestaji.reduce((sum, r) => sum + r.total, 0) + izvestaj.total;
  document.getElementById("mesecnoStanje").textContent = mesecno.toFixed(2);

  // Sačuvaj izveštaj
  podaci.push(izvestaj);
  localStorage.setItem("dailyReports", JSON.stringify(podaci));

  // Pripremi za štampu
  pripremiZaStampu(izvestaj);

  // Očisti ulazna polja za izlaz (izlaz ostaje prazan za novi unos)
  aparati.forEach((aparat) => {
    document.getElementById(`exit-${aparat}`).value = "";
  });
}

// Pripremi podatke za štampu
function pripremiZaStampu(izvestaj) {
  document.getElementById("printDate").textContent = new Date().toLocaleDateString();
  document.getElementById("reportDatePrint").textContent = izvestaj.date;
  document.getElementById("shiftPrint").textContent = izvestaj.shift;
  document.getElementById("workerPrint").textContent = izvestaj.worker;
  document.getElementById("prethodnoStanjePrint").textContent = izvestaj.previous.toFixed(2);
  document.getElementById("novoStanjePrint").textContent = izvestaj.current.toFixed(2);
  document.getElementById("totalRazlikaPrint").textContent = izvestaj.total.toFixed(2);

  popuniPrintTabelu(izvestaj);
}

// Popuni tabelu u print sekciji
function popuniPrintTabelu(izvestaj) {
  const tbody = document.getElementById("printTableBody");
  tbody.innerHTML = "";

  izvestaj.entries.forEach((e) => {
    const red = document.createElement("tr");
    red.innerHTML = `
      <td>${e.machine}</td>
      <td>${e.entry.toFixed(2)}</td>
      <td>${e.exit.toFixed(2)}</td>
      <td>${e.total.toFixed(2)}</td>
    `;
    tbody.appendChild(red);
  });
}

// Dobij poslednji ponedeljak u odnosu na danas
function dohvatiPoslednjiPonedeljak() {
  const danas = new Date();
  const dan = danas.getDay();
  const razlika = dan === 0 ? 6 : dan - 1; // Ponedeljak je 1, nedelja 0
  danas.setDate(danas.getDate() - razlika);
  danas.setHours(0, 0, 0, 0);
  return danas;
}

// Resetuj prethodno stanje na 0 ako je ponedeljak i učitaj prazan prethodni unos
function proveriResetPon() {
  const danas = new Date();
  if (danas.getDay() === 1) {
    // ponedeljak
    // Resetuj prethodno stanje na 0 tako što brišeš stare izveštaje
    podaci = podaci.filter(
      (r) => new Date(r.date) >= dohvatiPoslednjiPonedeljak()
    ); // izbriši starije od ponedeljka
    localStorage.setItem("dailyReports", JSON.stringify(podaci));
    
    // Ažuriraj prikaz stanja nakon resetovanja
    document.getElementById("prethodnoStanje").textContent = "0.00";
    document.getElementById("novoStanje").textContent = "0.00";
    document.getElementById("totalRazlika").textContent = "0.00";

    // Učitaj tabelu ponovo, sa ulazom 0 jer je reset
    ucitajTabelu();
  }
}

// Štampaj izveštaj
function stampaj() {
  window.print();
}

// Pomoćna funkcija za dodavanje bordera i automatsko podešavanje širine kolona
function formatirajSheet(ws, data) {
  const colWidths = [];

  for (let R = 0; R < data.length; ++R) {
    for (let C = 0; C < data[R].length; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      const cell_value = data[R][C];
      if (!ws[cell_address]) continue;

      // Dodaj bordere
      ws[cell_address].s = {
        border: {
          top: { style: "thin", color: { auto: 1 } },
          bottom: { style: "thin", color: { auto: 1 } },
          left: { style: "thin", color: { auto: 1 } },
          right: { style: "thin", color: { auto: 1 } },
        },
      };

      // Izračunaj širinu teksta za kolonu (minimum 10)
      const length = cell_value ? cell_value.toString().length : 10;
      colWidths[C] = Math.max(colWidths[C] || 10, length + 2);
    }
  }

  // Postavi širine kolona u sheet
  ws['!cols'] = colWidths.map(w => ({ wch: w }));
}

// Eksport poslednjeg izveštaja u Excel sa formatiranjem
function eksportujPoslednji() {
  if (!podaci.length) {
    alert("Nema sačuvanih izveštaja za eksport.");
    return;
  }

  const poslednji = podaci[podaci.length - 1];
  const podaciZaSheet = [
    ["Datum", poslednji.date],
    ["Smena", poslednji.shift],
    ["Radnik", poslednji.worker],
    [],
    ["Aparat", "Ulaz", "Izlaz", "Stanje"],
    ...poslednji.entries.map((e) => [e.machine, e.entry, e.exit, e.total]),
    [],
    ["Prethodno stanje", poslednji.previous],
    ["Novo stanje", poslednji.current],
    ["Ukupno", poslednji.total],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(podaciZaSheet);

  formatirajSheet(ws, podaciZaSheet);

  XLSX.utils.book_append_sheet(wb, ws, "Izveštaj");
  XLSX.writeFile(wb, `izvestaj_${poslednji.date}.xlsx`);
}

// Eksport cele istorije u Excel sa formatiranjem
function eksportujSve() {
  if (!podaci.length) {
    alert("Nema sačuvanih izveštaja za eksport.");
    return;
  }

  const podaciZaSheet = [];
  podaci.forEach((report) => {
    podaciZaSheet.push(["Datum", report.date]);
    podaciZaSheet.push(["Smena", report.shift]);
    podaciZaSheet.push(["Radnik", report.worker]);
    podaciZaSheet.push([]);
    podaciZaSheet.push(["Aparat", "Ulaz", "Izlaz", "Stanje"]);
    report.entries.forEach((e) => {
      podaciZaSheet.push([e.machine, e.entry, e.exit, e.total]);
    });
    podaciZaSheet.push([]);
    podaciZaSheet.push(["Prethodno stanje", report.previous]);
    podaciZaSheet.push(["Novo stanje", report.current]);
    podaciZaSheet.push(["Ukupno", report.total]);
    podaciZaSheet.push([]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(podaciZaSheet);

  formatirajSheet(ws, podaciZaSheet);

  XLSX.utils.book_append_sheet(wb, ws, "Svi izveštaji");
  XLSX.writeFile(
    wb,
    `izvestaji_${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

function resetujMesecnoStanje() {
  const danas = new Date();
  if (danas.getDate() === 1) {
    localStorage.setItem("mesecnoStanje", "0");
  }
}

function ocistiMemoriju() {
  if (confirm("Da li ste sigurni da želite da očistite memoriju? Ova akcija će obrisati sve sačuvane izveštaje.")) {
    localStorage.removeItem("dailyReports");
    podaci = [];
    ucitajTabelu();
    prikaziStanja();
    alert("Memorija je očišćena.");
  }
}