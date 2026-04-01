
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ComparisonSlider from './components/ComparisonSlider';
import { INTERIOR_STYLES } from './constants';
import { InteriorStyle, TransformationResult } from './types';
import { transformRoomImage } from './services/geminiService';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  // UI State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<InteriorStyle>(InteriorStyle.NEW_CHINESE);
  const [imageAspectRatio, setImageAspectRatio] = useState<string>("1:1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TransformationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // SaaS Integration State
  const [userId, setUserId] = useState<string | null>(null);
  const [toolId, setToolId] = useState<string | null>(null);
  const [userIntegral, setUserIntegral] = useState<number | null>(null);
  const [toolIntegral, setToolIntegral] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  
  // API Key Selection State
  const [hasSelectedKey, setHasSelectedKey] = useState<boolean>(false);
  const [isCheckingKey, setIsCheckingKey] = useState<boolean>(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SAAS_INIT') {
        const { userId: rawUserId, toolId: rawToolId } = event.data;
        
        // Filter out "null" or "undefined" strings as per API_SPEC.md
        const cleanUserId = (rawUserId === "null" || rawUserId === "undefined") ? null : rawUserId;
        const cleanToolId = (rawToolId === "null" || rawToolId === "undefined") ? null : rawToolId;
        
        if (cleanUserId) setUserId(cleanUserId);
        if (cleanToolId) setToolId(cleanToolId);
        
        console.log("SaaS Init received:", { userId: cleanUserId, toolId: cleanToolId });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const launchTool = async () => {
      if (!userId || !toolId) return;

      try {
        const response = await fetch('/api/tool/launch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, toolId })
        });
        const result = await response.json();
        if (result.success) {
          setUserIntegral(result.data.user.integral);
          setToolIntegral(result.data.tool.integral);
          setUserName(result.data.user.name);
        }
      } catch (err) {
        console.error("Failed to launch tool:", err);
      }
    };

    launchTool();
  }, [userId, toolId]);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasSelectedKey(hasKey);
        } else {
          // Fallback if not running in AI Studio environment
          setHasSelectedKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        setHasSelectedKey(true);
      } finally {
        setIsCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        // Assume success to mitigate race condition
        setHasSelectedKey(true);
      }
    } catch (e) {
      console.error("Error opening select key dialog:", e);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setError(null);
    try {
      // Step 2: Verify Integral (if SaaS integrated)
      if (userId && toolId) {
        const verifyRes = await fetch('/api/tool/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, toolId })
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          setError(verifyData.message || "积分不足");
          setIsProcessing(false);
          return;
        }
      }

      const resultUrl = await transformRoomImage(selectedImage, selectedStyle, "空间", imageAspectRatio, (status) => {
        // Optional: you could add a progress state here if you want to show it in the UI
      });
      
      setResult({
        originalUrl: selectedImage,
        resultUrl,
        timestamp: Date.now()
      });

      // Step 3: Consume Integral (if SaaS integrated)
      if (userId && toolId) {
        const consumeRes = await fetch('/api/tool/consume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, toolId })
        });
        const consumeData = await consumeRes.json();
        if (consumeData.success) {
          setUserIntegral(consumeData.data.currentIntegral);
        }
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || String(err);
      setError(`图像转换失败: ${errorMessage}`);
      
      if (errorMessage.includes("API key not valid") || errorMessage.includes("API_KEY_INVALID")) {
        setHasApiKey(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    alert('支付成功！');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setResult(null);
        setError(null);

        // Calculate aspect ratio
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          if (ratio > 1.5) setImageAspectRatio("16:9");
          else if (ratio > 1.1) setImageAspectRatio("4:3");
          else if (ratio > 0.8) setImageAspectRatio("1:1");
          else if (ratio > 0.6) setImageAspectRatio("3:4");
          else setImageAspectRatio("9:16");
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.resultUrl;
    link.download = `禅艺装修设计-${selectedStyle}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isCheckingKey && !hasSelectedKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfcf9] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-stone-100">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-4 font-serif-sc">需要授权 API Key</h2>
          <p className="text-stone-600 mb-6 text-sm">
            本应用使用了谷歌最新的高级图像生成模型 (gemini-3.1-flash-image-preview)。您需要选择一个启用了结算 (Billing) 的 Google Cloud 项目才能继续。
          </p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm block mb-8">
            了解如何开启结算 (Billing)
          </a>
          <button
            onClick={handleSelectKey}
            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-stone-800 transition-colors shadow-lg"
          >
            选择 API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcf9]">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
              <h2 className="text-lg font-bold text-stone-900 mb-6 font-serif-sc">1. 选择装修风格A</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {INTERIOR_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyle(style.id);
                      if (result) setResult(null);
                    }}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left group ${
                      selectedStyle === style.id 
                        ? 'border-stone-900 bg-stone-50 ring-4 ring-stone-900/5' 
                        : 'border-stone-100 bg-white hover:border-stone-200'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-stone-100">
                      <img src={style.preview} alt={style.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-stone-900 text-sm truncate">{style.name}</span>
                        {style.keywords && (
                          <span className="text-[9px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold whitespace-nowrap">
                            {style.keywords}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-1 leading-tight">{style.description}</p>
                    </div>
                    {selectedStyle === style.id && (
                      <div className="w-5 h-5 bg-stone-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {userIntegral !== null && (
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span className="text-sm font-medium text-stone-600">剩余积分</span>
                </div>
                <span className="text-lg font-bold text-stone-900 font-serif-sc">{userIntegral}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedImage || isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                !selectedImage || isProcessing 
                  ? 'bg-stone-300 cursor-not-allowed' 
                  : 'bg-stone-900 hover:bg-stone-800 hover:shadow-xl active:scale-95'
              }`}
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  智能设计中...
                </>
              ) : (
                <>生成装修方案</>
              )}
            </button>
            
            {!hasApiKey && (
              <div className="w-full py-3 rounded-xl font-bold text-red-600 bg-red-50 border border-red-200 text-center text-sm">
                请在右上角设置中检查您的 GEMINI_API_KEY
              </div>
            )}
          </div>

          {/* Main Display Area */}
          <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
            {!result ? (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-stone-200 aspect-[4/3] flex flex-col items-center justify-center p-8 transition-colors hover:border-stone-300 relative overflow-hidden group">
                {selectedImage ? (
                  <div className="w-full h-full relative">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-colors text-stone-900"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-white text-sm font-medium">原图实拍 (毛坯房)</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>
                    <p className="text-stone-900 text-xl font-bold mb-2">上传您的毛坯房照片</p>
                    <p className="text-stone-500 text-sm mb-8 max-w-xs text-center">我们将在保持原始建筑结构的基础上，为您叠加全覆盖的精美装修方案。</p>
                    <input
                      type="file"
                      id="room-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <label
                      htmlFor="room-upload"
                      className="bg-stone-900 text-white px-10 py-4 rounded-full font-bold hover:bg-stone-800 transition-colors cursor-pointer shadow-xl flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      选择照片
                    </label>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <ComparisonSlider beforeUrl={result.originalUrl} afterUrl={result.resultUrl} />
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-stone-900 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">AI 智能设计</span>
                      <h3 className="font-bold text-stone-900 font-serif-sc text-lg">{selectedStyle}</h3>
                    </div>
                    <p className="text-stone-500 text-sm italic">已严格保留原始建筑结构，并全面覆盖水泥表面。</p>
                  </div>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <button 
                      onClick={handleDownload}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-900 text-white hover:bg-stone-800 transition-all px-6 py-3 rounded-xl shadow-lg hover:shadow-xl active:scale-95"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                       <span className="font-bold">下载无水印高清图</span>
                    </button>
                    <button onClick={() => setResult(null)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-stone-100 text-stone-600 hover:text-stone-900 px-6 py-3 rounded-xl border border-stone-200 transition-all hover:bg-stone-200">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      <span className="font-bold">重新设计</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center gap-3 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setShowPayment(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2 font-serif-sc">额度不足</h3>
              <p className="text-stone-500 text-sm mb-6">今日免费10次已用完。支付100元即可获得100次永久有效额度。</p>
              
              <div className="bg-stone-50 p-4 rounded-2xl mb-6 flex flex-col items-center">
                <div className="w-48 h-48 bg-white border border-stone-200 rounded-xl flex items-center justify-center mb-2 relative group">
                  {/* Mock QR Code */}
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=alipay_payment_mock_100rmb" 
                    alt="支付宝收款码"
                    className="w-40 h-40"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 cursor-pointer" onClick={handlePaymentSuccess}>
                    <p className="text-xs font-bold text-stone-900">模拟支付(点击完成)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 14.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V1a.5.5 0 0 0-.5-.5H.5A.5.5 0 0 0 0 1v13.5zM1.5 2h13v11h-13V2z"/>
                    <path d="M5.5 10.5h5v1h-5v-1z"/>
                  </svg>
                  <span className="text-xs font-bold">支付宝扫码支付</span>
                </div>
              </div>

              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className="text-3xl font-bold text-stone-900 font-serif-sc">100</span>
                <span className="text-stone-500 font-medium">元</span>
              </div>

              <p className="text-[10px] text-stone-400">支付完成后额度将自动充值到您的账户</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
