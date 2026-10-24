import data from "./data/suhu.json";

export type Indikator = keyof typeof data.tahunan;
export const SUMBER = data.sumber;
export const DIUNDUH = data.diunduh;

export const TAHUN: number[] = Object.keys(data.tahunan.tas).map(Number).sort((a, b) => a - b);
export const AWAL = TAHUN[0];
export const AKHIR = TAHUN[TAHUN.length - 1];

/** Periode acuan iklim WMO yang lazim dipakai untuk anomali. */
export const ACUAN: [number, number] = [1961, 1990];

export const nilai = (ind: Indikator, tahun: number): number => (data.tahunan[ind] as Record<string, number>)[String(tahun)];

/** Rata-rata sebuah indikator pada rentang tahun (inklusif), dipotong ke rentang data. */
export function rata(ind: Indikator, dari: number, sampai: number): number {
  const ys = TAHUN.filter((y) => y >= dari && y <= sampai);
  return ys.reduce((a, y) => a + nilai(ind, y), 0) / ys.length;
}

const dasar = rata("tas", ...ACUAN);
/** Anomali suhu rata-rata tahunan terhadap 1961–1990. */
export const anomali = (tahun: number) => nilai("tas", tahun) - dasar;

/** Kemiringan tren kuadrat terkecil, dalam satuan per dekade. */
export function trenPerDekade(ind: Indikator = "tas", dari = AWAL, sampai = AKHIR): number {
  const xs = TAHUN.filter((y) => y >= dari && y <= sampai);
  const ys = xs.map((y) => nilai(ind, y));
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let atas = 0;
  let bawah = 0;
  xs.forEach((x, i) => {
    atas += (x - mx) * (ys[i] - my);
    bawah += (x - mx) ** 2;
  });
  return (atas / bawah) * 10;
}

/** Tahun diurutkan dari yang terpanas. */
export const urutTerpanas = () => [...TAHUN].sort((a, b) => nilai("tas", b) - nilai("tas", a));
export const peringkat = (tahun: number) => urutTerpanas().indexOf(tahun) + 1;

/* ---------- bulanan ---------- */
export const nilaiBulan = (tahun: number, bulan: number): number | null => (data.bulanan as Record<string, number>)[`${tahun}-${String(bulan).padStart(2, "0")}`] ?? null;

const dasarBulan = Array.from({ length: 12 }, (_, i) => {
  const xs = TAHUN.filter((y) => y >= ACUAN[0] && y <= ACUAN[1]).map((y) => nilaiBulan(y, i + 1)!);
  return xs.reduce((a, b) => a + b, 0) / xs.length;
});
/** Anomali satu bulan terhadap rata-rata bulan yang sama pada 1961–1990 (musim sudah dikeluarkan). */
export const anomaliBulan = (tahun: number, bulan: number) => {
  const v = nilaiBulan(tahun, bulan);
  return v == null ? null : v - dasarBulan[bulan - 1];
};

/* ---------- sejak kamu lahir ---------- */
export type Perbandingan = {
  tahunLahir: number;
  rentangAwal: [number, number];
  rentangAkhir: [number, number];
  suhuAwal: number;
  suhuAkhir: number;
  selisih: number;
  hariPanasAwal: number;
  hariPanasAkhir: number;
  malamTropisAwal: number;
  malamTropisAkhir: number;
  terlaluBaru: boolean;
};

/**
 * Membandingkan lima tahun di sekitar tahun lahir dengan lima tahun terakhir. Rata-rata lima tahun meredam
 * naik-turun dari tahun ke tahun (misalnya El Niño) supaya selisihnya tidak bergantung pada satu tahun kebetulan.
 */
export function sejakLahir(tahunLahir: number): Perbandingan {
  const tengah = Math.min(Math.max(tahunLahir, AWAL + 2), AKHIR - 2);
  const rentangAwal: [number, number] = [tengah - 2, tengah + 2];
  const rentangAkhir: [number, number] = [AKHIR - 4, AKHIR];
  const r = (ind: Indikator, [a, b]: [number, number]) => rata(ind, a, b);
  return {
    tahunLahir,
    rentangAwal,
    rentangAkhir,
    suhuAwal: r("tas", rentangAwal),
    suhuAkhir: r("tas", rentangAkhir),
    selisih: r("tas", rentangAkhir) - r("tas", rentangAwal),
    hariPanasAwal: r("hd30", rentangAwal),
    hariPanasAkhir: r("hd30", rentangAkhir),
    malamTropisAwal: r("tr", rentangAwal),
    malamTropisAkhir: r("tr", rentangAkhir),
    terlaluBaru: rentangAwal[1] >= rentangAkhir[0],
  };
}

/* ---------- teks ---------- */
export const desimal = (x: number, d = 1) => x.toFixed(d).replace(".", ",").replace(/^-/, "−");
export const bertanda = (x: number, d = 1) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(d).replace(".", ",")}`;
export const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
