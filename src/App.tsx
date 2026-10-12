import React, { useState } from 'react';
import { 
  Icons, 
  OPTIONS, 
  getMimeTypeFromBase64, 
  getBase64DataOnly, 
  fetchGeminiContent,
  getGeminiApiKey,
  setGeminiApiKey
} from './types.tsx';
import { ImageCropperModal } from './components/ImageCropperModal.tsx';
import { TTSModule } from './components/TTSModule.tsx';
import { DesignModule } from './components/DesignModule.tsx';
import { AnimationModule } from './components/AnimationModule.tsx';
import { FilmModule } from './components/FilmModule.tsx';

const Toast = ({ message, type = 'info', onClose }: { message: string; type?: string; onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000);
    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  const colors: Record<string, string> = {
    info: 'bg-slate-800 border-slate-700 text-white',
    success: 'bg-emerald-900 border-emerald-700 text-white',
    error: 'bg-rose-900 border-rose-700 text-white'
  };

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-xl border shadow-xl flex items-center space-x-3 transition-all z-50 animate-in slide-in-from-bottom-5 ${colors[type] || colors.info}`}>
      {type === 'success' && <Icons.Check />}
      {type === 'error' && <Icons.Alert />}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default function App() {
  const [activeAppMenu, setActiveAppMenu] = useState('prompt');
  const [activeOutputTab, setActiveOutputTab] = useState('image-prompt');
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());

  const [productImgs, setProductImgs] = useState<any[]>([null, null, null]);
  const [charType, setCharType] = useState('none'); 
  const [autoChar, setAutoChar] = useState({ gender: 'Wanita', age: 'Dewasa', hijab: 'Tidak' });
  const [charImg, setCharImg] = useState<any>(null);
  
  const [cropData, setCropData] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [promptText, setPromptText] = useState('');

  const [config, setConfig] = useState({
    background: OPTIONS.backgrounds[0],
    angle: OPTIONS.angles[0],
    style: OPTIONS.styles[0],
    ratio: '9:16',
    duration: '15',
    textOverlay: true,
    voiceOver: true,
    voiceOverType: 'narrator',
    storyboardStyle: OPTIONS.storyboardStyles[0],
    storyboardParts: '1',
    storyboardGrids: '4 Panel (Grid 2x2)'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const [imagePrompt, setImagePrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [hookText, setHookText] = useState('');
  const [captionText, setCaptionText] = useState('');
  const [hashtagsText, setHashtagsText] = useState('');

  const showToast = (message: string, type = 'info') => setToast({ message, type });

  const handleImageUpload = async (e: any, type: string, index = 0) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      showToast('Format tidak didukung. Gunakan JPG, PNG, atau WebP.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5MB.', 'error');
      return;
    }

    try {
      const previewUrl = URL.createObjectURL(file);
      setCropData({ file, preview: previewUrl, targetType: type, targetIndex: index });
      e.target.value = null;
    } catch (err) {
      showToast('Gagal membaca gambar.', 'error');
    }
  };

  const handleCropSave = (croppedBase64: string) => {
    const imgData = {
      file: cropData.file, 
      preview: croppedBase64, 
      base64: croppedBase64
    };

    if (cropData.targetType === 'product') {
      const newProds = [...productImgs];
      newProds[cropData.targetIndex] = imgData;
      setProductImgs(newProds);
    } else {
      setCharImg(imgData);
    }
    setCropData(null);
  };

  const removeProduct = (index: number) => {
    const newProds = [...productImgs];
    newProds[index] = null;
    setProductImgs(newProds);
  };

  const generateAllPrompts = async () => {
    const hasImage = productImgs.some(p => p !== null);
    if (!hasImage && !productName.trim() && !promptText.trim()) {
      showToast('Masukkan nama produk / deskripsi atau upload foto produk.', 'error');
      return;
    }

    setIsGenerating(true);
    setImagePrompt('');
    setNegativePrompt('');
    setVideoPrompt('');
    setHookText('');
    setCaptionText('');
    setHashtagsText('');

    try {
      const isStoryboard = config.style === 'Storyboard';
      const durationSeconds = parseInt(config.duration) || 15;
      
      let characterContext = "";
      if (charType === 'upload' && charImg) {
        characterContext = "Model: A person matching the reference face provided. Ensure detailed demographic and appearance descriptors.";
      } else if (charType === 'auto') {
        characterContext = `Model: A ${autoChar.age === 'Muda' ? 'young' : 'mature'} Indonesian ${autoChar.gender === 'Pria' ? 'man' : 'woman'}${autoChar.hijab === 'Ya' ? ' wearing an elegant modern hijab' : ''}.`;
      } else {
        characterContext = "Model: NO HUMANS, NO FACES, NO PEOPLE, NO HANDS. Clean inanimate product focus only.";
      }

      let audioInstruction = "";
      if (config.textOverlay && config.voiceOver) {
        audioInstruction = `Include on-screen Indonesian hook text overlays AND an Indonesian voice over script (${config.voiceOverType === 'narrator' ? 'off-screen narrator' : 'speaking character'}).`;
      } else if (config.textOverlay) {
        audioInstruction = `Include on-screen Indonesian hook text overlays only. NO voice over.`;
      } else if (config.voiceOver) {
        audioInstruction = `Include an Indonesian voice over script for ${durationSeconds} seconds (${config.voiceOverType}). NO text overlays.`;
      } else {
        audioInstruction = `NO text overlays and NO voice over. Pure visual motions.`;
      }

      const systemPrompt = `You are Oval Studio's Lead Creative Director, Prompt Engineer, and Social Media Strategist.
Your job is to directly generate the complete professional prompt package for an advertising campaign:
1. TEXT-TO-IMAGE PROMPT: English prompt for Midjourney v6 / Flux / Stable Diffusion / DALL-E. Ultra-detailed, photorealistic commercial photography, lighting, angle, materials, quality tags. Include aspect ratio parameter (${config.ratio}).
2. NEGATIVE PROMPT: Comprehensive English negative tags to prevent flaws.
3. TEXT-TO-VIDEO PROMPT: Step-by-step motion prompt for Kling / Runway Gen-3 / Luma Dream Machine / Sora. Duration: ${durationSeconds}s, aspect ratio: ${config.ratio}. Detailed camera movements, character/product interaction, lighting, transitions, and audio/text overlay scripts as instructed.
4. SOCIAL MEDIA COPYWRITING: In Indonesian. Catchy Hook (max 10 words), engaging Caption with emojis, and 5-8 relevant trending Hashtags.

Context:
- Product Name/Details: "${productName || 'Advertising Product'}"
- User Notes: "${promptText || 'High-end advertising'}"
- Visual Style: ${config.style} ${isStoryboard ? `(Storyboard ${config.storyboardGrids}, theme: ${config.storyboardStyle})` : ''}
- Camera Angle: ${config.angle}
- Environment/Background: ${config.background}
- Aspect Ratio: ${config.ratio}
- Duration: ${durationSeconds}s
- ${characterContext}
- Audio/Text Overlay Rules: ${audioInstruction}`;

      const userParts: any[] = [
        { text: "Generate the complete prompt and copywriting package now." }
      ];

      const validProds = productImgs.filter(p => p !== null);
      validProds.forEach((p, idx) => {
        userParts.push({ text: `[Product Reference Image ${idx + 1}]` });
        userParts.push({
          inlineData: {
            mimeType: getMimeTypeFromBase64(p.base64),
            data: getBase64DataOnly(p.base64)
          }
        });
      });

      if (charType === 'upload' && charImg) {
        userParts.push({ text: "[Model Face Reference Image]" });
        userParts.push({
          inlineData: {
            mimeType: getMimeTypeFromBase64(charImg.base64),
            data: getBase64DataOnly(charImg.base64)
          }
        });
      }

      const payload = {
        contents: [{ role: "user", parts: userParts }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              imagePrompt: { type: "STRING", description: "Ultra detailed Text-to-Image prompt in English ending with aspect ratio." },
              negativePrompt: { type: "STRING", description: "Comprehensive negative prompt tags in English." },
              videoPrompt: { type: "STRING", description: "Detailed Text-to-Video motion prompt with camera direction, scenes, and audio/text scripts." },
              hook: { type: "STRING", description: "Catchy Indonesian social media hook title." },
              caption: { type: "STRING", description: "Engaging Indonesian caption with emojis." },
              hashtags: { type: "STRING", description: "Space-separated hashtags." }
            },
            required: ["imagePrompt", "negativePrompt", "videoPrompt", "hook", "caption", "hashtags"]
          }
        }
      };

      const data = await fetchGeminiContent('v1beta/models/gemini-3.8-flash:generateContent', payload);
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("No response from AI");

      const parsed = JSON.parse(rawText);
      setImagePrompt(parsed.imagePrompt || '');
      setNegativePrompt(parsed.negativePrompt || '');
      setVideoPrompt(parsed.videoPrompt || '');
      setHookText(parsed.hook || '');
      setCaptionText(parsed.caption || '');
      setHashtagsText(parsed.hashtags || '');

      showToast('Semua prompt & copywriting berhasil dibuat!', 'success');
    } catch (err: any) {
      console.error(err);
      if (err.message === 'API_KEY_REQUIRED') {
        setShowKeyModal(true);
        showToast('Kunci Gemini API diperlukan. Silakan masukkan kunci API.', 'info');
      } else {
        showToast(err.message || 'Gagal menghasilkan prompt. Silakan coba lagi.', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Disalin ke clipboard!', 'success');
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast('Disalin ke clipboard!', 'success');
      } catch (err) {
        showToast('Gagal menyalin.', 'error');
      }
      document.body.removeChild(textArea);
    });
  };

  const exportAllToTxt = () => {
    if (!imagePrompt && !videoPrompt) return;
    const content = `OVAL STUDIO - PROMPT & COPYWRITING PACKAGE
==================================================
Produk: ${productName || 'Produk Iklan'}
Gaya: ${config.style} | Rasio: ${config.ratio} | Durasi: ${config.duration}s
==================================================

[1] PROMPT TEXT-TO-IMAGE (Midjourney / Flux / SD)
--------------------------------------------------
${imagePrompt}

NEGATIVE PROMPT:
${negativePrompt}

==================================================
[2] PROMPT TEXT-TO-VIDEO (Kling / Runway / Luma / Sora)
--------------------------------------------------
${videoPrompt}

==================================================
[3] SOCIAL MEDIA COPYWRITING
--------------------------------------------------
HOOK:
${hookText}

CAPTION:
${captionText}

HASHTAGS:
${hashtagsText}
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OvalStudio_Prompts_${Date.now()}.txt`;
    link.click();
    showToast('File prompt berhasil di-export ke TXT!', 'success');
  };

  const UploaderBox = ({ title, imgData, onUpload, onRemove, required, id }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-purple-500/50 transition-colors">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-slate-200 flex items-center text-sm">
          {title} {required && <span className="text-purple-400 text-xs ml-1 font-normal">(Rekomendasi)</span>}
        </h3>
        {imgData && (
          <button onClick={onRemove} className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer">
            <Icons.Trash />
          </button>
        )}
      </div>
      
      {!imgData ? (
        <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center relative hover:bg-white/5 transition-colors cursor-pointer group">
          <input type="file" id={id} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/jpeg,image/png,image/webp" onChange={(e) => onUpload(e)} />
          <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none text-slate-400 group-hover:text-purple-400 transition-colors">
            <Icons.Upload />
            <div className="text-xs">
              <span className="font-semibold text-white">Upload Foto</span>
            </div>
            <p className="text-[10px] text-slate-500">Foto produk opsional</p>
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden group border border-white/10 bg-black/50 aspect-square flex items-center justify-center">
          <img src={imgData.preview} alt={title} className="max-h-full max-w-full object-contain" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <label htmlFor={`replace-${id}`} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-lg cursor-pointer text-xs font-medium transition-colors">
              Ganti
            </label>
            <input type="file" id={`replace-${id}`} className="hidden" accept="image/*" onChange={(e) => onUpload(e)} />
          </div>
        </div>
      )}
    </div>
  );

  const APP_MENUS = [
    { id: 'prompt', label: 'Prompt Generator', icon: Icons.Wand },
    { id: 'animasi', label: 'Animasi', icon: Icons.Animation },
    { id: 'film', label: 'Film', icon: Icons.Film },
    { id: 'desain', label: 'Desain', icon: Icons.Design },
    { id: 'tts', label: 'Teks to Suara', icon: Icons.Audio },
  ];

  const hasGeneratedPrompts = Boolean(imagePrompt || videoPrompt || hookText);

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-300 font-sans selection:bg-purple-500/30 overflow-hidden">
      <aside className="w-64 bg-[#0a0c10] border-r border-white/10 flex flex-col shrink-0 z-20 hidden md:flex">
        <div className="p-6 flex items-center space-x-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
            <span className="text-white font-bold text-sm tracking-wider">OS</span>
          </div>
          <div>
            <h1 className="text-white font-bold tracking-wide text-base">OVAL STUDIO</h1>
            <p className="text-[10px] text-purple-400 font-medium">AI Prompt Engine</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 px-2 mt-2">Menu Aplikasi</h2>
          {APP_MENUS.map((menu) => (
            <button
              key={menu.id}
              onClick={() => setActiveAppMenu(menu.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${
                activeAppMenu === menu.id 
                  ? 'bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-400 border border-purple-500/30 font-semibold shadow-lg shadow-purple-900/10' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              }`}
            >
              <menu.icon />
              <span className="text-sm">{menu.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/10 space-y-3">
          <button
            onClick={() => { setApiKeyInput(getGeminiApiKey()); setShowKeyModal(true); }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors border border-white/5 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Icons.Pen className="w-3.5 h-3.5 text-purple-400" />
              <span>Pengaturan API Key</span>
            </span>
            <span className={`w-2 h-2 rounded-full ${getGeminiApiKey() ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          </button>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
            <p className="text-[11px] text-slate-400 font-medium mb-1">Mode Kerja</p>
            <div className="flex items-center justify-center space-x-2 text-[11px] text-purple-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>Direct Prompt Engine</span>
            </div>
          </div>
        </div>
      </aside>

      {cropData && (
        <ImageCropperModal 
          data={cropData} 
          onSave={handleCropSave} 
          onCancel={() => setCropData(null)} 
        />
      )}

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0c10] border-b border-white/10 z-30 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">OS</span>
          </div>
          <h1 className="text-white font-bold text-sm">OVAL STUDIO</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setApiKeyInput(getGeminiApiKey()); setShowKeyModal(true); }}
            className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-xs text-purple-400"
            title="Pengaturan API Key"
          >
            <Icons.Pen className="w-3.5 h-3.5" />
          </button>
          <select 
            className="bg-black/40 border border-white/10 rounded-lg p-1.5 text-xs text-slate-200 outline-none max-w-[130px]"
            value={activeAppMenu}
            onChange={(e) => setActiveAppMenu(e.target.value)}
          >
            {APP_MENUS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative h-full overflow-hidden bg-[#050505] pt-16 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar relative">
          {activeAppMenu === 'prompt' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Icons.Wand /> Prompt & Copywriting Generator
                </h2>
                <p className="text-slate-400 text-sm mt-2">Buat prompt Text-to-Image (Midjourney/Flux), Text-to-Video (Kling/Runway), serta Copywriting iklan secara instan tanpa menunggu pembuatan visual.</p>
              </div>

              <section className="bg-[#0f111a] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Nama Produk / Topik Iklan</label>
                  <input 
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Contoh: Serum Wajah Glow Brightening, Kopi Arabika Premium, dsb..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Foto Produk Sebagai Referensi (Opsional)</label>
                    <span className="text-[11px] text-purple-400">AI menganalisis label & bentuk produk</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <UploaderBox 
                      id="product-upload-0"
                      title="Foto Utama" 
                      required={false}
                      imgData={productImgs[0]} 
                      onUpload={(e: any) => handleImageUpload(e, 'product', 0)} 
                      onRemove={() => removeProduct(0)} 
                    />
                    <UploaderBox 
                      id="product-upload-1"
                      title="Detail Tekstur/Sisi" 
                      required={false}
                      imgData={productImgs[1]} 
                      onUpload={(e: any) => handleImageUpload(e, 'product', 1)} 
                      onRemove={() => removeProduct(1)} 
                    />
                    <UploaderBox 
                      id="product-upload-2"
                      title="Kemasan / Box" 
                      required={false}
                      imgData={productImgs[2]} 
                      onUpload={(e: any) => handleImageUpload(e, 'product', 2)} 
                      onRemove={() => removeProduct(2)} 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Karakter / Model Manusia</label>
                  <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 rounded-xl border border-white/10 w-fit">
                    <button onClick={()=>setCharType('none')} className={`px-4 py-2 text-xs rounded-lg font-bold transition-all cursor-pointer ${charType === 'none' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Tanpa Model</button>
                    <button onClick={()=>setCharType('auto')} className={`px-4 py-2 text-xs rounded-lg font-bold transition-all cursor-pointer ${charType === 'auto' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Model AI (Otomatis)</button>
                    <button onClick={()=>setCharType('upload')} className={`px-4 py-2 text-xs rounded-lg font-bold transition-all cursor-pointer ${charType === 'upload' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Upload Wajah</button>
                  </div>
                  
                  {charType === 'auto' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 p-5 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-xl shadow-inner mt-3">
                      <div>
                        <label className="block text-xs font-medium text-purple-200 mb-1.5">Gender</label>
                        <select value={autoChar.gender} onChange={e=>setAutoChar({...autoChar, gender: e.target.value})} className="w-full bg-black/40 border border-purple-500/30 rounded-lg p-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer">
                          <option>Wanita</option>
                          <option>Pria</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-200 mb-1.5">Usia</label>
                        <select value={autoChar.age} onChange={e=>setAutoChar({...autoChar, age: e.target.value})} className="w-full bg-black/40 border border-purple-500/30 rounded-lg p-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer">
                          <option>Muda</option>
                          <option>Dewasa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-200 mb-1.5">Atribut (Berhijab)</label>
                        <select value={autoChar.hijab} onChange={e=>setAutoChar({...autoChar, hijab: e.target.value})} className="w-full bg-black/40 border border-purple-500/30 rounded-lg p-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer">
                          <option>Tidak</option>
                          <option>Ya</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {charType === 'upload' && (
                    <div className="animate-in fade-in slide-in-from-top-2 sm:w-1/3 mt-3">
                      <UploaderBox 
                        id="char-upload"
                        title="Upload Wajah Referensi" 
                        imgData={charImg} 
                        onUpload={(e: any) => handleImageUpload(e, 'char')} 
                        onRemove={() => setCharImg(null)} 
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Instruksi Aksi & Suasana Tambahan</label>
                  <textarea 
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Contoh: Nuansa mewah, tetesan air segar, pencahayaan golden hour, fokus pada hasil kulit glowing..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-20 custom-scrollbar"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Background</label>
                    <select 
                      value={config.background} onChange={(e) => setConfig({...config, background: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:border-purple-500 outline-none cursor-pointer"
                    >
                      {OPTIONS.backgrounds.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Angle</label>
                    <select 
                      value={config.angle} onChange={(e) => setConfig({...config, angle: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:border-purple-500 outline-none cursor-pointer"
                    >
                      {OPTIONS.angles.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Style</label>
                    <select 
                      value={config.style} onChange={(e) => setConfig({...config, style: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:border-purple-500 outline-none cursor-pointer"
                    >
                      {OPTIONS.styles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {config.style === 'Storyboard' && (
                  <div className="bg-purple-900/10 border border-purple-500/30 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-medium text-purple-200/70 mb-1.5">Gaya Storyboard</label>
                      <select 
                        value={config.storyboardStyle} onChange={(e) => setConfig({...config, storyboardStyle: e.target.value})}
                        className="w-full bg-black/40 border border-purple-500/20 rounded-lg p-2 text-sm text-purple-100 focus:ring-2 focus:ring-purple-500/50 outline-none cursor-pointer"
                      >
                        {OPTIONS.storyboardStyles.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-purple-200/70 mb-1.5">Panel / Grid Storyboard</label>
                      <select 
                        value={config.storyboardGrids} onChange={(e) => setConfig({...config, storyboardGrids: e.target.value})}
                        className="w-full bg-black/40 border border-purple-500/20 rounded-lg p-2 text-sm text-purple-100 focus:ring-2 focus:ring-purple-500/50 outline-none cursor-pointer"
                      >
                        {OPTIONS.storyboardGrids.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Aspect Ratio</label>
                    <select 
                      value={config.ratio} onChange={(e) => setConfig({...config, ratio: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500/50 outline-none cursor-pointer"
                    >
                      {OPTIONS.ratios.map(r => <option key={r.value} value={r.value}>{r.value} - {r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Durasi Video Target</label>
                    <select 
                      value={config.duration} onChange={(e) => setConfig({...config, duration: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500/50 outline-none cursor-pointer"
                    >
                      {OPTIONS.durations.map(d => <option key={d} value={d}>{d} Detik</option>)}
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-4">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={config.textOverlay}
                        onChange={(e) => setConfig({...config, textOverlay: e.target.checked})}
                        className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded-md bg-black/40 checked:bg-purple-500 checked:border-purple-500 transition-all cursor-pointer"
                      />
                      <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                        <Icons.Check />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Sertakan Teks Overlay (Hook Iklan)</span>
                    </div>
                  </label>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={config.voiceOver}
                          onChange={(e) => setConfig({...config, voiceOver: e.target.checked})}
                          className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded-md bg-black/40 checked:bg-purple-500 checked:border-purple-500 transition-all cursor-pointer"
                        />
                        <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                          <Icons.Check />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Sertakan Skrip Voice Over / Dialog</span>
                    </label>

                    {config.voiceOver && (
                      <div className="pl-8 flex space-x-4 animate-in fade-in slide-in-from-top-2">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="voType" 
                            value="narrator"
                            checked={config.voiceOverType === 'narrator'}
                            onChange={(e) => setConfig({...config, voiceOverType: e.target.value})}
                            className="w-4 h-4 accent-purple-500 bg-black/40 border-white/20 cursor-pointer"
                          />
                          <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Narator Off-screen</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="voType" 
                            value="lipsync"
                            checked={config.voiceOverType === 'lipsync'}
                            onChange={(e) => setConfig({...config, voiceOverType: e.target.value})}
                            className="w-4 h-4 accent-purple-500 bg-black/40 border-white/20 cursor-pointer"
                          />
                          <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Lipsync / Tokoh Berbicara</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={generateAllPrompts}
                    disabled={isGenerating}
                    className={`w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer
                      ${isGenerating
                        ? 'bg-slate-700 cursor-not-allowed opacity-70' 
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/25 active:scale-[0.98]'}`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Menganalisis & Menyusun Prompt Lengkap...</span>
                      </>
                    ) : (
                      <>
                        <Icons.Wand />
                        <span>Generate Prompts & Copywriting</span>
                      </>
                    )}
                  </button>
                </div>
              </section>

              {hasGeneratedPrompts && (
                <section className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Icons.Check /> Hasil Prompt Siap Pakai
                    </h3>
                    
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={exportAllToTxt}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Icons.Download /> Export Semua ke TXT
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                    <button
                      onClick={() => setActiveOutputTab('image-prompt')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 cursor-pointer
                        ${activeOutputTab === 'image-prompt' ? 'bg-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Icons.Text />
                      <span>Prompt Gambar (Text-to-Image)</span>
                    </button>
                    <button
                      onClick={() => setActiveOutputTab('video-prompt')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 cursor-pointer
                        ${activeOutputTab === 'video-prompt' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Icons.Video />
                      <span>Prompt Video (Text-to-Video)</span>
                    </button>
                    <button
                      onClick={() => setActiveOutputTab('copywriting')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center space-x-2 cursor-pointer
                        ${activeOutputTab === 'copywriting' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Icons.Pen />
                      <span>Copywriting Iklan</span>
                    </button>
                  </div>

                  {activeOutputTab === 'image-prompt' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-bold text-white">Master Prompt Text-to-Image</h4>
                            <p className="text-xs text-slate-400">Siap digunakan di Midjourney, Flux, Stable Diffusion, atau DALL-E.</p>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(imagePrompt)}
                            className="text-xs flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-pink-500/20 active:scale-95 cursor-pointer"
                          >
                            <Icons.Copy /> <span>Salin Master Prompt</span>
                          </button>
                        </div>

                        <div className="bg-[#1e1e2e] border border-pink-500/30 rounded-xl p-5 relative group">
                          <p className="font-mono text-sm leading-relaxed text-pink-100 whitespace-pre-wrap select-all">
                            {imagePrompt}
                          </p>
                        </div>

                        {negativePrompt && (
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-bold text-red-400 uppercase">Negative Prompt</h5>
                              <button 
                                onClick={() => copyToClipboard(negativePrompt)}
                                className="text-[11px] text-red-300 hover:text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Icons.Copy /> Salin Negative
                              </button>
                            </div>
                            <div className="bg-black/50 border border-red-500/20 rounded-xl p-4">
                              <p className="font-mono text-xs text-red-200 whitespace-pre-wrap leading-relaxed select-all">
                                {negativePrompt}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeOutputTab === 'video-prompt' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-bold text-white">Prompt Text-to-Video AI</h4>
                            <p className="text-xs text-slate-400">Gunakan di Kling AI, Runway Gen-3, Luma Dream Machine, atau Pika.</p>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(videoPrompt)}
                            className="text-xs flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
                          >
                            <Icons.Copy /> <span>Salin Prompt Video</span>
                          </button>
                        </div>

                        <div className="bg-[#1e1e2e] border border-indigo-500/30 rounded-xl p-5 overflow-hidden">
                          <div className="font-mono text-sm text-[#cdd6f4] leading-relaxed custom-scrollbar whitespace-pre-wrap select-all">
                            {videoPrompt}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeOutputTab === 'copywriting' && (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-white">Social Media Copywriting</h4>
                        <button 
                          onClick={() => copyToClipboard(`${hookText}\n\n${captionText}\n\n${hashtagsText}`)}
                          className="text-xs flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                        >
                          <Icons.Copy /> <span>Salin Semua Copy</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-[#1e1e2e] border border-white/10 rounded-xl p-5 relative group transition-colors hover:border-amber-500/50">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-bold text-amber-400 flex items-center space-x-2">
                              <span>🔥 Judul / Hook Iklan</span>
                            </h5>
                            <button 
                              onClick={() => copyToClipboard(hookText)}
                              className="text-[10px] flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Icons.Copy /> <span>Salin</span>
                            </button>
                          </div>
                          <p className="text-slate-200 text-sm font-medium">{hookText}</p>
                        </div>

                        <div className="bg-[#1e1e2e] border border-white/10 rounded-xl p-5 relative group transition-colors hover:border-sky-500/50">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-bold text-sky-400 flex items-center space-x-2">
                              <span>📝 Caption / Deskripsi Lengkap</span>
                            </h5>
                            <button 
                              onClick={() => copyToClipboard(captionText)}
                              className="text-[10px] flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Icons.Copy /> <span>Salin</span>
                            </button>
                          </div>
                          <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{captionText}</p>
                        </div>

                        <div className="bg-[#1e1e2e] border border-white/10 rounded-xl p-5 relative group transition-colors hover:border-emerald-500/50">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-bold text-emerald-400 flex items-center space-x-2">
                              <span>#️⃣ Trending Hashtags</span>
                            </h5>
                            <button 
                              onClick={() => copyToClipboard(hashtagsText)}
                              className="text-[10px] flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/15 text-white rounded-lg transition-colors cursor-pointer"
                            >
                              <Icons.Copy /> <span>Salin</span>
                            </button>
                          </div>
                          <p className="text-slate-200 text-sm text-emerald-200/80">{hashtagsText}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {activeAppMenu === 'desain' && (
            <div className="animate-in fade-in duration-300">
              <DesignModule showToast={showToast} />
            </div>
          )}

          {activeAppMenu === 'tts' && (
            <div className="animate-in fade-in duration-300 h-full">
              <TTSModule />
            </div>
          )}

          {activeAppMenu === 'animasi' && (
            <div className="animate-in fade-in duration-300 h-full">
              <AnimationModule showToast={showToast} />
            </div>
          )}

          {activeAppMenu === 'film' && (
            <div className="animate-in fade-in duration-300 h-full">
              <FilmModule showToast={showToast} />
            </div>
          )}
        </div>
      </main>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {showKeyModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Icons.Pen className="w-4 h-4 text-purple-400" /> Pengaturan Gemini API Key
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Jika aplikasi dijalankan di deployment publik (seperti Vercel atau domain Anda sendiri), Anda dapat menyimpan Gemini API Key Anda di sini. Kunci tersimpan secara lokal dan aman di browser Anda.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase block mb-1.5">Gemini API Key</label>
              <input 
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              {apiKeyInput && (
                <button
                  onClick={() => {
                    setGeminiApiKey('');
                    setApiKeyInput('');
                    showToast('API Key telah dihapus dari browser.', 'info');
                  }}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Hapus Kunci
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button 
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    setGeminiApiKey(apiKeyInput);
                    setShowKeyModal(false);
                    showToast('API Key berhasil disimpan!', 'success');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20 cursor-pointer"
                >
                  Simpan Kunci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.5);
        }
      `}} />
    </div>
  );
}
