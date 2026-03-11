// frontend/src/components/ZiweiChart/PalaceCell.tsx
import React, { useState } from 'react';
import { getDynamicSiHua } from '@/lib/sihua';

// 固定的顺时针地支数组
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
// 固定的逆时针十二宫顺序（标准名称）
const PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '交友', '官禄', '田宅', '福德', '父母'];

// 星曜颜色映射 - 根据星曜属性分配发光颜色
const STAR_COLOR_MAP: Record<string, string> = {
  // 紫微星系 - 紫色（帝星）
  '紫微': '#ff44ff',
  '天机': '#44ff44',
  '太阳': '#ff4444',
  '武曲': '#ffff44',
  '天同': '#00f3ff',
  '廉贞': '#4444ff',
  // 天府星系
  '天府': '#ff44ff',
  '太阴': '#00f3ff',
  '贪狼': '#ffff44',
  '巨门': '#4444ff',
  '天相': '#44ff44',
  '天梁': '#44ff44',
  '七杀': '#ff4444',
  '破军': '#ff4444',
  // 辅星
  '左辅': '#44ff44',
  '右弼': '#44ff44',
  '文昌': '#ffd700',
  '文曲': '#ffd700',
  '天魁': '#ffff44',
  '天钺': '#ffff44',
  '禄存': '#ffd700',
  '天马': '#00f3ff',
  // 四化星
  '擎羊': '#ff4444',
  '陀罗': '#ff44ff',
  '火星': '#ff4444',
  '铃星': '#ff4444',
  '地空': '#ff44ff',
  '地劫': '#ff44ff',
  // 长生十二神
  '长生': '#44ff44',
  '沐浴': '#00f3ff',
  '冠带': '#4444ff',
  '临官': '#ffd700',
  '帝旺': '#ff4444',
  '衰': '#ffff44',
  '病': '#ff44ff',
  '死': '#ff44ff',
  '墓': '#ff44ff',
  '绝': '#ff44ff',
  '胎': '#44ff44',
  '养': '#44ff44',
};

// 获取星曜发光颜色
const getStarColor = (starName: string, isMajor: boolean): string => {
  return STAR_COLOR_MAP[starName] || (isMajor ? '#ff44ff' : '#00f3ff');
};

// 四化类型定义
const SIHUA_TYPES = ['禄', '权', '科', '忌'] as const;
type SiHuaType = typeof SIHUA_TYPES[number];

// 四化颜色配置
const SIHUA_COLORS: Record<SiHuaType, { bg: string; glow: string; text: string }> = {
  '禄': { bg: 'rgba(255, 215, 0, 0.2)', glow: '#ffd700', text: '#ffd700' },
  '权': { bg: 'rgba(255, 68, 68, 0.2)', glow: '#ff4444', text: '#ff4444' },
  '科': { bg: 'rgba(0, 243, 255, 0.2)', glow: '#00f3ff', text: '#00f3ff' },
  '忌': { bg: 'rgba(179, 0, 255, 0.2)', glow: '#b300ff', text: '#b300ff' },
};

interface PalaceCellProps {
  palace: any;
  horoscope?: any;
  earthlyBranchOfBodyPalace?: string;
  birthYearStem?: string;
  decadalStem?: string;
  yearlyStem?: string;
}

// 推算动态宫名的方法
const getDynamicPalaceName = (currentBranch: string, targetLifeBranch?: string) => {
  if (!targetLifeBranch) return null;
  const currentIndex = EARTHLY_BRANCHES.indexOf(currentBranch);
  const lifeIndex = EARTHLY_BRANCHES.indexOf(targetLifeBranch);
  if (currentIndex === -1 || lifeIndex === -1) return null;

  const clockwiseDistance = (currentIndex - lifeIndex + 12) % 12;
  const palaceIndex = (12 - clockwiseDistance) % 12;

  return PALACE_NAMES[palaceIndex];
};

// Tooltip 组件
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap"
          style={{
            background: 'rgba(26, 11, 46, 0.95)',
            border: '1px solid rgba(0, 243, 255, 0.5)',
            boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)',
            backdropFilter: 'blur(8px)'
          }}
        >
          {content}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(0, 243, 255, 0.5)'
            }}
          />
        </div>
      )}
    </div>
  );
};

// 几何装饰组件
const GeometricDecoration: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br' }> = ({ position }) => {
  const positionStyles = {
    tl: { top: '4px', left: '4px' },
    tr: { top: '4px', right: '4px' },
    bl: { bottom: '4px', left: '4px' },
    br: { bottom: '4px', right: '4px' },
  };

  const rotations = {
    tl: '0deg',
    tr: '90deg',
    bl: '270deg',
    br: '180deg',
  };

  return (
    <div
      className="absolute w-3 h-3 pointer-events-none"
      style={{
        ...positionStyles[position],
        transform: `rotate(${rotations[position]})`,
      }}
    >
      {/* 菱形装饰 */}
      <div
        className="w-full h-full"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.6), rgba(179, 0, 255, 0.6))',
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          boxShadow: '0 0 8px rgba(0, 243, 255, 0.5)',
        }}
      />
    </div>
  );
};

// 四化流动光线组件
const FlowingLight: React.FC<{ type: SiHuaType; label: string }> = ({ type, label }) => {
  const colors = SIHUA_COLORS[type];

  return (
    <span
      className="relative inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold overflow-hidden"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.glow}`,
        boxShadow: `0 0 8px ${colors.glow}40`,
      }}
    >
      {/* 流动光线动画 */}
      <span
        className="absolute inset-0 flowing-light-animation"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.glow}60, transparent)`,
        }}
      />
      <span className="relative z-10">{label}{type}</span>
    </span>
  );
};

export default function PalaceCell({
  palace,
  horoscope,
  earthlyBranchOfBodyPalace,
  birthYearStem,
  decadalStem,
  yearlyStem
}: PalaceCellProps) {
  if (!palace) return null;

  // 判断是否为当前大限或流年所在宫位
  const isCurrentDecadal = horoscope?.decadal?.earthlyBranch === palace.earthlyBranch;
  const isCurrentYearly = horoscope?.yearly?.earthlyBranch === palace.earthlyBranch;

  // 判断是否为身宫
  const isBodyPalace = palace.earthlyBranch === earthlyBranchOfBodyPalace;

  // 判断是否为来因宫
  const isOriginPalace = palace.heavenlyStem === birthYearStem;

  // 计算动态宫名
  const decadalPalace = getDynamicPalaceName(palace.earthlyBranch, horoscope?.decadal?.earthlyBranch);
  const yearlyPalace = getDynamicPalaceName(palace.earthlyBranch, horoscope?.yearly?.earthlyBranch);

  // 确定宫位边框颜色
  const getBorderStyle = () => {
    if (isCurrentDecadal) return {
      border: '1px solid rgba(0, 243, 255, 0.6)',
      boxShadow: 'inset 0 0 15px rgba(0, 243, 255, 0.2), 0 0 10px rgba(0, 243, 255, 0.3)'
    };
    if (isCurrentYearly) return {
      border: '1px solid rgba(255, 0, 255, 0.6)',
      boxShadow: 'inset 0 0 15px rgba(255, 0, 255, 0.2), 0 0 10px rgba(255, 0, 255, 0.3)'
    };
    if (isBodyPalace) return {
      border: '1px solid rgba(0, 255, 136, 0.5)',
      boxShadow: 'inset 0 0 10px rgba(0, 255, 136, 0.15)'
    };
    if (isOriginPalace) return {
      border: '1px solid rgba(255, 215, 0, 0.5)',
      boxShadow: 'inset 0 0 10px rgba(255, 215, 0, 0.15)'
    };
    return {
      border: '1px solid rgba(0, 243, 255, 0.15)',
      boxShadow: 'none'
    };
  };

  const borderStyle = getBorderStyle();

  return (
    <div
      className="w-full h-full p-1.5 sm:p-2 flex flex-col justify-between relative overflow-hidden"
      style={{
        ...borderStyle,
        background: isCurrentDecadal || isCurrentYearly
          ? 'rgba(0, 243, 255, 0.05)'
          : 'transparent'
      }}
    >
      {/* 几何角落装饰 */}
      <GeometricDecoration position="tl" />
      <GeometricDecoration position="tr" />
      <GeometricDecoration position="bl" />
      <GeometricDecoration position="br" />

      {/* 宫位标识标签 */}
      <div className="absolute top-1 right-1 flex flex-col gap-0.5 items-end">
        {isBodyPalace && (
          <span
            className="text-[8px] px-1 py-0.5 rounded"
            style={{
              background: 'rgba(0, 255, 136, 0.2)',
              color: '#00ff88',
              border: '1px solid rgba(0, 255, 136, 0.4)',
              textShadow: '0 0 5px rgba(0, 255, 136, 0.5)'
            }}
          >
            身
          </span>
        )}
        {isOriginPalace && (
          <span
            className="text-[8px] px-1 py-0.5 rounded"
            style={{
              background: 'rgba(255, 215, 0, 0.2)',
              color: '#ffd700',
              border: '1px solid rgba(255, 215, 0, 0.4)',
              textShadow: '0 0 5px rgba(255, 215, 0, 0.5)'
            }}
          >
            因
          </span>
        )}
      </div>

      {/* 顶部：星曜区 */}
      <div className="flex flex-col gap-1 relative z-10">
        {/* 主星 */}
        <div className="flex flex-wrap gap-1 content-start min-h-[1.25rem]">
          {palace.majorStars?.map((star: any) => {
            const birthSiHua = star.mutagen as SiHuaType | undefined;
            const decadalSiHua = getDynamicSiHua(star.name, decadalStem) as SiHuaType | undefined;
            const yearlySiHua = getDynamicSiHua(star.name, yearlyStem) as SiHuaType | undefined;
            const starColor = getStarColor(star.name, true);

            return (
              <Tooltip
                key={star.name}
                content={
                  <div className="space-y-1">
                    <div className="font-bold" style={{ color: SIHUA_COLORS['禄'].text }}>{star.name}</div>
                    {star.brightness && <div>亮度: {star.brightness}</div>}
                    {birthSiHua && <div>生年{typeToText(birthSiHua)}</div>}
                    {decadalSiHua && <div>大限{typeToText(decadalSiHua)}</div>}
                    {yearlySiHua && <div>流年{typeToText(yearlySiHua)}</div>}
                  </div>
                }
              >
                <div className="flex items-center flex-wrap gap-0.5 cursor-help">
                  <span
                    className="font-bold text-sm sm:text-base leading-tight"
                    style={{
                      color: starColor,
                      textShadow: `0 0 5px ${starColor}`
                    }}
                  >
                    {star.name}
                  </span>
                  {star.brightness && (
                    <span className="text-[9px] text-gray-500">{star.brightness}</span>
                  )}

                  {/* 四化标签 */}
                  <div className="flex gap-0.5">
                    {birthSiHua && <FlowingLight type={birthSiHua} label="生" />}
                    {decadalSiHua && <FlowingLight type={decadalSiHua} label="限" />}
                    {yearlySiHua && <FlowingLight type={yearlySiHua} label="流" />}
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>

        {/* 辅星 */}
        <div className="flex flex-wrap gap-1 content-start">
          {palace.minorStars?.map((star: any) => {
            const birthSiHua = star.mutagen as SiHuaType | undefined;
            const decadalSiHua = getDynamicSiHua(star.name, decadalStem) as SiHuaType | undefined;
            const yearlySiHua = getDynamicSiHua(star.name, yearlyStem) as SiHuaType | undefined;
            const starColor = getStarColor(star.name, false);

            return (
              <Tooltip
                key={star.name}
                content={
                  <div className="space-y-1">
                    <div className="font-bold" style={{ color: SIHUA_COLORS['科'].text }}>{star.name}</div>
                    {star.brightness && <div>亮度: {star.brightness}</div>}
                  </div>
                }
              >
                <div className="flex items-center flex-wrap gap-0.5 cursor-help">
                  <span
                    className="text-xs sm:text-sm leading-tight"
                    style={{
                      color: starColor,
                      textShadow: `0 0 5px ${starColor}`
                    }}
                  >
                    {star.name}
                  </span>
                  {star.brightness && (
                    <span className="text-[8px] text-gray-500">{star.brightness}</span>
                  )}

                  <div className="flex gap-0.5">
                    {birthSiHua && <FlowingLight type={birthSiHua} label="生" />}
                    {decadalSiHua && <FlowingLight type={decadalSiHua} label="限" />}
                    {yearlySiHua && <FlowingLight type={yearlySiHua} label="流" />}
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* 中部：杂曜与神煞区 */}
      <div className="flex flex-wrap gap-1 mt-1 opacity-70 text-[10px] relative z-10">
        {palace.adjectiveStars?.map((star: any) => (
          <Tooltip key={star.name} content={<span>{star.name}</span>}>
            <span className="text-gray-400 cursor-help hover:text-gray-300 transition-colors">
              {star.name}
            </span>
          </Tooltip>
        ))}
        {palace.changsheng12 && (
          <span className="text-purple-400">{palace.changsheng12}</span>
        )}
        {palace.boshi12 && (
          <span className="text-teal-400">{palace.boshi12}</span>
        )}
      </div>

      {/* 底部：基石区 */}
      <div className="border-t border-dashed border-gray-700 pt-1 mt-auto flex justify-between items-end relative z-10">
        <div className="flex flex-col">
          {/* 大限岁数 */}
          <span className="text-[9px] text-gray-500">
            {palace.decadal?.range?.[0]}~{palace.decadal?.range?.[1]}
          </span>
          {/* 宫名 */}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span
              className="text-xs sm:text-sm font-bold"
              style={{
                color: '#ff6b6b',
                textShadow: '0 0 8px rgba(255, 107, 107, 0.5)'
              }}
            >
              {palace.name}
            </span>
            {decadalPalace && (
              <span
                className="text-[8px] sm:text-[10px]"
                style={{ color: '#00ff88' }}
              >
                大{decadalPalace.substring(0, 2)}
              </span>
            )}
            {yearlyPalace && (
              <span
                className="text-[8px] sm:text-[10px]"
                style={{ color: '#00f3ff' }}
              >
                年{yearlyPalace.substring(0, 2)}
              </span>
            )}
          </div>
        </div>
        {/* 干支 */}
        <div className="flex flex-col items-end">
          <span
            className="text-sm sm:text-base font-bold"
            style={{
              color: '#00f3ff',
              textShadow: '0 0 8px rgba(0, 243, 255, 0.5)'
            }}
          >
            {palace.heavenlyStem}{palace.earthlyBranch}
          </span>
        </div>
      </div>
    </div>
  );
}

// 辅助函数：四化类型转文字
function typeToText(type: SiHuaType): string {
  const map: Record<SiHuaType, string> = {
    '禄': '化禄 - 财禄、福气',
    '权': '化权 - 权力、掌控',
    '科': '化科 - 科名、贵人',
    '忌': '化忌 - 执着、波折'
  };
  return map[type];
}
