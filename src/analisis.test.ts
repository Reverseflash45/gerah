import { describe, expect, it } from "vitest";
import { AKHIR, AWAL, TAHUN, anomali, anomaliBulan, bertanda, nilai, peringkat, rata, sejakLahir, trenPerDekade, urutTerpanas } from "./analisis";

describe("data", () => {
  it("1950–2024 lengkap", () => {
    expect(AWAL).toBe(1950);
    expect(AKHIR).toBe(2024);
    expect(TAHUN).toHaveLength(75);
  });

  it("anomali periode acuan rata-ratanya nol", () => {
    const xs = TAHUN.filter((y) => y >= 1961 && y <= 1990).map(anomali);
    expect(xs.reduce((a, b) => a + b, 0) / xs.length).toBeCloseTo(0, 6);
  });

  it("anomali bulanan periode acuan juga nol untuk tiap bulan", () => {
    for (let b = 1; b <= 12; b++) {
      const xs = TAHUN.filter((y) => y >= 1961 && y <= 1990).map((y) => anomaliBulan(y, b)!);
      expect(xs.reduce((a, c) => a + c, 0) / xs.length).toBeCloseTo(0, 6);
    }
  });
});

describe("pemanasan", () => {
  it("2024 tahun terpanas dan tren positif", () => {
    expect(urutTerpanas()[0]).toBe(2024);
    expect(peringkat(2024)).toBe(1);
    expect(trenPerDekade()).toBeGreaterThan(0.15);
    expect(trenPerDekade()).toBeLessThan(0.35);
  });

  it("dekade terakhir lebih panas daripada periode acuan", () => {
    expect(rata("tas", 2015, 2024) - rata("tas", 1961, 1990)).toBeGreaterThan(1);
  });

  it("hari di atas 30 °C dan malam tropis bertambah", () => {
    expect(rata("hd30", 2020, 2024)).toBeGreaterThan(rata("hd30", 1960, 1964));
    expect(rata("tr", 2020, 2024)).toBeGreaterThan(rata("tr", 1960, 1964));
  });
});

describe("sejak kamu lahir", () => {
  it("lima tahun di sekitar tahun lahir lawan lima tahun terakhir", () => {
    const p = sejakLahir(2000);
    expect(p.rentangAwal).toEqual([1998, 2002]);
    expect(p.rentangAkhir).toEqual([2020, 2024]);
    expect(p.selisih).toBeCloseTo(p.suhuAkhir - p.suhuAwal, 10);
    expect(p.terlaluBaru).toBe(false);
  });

  it("tahun di luar data dipotong ke tepi", () => {
    expect(sejakLahir(1930).rentangAwal).toEqual([1950, 1954]);
    expect(sejakLahir(2024).terlaluBaru).toBe(true);
  });

  it("format angka bertanda", () => {
    expect(bertanda(1.234)).toBe("+1,2");
    expect(bertanda(-0.25, 2)).toBe("−0,25");
    expect(nilai("tas", 2024)).toBeGreaterThan(25);
  });
});
