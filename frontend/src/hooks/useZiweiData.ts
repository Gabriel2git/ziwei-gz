import { useRef, useState } from 'react';
import { getShichenIndexFromHour } from '@/lib/shichen';
import type { ContextStatus, ZiweiContextData, ZiweiData, ZiweiLiteData } from '@/types';

interface BirthData {
  birthday: string;
  birthTime: number;
  birthMinute: number;
  birthdayType: 'solar' | 'lunar';
  gender: 'male' | 'female';
  longitude: number;
  isLeap: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MAX_RETRY = 3;
const RETRY_DELAY = 1000;

class DataCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxAge: number;

  constructor(maxAge: number = 3600000) {
    this.maxAge = maxAge;
  }

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: T) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

const liteCache = new DataCache<ZiweiLiteData>();
const contextCache = new DataCache<ZiweiContextData>();

function getRequestKey(birthData: BirthData, targetYear: number) {
  return [
    birthData.birthday,
    birthData.birthTime,
    birthData.birthMinute,
    birthData.birthdayType,
    birthData.gender,
    birthData.longitude,
    birthData.isLeap,
    targetYear,
  ].join('_');
}

function mergeZiweiData(
  liteData: ZiweiLiteData | null,
  contextData: ZiweiContextData | null,
  originalTime?: { hour: number; minute: number },
): ZiweiData | null {
  if (!liteData) return null;

  return {
    ...liteData,
    ...contextData,
    selectedContext: contextData?.selectedContext || liteData.selectedContext,
    originalTime,
  };
}

export function useZiweiData() {
  const [ziweiData, setZiweiData] = useState<ZiweiData | null>(null);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [contextStatus, setContextStatus] = useState<ContextStatus>('idle');
  const [horoscopeYear, setHoroscopeYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);
  const activeRequestKeyRef = useRef<string>('');

  const fetchWithRetry = async (url: string, options: RequestInit, retryCount: number = 0): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      return response;
    } catch (err) {
      if (retryCount < MAX_RETRY) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return fetchWithRetry(url, options, retryCount + 1);
      }
      throw err;
    }
  };

  const buildRequestBody = (data: BirthData, targetYear: number) => ({
    birthday: data.birthday,
    hourIndex: getShichenIndexFromHour(data.birthTime),
    minute: data.birthMinute,
    gender: data.gender,
    isLunar: data.birthdayType === 'lunar',
    isLeap: data.isLeap,
    longitude: data.longitude,
    targetYear,
  });

  const fetchLiteData = async (data: BirthData, targetYear: number): Promise<ZiweiLiteData> => {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/ziwei-lite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(data, targetYear)),
    });
    return response.json();
  };

  const fetchContextData = async (data: BirthData, targetYear: number): Promise<ZiweiContextData> => {
    const response = await fetchWithRetry(`${API_BASE_URL}/api/ziwei-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestBody(data, targetYear)),
    });
    return response.json();
  };

  const attachOriginalTime = (data: BirthData) => ({
    hour: data.birthTime,
    minute: data.birthMinute,
  });

  const prefetchZiweiContext = async (birthData: BirthData, targetYear: number) => {
    const requestKey = getRequestKey(birthData, targetYear);
    const cachedContext = contextCache.get(requestKey);
    if (cachedContext) {
      setContextStatus('ready');
      return cachedContext;
    }

    setContextStatus('loading');

    try {
      const contextData = await fetchContextData(birthData, targetYear);
      contextCache.set(requestKey, contextData);

      if (activeRequestKeyRef.current === requestKey) {
        setZiweiData((prev) => mergeZiweiData(prev as ZiweiLiteData, contextData, attachOriginalTime(birthData)));
        setContextStatus('ready');
      }

      return contextData;
    } catch (err) {
      if (activeRequestKeyRef.current === requestKey) {
        setContextStatus('error');
      }
      throw err;
    }
  };

  const ensureZiweiContext = async (birthData: BirthData, targetYear: number = horoscopeYear): Promise<ZiweiData | null> => {
    const requestKey = getRequestKey(birthData, targetYear);
    const originalTime = attachOriginalTime(birthData);
    const cachedLite = liteCache.get(requestKey);
    const cachedContext = contextCache.get(requestKey);

    if (cachedLite && cachedContext) {
      const merged = mergeZiweiData(cachedLite, cachedContext, originalTime);
      if (activeRequestKeyRef.current === requestKey) {
        setZiweiData(merged);
        setContextStatus('ready');
      }
      return merged;
    }

    const liteData = cachedLite || (await fetchLiteData(birthData, targetYear));
    if (!cachedLite) {
      liteCache.set(requestKey, liteData);
    }

    const contextData = cachedContext || (await prefetchZiweiContext(birthData, targetYear));
    const merged = mergeZiweiData(liteData, contextData, originalTime);

    if (activeRequestKeyRef.current === requestKey) {
      setZiweiData(merged);
      setContextStatus('ready');
    }

    return merged;
  };

  const loadZiweiData = async (data: BirthData): Promise<ZiweiData> => {
    setError(null);
    const targetYear = horoscopeYear;
    const requestKey = getRequestKey(data, targetYear);
    activeRequestKeyRef.current = requestKey;

    try {
      const cachedLite = liteCache.get(requestKey);
      const cachedContext = contextCache.get(requestKey);
      const originalTime = attachOriginalTime(data);

      if (cachedLite) {
        const merged = mergeZiweiData(cachedLite, cachedContext, originalTime);
        if (merged) {
          setZiweiData(merged);
          setContextStatus(cachedContext ? 'ready' : 'loading');
          if (!cachedContext) {
            void prefetchZiweiContext(data, targetYear);
          }
          return merged;
        }
      }

      const liteData = await fetchLiteData(data, targetYear);
      liteCache.set(requestKey, liteData);
      const merged = mergeZiweiData(liteData, cachedContext, originalTime) as ZiweiData;
      setZiweiData(merged);
      setContextStatus(cachedContext ? 'ready' : 'loading');
      if (!cachedContext) {
        void prefetchZiweiContext(data, targetYear);
      }
      return merged;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`获取命盘数据失败: ${errorMessage}`);
      setContextStatus('error');
      throw err;
    }
  };

  const updateHoroscopeYear = async (birthData: BirthData, newYear: number): Promise<ZiweiData> => {
    if (isRefreshingData && ziweiData) return ziweiData;

    setIsRefreshingData(true);
    setError(null);
    const requestKey = getRequestKey(birthData, newYear);
    activeRequestKeyRef.current = requestKey;

    try {
      const cachedLite = liteCache.get(requestKey);
      const cachedContext = contextCache.get(requestKey);
      const originalTime = attachOriginalTime(birthData);

      if (cachedLite) {
        const merged = mergeZiweiData(cachedLite, cachedContext, originalTime) as ZiweiData;
        setHoroscopeYear(newYear);
        setZiweiData(merged);
        setContextStatus(cachedContext ? 'ready' : 'loading');
        if (!cachedContext) {
          void prefetchZiweiContext(birthData, newYear);
        }
        return merged;
      }

      setHoroscopeYear(newYear);
      const liteData = await fetchLiteData(birthData, newYear);
      liteCache.set(requestKey, liteData);
      const merged = mergeZiweiData(liteData, cachedContext, originalTime) as ZiweiData;
      setZiweiData(merged);
      setContextStatus(cachedContext ? 'ready' : 'loading');
      if (!cachedContext) {
        void prefetchZiweiContext(birthData, newYear);
      }
      return merged;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`更新命盘数据失败: ${errorMessage}`);
      setContextStatus('error');
      throw err;
    } finally {
      setIsRefreshingData(false);
    }
  };

  return {
    ziweiData,
    isRefreshingData,
    contextStatus,
    horoscopeYear,
    error,
    loadZiweiData,
    updateHoroscopeYear,
    ensureZiweiContext,
    setZiweiData,
    setError,
  };
}
