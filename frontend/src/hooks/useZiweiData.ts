import { useState, useMemo } from 'react';
import { getShichenIndexFromHour, getLunarBaseYear } from '@/lib/shichen';
import { parseZiweiToPrompt, Message } from '@/lib/ai';

interface BirthData {
  birthday: string;
  birthTime: number;
  birthMinute: number;
  birthdayType: 'solar' | 'lunar';
  gender: 'male' | 'female';
  longitude: number;
  isLeap: boolean;
}

interface ZiweiData {
  astrolabe: any;
  horoscope?: any;
  decadalYearlyInfo?: any;
  originalTime?: {
    hour: number;
    minute: number;
  };
  targetYear?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MAX_RETRY = 3;
const RETRY_DELAY = 1000;

// 缓存管理
class ZiweiCache {
  private cache: Map<string, { data: ZiweiData; timestamp: number }>;
  private maxAge: number; // 缓存最大年龄（毫秒）

  constructor(maxAge: number = 3600000) { // 默认1小时
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  // 生成缓存键
  private generateKey(birthData: BirthData, targetYear: number): string {
    return `${birthData.birthday}_${birthData.birthTime}_${birthData.birthMinute}_${birthData.birthdayType}_${birthData.gender}_${birthData.longitude}_${birthData.isLeap}_${targetYear}`;
  }

  // 获取缓存数据
  get(birthData: BirthData, targetYear: number): ZiweiData | null {
    const key = this.generateKey(birthData, targetYear);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // 检查缓存是否过期
    const now = Date.now();
    if (now - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // 设置缓存数据
  set(birthData: BirthData, targetYear: number, data: ZiweiData): void {
    const key = this.generateKey(birthData, targetYear);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 清理过期缓存
    this.cleanup();
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    });
  }

  // 清空缓存
  clear(): void {
    this.cache.clear();
  }
}

// 创建全局缓存实例
const ziweiCache = new ZiweiCache();

export function useZiweiData() {
  const [ziweiData, setZiweiData] = useState<ZiweiData | null>(null);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [horoscopeYear, setHoroscopeYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  // 带重试机制的 fetch 函数
  const fetchWithRetry = async (url: string, options: RequestInit, retryCount: number = 0): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.statusText}`);
      }
      return response;
    } catch (err) {
      if (retryCount < MAX_RETRY) {
        console.log(`请求失败，正在重试 (${retryCount + 1}/${MAX_RETRY})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return fetchWithRetry(url, options, retryCount + 1);
      }
      throw err;
    }
  };

  const fetchZiweiData = async (data: BirthData, targetYear: number): Promise<ZiweiData> => {
    const shichenIndex = getShichenIndexFromHour(data.birthTime);
    const response = await fetchWithRetry(`${API_BASE_URL}/api/ziwei`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        birthday: data.birthday,
        hourIndex: shichenIndex,
        minute: data.birthMinute,
        gender: data.gender,
        isLunar: data.birthdayType === 'lunar',
        isLeap: data.isLeap,
        longitude: data.longitude,
        targetYear: targetYear
      }),
    });

    const realZiweiData = await response.json();
    realZiweiData.originalTime = { hour: data.birthTime, minute: data.birthMinute };
    return realZiweiData;
  };

  const loadZiweiData = async (data: BirthData): Promise<ZiweiData> => {
    setError(null);
    try {
      // 检查缓存
      const cachedData = ziweiCache.get(data, horoscopeYear);
      if (cachedData) {
        console.log('使用缓存的命盘数据');
        setZiweiData(cachedData);
        return cachedData;
      }

      // 缓存未命中，调用 API
      const realZiweiData = await fetchZiweiData(data, horoscopeYear);
      // 存入缓存
      ziweiCache.set(data, horoscopeYear, realZiweiData);
      setZiweiData(realZiweiData);
      return realZiweiData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('获取命盘数据失败:', errorMessage);
      setError(`获取命盘数据失败: ${errorMessage}`);
      throw error;
    }
  };

  const updateHoroscopeYear = async (birthData: BirthData, newYear: number): Promise<ZiweiData> => {
    if (isRefreshingData) return ziweiData!;
    
    setIsRefreshingData(true);
    setError(null);
    try {
      // 检查缓存
      const cachedData = ziweiCache.get(birthData, newYear);
      if (cachedData) {
        console.log('使用缓存的命盘数据');
        setHoroscopeYear(newYear);
        setZiweiData(cachedData);
        return cachedData;
      }

      // 缓存未命中，调用 API
      setHoroscopeYear(newYear);
      const realZiweiData = await fetchZiweiData(birthData, newYear);
      // 存入缓存
      ziweiCache.set(birthData, newYear, realZiweiData);
      setZiweiData(realZiweiData);
      return realZiweiData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('更新命盘数据失败:', errorMessage);
      setError(`更新命盘数据失败: ${errorMessage}`);
      throw error;
    } finally {
      setIsRefreshingData(false);
    }
  };

  return {
    ziweiData,
    isRefreshingData,
    horoscopeYear,
    error,
    loadZiweiData,
    updateHoroscopeYear,
    setZiweiData,
    setError
  };
}
