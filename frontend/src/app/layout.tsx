import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "AI 紫微斗数 Pro | Oriental Cyber Divination",
  description: "融合东方玄学与现代AI的智能紫微斗数命理分析应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Orbitron:wght@400;500;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-[#050508] text-[#e0f0f0] overflow-x-hidden">
        {/* 星空背景 */}
        <StarField />
        
        {/* 扫描线效果 */}
        <ScanLines />
        
        {/* 主内容 */}
        <main className="relative z-10">
          {children}
        </main>
        
        {/* 角落装饰 */}
        <CornerDecorations />
        
        <Analytics />
      </body>
    </html>
  );
}

// 星空背景组件
function StarField() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* 基础渐变背景 */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(179, 0, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(0, 243, 255, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(45, 27, 78, 0.4) 0%, transparent 70%),
            linear-gradient(180deg, #050508 0%, #0d1117 50%, #050508 100%)
          `
        }}
      />
      
      {/* 星星 */}
      {[...Array(100)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            width: Math.random() * 3 + 'px',
            height: Math.random() * 3 + 'px',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            background: Math.random() > 0.5 ? '#00f3ff' : '#ff00ff',
            opacity: Math.random() * 0.5 + 0.2,
            animationDelay: Math.random() * 3 + 's',
            animationDuration: (Math.random() * 2 + 2) + 's',
          }}
        />
      ))}
      
      {/* 八卦图案装饰 */}
      <div 
        className="absolute top-10 right-10 w-32 h-32 opacity-10"
        style={{
          background: `
            radial-gradient(circle, transparent 40%, rgba(0, 243, 255, 0.3) 41%, rgba(0, 243, 255, 0.3) 59%, transparent 60%),
            linear-gradient(90deg, transparent 48%, rgba(0, 243, 255, 0.3) 49%, rgba(0, 243, 255, 0.3) 51%, transparent 52%)
          `,
          borderRadius: '50%',
          transform: 'rotate(45deg)',
        }}
      />
      
      {/* 底部光晕 */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]"
        style={{
          background: 'radial-gradient(ellipse, rgba(0, 243, 255, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  );
}

// 扫描线效果
function ScanLines() {
  return (
    <div 
      className="fixed inset-0 z-[5] pointer-events-none opacity-30"
      style={{
        background: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 243, 255, 0.03) 2px,
            rgba(0, 243, 255, 0.03) 4px
          )
        `,
      }}
    />
  );
}

// 角落装饰
function CornerDecorations() {
  return (
    <>
      {/* 左上角 */}
      <div className="fixed top-4 left-4 z-20 pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path 
            d="M0 20 L0 0 L20 0" 
            stroke="#00f3ff" 
            strokeWidth="2"
            strokeOpacity="0.5"
          />
          <circle cx="8" cy="8" r="2" fill="#00f3ff" fillOpacity="0.5" />
        </svg>
      </div>
      
      {/* 右上角 */}
      <div className="fixed top-4 right-4 z-20 pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path 
            d="M40 0 L60 0 L60 20" 
            stroke="#ff00ff" 
            strokeWidth="2"
            strokeOpacity="0.5"
          />
          <circle cx="52" cy="8" r="2" fill="#ff00ff" fillOpacity="0.5" />
        </svg>
      </div>
      
      {/* 左下角 */}
      <div className="fixed bottom-4 left-4 z-20 pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path 
            d="M0 40 L0 60 L20 60" 
            stroke="#ff00ff" 
            strokeWidth="2"
            strokeOpacity="0.5"
          />
          <circle cx="8" cy="52" r="2" fill="#ff00ff" fillOpacity="0.5" />
        </svg>
      </div>
      
      {/* 右下角 */}
      <div className="fixed bottom-4 right-4 z-20 pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path 
            d="M40 60 L60 60 L60 40" 
            stroke="#00f3ff" 
            strokeWidth="2"
            strokeOpacity="0.5"
          />
          <circle cx="52" cy="52" r="2" fill="#00f3ff" fillOpacity="0.5" />
        </svg>
      </div>
    </>
  );
}
