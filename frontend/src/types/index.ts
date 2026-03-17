export interface Star {
  name: string;
  brightness?: string;
  mutagen?: string;
  type?: string;
  scope?: string;
}

export interface PalaceDecadal {
  range?: [number, number];
  heavenlyStem?: string;
  earthlyBranch?: string;
  mutagen?: string[];
}

export interface Palace {
  index?: number;
  name: string;
  isBodyPalace?: boolean;
  isOriginalPalace?: boolean;
  heavenlyStem: string;
  earthlyBranch: string;
  majorStars?: Star[];
  minorStars?: Star[];
  adjectiveStars?: Star[];
  changsheng12?: string;
  boshi12?: string;
  jiangqian12?: string;
  suiqian12?: string;
  decadal?: PalaceDecadal;
  ages?: number[];
}

export interface Astrolabe {
  gender?: string;
  solarDate?: string;
  lunarDate?: string;
  chineseDate?: string;
  time?: string;
  timeRange?: string;
  sign?: string;
  zodiac?: string;
  earthlyBranchOfBodyPalace?: string;
  earthlyBranchOfSoulPalace?: string;
  soul?: string;
  body?: string;
  fiveElementsClass?: string;
  palaces: Palace[];
  copyright?: string;
}

export interface HoroscopeAge {
  nominalAge?: number;
  [key: string]: string | number | boolean | undefined;
}

export interface HoroscopeScope {
  heavenlyStem?: string;
  earthlyBranch?: string;
  mutagen?: string[];
  palaceNames?: string[];
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface Horoscope {
  lunarDate?: string;
  solarDate?: string;
  age?: HoroscopeAge;
  decadal?: HoroscopeScope;
  yearly?: HoroscopeScope;
  monthly?: HoroscopeScope;
  daily?: HoroscopeScope;
  hourly?: HoroscopeScope;
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

export interface YearlyDetail {
  year: number;
  yearGanzhi: string;
  nominalAge: number | null;
  lifePalaceGanzhi: string;
  yearlyMutagen: string[];
}

export interface DecadalBlock {
  index: number;
  decadalGanzhi: string;
  decadalRange: [number, number];
  yearRange: [number, number];
  decadalMutagen: string[];
  years: YearlyDetail[];
}

export interface SelectedContext {
  baselineYear: number;
  targetYear: number;
  nominalAge: number | null;
  decadal: {
    heavenlyStem: string;
    earthlyBranch: string;
    range: number[];
    mutagen: string[];
  };
  yearly: {
    heavenlyStem: string;
    earthlyBranch: string;
    mutagen: string[];
  };
}

export interface ZiweiData {
  astrolabe: Astrolabe;
  horoscope?: Horoscope;
  decadalYearlyInfo?: DecadalYearlyInfo | null;
  promptDecadalBlocks?: DecadalBlock[];
  selectedContext?: SelectedContext;
  originalTime?: {
    hour: number;
    minute: number;
  };
  targetYear?: number;
}

export interface ZiweiLiteData {
  astrolabe: Astrolabe;
  horoscope?: Horoscope;
  selectedContext?: SelectedContext;
  targetYear?: number;
}

export interface ZiweiContextData {
  targetYear?: number;
  selectedContext?: SelectedContext;
  decadalYearlyInfo?: DecadalYearlyInfo | null;
  promptDecadalBlocks?: DecadalBlock[];
}

export type ContextStatus = 'idle' | 'loading' | 'ready' | 'error';

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
