
import React, { useState, useRef, useEffect } from 'react';

interface ComparisonSliderProps {
  beforeUrl: string;
  afterUrl: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ beforeUrl, afterUrl }) => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const relativeX = x - rect.left;
    const newPosition = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    setPosition(newPosition);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // 仅允许鼠标左键点击拖拽
    if ('button' in e && e.button !== 0) return;
    setIsDragging(true);
  };

  const handleEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    } else {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-ew-resize group shadow-2xl bg-stone-100 select-none border border-stone-200"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
    >
      {/* 装修后图像 */}
      <img 
        src={afterUrl} 
        alt="装修后" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      
      {/* 装修前图像 (裁剪显示) */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-10"
        style={{ width: `${position}%` }}
      >
        <img 
          src={beforeUrl} 
          alt="毛坯房" 
          className="absolute inset-0 w-[100vw] h-full object-cover max-w-none"
          style={{ width: containerRef.current?.offsetWidth }}
        />
        <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1.5 text-xs rounded-full uppercase tracking-widest font-bold backdrop-blur-sm">
          原图 (毛坯房)
        </div>
      </div>

      {/* 装修后标签 */}
      <div className="absolute top-4 right-4 bg-stone-900/60 text-white px-3 py-1.5 text-xs rounded-full uppercase tracking-widest font-bold pointer-events-none backdrop-blur-sm z-20">
        AI 装修效果
      </div>

      {/* 滑块手柄 */}
      <div 
        className={`absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-[0_0_15px_rgba(0,0,0,0.3)] z-30 pointer-events-none`}
        style={{ left: `${position}%` }}
      >
        <div className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white/50 transition-transform ${isDragging ? 'scale-110' : 'group-hover:scale-105'}`}>
          <div className="flex gap-1.5">
            <div className={`w-1 h-4 bg-stone-400 rounded-full transition-colors ${isDragging ? 'bg-stone-900' : ''}`}></div>
            <div className={`w-1 h-4 bg-stone-400 rounded-full transition-colors ${isDragging ? 'bg-stone-900' : ''}`}></div>
          </div>
        </div>
      </div>
      
      {/* 交互提示 */}
      {!isDragging && (
        <div className="absolute inset-x-0 bottom-12 flex justify-center pointer-events-none z-40">
          <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-medium animate-bounce border border-white/20">
            按住左键拖动对比
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonSlider;
