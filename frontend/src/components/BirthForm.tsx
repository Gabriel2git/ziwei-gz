'use client';

import { useEffect, useMemo, useState } from 'react';
import { getShichenFromHour } from '@/lib/shichen';

const STORAGE_KEY = 'ziwei_birth_form_v2';

interface BirthFormProps {
  onDataLoaded: (data: {
    birthday: string;
    birthTime: number;
    birthMinute: number;
    birthdayType: 'solar' | 'lunar';
    gender: 'male' | 'female';
    longitude: number;
    isLeap: boolean;
  }) => void | Promise<void>;
}

interface FormState {
  isLunar: boolean;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
  isLeap: boolean;
  selectedCity: string;
  customLongitude: string;
}

const DEFAULT_STATE: FormState = {
  isLunar: false,
  year: 2000,
  month: 5,
  day: 23,
  hour: 10,
  minute: 50,
  gender: 'male',
  isLeap: false,
  selectedCity: 'beijing',
  customLongitude: '',
};

const cities = [
  { value: 'beijing', label: '北京', longitude: 116.41 },
  { value: 'shanghai', label: '上海', longitude: 121.48 },
  { value: 'guangzhou', label: '广州', longitude: 113.27 },
  { value: 'shenzhen', label: '深圳', longitude: 114.07 },
  { value: 'hangzhou', label: '杭州', longitude: 120.2 },
  { value: 'chengdu', label: '成都', longitude: 104.07 },
  { value: 'wuhan', label: '武汉', longitude: 114.31 },
  { value: 'xian', label: '西安', longitude: 108.95 },
  { value: 'custom', label: '自定义', longitude: 0 },
];

export default function BirthForm({ onDataLoaded }: BirthFormProps) {
  const [form, setForm] = useState<FormState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch (error) {
      console.error('加载表单缓存失败:', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const getLongitude = (): number => {
    if (form.selectedCity === 'custom' && form.customLongitude) {
      return Number.parseFloat(form.customLongitude) || 120.033;
    }
    const city = cities.find((item) => item.value === form.selectedCity);
    return city ? city.longitude : 120.033;
  };

  const isValidDate = (year: number, month: number, day: number): boolean => {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };

  const isValidLongitude = (longitude: string): boolean => {
    const num = Number.parseFloat(longitude);
    return !Number.isNaN(num) && num >= -180 && num <= 180;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!isValidDate(form.year, form.month, form.day)) {
      newErrors.date = '请选择有效的日期';
    }

    if (form.selectedCity === 'custom') {
      if (!form.customLongitude) {
        newErrors.longitude = '请输入经度值';
      } else if (!isValidLongitude(form.customLongitude)) {
        newErrors.longitude = '经度需在 -180 到 180 之间';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const shichen = useMemo(() => getShichenFromHour(form.hour), [form.hour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setJustSubmitted(true);

    try {
      const birthday = `${form.year}-${form.month}-${form.day}`;
      const birthdayType = form.isLunar ? 'lunar' : 'solar';
      const longitude = getLongitude();

      await onDataLoaded({
        birthday,
        birthTime: form.hour,
        birthMinute: form.minute,
        birthdayType,
        gender: form.gender,
        longitude,
        isLeap: form.isLeap,
      });
    } finally {
      setLoading(false);
      setTimeout(() => setJustSubmitted(false), 2000);
    }
  };

  const years = Array.from({ length: 100 }, (_, i) => 2026 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {justSubmitted && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 text-blue-800 text-xs px-3 py-2 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300">
          已提交，正在排盘中。请稍候，表单信息已保留。
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">选择历法</label>
        <div className="flex gap-2">
          <label className="flex items-center cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700 transition-all text-sm">
            <input
              type="radio"
              checked={!form.isLunar}
              onChange={() => setForm((prev) => ({ ...prev, isLunar: false }))}
              className="mr-2 text-purple-600"
            />
            <span className="text-gray-900 dark:text-gray-100">阳历（推荐）</span>
          </label>
          <label className="flex items-center cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-700 transition-all text-sm">
            <input
              type="radio"
              checked={form.isLunar}
              onChange={() => setForm((prev) => ({ ...prev, isLunar: true }))}
              className="mr-2 text-purple-600"
            />
            <span className="text-gray-900 dark:text-gray-100">农历</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">出生日期</label>
        <div className="flex gap-1 flex-wrap">
          <select
            value={form.year}
            onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
            className={`flex-1 min-w-[90px] p-2 border-2 ${errors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm`}
          >
            {years.map((year) => (
              <option key={year} value={year} className="text-gray-900 dark:text-gray-100">
                {year}年
              </option>
            ))}
          </select>
          <select
            value={form.month}
            onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
            className={`flex-1 min-w-[60px] p-2 border-2 ${errors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm`}
          >
            {months.map((month) => (
              <option key={month} value={month} className="text-gray-900 dark:text-gray-100">
                {month}月
              </option>
            ))}
          </select>
          <select
            value={form.day}
            onChange={(e) => setForm((prev) => ({ ...prev, day: Number(e.target.value) }))}
            className={`flex-1 min-w-[60px] p-2 border-2 ${errors.date ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm`}
          >
            {days.map((day) => (
              <option key={day} value={day} className="text-gray-900 dark:text-gray-100">
                {day}日
              </option>
            ))}
          </select>
        </div>
        {errors.date && <p className="text-xs text-red-500 dark:text-red-400">{errors.date}</p>}
      </div>

      {form.isLunar && (
        <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
          <input
            type="checkbox"
            checked={form.isLeap}
            onChange={(e) => setForm((prev) => ({ ...prev, isLeap: e.target.checked }))}
            className="mr-2 w-4 h-4 text-purple-600"
          />
          <label className="text-xs text-amber-900 dark:text-amber-400 font-medium">闰月出生（例如：闰四月）</label>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">出生时间</label>
        <div className="flex items-center gap-1 flex-wrap">
          <select
            value={form.hour}
            onChange={(e) => setForm((prev) => ({ ...prev, hour: Number(e.target.value) }))}
            className="flex-1 min-w-[80px] p-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm"
          >
            {hours.map((hour) => (
              <option key={hour} value={hour} className="text-gray-900 dark:text-gray-100">
                {hour.toString().padStart(2, '0')}时
              </option>
            ))}
          </select>
          <span className="text-xl text-gray-400 dark:text-gray-500 font-light">:</span>
          <select
            value={form.minute}
            onChange={(e) => setForm((prev) => ({ ...prev, minute: Number(e.target.value) }))}
            className="flex-1 min-w-[80px] p-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm"
          >
            {minutes.map((minute) => (
              <option key={minute} value={minute} className="text-gray-900 dark:text-gray-100">
                {minute.toString().padStart(2, '0')}分
              </option>
            ))}
          </select>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg border border-purple-200 dark:border-purple-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800 dark:text-purple-400">对应时辰</span>
            <span className="text-sm font-bold text-purple-700 dark:text-purple-400">{shichen}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">出生地</label>
        <select
          value={form.selectedCity}
          onChange={(e) => setForm((prev) => ({ ...prev, selectedCity: e.target.value }))}
          className="w-full p-2 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm"
        >
          {cities.map((city) => (
            <option key={city.value} value={city.value} className="text-gray-900 dark:text-gray-100">
              {city.label}
            </option>
          ))}
        </select>

        {form.selectedCity === 'custom' && (
          <input
            type="text"
            value={form.customLongitude}
            onChange={(e) => setForm((prev) => ({ ...prev, customLongitude: e.target.value }))}
            placeholder="请输入经度（如 116.41）"
            className={`w-full p-2 border-2 ${errors.longitude ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg focus:border-purple-500 focus:outline-none transition-all text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 text-sm`}
          />
        )}
        {errors.longitude && <p className="text-xs text-red-500 dark:text-red-400">{errors.longitude}</p>}

        <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-400">当前经度</span>
            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{getLongitude().toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">性别</label>
        <div className="flex gap-2">
          <label className="flex items-center cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border-2 border-transparent hover:border-pink-300 dark:hover:border-pink-700 transition-all flex-1 justify-center text-sm">
            <input
              type="radio"
              value="female"
              checked={form.gender === 'female'}
              onChange={() => setForm((prev) => ({ ...prev, gender: 'female' }))}
              className="mr-2 text-pink-600"
            />
            <span className="text-gray-900 dark:text-gray-100">女</span>
          </label>
          <label className="flex items-center cursor-pointer bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-all flex-1 justify-center text-sm">
            <input
              type="radio"
              value="male"
              checked={form.gender === 'male'}
              onChange={() => setForm((prev) => ({ ...prev, gender: 'male' }))}
              className="mr-2 text-blue-600"
            />
            <span className="text-gray-900 dark:text-gray-100">男</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold text-base hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            排盘中...
          </div>
        ) : (
          '开始排盘'
        )}
      </button>
    </form>
  );
}
