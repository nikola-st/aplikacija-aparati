const aparati = [
  { id: "egt1", imaUlazIzlaz: true },
  { id: "egt2", imaUlazIzlaz: true },
  { id: "imp3", imaUlazIzlaz: false },
  { id: "imp4", imaUlazIzlaz: false },
  { id: "imp5", imaUlazIzlaz: false },
];

const prethodnoStanjeInput = document.getElementById("prethodnoStanje");
const novoStanjeSpan = document.getElementById("novoStanje");
const ukupnoSpan = document.getElementById("ukupno");
const mesecnoStanjeSpan = document.getElementById("mesecnoStanje");
const radnikInput = document.getElementById("radnik");
const lokalInput = document.getElementById("lokal");
const datumInput = document.getElementById("datum");
const smenaInput = document.getElementById("smena");
const resetujBtn = document.getElementById("resetujBtn");
const aparatiTabela = document.getElementById("aparatiTabela");


function formatBroj(vrednost) {
  return Number(vrednost || 0).toLocaleString("sr-RS");
}

function sacuvajPodatke() {
  // Ne pamtimo smenu
  const podaci = {
    radnik: radnikInput.value,
    lokal: lokalInput.value,
    datum: datumInput.value,
    prethodnoStanje: prethodnoStanjeInput.value !== "" ? Number(prethodnoStanjeInput.value) : (JSON.parse(localStorage.getItem("podaci"))?.prethodnoStanje || 0),
    aparati: {},
    mesecnoStanje: Number(localStorage.getItem("mesecnoStanje")) || 0,
  };

  aparati.forEach(({ id }) => {
    const ulaz = document.getElementById(`${id}_ulaz`);
    const izlaz = document.getElementById(`${id}_izlaz`);
    const stanje = document.getElementById(`${id}_stanje`);
    podaci.aparati[id] = {
      ulaz: Number(ulaz?.value) || 0,
      izlaz: Number(izlaz?.value) || 0,
      stanje: Number(stanje?.value) || 0,
    };
  });
  
  localStorage.setItem("podaci", JSON.stringify(podaci));
}

function ucitajPodatke() {
  const podaci = JSON.parse(localStorage.getItem("podaci")) || {};
  //radnikInput.value = podaci.radnik || ""; //ne pamtimo radnika
  lokalInput.value = podaci.lokal || "";

  prethodnoStanjeInput.value = podaci.prethodnoStanje !== undefined ? podaci.prethodnoStanje : "";

  aparati.forEach(({ id }) => {
    const ulaz = document.getElementById(`${id}_ulaz`);
    const izlaz = document.getElementById(`${id}_izlaz`);
    const stanje = document.getElementById(`${id}_stanje`);
    const p = podaci.aparati?.[id] || {};
    if (ulaz) ulaz.value = p.ulaz || "";
    if (izlaz) izlaz.value = p.izlaz || "";
    if (stanje) stanje.value = p.stanje || "";
  });

  const mesecnoStanje = Number(podaci.mesecnoStanje || 0);
  mesecnoStanjeSpan.textContent = formatBroj(mesecnoStanje);
}

function resetujPrethodnoStanjeAkoJePonedeljak() {
  const danas = new Date();
  if (danas.getDay() === 1) { // ponedeljak je 1
    // Resetuj samo ako prethodno stanje nije postavljeno ili je 0
    if (!prethodnoStanjeInput.value || Number(prethodnoStanjeInput.value) === 0) {
      prethodnoStanjeInput.value = 0;
      sacuvajPodatke();
    }
  }
}

let poslednjiUkupno = 0; // Za pamćenje poslednjeg ukupnog da ne duplira mesečno stanje

function izracunajStanje() {
  let novoStanje = 0;

  aparati.forEach(({ id, imaUlazIzlaz }) => {
    const ulaz = document.getElementById(`${id}_ulaz`);
    const izlaz = document.getElementById(`${id}_izlaz`);
    const stanje = document.getElementById(`${id}_stanje`);

    if (imaUlazIzlaz) {
      const u = Number(ulaz.value) || 0;
      const i = Number(izlaz.value) || 0;
      const rez = u - i;
      stanje.value = rez;
      novoStanje += rez;
    } else {
      const s = Number(stanje.value) || 0;
      novoStanje += s;
    }
  });

  const prethodnoStanje = Number(prethodnoStanjeInput.value) || 0;
  const ukupno = novoStanje - prethodnoStanje;

  novoStanjeSpan.textContent = formatBroj(novoStanje);
  ukupnoSpan.textContent = formatBroj(ukupno);

  // Mesečno stanje se ažurira samo ako se ukupno promeni
  let mesecnoStanje = Number(localStorage.getItem("mesecnoStanje")) || 0;
  if (ukupno !== poslednjiUkupno) {
    mesecnoStanje += ukupno - poslednjiUkupno;
    poslednjiUkupno = ukupno;
    mesecnoStanjeSpan.textContent = formatBroj(mesecnoStanje);
    localStorage.setItem("mesecnoStanje", mesecnoStanje);
  }

  sacuvajPodatke();
}

function napraviRedoveAparata() {
  aparatiTabela.innerHTML = ""; // obriši ako već nešto ima

  aparati.forEach(({ id, imaUlazIzlaz }) => {
    const tr = document.createElement("tr");

    // prvi td sa labelom
    const tdNaziv = document.createElement("td");
    const label = document.createElement("label");
    label.htmlFor = imaUlazIzlaz ? `${id}_ulaz` : `${id}_stanje`;
    label.textContent = id.toUpperCase();
    tdNaziv.appendChild(label);

    // td za ulaz
    const tdUlaz = document.createElement("td");
    const ulazInput = document.createElement("input");
    ulazInput.type = "number";
    ulazInput.className = "form-control";
    ulazInput.id = `${id}_ulaz`;
    ulazInput.placeholder = imaUlazIzlaz ? `Unesite ulaz za ${id.toUpperCase()}` : `Ulaz ${id.toUpperCase()}`;
    ulazInput.title = `Ulaz za ${id.toUpperCase()}`;
    ulazInput.setAttribute("aria-label", `Ulaz za ${id.toUpperCase()}`);
    if (!imaUlazIzlaz) ulazInput.disabled = true;
    tdUlaz.appendChild(ulazInput);

    // td za izlaz
    const tdIzlaz = document.createElement("td");
    const izlazInput = document.createElement("input");
    izlazInput.type = "number";
    izlazInput.className = "form-control";
    izlazInput.id = `${id}_izlaz`;
    izlazInput.placeholder = imaUlazIzlaz ? `Unesite izlaz za ${id.toUpperCase()}` : `Izlaz ${id.toUpperCase()}`;
    izlazInput.title = `Izlaz za ${id.toUpperCase()}`;
    izlazInput.setAttribute("aria-label", `Izlaz za ${id.toUpperCase()}`);
    if (!imaUlazIzlaz) izlazInput.disabled = true;
    tdIzlaz.appendChild(izlazInput);

    // td za stanje
    const tdStanje = document.createElement("td");
    const stanjeInput = document.createElement("input");
    stanjeInput.type = "number";
    stanjeInput.className = "form-control";
    stanjeInput.id = `${id}_stanje`;
    stanjeInput.placeholder = imaUlazIzlaz ? `Stanje ${id.toUpperCase()}` : `Unesite stanje za ${id.toUpperCase()}`;
    stanjeInput.title = `Stanje ${id.toUpperCase()}`;
    stanjeInput.setAttribute("aria-label", `Stanje ${id.toUpperCase()}`);
    if (imaUlazIzlaz) stanjeInput.disabled = true;
    tdStanje.appendChild(stanjeInput);

    tr.appendChild(tdNaziv);
    tr.appendChild(tdUlaz);
    tr.appendChild(tdIzlaz);
    tr.appendChild(tdStanje);

    aparatiTabela.appendChild(tr);
  });
}

function stampaj() {
  function formatBroj(vrednost) {
    const num = Number(vrednost);
    return isNaN(num) ? "-" : num.toLocaleString("sr-RS");
  }

  const datum = datumInput.value || "-";
  const radnik = radnikInput.value || "-";
  const lokal = lokalInput.value || "-";
  const smena = smenaInput.value || "-";
  const prethodno = prethodnoStanjeInput.value || "-";
  const novo = novoStanjeSpan.textContent.trim() || "-";
  const ukupno = ukupnoSpan.textContent.trim() || "-";
  const mesecno = mesecnoStanjeSpan.textContent.trim() || "-";
  
  document.getElementById("radnikPrint").textContent = radnik;
  document.getElementById("lokalPrint").textContent = lokal;
  document.getElementById("smenaPrint").textContent = smena;
  document.getElementById("prethodnoStanjePrint").textContent = formatBroj(prethodno);
  document.getElementById("novoStanjePrint").textContent = novo;
  document.getElementById("ukupnoPrint").textContent = formatBroj(ukupno);
  //document.getElementById("mesecnoStanjePrint").textContent = formatBroj(mesecno); // ne štampamo mesečno stanje
  //document.getElementById("printDatum").textContent = new Date().toLocaleDateString("sr-RS"); // ne štampamo datum štampe, samo datum unosa
  //document.getElementById("datumPrint").textContent = datum.toLocaleString("sr-RS"); // ne konvertuje u lokalni format
  try {
    const datumObj = new Date(datum);
    document.getElementById("datumPrint").textContent = datumObj.toLocaleDateString("sr-RS");
   } catch {
     document.getElementById("datumPrint").textContent = datum;
   }

  const tbody = document.getElementById("printTabela");
  tbody.innerHTML = "";
  aparati.forEach(({ id }) => {
    const ulaz = formatBroj(document.getElementById(id + "_ulaz")?.value);
    const izlaz = formatBroj(document.getElementById(id + "_izlaz")?.value);
    const stanje = formatBroj(document.getElementById(id + "_stanje")?.value);
    
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${id.toUpperCase()}</td><td>${ulaz}</td><td>${izlaz}</td><td>${stanje}</td>`;
    tbody.appendChild(tr);
  });

  window.print();
}

function ocistiMemoriju() {
  if (
    confirm(
      "Da li ste sigurni da želite da očistite memoriju? Ova akcija će obrisati sve sačuvane podatke."
    )
  ) {
    localStorage.removeItem("podaci");
    localStorage.removeItem("mesecnoStanje");
    novoStanjeSpan.textContent = formatBroj(0);
    ukupnoSpan.textContent = formatBroj(0);
    mesecnoStanjeSpan.textContent = formatBroj(0);
    prethodnoStanjeInput.value = 0;
    radnikInput.value = "";
    lokalInput.value = "";
    smenaInput.value = "";
    // Datum se uvek postavlja na današnji, pa ga ne brišemo

    // Očisti polja aparata
    aparati.forEach(({ id }) => {
      const ulaz = document.getElementById(`${id}_ulaz`);
      const izlaz = document.getElementById(`${id}_izlaz`);
      const stanje = document.getElementById(`${id}_stanje`);
      if (ulaz) ulaz.value = "";
      if (izlaz) izlaz.value = "";
      if (stanje) stanje.value = "";
    });

    alert("Memorija je očišćena.");
  }
}

document
  .getElementById("izracunajBtn")
  .addEventListener("click", izracunajStanje);
resetujBtn.addEventListener("click", ocistiMemoriju);

window.addEventListener("load", () => {
  napraviRedoveAparata();
  ucitajPodatke(); // prvo učitaj sve sa localStorage
  resetujPrethodnoStanjeAkoJePonedeljak(); // onda resetuj ako treba (sada samo ako nema vrednosti)

  // Postavi datum ako je polje prazno
  if (!datumInput.value) {
    const danas = new Date();
    const yyyy = danas.getFullYear();
    const mm = String(danas.getMonth() + 1).padStart(2, "0");
    const dd = String(danas.getDate()).padStart(2, "0");
    datumInput.value = `${yyyy}-${mm}-${dd}`;
  }
});