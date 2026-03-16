export interface Star {
  name: string;
  brightness?: string;
  mutagen?: string;
}

export interface Palace {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars?: Star[];
  minorStars?: Star[];
  adjectiveStars?: Star[];
  decadal?: {
    range: [number, number];
  };
}

export interface Astrolabe {
  palaces: Palace[];
  solarDate?: string;
  lunarDate?: string;
  time?: string;
  timeRange?: string;
  soul?: string;
  body?: string;
  earthlyBranchOfBodyPalace?: string;
  chineseDate?: string;
}

export interface Horoscope {
  age?: {
    nominalAge: number;
  };
  decadal?: {
    heavenlyStem: string;
    earthlyBranch: string;
    mutagen?: string[];
  };
  yearly?: {
    heavenlyStem: string;
    earthlyBranch: string;
    mutagen?: string[];
  };
}

export interface DecadalYearlyItem {
  year: number;
  yearGanzhi: string;
  nominalAge: number | null;
  lifePalaceGanzhi: string;
  yearlyMutagen: string[];
  decadalMutagen: string[];
  decadalEarthlyBranch: string;
  yearlyEarthlyBranch: string;
  overlap: '同宫' | '无';
}

export interface DecadalYearlyInfo {
  range: [number, number];
  ageRange: [number, number];
  years: DecadalYearlyItem[];
}

export interface ZiweiData {
  astrolabe: Astrolabe;
  horoscope?: Horoscope;
  decadalYearlyInfo?: DecadalYearlyInfo | null;
  originalTime?: {
    hour: number;
    minute: number;
  };
  targetYear?: number;
}

export interface BirthFormData {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: '男' | '女';
  isLunar: boolean;
  isLeap?: boolean;
}
