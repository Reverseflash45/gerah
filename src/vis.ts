import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { AKHIR, AWAL, BULAN, type Indikator, TAHUN, anomali, anomaliBulan, bertanda, desimal, nilai, nilaiBulan, trenPerDekade, urutTerpanas } from "./analisis";

/** Palet garis hangat Ed Hawkins (ColorBrewer RdBu, 8 biru dan 8 merah). */
const BIRU_MERAH = ["#08306b", "#08519c", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#deebf7", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"];

/** Warna untuk anomali x pada rentang simetris ±batas. */
export function warnaAnomali(x: number, batas: number): string {
  const t = Math.max(0, Math.min(0.9999, (x + batas) / (2 * batas)));
  return BIRU_MERAH[Math.floor(t * BIRU_MERAH.length)];
}

export const BATAS_TAHUNAN = Math.max(...TAHUN.map((y) => Math.abs(anomali(y))));

function buatTip(wadah: HTMLElement) {
  const el = document.createElement("div");
  el.className = "tip";
  el.hidden = true;
  wadah.append(el);
  return {
    tampil(x: number, y: number, html: string) {
      el.innerHTML = html;
      el.hidden = false;
      const w = el.offsetWidth;
      const kiri = x + 14 + w > wadah.clientWidth ? x - 14 - w : x + 14;
      el.style.left = `${Math.max(0, kiri)}px`;
      el.style.top = `${Math.max(0, y - el.offsetHeight - 10)}px`;
    },
    sembunyi() {
      el.hidden = true;
    },
  };
}

const isiTahun = (y: number) => `<b>${y}</b><br>${desimal(nilai("tas", y), 2)} °C · ${bertanda(anomali(y), 2)} °C dari rata-rata 1961–1990`;

/* ---------- garis hangat ---------- */
export function gambarGaris(wadah: HTMLElement, sorot: number | null = null, tinggi = 0): void {
  const lebar = Math.max(300, wadah.clientWidth);
  const t = tinggi || wadah.clientHeight || 240;
  const w = lebar / TAHUN.length;
  wadah.innerHTML = `<svg viewBox="0 0 ${lebar} ${t}" width="${lebar}" height="${t}" preserveAspectRatio="none">
    ${TAHUN.map((y, i) => `<rect x="${(i * w).toFixed(2)}" width="${(w + 0.6).toFixed(2)}" y="0" height="${t}" fill="${warnaAnomali(anomali(y), BATAS_TAHUNAN)}"/>`).join("")}
    ${sorot != null && sorot >= AWAL && sorot <= AKHIR ? `<rect class="sorot-tahun" x="${((sorot - AWAL) * w).toFixed(2)}" width="${w.toFixed(2)}" y="1" height="${t - 2}"/>` : ""}
  </svg>`;
  const svg = wadah.querySelector("svg")!;
  const tip = buatTip(wadah);
  svg.addEventListener("pointermove", (e) => {
    const k = svg.getBoundingClientRect();
    const i = Math.max(0, Math.min(TAHUN.length - 1, Math.floor(((e.clientX - k.left) / k.width) * TAHUN.length)));
    tip.tampil(e.clientX - k.left, e.clientY - k.top, isiTahun(TAHUN[i]));
  });
  svg.addEventListener("pointerleave", () => tip.sembunyi());
}

/* ---------- batang anomali tahunan ---------- */
export function gambarBatang(wadah: HTMLElement): void {
  const lebar = Math.max(300, wadah.clientWidth);
  const hp = lebar < 560;
  const tinggi = hp ? 260 : 340;
  const m = { atas: 24, kanan: 12, bawah: 26, kiri: 44 };
  const x = scaleLinear().domain([AWAL - 0.5, AKHIR + 0.5]).range([m.kiri, lebar - m.kanan]);
  const maks = Math.ceil(BATAS_TAHUNAN * 4) / 4;
  const y = scaleLinear().domain([-maks, maks]).range([tinggi - m.bawah, m.atas]);
  const w = Math.max(1, x(1) - x(0) - 1.5);
  const tren = trenPerDekade() / 10;
  const tengahX = (AWAL + AKHIR) / 2;
  const tengahY = TAHUN.reduce((a, t) => a + anomali(t), 0) / TAHUN.length;
  const tick = [-1, -0.5, 0, 0.5, 1, 1.5].filter((v) => Math.abs(v) <= maks);
  const urut = urutTerpanas();
  const label = [urut[0], urut[1], urut[urut.length - 1]]
    .filter((t) => TAHUN.includes(t))
    .map((t) => {
      const a = anomali(t);
      return `<text class="label-batang" x="${x(t)}" y="${a >= 0 ? y(a) - 6 : y(a) + 14}" text-anchor="${t > AKHIR - 6 ? "end" : "middle"}">${t}</text>`;
    })
    .join("");
  const garisTren = line<number>()
    .x((t) => x(t))
    .y((t) => y(tengahY + (t - tengahX) * tren));
  wadah.innerHTML = `<svg viewBox="0 0 ${lebar} ${tinggi}" width="${lebar}" height="${tinggi}">
    ${tick.map((v) => `<line class="kisi${v === 0 ? " nol" : ""}" x1="${m.kiri}" x2="${lebar - m.kanan}" y1="${y(v)}" y2="${y(v)}"/><text class="sumbu" x="${m.kiri - 8}" y="${y(v) + 4}" text-anchor="end">${v === 0 ? "0" : bertanda(v)}°</text>`).join("")}
    ${TAHUN.map((t) => {
      const a = anomali(t);
      return `<rect x="${x(t) - w / 2}" width="${w}" y="${Math.min(y(a), y(0))}" height="${Math.max(1, Math.abs(y(a) - y(0)))}" fill="${warnaAnomali(a, BATAS_TAHUNAN)}" rx="1"/>`;
    }).join("")}
    <path class="garis-tren" d="${garisTren([AWAL, AKHIR]) ?? ""}"/>
    ${[1950, 1970, 1990, 2010, AKHIR].map((t) => `<text class="sumbu" x="${x(t)}" y="${tinggi - 6}" text-anchor="middle">${t}</text>`).join("")}
    ${label}
    <line class="silang" x1="-10" x2="-10" y1="${m.atas}" y2="${tinggi - m.bawah}"/>
  </svg>`;
  wadah.setAttribute("aria-label", `Anomali suhu tahunan Indonesia ${AWAL}–${AKHIR} terhadap 1961–1990; tren ${bertanda(trenPerDekade(), 2)} °C per dekade.`);
  const svg = wadah.querySelector("svg")!;
  const silang = svg.querySelector<SVGLineElement>(".silang")!;
  const tip = buatTip(wadah);
  svg.addEventListener("pointermove", (e) => {
    const k = svg.getBoundingClientRect();
    const t = Math.max(AWAL, Math.min(AKHIR, Math.round(x.invert(e.clientX - k.left))));
    silang.setAttribute("x1", String(x(t)));
    silang.setAttribute("x2", String(x(t)));
    tip.tampil(x(t), y(anomali(t)), isiTahun(t));
  });
  svg.addEventListener("pointerleave", () => {
    silang.setAttribute("x1", "-10");
    silang.setAttribute("x2", "-10");
    tip.sembunyi();
  });
}

/* ---------- kalender panas (tahun × bulan) ---------- */
export function gambarKalender(wadah: HTMLElement): void {
  const lebar = Math.max(300, wadah.clientWidth);
  const hp = lebar < 560;
  const m = { atas: 6, kanan: 4, bawah: 22, kiri: hp ? 30 : 36 };
  const kolom = TAHUN.length;
  const w = (lebar - m.kiri - m.kanan) / kolom;
  const h = hp ? 14 : 20;
  const tinggi = m.atas + 12 * h + m.bawah;
  const semua = TAHUN.flatMap((t) => BULAN.map((_, b) => anomaliBulan(t, b + 1) ?? 0));
  const batas = Math.max(...semua.map(Math.abs));
  const sel: string[] = [];
  TAHUN.forEach((t, i) =>
    BULAN.forEach((_, b) => {
      const a = anomaliBulan(t, b + 1);
      if (a == null) return;
      sel.push(`<rect x="${(m.kiri + i * w).toFixed(2)}" y="${m.atas + b * h}" width="${(w + 0.4).toFixed(2)}" height="${h + 0.4}" fill="${warnaAnomali(a, batas)}"/>`);
    }),
  );
  wadah.innerHTML = `<svg viewBox="0 0 ${lebar} ${tinggi}" width="${lebar}" height="${tinggi}">
    ${sel.join("")}
    ${BULAN.map((n, b) => (hp && b % 2 ? "" : `<text class="sumbu" x="${m.kiri - 6}" y="${m.atas + b * h + h / 2 + 4}" text-anchor="end">${n}</text>`)).join("")}
    ${[1950, 1970, 1990, 2010, AKHIR].map((t) => `<text class="sumbu" x="${t === AKHIR ? lebar - m.kanan : m.kiri + (t - AWAL + 0.5) * w}" y="${tinggi - 6}" text-anchor="${t === AKHIR ? "end" : "middle"}">${t}</text>`).join("")}
    <rect class="sorot-sel" x="-50" y="-50" width="${w}" height="${h}"/>
  </svg>`;
  const svg = wadah.querySelector("svg")!;
  const sorot = svg.querySelector<SVGRectElement>(".sorot-sel")!;
  const tip = buatTip(wadah);
  svg.addEventListener("pointermove", (e) => {
    const k = svg.getBoundingClientRect();
    const px = ((e.clientX - k.left) / k.width) * lebar;
    const py = ((e.clientY - k.top) / k.height) * tinggi;
    const i = Math.floor((px - m.kiri) / w);
    const b = Math.floor((py - m.atas) / h);
    if (i < 0 || i >= kolom || b < 0 || b > 11) {
      sorot.setAttribute("x", "-50");
      return tip.sembunyi();
    }
    const t = TAHUN[i];
    const a = anomaliBulan(t, b + 1);
    if (a == null) return tip.sembunyi();
    sorot.setAttribute("x", String(m.kiri + i * w));
    sorot.setAttribute("y", String(m.atas + b * h));
    tip.tampil(m.kiri + i * w, m.atas + b * h, `<b>${BULAN[b]} ${t}</b><br>${desimal(nilaiBulan(t, b + 1)!, 2)} °C · ${bertanda(a, 2)} °C dari rata-rata ${BULAN[b]} 1961–1990`);
  });
  svg.addEventListener("pointerleave", () => {
    sorot.setAttribute("x", "-50");
    tip.sembunyi();
  });
}

/* ---------- garis kecil: hari panas & malam tropis ---------- */
export function gambarGarisKecil(wadah: HTMLElement, ind: Indikator, satuan: string): void {
  const lebar = Math.max(260, wadah.clientWidth);
  const tinggi = 200;
  const m = { atas: 22, kanan: 40, bawah: 24, kiri: 40 };
  const ys = TAHUN.map((t) => nilai(ind, t));
  const x = scaleLinear().domain([AWAL, AKHIR]).range([m.kiri, lebar - m.kanan]);
  const y = scaleLinear()
    .domain([Math.min(...ys), Math.max(...ys)])
    .nice()
    .range([tinggi - m.bawah, m.atas]);
  const garis = line<number>()
    .x((t) => x(t))
    .y((t) => y(nilai(ind, t)));
  const ujung = (t: number, label: boolean) =>
    `<circle class="ujung" cx="${x(t)}" cy="${y(nilai(ind, t))}" r="3.5"/>` +
    (label ? `<text class="label-ujung" x="${x(t) + 6}" y="${y(nilai(ind, t)) - 8}">${Math.round(nilai(ind, t))}</text>` : "");
  wadah.innerHTML = `<svg viewBox="0 0 ${lebar} ${tinggi}" width="${lebar}" height="${tinggi}">
    ${y.ticks(4).map((v) => `<line class="kisi" x1="${m.kiri}" x2="${lebar - m.kanan}" y1="${y(v)}" y2="${y(v)}"/><text class="sumbu" x="${m.kiri - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join("")}
    ${[1950, 1990, AKHIR].map((t) => `<text class="sumbu" x="${x(t)}" y="${tinggi - 6}" text-anchor="middle">${t}</text>`).join("")}
    <path class="garis-kecil" d="${garis(TAHUN) ?? ""}"/>
    ${ujung(AWAL, false)}${ujung(AKHIR, true)}
  </svg>`;
  wadah.setAttribute("aria-label", `${satuan} per tahun, ${Math.round(nilai(ind, AWAL))} pada ${AWAL} menjadi ${Math.round(nilai(ind, AKHIR))} pada ${AKHIR}.`);
}
