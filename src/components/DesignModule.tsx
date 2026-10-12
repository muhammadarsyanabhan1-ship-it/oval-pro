import React, { useState } from 'react';
import { getApiUrl } from '../types.tsx';

export const DesignModule = ({ showToast }: { showToast: (msg: string, type?: string) => void }) => {
  const [idea, setIdea] = useState('');
  const [aspectRatio, setAspectRatio] = useState('--ar 1:1');
  const [designType, setDesignType] = useState('Infografis');
  const [language, setLanguage] = useState('Indonesia');
  const [customLanguage, setCustomLanguage] = useState(false);
  
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);
  const [ytData, setYtData] = useState<any>(null);
  const [selectedYtTitles, setSelectedYtTitles] = useState<number[]>([0]);
  
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('prompt');

  const handleTypeSelect = (type: string) => {
    setDesignType(type);
    if (type === 'Thumbnail') {
      setAspectRatio('--ar 16:9');
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast("Berhasil disalin ke clipboard!", "success");
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showToast("Berhasil disalin ke clipboard!", "success");
      } catch (err) {
        showToast("Gagal menyalin text", "error");
      }
      document.body.removeChild(textArea);
    });
  };

  const generateYoutubeMeta = async () => {
    if (idea.trim().length < 10) {
      showToast("Mohon masukkan ide minimal 10 karakter terlebih dahulu.", "error");
      return;
    }

    setIsGeneratingMeta(true);
    const systemPrompt = `Anda adalah YouTube Strategist dan SEO Expert profesional.
Tugas Anda adalah meriset dan memberikan paket metadata YouTube berdasarkan ide pengguna.
BERIKAN 5 JUDUL VIRAL: Harus clickbait namun relevan, mengundang rasa penasaran, menggunakan huruf kapital pada kata penting, dan emosional.
BERIKAN HOOK UNTUK TIAP JUDUL: Penjelasan visual/emosional mengapa judul ini menarik.
BERIKAN DESKRIPSI: Deskripsi video lengkap yang ramah SEO (3 paragraf singkat).
BERIKAN TAGS: Kata kunci relevan dipisahkan koma.
BERIKAN HASHTAGS: 3-5 hashtag utama.
SELURUH OUTPUT (Judul, Hook, Deskripsi, Tags, Hashtags) HARUS DITULIS DALAM BAHASA: ${language}.`;

    const payload = {
      contents: [{ parts: [{ text: `Ide Video: "${idea}"` }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            "titles": {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  "title": { type: "STRING", description: "Judul YouTube viral." },
                  "hook": { type: "STRING", description: "Hook visual/psikologis singkat." }
                },
                required: ["title", "hook"]
              }
            },
            "description": { type: "STRING" },
            "tags": { type: "STRING" },
            "hashtags": { type: "STRING" }
          },
          required: ["titles", "description", "tags", "hashtags"]
        }
      },
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const apiUrl = getApiUrl('v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent');

    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      const data = JSON.parse(result.candidates[0].content.parts[0].text);
      setYtData(data);
      setSelectedYtTitles([0]);
      showToast("Metadata YouTube berhasil digenerate!", "success");
    } catch (error) {
      console.error("YT Meta Error:", error);
      showToast("Gagal menghasilkan metadata. Coba lagi.", "error");
    } finally {
      setIsGeneratingMeta(false);
    }
  };

  const generateMainPrompt = async () => {
    if (idea.trim().length < 10) {
      showToast("Mohon masukkan ide minimal 10 karakter.", "error");
      return;
    }

    let specificContext = "";
    if (designType === 'Thumbnail') {
      if (selectedYtTitles.length === 0 || !ytData) {
        showToast("WAJIB: Klik 'Generate Judul & Metadata SEO' dan ceklist minimal 1 judul!", "error");
        return;
      }
      
      const selectedTitlesData = selectedYtTitles.map(idx => ytData.titles[idx]);
      specificContext = `\n\n[SANGAT PENTING - MULTIPLE THUMBNAIL YOUTUBE]:
Pengguna telah menceklist ${selectedTitlesData.length} Judul Video berikut:
${selectedTitlesData.map((t: any, i: number) => `${i+1}. Judul: "${t.title}" | Hook: "${t.hook}"`).join('\n')}

-> TUGAS KHUSUS PADA 'professionalPrompt': Anda WAJIB membuatkan prompt text-to-image secara terpisah untuk MASING-MASING judul yang dipilih di atas!
-> Susun 'professionalPrompt' dalam bentuk blok, pisahkan dengan jelas. Contoh Format:

--- 1. PROMPT THUMBNAIL: [Judul 1] ---
[Isi prompt text to image bahasa inggris...]

--- 2. PROMPT THUMBNAIL: [Judul 2] ---
[Isi prompt text to image bahasa inggris...]

-> PASTIKAN Teks Typography yang tertulis besar di dalam gambar masing-masing prompt disesuaikan dengan judulnya.
-> PASTIKAN Visual setiap prompt merepresentasikan Hook-nya masing-masing.`;
    }

    setIsGeneratingPrompt(true);

    const systemPrompt = `Anda adalah Oval Design Prompt Engine. Anda bertindak sebagai Senior Graphic Designer, Creative Director, dan AI Prompt Engineer ahli.
Tugas Anda: Mengubah ide sederhana dari pengguna menjadi Prompt Text-to-Image yang sangat profesional, detail, dan siap digunakan pada AI generator (Midjourney, Flux, dll).

ATURAN WAJIB PEMBUATAN PROMPT (Gunakan Bahasa Inggris untuk isi prompt):
Prompt harus mendeskripsikan gambar.
Struktur prompt harus urut: [Main Subject/Concept], [Visual Style], [Layout/Composition], [Typography Direction (gaya font dan isi teks)], [Color Palette], [Lighting], [Graphic Elements], [Quality Tags], [Aspect Ratio].

BAHASA TEKS PADA GAMBAR (SANGAT PENTING):
Meskipun prompt ditulis dalam Bahasa Inggris, SEMUA teks (typography/text overlay) yang akan muncul di dalam gambar HARUS mematuhi bahasa berikut: ${language}. Jangan sembarangan menerjemahkan pesan/judul jika tidak diminta.
Contoh penulisan di prompt: 
- with bold typography "TEKS DI SINI"
- text overlay "TEKS DI SINI"

BERDASARKAN JENIS DESAIN (PENTING! Sesuaikan elemen dengan jenis ini):
1. Jika "Infografis": Tambahkan keyword: Data visualization, Modern charts, Statistic blocks, Information hierarchy, Educational design, Clean infographic layout, Professional icons, isometric elements, infographic style with readable text.
2. Jika "Poster": Tambahkan keyword: Hero visual, Eye-catching composition, Promotional layout, Modern poster composition, Professional branding, Strong focal point, poster design with clear typography.
3. Jika "Banner": Tambahkan keyword: Advertising banner design, Marketing layout, Promotional elements, Attention grabbing visuals, ultra wide composition (if landscape), commercial advertisement with bold text.
4. Jika "Thumbnail": Tambahkan keyword: High CTR thumbnail style, Viral youtube style, Strong emotional impact, Click-worthy composition, Large readable typography element, Eye-catching contrast, vibrant colors. JIKA diberikan Judul dan Hook spesifik, GAMBAR HARUS MEREFLEKSIKANNYA 100%.

QUALITY TAGS WAJIB ADA:
ultra detailed, professional graphic design, award winning design, high quality, 8k resolution, premium layout, sharp focus, commercial advertising quality, behance style, dribbble trending.

PANDUAN NEGATIVE PROMPT:
Berikan negative prompt komprehensif dalam bahasa inggris yang mencegah hasil buruk, menyesuaikan jenis desain. Selalu sertakan: low quality, blurry, pixelated, bad typography, cropped text, poor composition, watermark, messy layout.

STRATEGI DESAIN:
Berikan penjelasan singkat (dalam Bahasa Indonesia) tentang mengapa prompt tersebut disusun demikian, dibagi menjadi 5 kategori strategi.`;

    const userQuery = `Ide Desain: "${idea}"\nJenis Desain: ${designType}\nAspect Ratio yang diinginkan: ${aspectRatio}\nBahasa Teks Pada Gambar: ${language}${specificContext}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            "professionalPrompt": { type: "STRING", description: "The highly detailed, english text-to-image prompt ending with the aspect ratio parameter." },
            "negativePrompt": { type: "STRING", description: "Comma separated negative tags in english." },
            "strategyTargetAudience": { type: "STRING", description: "Target audience analysis in Indonesian." },
            "strategyVisualApproach": { type: "STRING", description: "Visual approach explanation in Indonesian." },
            "strategyColorStrategy": { type: "STRING", description: "Color choices explanation in Indonesian." },
            "strategyLayoutStrategy": { type: "STRING", description: "Layout and composition strategy in Indonesian." },
            "strategyTypographyStrategy": { type: "STRING", description: "Typography direction explanation in Indonesian." }
          },
          required: ["professionalPrompt", "negativePrompt", "strategyTargetAudience", "strategyVisualApproach", "strategyColorStrategy", "strategyLayoutStrategy", "strategyTypographyStrategy"]
        }
      },
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    const apiUrl = getApiUrl('v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (result.candidates && result.candidates[0]?.content?.parts[0]) {
        const data = JSON.parse(result.candidates[0].content.parts[0].text);
        
        if (!data.professionalPrompt.includes(aspectRatio)) {
          data.professionalPrompt += ` ${aspectRatio}`;
        }

        const baseNegative = "low quality, blurry, pixelated, bad typography, cropped text, poor composition, watermark, duplicate objects, overexposed, underexposed, messy layout, distorted graphics, text overlay error";
        data.negativePrompt = data.negativePrompt.length > 10 ? data.negativePrompt + ", " + baseNegative : baseNegative;

        setGeneratedData(data);
        setActiveTab('prompt');
        showToast("Prompt berhasil dibuat!", "success");
      }
    } catch (error) {
      console.error("Generation Error:", error);
      showToast("Terjadi kesalahan saat menghubungi AI Engine.", "error");
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const exportToTxt = () => {
    if (!generatedData) return;
    const content = `OVAL DESIGN PROMPT GENERATOR\n=============================\nIde Asli:\n${idea}\n\nParameter:\nAspect Ratio: ${aspectRatio}\nJenis Desain: ${designType}\n\n=============================\nPROFESSIONAL PROMPT:\n${generatedData.professionalPrompt}\n\n=============================\nNEGATIVE PROMPT:\n${generatedData.negativePrompt}\n\n=============================\nDESIGN STRATEGY:\n- Target Audience: ${generatedData.strategyTargetAudience}\n- Visual Approach: ${generatedData.strategyVisualApproach}\n- Color Strategy: ${generatedData.strategyColorStrategy}\n- Layout Strategy: ${generatedData.strategyLayoutStrategy}\n- Typography Strategy: ${generatedData.strategyTypographyStrategy}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `OvalPrompt_${new Date().getTime()}.txt`;
    link.click();
    showToast("File berhasil diexport!", "success");
  };

  const renderStrategyItem = (icon: string, title: string, desc: string) => (
    <div className="bg-white/5 border border-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-sky-400 bg-sky-500/10 p-2 rounded-md">
          <i className={`ph ${icon} text-lg`}></i>
        </div>
        <div>
          <h5 className="text-sm font-semibold text-white mb-1">{title}</h5>
          <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="oval-design-wrapper bg-[#0B0F19] text-white min-h-[85vh] flex flex-col relative font-sans rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      <style>{`
        .oval-design-wrapper {
          background-image: radial-gradient(circle at 15% 50%, rgba(14, 165, 233, 0.08), transparent 25%),
                            radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08), transparent 25%);
        }
        .oval-design-wrapper .glass-panel {
          background: rgba(21, 26, 45, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(42, 52, 79, 0.5);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
        .oval-design-wrapper .glass-card {
          background: rgba(30, 37, 61, 0.4);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }
        .oval-design-wrapper .glass-card:hover {
          background: rgba(30, 37, 61, 0.8);
          border-color: rgba(56, 189, 248, 0.3);
          transform: translateY(-2px);
        }
        .oval-design-wrapper .glass-card.active {
          background: rgba(14, 165, 233, 0.1);
          border-color: #0ea5e9;
          box-shadow: 0 0 20px rgba(14, 165, 233, 0.15);
        }
        .oval-design-wrapper .loader-spinner {
          border: 3px solid rgba(255,255,255,0.1);
          border-bottom-color: #0ea5e9;
          border-radius: 50%;
          display: inline-block;
          animation: rotation 1s linear infinite;
        }
        @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <header className="w-full border-b border-white/5 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <i className="ph ph-magic-wand text-white text-lg"></i>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Oval <span className="text-sky-400 font-light">Design Prompt</span></h1>
          </div>
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Engine Ready
          </div>
        </div>
      </header>

      <div className="flex-grow w-full px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">1</span>
                <h2 className="text-lg font-semibold">Masukkan Ide Desain</h2>
              </div>
              <label className="block text-sm text-gray-400 mb-2">Deskripsikan visual yang ingin Anda buat secara sederhana.</label>
              <textarea 
                rows={4} 
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="w-full bg-[#0B0F19]/50 border border-[#2A344F] rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-none custom-scrollbar"
                placeholder="Contoh:&#10;Poster PPDB SD Negeri 4 Weding&#10;Banner Jual Beli Barang Bekas&#10;Thumbnail Youtube Cara Cepat Viral"
              ></textarea>
              <div className="flex justify-between text-xs mt-2 text-gray-500">
                <span className={idea.length > 0 && idea.length < 10 ? 'text-rose-400' : ''}>Min 10 karakter</span>
                <span className={idea.length > 5000 ? 'text-rose-400' : ''}>{idea.length} / 5000</span>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">2</span>
                <h2 className="text-lg font-semibold">Pilih Aspect Ratio</h2>
              </div>
              <div className="relative">
                <select 
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full bg-[#0B0F19]/50 border border-[#2A344F] rounded-xl p-3 pl-4 pr-10 text-white appearance-none focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                >
                  <optgroup label="Sosial Media">
                    <option value="--ar 1:1">1:1 Square (Feed)</option>
                    <option value="--ar 4:5">4:5 Instagram Portrait</option>
                    <option value="--ar 9:16">9:16 Story/Reels/Tiktok</option>
                    <option value="--ar 16:9">16:9 Youtube Thumbnail</option>
                    <option value="--ar 3:4">3:4 Poster Portrait</option>
                    <option value="--ar 4:3">4:3 Landscape</option>
                  </optgroup>
                  <optgroup label="Cetak / Print">
                    <option value="--ar 1:1.414">A4 Portrait</option>
                    <option value="--ar 1.414:1">A4 Landscape</option>
                    <option value="--ar 1:1.5">F4 Portrait</option>
                    <option value="--ar 1.5:1">F4 Landscape</option>
                  </optgroup>
                </select>
                <i className="ph ph-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">3</span>
                <h2 className="text-lg font-semibold">Bahasa Teks Pada Desain</h2>
              </div>
              {customLanguage ? (
                <div className="flex gap-2">
                  <input type="text" value={language} onChange={e => setLanguage(e.target.value)} className="flex-1 bg-[#0B0F19]/50 border border-[#2A344F] rounded-xl p-3 text-white text-sm focus:outline-none focus:border-sky-500" placeholder="Ketik bahasa (contoh: Jepang)..." autoFocus />
                  <button onClick={() => { setCustomLanguage(false); setLanguage('Indonesia'); }} className="bg-[#1E253D] hover:bg-[#2A344F] text-gray-300 px-4 rounded-xl text-xs font-semibold transition-colors">Batal</button>
                </div>
              ) : (
                <div className="relative">
                  <select 
                    value={language}
                    onChange={(e) => {
                      if (e.target.value === 'KUSTOM') { setCustomLanguage(true); setLanguage(''); }
                      else setLanguage(e.target.value);
                    }}
                    className="w-full bg-[#0B0F19]/50 border border-[#2A344F] rounded-xl p-3 pl-4 pr-10 text-white appearance-none focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  >
                    <option value="Indonesia">Indonesia</option>
                    <option value="Inggris (English)">Inggris (English)</option>
                    <option value="Arab (Arabic)">Arab (Arabic)</option>
                    <option value="Spanyol (Spanish)">Spanyol (Spanish)</option>
                    <option value="KUSTOM" className="text-sky-400 font-bold">+ Ketik Kustom...</option>
                  </select>
                  <i className="ph ph-caret-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                </div>
              )}
            </div>

            <div className="glass-panel rounded-2xl p-6 flex-grow transition-all duration-300">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-bold">4</span>
                <h2 className="text-lg font-semibold">Jenis Desain</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'Infografis', icon: '📊', desc: 'Visual edukatif dengan data & layout profesional.' },
                  { id: 'Poster', icon: '🖼️', desc: 'Desain promosi dengan visual menarik & fokus.' },
                  { id: 'Banner', icon: '📢', desc: 'Promosi dengan headline kuat & visual menarik.' },
                  { id: 'Thumbnail', icon: '▶️', desc: 'Visual Youtube CTR tinggi yang memancing klik.' }
                ].map(t => (
                  <div 
                    key={t.id}
                    onClick={() => handleTypeSelect(t.id)}
                    className={`glass-card rounded-xl p-4 cursor-pointer ${designType === t.id ? 'active' : ''}`}
                  >
                    <div className="text-2xl mb-2">{t.icon}</div>
                    <h3 className="font-medium text-white mb-1">{t.id}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>

              {designType === 'Thumbnail' && (
                <div className="mt-6 pt-5 border-t border-[#2A344F]/50 animate-in fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                      <i className="ph-fill ph-youtube-logo text-xl"></i> YouTube Viral Kit
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">Dapatkan 5 ide judul viral dan metadata SEO sebelum membuat prompt gambar agar hasilnya relevan.</p>
                  
                  <button 
                    onClick={generateYoutubeMeta}
                    disabled={isGeneratingMeta}
                    className="w-full bg-[#0B0F19] border border-rose-500/30 hover:bg-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed text-rose-400 font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    {isGeneratingMeta ? <div className="loader-spinner w-5 h-5 border-rose-500"></div> : <i className="ph ph-fire text-lg"></i>}
                    <span>{isGeneratingMeta ? 'Menganalisis SEO...' : 'Generate Judul & Metadata SEO'}</span>
                  </button>

                  {ytData && (
                    <div className="space-y-5 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pilih Judul (Klik Salah Satu/Lebih)</label>
                        <div className="space-y-2">
                          {ytData.titles.map((item: any, idx: number) => (
                            <label key={idx} className={`flex p-3 border rounded-xl cursor-pointer hover:border-rose-500/50 transition-all items-start gap-3 group ${selectedYtTitles.includes(idx) ? 'border-rose-500 bg-rose-500/10' : 'border-[#2A344F] bg-[#0B0F19]/30'}`}>
                              <input 
                                type="checkbox" 
                                checked={selectedYtTitles.includes(idx)} 
                                onChange={(e) => {
                                  if(e.target.checked) setSelectedYtTitles([...selectedYtTitles, idx]);
                                  else setSelectedYtTitles(selectedYtTitles.filter(i => i !== idx));
                                }}
                                className="mt-1 w-4 h-4 accent-rose-500 rounded cursor-pointer flex-shrink-0" 
                              />
                              <div>
                                <div className={`font-bold mb-1 transition-colors ${selectedYtTitles.includes(idx) ? 'text-white' : 'text-gray-300 group-hover:text-rose-200'}`}>{item.title}</div>
                                <div className="text-xs text-sky-400 bg-sky-500/10 inline-block px-2 py-0.5 rounded border border-sky-500/20">
                                  <i className="ph-fill ph-lightbulb mr-1"></i>Hook: {item.hook}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Deskripsi Lengkap</label>
                          <button onClick={() => copyToClipboard(ytData.description)} className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"><i className="ph ph-copy"></i> Copy</button>
                        </div>
                        <div className="w-full bg-[#0B0F19]/50 border border-[#2A344F] rounded-lg p-3 text-sm text-gray-300 h-24 overflow-y-auto font-mono whitespace-pre-wrap custom-scrollbar">{ytData.description}</div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags & Hashtags</label>
                          <button onClick={() => copyToClipboard(`${ytData.tags}\n\n${ytData.hashtags}`)} className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1"><i className="ph ph-copy"></i> Copy</button>
                        </div>
                        <div className="w-full bg-[#0B0F19]/50 border border-[#2A344F] rounded-lg p-3 text-sm text-gray-300 font-mono whitespace-pre-wrap custom-scrollbar">{ytData.tags + "\n\n" + ytData.hashtags}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button 
              onClick={generateMainPrompt}
              disabled={isGeneratingPrompt}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-3 mt-2"
            >
              {isGeneratingPrompt ? <div className="loader-spinner w-6 h-6 border-white"></div> : <i className="ph ph-magic-wand text-xl"></i>}
              <span>{isGeneratingPrompt ? 'Generating...' : 'Generate Design Prompt'}</span>
            </button>
          </div>

          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="glass-panel rounded-2xl flex flex-col h-full overflow-hidden border-t-4 border-t-sky-500 relative min-h-[500px]">
              {!generatedData && !isGeneratingPrompt && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10 transition-opacity duration-300">
                  <div className="w-20 h-20 bg-[#1E253D] rounded-full flex items-center justify-center border border-[#2A344F] mb-4">
                    <i className="ph ph-image-square text-4xl text-gray-500"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Area Hasil Generate</h3>
                  <p className="text-gray-500 text-sm max-w-md">Isi ide desain di panel kiri dan klik generate untuk melihat struktur prompt AI (Midjourney/DALL-E) beserta panduan tata letak.</p>
                </div>
              )}

              {isGeneratingPrompt && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d121f]/80 backdrop-blur-sm z-20 animate-in fade-in">
                  <div className="loader-spinner w-12 h-12 mb-4"></div>
                  <h3 className="text-lg font-semibold text-white mb-2">Menyusun Prompt Masterpiece...</h3>
                  <p className="text-gray-400 text-sm max-w-sm text-center">AI sedang memformulasikan komposisi visual, tata letak, dan kata kunci spesifik untuk desain Anda.</p>
                </div>
              )}

              {generatedData && (
                <div className="flex flex-col h-full z-10 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-1 border-b border-white/5 bg-[#0B0F19]/30 p-2 overflow-x-auto custom-scrollbar">
                    <button onClick={() => setActiveTab('prompt')} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'prompt' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-400 hover:text-white'}`}>
                      <i className="ph ph-terminal-window mr-1.5"></i> Master Prompt
                    </button>
                    <button onClick={() => setActiveTab('negative')} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'negative' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-400 hover:text-white'}`}>
                      <i className="ph ph-minus-circle mr-1.5"></i> Negative Prompt
                    </button>
                    <button onClick={() => setActiveTab('strategy')} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'strategy' ? 'bg-sky-500/20 text-sky-400' : 'text-gray-400 hover:text-white'}`}>
                      <i className="ph ph-layout mr-1.5"></i> Strategi Canva/Figma
                    </button>
                  </div>

                  <div className="p-6 flex-grow overflow-y-auto custom-scrollbar bg-[#0d121f]">
                    {activeTab === 'prompt' && (
                      <div className="animate-in fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">AI Image Prompt (En)</h3>
                            <p className="text-xs text-gray-400">Gunakan di Midjourney, Stable Diffusion, atau DALL-E.</p>
                          </div>
                          <button onClick={() => copyToClipboard(generatedData.professionalPrompt)} className="bg-[#1E253D] hover:bg-[#2A344F] border border-white/10 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 text-white">
                            <i className="ph ph-copy"></i> Copy
                          </button>
                        </div>
                        <div className="bg-black/40 border border-sky-500/30 rounded-xl p-5 relative group">
                          <p className="font-mono text-[15px] leading-relaxed text-sky-100 whitespace-pre-wrap">{generatedData.professionalPrompt}</p>
                          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity rounded-xl"></div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'negative' && (
                      <div className="animate-in fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">Negative Prompt (En)</h3>
                            <p className="text-xs text-gray-400">Elemen yang harus dihindari oleh AI (Khusus SD/Midjourney).</p>
                          </div>
                          <button onClick={() => copyToClipboard(generatedData.negativePrompt)} className="bg-[#1E253D] hover:bg-[#2A344F] border border-white/10 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 text-white">
                            <i className="ph ph-copy"></i> Copy
                          </button>
                        </div>
                        <div className="bg-black/40 border border-red-500/30 rounded-xl p-5">
                          <p className="font-mono text-[15px] leading-relaxed text-red-200 whitespace-pre-wrap">{generatedData.negativePrompt}</p>
                        </div>
                      </div>
                    )}
                    {activeTab === 'strategy' && (
                      <div className="animate-in fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-white">Strategi Editing & Tata Letak</h3>
                            <p className="text-xs text-gray-400">Panduan menerapkan hasil AI ke aplikasi editing (Canva/Figma).</p>
                          </div>
                          <button onClick={() => copyToClipboard(`- Target Audience: ${generatedData.strategyTargetAudience}\n- Visual Approach: ${generatedData.strategyVisualApproach}\n- Color Strategy: ${generatedData.strategyColorStrategy}\n- Layout Strategy: ${generatedData.strategyLayoutStrategy}\n- Typography Strategy: ${generatedData.strategyTypographyStrategy}`)} className="bg-[#1E253D] hover:bg-[#2A344F] border border-white/10 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 text-white">
                            <i className="ph ph-copy"></i> Copy
                          </button>
                        </div>
                        <div className="bg-[#0B0F19]/50 border border-[#2A344F] rounded-xl p-5 space-y-4 text-sm text-gray-300">
                          {renderStrategyItem('ph-users', 'Target Audience', generatedData.strategyTargetAudience)}
                          {renderStrategyItem('ph-eye', 'Visual Approach', generatedData.strategyVisualApproach)}
                          {renderStrategyItem('ph-palette', 'Color Strategy', generatedData.strategyColorStrategy)}
                          {renderStrategyItem('ph-squares-four', 'Layout & Composition', generatedData.strategyLayoutStrategy)}
                          {renderStrategyItem('ph-text-t', 'Typography Direction', generatedData.strategyTypographyStrategy)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#2A344F] bg-[#151A2D] p-4 flex flex-wrap gap-3 justify-end shrink-0">
                    <button onClick={exportToTxt} className="px-4 py-2 text-sm font-medium rounded-lg border border-[#2A344F] bg-[#0B0F19] hover:bg-white/5 text-gray-300 transition-all flex items-center gap-2">
                      <i className="ph ph-file-text"></i> Export TXT
                    </button>
                    <button onClick={generateMainPrompt} className="px-4 py-2 text-sm font-medium rounded-lg border border-sky-500/50 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-all flex items-center gap-2">
                      <i className="ph ph-arrows-clockwise"></i> Regenerate
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
