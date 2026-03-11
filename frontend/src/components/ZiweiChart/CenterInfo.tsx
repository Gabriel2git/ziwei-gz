// frontend/src/components/ZiweiChart/CenterInfo.tsx
import React from 'react';

interface CenterInfoProps {
  astrolabe: any;
  horoscope?: any;
}

// 八字四柱组件
const BaziPillar: React.FC<{
  position: string;
  heavenlyStem: string;
  earthlyBranch: string;
  stemColor?: string;
  branchColor?: string;
}> = ({ position, heavenlyStem, earthlyBranch, stemColor = '#00f3ff', branchColor = '#ff6b6b' }) => (
  <div className="flex flex-col items-center gap-1">
    <span className="text-[10px] text-gray-500 uppercase tracking-wider">{position}</span>
    <div className="flex gap-1">
      <span
        className="text-lg font-bold"
        style={{
          color: stemColor,
          textShadow: `0 0 10px ${stemColor}80`
        }}
      >
        {heavenlyStem}
      </span>
      <span
        className="text-lg font-bold"
        style={{
          color: branchColor,
          textShadow: `0 0 10px ${branchColor}80`
        }}
      >
        {earthlyBranch}
      </span>
    </div>
  </div>
);

export default function CenterInfo({ astrolabe, horoscope }: CenterInfoProps) {
  // 解析八字四柱
  const parseBazi = (chineseDate: string) => {
    // 格式如: "戊寅年 乙丑月 庚辰日 丁亥时"
    const parts = chineseDate.split(' ');
    if (parts.length >= 4) {
      return {
        year: { stem: parts[0][0], branch: parts[0][1] },
        month: { stem: parts[1][0], branch: parts[1][1] },
        day: { stem: parts[2][0], branch: parts[2][1] },
        hour: { stem: parts[3][0], branch: parts[3][1] },
      };
    }
    return null;
  };

  const bazi = astrolabe.chineseDate ? parseBazi(astrolabe.chineseDate) : null;

  return (
    <div
      className="w-full h-full p-4 flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(26, 11, 46, 0.9), rgba(5, 5, 8, 0.95))',
        border: '1px solid rgba(0, 243, 255, 0.3)',
        boxShadow: 'inset 0 0 30px rgba(0, 243, 255, 0.1), 0 0 20px rgba(0, 243, 255, 0.15)'
      }}
    >
      {/* 背景装饰 - 旋转的几何图形 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(0, 243, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(179, 0, 255, 0.3) 0%, transparent 50%)'
        }}
      />

      {/* 四角装饰 */}
      <div className="absolute top-2 left-2 w-4 h-4">
        <div
          className="w-full h-full"
          style={{
            borderLeft: '2px solid rgba(0, 243, 255, 0.5)',
            borderTop: '2px solid rgba(0, 243, 255, 0.5)',
          }}
        />
      </div>
      <div className="absolute top-2 right-2 w-4 h-4">
        <div
          className="w-full h-full"
          style={{
            borderRight: '2px solid rgba(0, 243, 255, 0.5)',
            borderTop: '2px solid rgba(0, 243, 255, 0.5)',
          }}
        />
      </div>
      <div className="absolute bottom-2 left-2 w-4 h-4">
        <div
          className="w-full h-full"
          style={{
            borderLeft: '2px solid rgba(0, 243, 255, 0.5)',
            borderBottom: '2px solid rgba(0, 243, 255, 0.5)',
          }}
        />
      </div>
      <div className="absolute bottom-2 right-2 w-4 h-4">
        <div
          className="w-full h-full"
          style={{
            borderRight: '2px solid rgba(0, 243, 255, 0.5)',
            borderBottom: '2px solid rgba(0, 243, 255, 0.5)',
          }}
        />
      </div>

      {/* 标题 */}
      <h2
        className="text-xl sm:text-2xl font-bold tracking-[0.3em] mb-4 relative"
        style={{
          color: '#00f3ff',
          textShadow: '0 0 20px rgba(0, 243, 255, 0.8), 0 0 40px rgba(0, 243, 255, 0.4)',
          fontFamily: 'SimSun, "Noto Serif SC", serif'
        }}
      >
        紫微斗数
        {/* 标题下划线动画 */}
        <div
          className="absolute -bottom-1 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, #00f3ff, transparent)',
            animation: 'pulse-glow 2s ease-in-out infinite'
          }}
        />
      </h2>

      {/* 八字四柱 */}
      {bazi && (
        <div
          className="grid grid-cols-4 gap-3 sm:gap-4 mb-4 p-3 rounded-lg"
          style={{
            background: 'rgba(0, 243, 255, 0.05)',
            border: '1px solid rgba(0, 243, 255, 0.2)',
          }}
        >
          <BaziPillar
            position="年柱"
            heavenlyStem={bazi.year.stem}
            earthlyBranch={bazi.year.branch}
            stemColor="#ffd700"
            branchColor="#ff6b6b"
          />
          <BaziPillar
            position="月柱"
            heavenlyStem={bazi.month.stem}
            earthlyBranch={bazi.month.branch}
            stemColor="#00ff88"
            branchColor="#00f3ff"
          />
          <BaziPillar
            position="日柱"
            heavenlyStem={bazi.day.stem}
            earthlyBranch={bazi.day.branch}
            stemColor="#ff00ff"
            branchColor="#ffff44"
          />
          <BaziPillar
            position="时柱"
            heavenlyStem={bazi.hour.stem}
            earthlyBranch={bazi.hour.branch}
            stemColor="#00f3ff"
            branchColor="#b300ff"
          />
        </div>
      )}

      {/* 日期信息 */}
      <div className="space-y-1.5 text-xs sm:text-sm text-center mb-4">
        <div className="flex items-center justify-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px]"
            style={{
              background: 'rgba(0, 243, 255, 0.15)',
              color: '#00f3ff',
              border: '1px solid rgba(0, 243, 255, 0.3)'
            }}
          >
            公历
          </span>
          <span className="text-gray-300">
            {astrolabe.solarDate} {astrolabe.timeRange}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span
            className="px-2 py-0.5 rounded text-[10px]"
            style={{
              background: 'rgba(255, 215, 0, 0.15)',
              color: '#ffd700',
              border: '1px solid rgba(255, 215, 0, 0.3)'
            }}
          >
            农历
          </span>
          <span className="text-gray-300">
            {astrolabe.lunarDate} {astrolabe.time}
          </span>
        </div>
      </div>

      {/* 分隔线 */}
      <div
        className="w-24 h-px mb-4"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.5), transparent)'
        }}
      />

      {/* 命主身主五行 */}
      <div className="flex gap-6 justify-center mb-3">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 mb-1">命主</span>
          <span
            className="text-lg font-bold"
            style={{
              color: '#ff6b6b',
              textShadow: '0 0 10px rgba(255, 107, 107, 0.6)'
            }}
          >
            {astrolabe.soul}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 mb-1">身主</span>
          <span
            className="text-lg font-bold"
            style={{
              color: '#00f3ff',
              textShadow: '0 0 10px rgba(0, 243, 255, 0.6)'
            }}
          >
            {astrolabe.body}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-500 mb-1">五行</span>
          <span
            className="text-lg font-bold"
            style={{
              color: '#ffd700',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.6)'
            }}
          >
            {astrolabe.fiveElementsClass}
          </span>
        </div>
      </div>

      {/* 当前推演信息 */}
      {horoscope?.age && (
        <div
          className="mt-2 px-4 py-2 rounded-full text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, rgba(179, 0, 255, 0.2), rgba(0, 243, 255, 0.2))',
            border: '1px solid rgba(179, 0, 255, 0.4)',
            color: '#b300ff',
            textShadow: '0 0 10px rgba(179, 0, 255, 0.5)',
            animation: 'pulse-glow 3s ease-in-out infinite'
          }}
        >
          当前推演虚岁：{horoscope.age.nominalAge} 岁
        </div>
      )}

      {/* 底部装饰文字 */}
      <div
        className="absolute bottom-3 text-[8px] tracking-[0.5em] text-gray-600 uppercase"
        style={{
          textShadow: '0 0 5px rgba(0, 243, 255, 0.3)'
        }}
      >
        Oriental Cyber Divination
      </div>
    </div>
  );
}
