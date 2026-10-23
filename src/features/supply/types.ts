export interface YearValue {
  year: number;
  value: number;
}

export interface TenchaShare {
  year: number;
  tonnes: number;
  // Of the same source's all-tea total for that year, as a fraction (0-1).
  share: number;
}

export interface PrefectureSupply {
  prefecture: string;
  // Matchoji regions inside this prefecture; empty for the national figure.
  regions: { id: string; name: string }[];
  // MAFF series, oldest year first.
  fields: YearValue[];
  rawTea: YearValue[];
  // Growers' federation figure; null where it does not report the prefecture.
  tencha: TenchaShare | null;
}

export interface SupplyOverview {
  national: PrefectureSupply | null;
  prefectures: PrefectureSupply[];
}
