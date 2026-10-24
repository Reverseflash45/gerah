// Ambil data suhu Indonesia dari Climate Change Knowledge Portal (Bank Dunia), reanalisis ERA5 0,25°.
//
//   node data/skrip/ambil.mjs
//
// Keluaran src/data/suhu.json: deret tahunan beberapa indikator dan suhu rata-rata bulanan, 1950–2024,
// dirata-ratakan untuk wilayah Indonesia.
import { writeFileSync } from "node:fs";

const RENTANG = "1950-2024";
const URL = (v, waktu) =>
  `https://cckpapi.worldbank.org/cckp/v1/era5-x0.25_timeseries_${v}_timeseries_${waktu}_${RENTANG}_mean_historical_era5_x0.25_mean/IDN?_format=json`;

/** Indikator tahunan ERA5 yang dipakai. */
const INDIKATOR = {
  tas: "suhu rata-rata (°C)",
  tasmax: "rata-rata suhu maksimum harian (°C)",
  tasmin: "rata-rata suhu minimum harian (°C)",
  txx: "suhu maksimum harian tertinggi dalam setahun (°C)",
  hd30: "jumlah hari dengan suhu maksimum di atas 30 °C",
  hd35: "jumlah hari dengan suhu maksimum di atas 35 °C",
  tr: "jumlah malam tropis (suhu minimum di atas 20 °C)",
};

async function ambil(v, waktu) {
  const r = await fetch(URL(v, waktu));
  if (!r.ok) throw new Error(`${v} ${waktu}: ${r.status}`);
  const j = await r.json();
  const data = j.data?.IDN;
  if (!data || !Object.keys(data).length) throw new Error(`${v} ${waktu}: kosong`);
  return data;
}

const tahunan = {};
for (const v of Object.keys(INDIKATOR)) {
  const d = await ambil(v, "annual");
  // Kunci "1950-07" → 1950.
  tahunan[v] = Object.fromEntries(Object.entries(d).map(([k, x]) => [k.slice(0, 4), Math.round(x * 100) / 100]));
}
const bulanan = Object.fromEntries(Object.entries(await ambil("tas", "monthly")).map(([k, x]) => [k, Math.round(x * 100) / 100]));

const hasil = {
  sumber: "World Bank Climate Change Knowledge Portal, ERA5 0.25° (Copernicus Climate Change Service)",
  diunduh: new Date().toLocaleDateString("sv-SE"),
  indikator: INDIKATOR,
  tahunan,
  bulanan,
};
writeFileSync("src/data/suhu.json", JSON.stringify(hasil));
const tahun = Object.keys(tahunan.tas);
console.log(`${tahun[0]}–${tahun.at(-1)}, ${Object.keys(bulanan).length} bulan`);
