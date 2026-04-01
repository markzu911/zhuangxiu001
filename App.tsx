
import React, { useState, useEffect } from 'react';
import { transformRoomImage, InteriorStyle } from './services/geminiService';

const STYLES = [
  { id: InteriorStyle.NEW_CHINESE, name: "新中式", description: "现代中式，极简线条，胡桃木色，优雅平衡。" },
  { id: InteriorStyle.CLASSICAL, name: "古典中式", description: "红木家具，格栅屏风，丝绸质感，传统韵味。" },
  { id: InteriorStyle.LIGHT_LUXURY, name: "轻奢风", description: "高品质材质，金属点缀，精致优雅。" },
  { id: InteriorStyle.FRENCH, name: "法式风", description: "浪漫雕花，柔和色调，复古家具，艺术气息。" },
  { id: InteriorStyle.MODERN_MINIMALIST, name: "现代简约", description: "黑白灰调，利落线条，通透空间，功能至上。" }
];

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>(InteriorStyle.NEW_CHINESE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setResult(null);
        setError(null);

        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          if (ratio > 1.5) setAspectRatio("16:9");
          else if (ratio > 1.1) setAspectRatio("4:3");
          else if (ratio > 0.8) setAspectRatio("1:1");
          else if (ratio > 0.6) setAspectRatio("3:4");
          else setAspectRatio("9:16");
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setError(null);
    try {
      const resultUrl = await transformRoomImage(selectedImage, selectedStyle, aspectRatio);
      setResult(resultUrl);
    } catch (err: any) {
      console.error(err);
      setError(`转换失败: ${err.message || "请检查 API Key 配置"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfcf9] text-stone-900 font-sans selection:bg-stone-200">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-serif-sc">禅艺·AI 装修设计</h1>
        </div>
        <div className="text-xs text-stone-400 uppercase tracking-widest font-medium">Core Edition v2.0</div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Controls */}
        <div className="lg:col-span-4 space-y-8">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-6">1. 选择装修风格</h2>
            <div className="grid gap-3">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedStyle === style.id 
                      ? 'border-stone-900 bg-stone-50 ring-4 ring-stone-900/5' 
                      : 'border-stone-100 bg-white hover:border-stone-200'
                  }`}
                >
                  <div className="font-bold text-stone-900 mb-1">{style.name}</div>
                  <div className="text-xs text-stone-500 leading-relaxed">{style.description}</div>
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={handleGenerate}
            disabled={!selectedImage || isProcessing}
            className={`w-full py-5 rounded-2xl font-bold text-white transition-all shadow-xl flex items-center justify-center gap-3 ${
              !selectedImage || isProcessing 
                ? 'bg-stone-300 cursor-not-allowed' 
                : 'bg-stone-900 hover:bg-stone-800 active:scale-95'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在智能渲染...
              </>
            ) : (
              "生成装修方案"
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              {error}
            </div>
          )}
        </div>

        {/* Right: Display */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden aspect-[4/3] relative group">
            {!selectedImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                <h3 className="text-xl font-bold mb-3">上传毛坯房实拍</h3>
                <p className="text-stone-500 text-sm max-w-xs mb-10 leading-relaxed">我们将严格保留原始建筑结构，为您叠加全覆盖的精美装修方案。</p>
                <input type="file" id="upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                <label htmlFor="upload" className="bg-stone-900 text-white px-12 py-4 rounded-full font-bold hover:bg-stone-800 transition-all cursor-pointer shadow-xl active:scale-95">
                  选择照片
                </label>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div className="flex-grow relative overflow-hidden">
                  <img 
                    src={result || selectedImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {result && (
                    <div className="absolute top-6 left-6 bg-stone-900/80 backdrop-blur text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                      AI 渲染结果
                    </div>
                  )}
                  {!result && (
                    <div className="absolute top-6 left-6 bg-white/80 backdrop-blur text-stone-900 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                      原图实拍
                    </div>
                  )}
                </div>
                {result && (
                  <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
                    <button onClick={() => setResult(null)} className="text-stone-500 text-sm font-bold hover:text-stone-900 transition-colors">
                      重新生成
                    </button>
                    <a 
                      href={result} 
                      download="禅艺设计方案.png"
                      className="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-stone-800 transition-all"
                    >
                      下载高清图
                    </a>
                  </div>
                )}
                {!result && (
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-6 right-6 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:bg-white transition-all text-stone-900"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 text-center border-t border-stone-100">
        <p className="text-stone-400 text-xs font-medium tracking-widest uppercase">
          Powered by Gemini 3.1 Flash Image Preview
        </p>
      </footer>
    </div>
  );
};

export default App;
