import "@fontsource-variable/sora";
import "@fontsource-variable/source-sans-3";
import "./gaya.css";
import { AKHIR, AWAL, BULAN, DIUNDUH, SUMBER, TAHUN, anomali, anomaliBulan, bertanda, desimal, nilai, rata, sejakLahir, trenPerDekade, urutTerpanas } from "./analisis";
import { gambarBatang, gambarGaris, gambarGarisKecil, gambarKalender } from "./vis";

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s)!;
const angka = (n: number) => Math.round(n).toLocaleString("id-ID");

/* ---------- pembuka ---------- */
function gambarPembuka() {
  const urut = urutTerpanas();
  const terpanas = urut[0];
  const sepuluh = urut.slice(0, 10);
  const sejak2015 = sepuluh.filter((t) => t >= 2015).length;
  $("[data-rentang]").textContent = `${AWAL}–${AKHIR}`;
  $("[data-judul]").textContent = `${terpanas}, tahun terpanas Indonesia${terpanas === AKHIR ? "" : ` sejak ${AWAL}`}.`;
  $("[data-lead]").textContent =
    `Setiap garis di atas adalah satu tahun, dari ${AWAL} sampai ${AKHIR}. Biru lebih sejuk dan merah lebih panas daripada rata-rata 1961–1990. ` +
    `Suhu rata-rata Indonesia pada ${terpanas} mencapai ${desimal(nilai("tas", terpanas), 2)}\u00a0°C.`;
  const kunci: [string, string][] = [
    [`${bertanda(anomali(terpanas))}\u00a0°C`, `${terpanas} dibanding rata-rata 1961–1990`],
    [`${bertanda(trenPerDekade(), 2)}\u00a0°C`, `tren per dekade sejak ${AWAL}`],
    [`${sejak2015} dari 10`, "tahun terpanas terjadi sejak 2015"],
    [`${angka(nilai("hd30", AKHIR))} hari`, `di atas 30\u00a0°C pada ${AKHIR}, dari ${angka(nilai("hd30", AWAL))} pada ${AWAL}`],
  ];
  $("[data-kunci]").innerHTML = kunci.map(([a, b]) => `<li><strong>${a}</strong><span>${b}</span></li>`).join("");
}

/* ---------- sejak kamu lahir ---------- */
const masukLahir = $<HTMLInputElement>("#tahun-lahir");
const hash = new URLSearchParams(location.hash.slice(1));
masukLahir.value = hash.get("lahir") ?? "2004";

function gambarLahir() {
  const t = Math.round(Number(masukLahir.value));
  if (!Number.isFinite(t) || t < 1900 || t > AKHIR) {
    $("[data-kalimat-lahir]").textContent = `Isi tahun antara 1900 dan ${AKHIR}.`;
    return;
  }
  history.replaceState(null, "", `#lahir=${t}`);
  const p = sejakLahir(t);
  const awal = `${p.rentangAwal[0]}–${p.rentangAwal[1]}`;
  const akhir = `${p.rentangAkhir[0]}–${p.rentangAkhir[1]}`;
  $("[data-kalimat-lahir]").innerHTML = p.terlaluBaru
    ? `Kamu lahir tahun ${t}, terlalu dekat dengan tahun-tahun terakhir untuk dibandingkan. Tapi orang tuamu mungkin lahir sekitar ${t - 30}: sejak itu Indonesia <strong>${bertanda(sejakLahir(t - 30).selisih)}\u00a0°C</strong> lebih panas.`
    : t < AWAL
      ? `Data dimulai ${AWAL}. Dibanding ${awal}, lima tahun terakhir (${akhir}) <strong>${bertanda(p.selisih)}\u00a0°C</strong> lebih panas, dan kamu lahir sebelum itu.`
      : `Sejak kamu lahir tahun ${t}, rata-rata suhu Indonesia naik <strong>${bertanda(p.selisih)}\u00a0°C</strong>: dari ${desimal(p.suhuAwal, 2)}\u00a0°C (rata-rata ${awal}) menjadi ${desimal(p.suhuAkhir, 2)}\u00a0°C (${akhir}).`;
  const ubin: [string, string, string][] = [
    ["Suhu rata-rata", `${desimal(p.suhuAwal, 2)} → ${desimal(p.suhuAkhir, 2)}\u00a0°C`, `${awal} lawan ${akhir}`],
    ["Hari di atas 30\u00a0°C", `${angka(p.hariPanasAwal)} → ${angka(p.hariPanasAkhir)}`, `${bertanda(p.hariPanasAkhir - p.hariPanasAwal, 0)} hari setahun`],
    ["Malam tropis", `${angka(p.malamTropisAwal)} → ${angka(p.malamTropisAkhir)}`, `${bertanda(p.malamTropisAkhir - p.malamTropisAwal, 0)} malam setahun`],
  ];
  $("[data-ubin-lahir]").innerHTML = ubin.map(([a, b, c]) => `<li><span class="label">${a}</span><strong>${b}</strong><span>${c}</span></li>`).join("");
  gambarGaris($("#garis-lahir"), t, 64);
  $("#garis-lahir").setAttribute("aria-label", `Garis hangat ${AWAL}–${AKHIR} dengan tahun ${t} disorot.`);
}
masukLahir.addEventListener("input", gambarLahir);
$("#isian-lahir").addEventListener("submit", (e) => e.preventDefault());

/* ---------- teks bagian ---------- */
function gambarTeks() {
  const sejuk = TAHUN.filter((t) => t > 1990 && anomali(t) < 0);
  $("[data-pengantar-tahun]").textContent =
    `Trennya ${bertanda(trenPerDekade(), 2)}\u00a0°C per dekade. Dari ${AKHIR - 1990} tahun sejak 1991, ` +
    (sejuk.length ? `hanya ${sejuk.length} yang lebih sejuk dari rata-rata 1961–1990 (${sejuk.join(", ")}).` : "tidak ada satu pun yang lebih sejuk dari rata-rata 1961–1990.");
  let terpanas = { t: AWAL, b: 1, a: -Infinity };
  let total = 0;
  let panas = 0;
  for (const t of TAHUN)
    for (let b = 1; b <= 12; b++) {
      const a = anomaliBulan(t, b);
      if (a == null) continue;
      if (a > terpanas.a) terpanas = { t, b, a };
      if (t >= 2015) {
        total++;
        if (a > 0) panas++;
      }
    }
  $("[data-pengantar-bulan]").textContent =
    `Tiap kotak satu bulan, dibandingkan dengan bulan yang sama pada 1961–1990 sehingga musim hujan dan kemarau tidak ikut terhitung. ` +
    `Sejak 2015, ${panas} dari ${total} bulan lebih panas dari biasanya. Bulan dengan selisih terbesar: ${BULAN[terpanas.b - 1]} ${terpanas.t}, ${bertanda(terpanas.a)}\u00a0°C.`;
}

/* ---------- gambar ---------- */
function gambarSemua() {
  gambarGaris($("#garis-utama"));
  gambarLahir();
  gambarBatang($("#grafik-batang"));
  gambarKalender($("#kalender"));
  gambarGarisKecil($("#grafik-hari"), "hd30", "Hari di atas 30\u00a0°C");
  gambarGarisKecil($("#grafik-malam"), "tr", "Malam tropis");
}

let lebarTerakhir = 0;
new ResizeObserver(([e]) => {
  const w = Math.round(e.contentRect.width);
  if (!lebarTerakhir) {
    lebarTerakhir = w;
    return;
  }
  if (w === lebarTerakhir) return;
  lebarTerakhir = w;
  gambarSemua();
}).observe(document.body);

$("[data-sumber]").textContent = `Data: ${SUMBER.replace("0.25", "0,25")}, diunduh ${new Date(`${DIUNDUH}T12:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}. Rata-rata ${AWAL}–${AKHIR}: ${desimal(rata("tas", AWAL, AKHIR), 2)}\u00a0°C.`;
gambarPembuka();
gambarTeks();
gambarSemua();
