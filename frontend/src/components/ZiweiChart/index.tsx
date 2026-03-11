import React from 'react';
import PalaceCell from './PalaceCell';
import CenterInfo from './CenterInfo';
import { EARTHLY_BRANCHES, GRID_MAPPING } from './constants';

interface ZiweiChartProps {
  ziweiData: {
    astrolabe: any;
    horoscope?: any;
  };
}

export default function ZiweiChart(props: ZiweiChartProps) {
  const { ziweiData } = props;
  if (!ziweiData || !ziweiData.astrolabe) return <div>暂无命盘数据</div>;

  const { astrolabe, horoscope } = ziweiData;
  const palaces = astrolabe.palaces || [];

  // 提取身宫地支
  const earthlyBranchOfBodyPalace = astrolabe.earthlyBranchOfBodyPalace;
  
  // 提取出生年干（从chineseDate中取第一个字符，如"戊寅年"的"戊"）
  const birthYearStem = astrolabe.chineseDate ? astrolabe.chineseDate.charAt(0) : undefined;
  
  // 提取大限天干
  const decadalStem = horoscope?.decadal?.heavenlyStem;
  
  // 提取流年天干
  const yearlyStem = horoscope?.yearly?.heavenlyStem;

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* 3D 透视容器 */}
      <div 
        className="relative perspective-1000"
        style={{ perspective: '1200px' }}
      >
        {/* 主命盘容器 - 赛博风格 */}
        <div 
          className="relative preserve-3d w-full aspect-square md:aspect-auto md:h-[680px]"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: 'rotateX(5deg) rotateY(0deg)'
          }}
        >
          {/* 外发光边框 */}
          <div 
            className="absolute -inset-2 rounded-lg opacity-50"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.3), rgba(179, 0, 255, 0.3))',
              filter: 'blur(10px)'
            }}
          />
          
          {/* 4x4 网格布局 */}
          <div 
            className="relative w-full h-full grid grid-cols-4 grid-rows-4 gap-[2px] rounded-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(26, 11, 46, 0.9), rgba(13, 17, 23, 0.95))',
              border: '2px solid rgba(0, 243, 255, 0.3)',
              boxShadow: `
                inset 0 0 30px rgba(0, 243, 255, 0.1),
                0 0 20px rgba(0, 243, 255, 0.2),
                0 0 40px rgba(179, 0, 255, 0.1)
              `
            }}
          >
            {/* 12宫位 */}
            {EARTHLY_BRANCHES.map((branch) => {
              const palaceData = palaces.find((p: any) => p.earthlyBranch === branch);
              return (
                <div
                  key={branch}
                  className={`${GRID_MAPPING[branch]} relative`}
                  style={{
                    background: 'rgba(45, 27, 78, 0.4)'
                  }}
                >
                  <PalaceCell
                    palace={palaceData}
                    horoscope={horoscope}
                    earthlyBranchOfBodyPalace={earthlyBranchOfBodyPalace}
                    birthYearStem={birthYearStem}
                    decadalStem={decadalStem}
                    yearlyStem={yearlyStem}
                  />
                </div>
              );
            })}
            
            {/* 中心信息区域 */}
            <div 
              className="col-start-2 col-span-2 row-start-2 row-span-2 relative z-10"
              style={{
                background: 'rgba(5, 5, 8, 0.8)'
              }}
            >
              <CenterInfo
                astrolabe={astrolabe}
                horoscope={horoscope}
              />
            </div>
          </div>
          
          {/* 扫描线效果 */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 243, 255, 0.02) 2px, rgba(0, 243, 255, 0.02) 4px)'
            }}
          />
        </div>
      </div>
    </div>
  );
}
