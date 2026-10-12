import React, { useState } from 'react';
import { INDONESIAN_VOICES, STYLE_PRESETS, SPEED_OPTIONS, base64ToArrayBuffer, pcmToWav, fetchGeminiContent } from '../types.tsx';

export const TTSModule = () => {
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState(INDONESIAN_VOICES[0].name);
  const [geminiStyle, setGeminiStyle] = useState('Normal');
  const [speechSpeed, setSpeechSpeed] = useState(SPEED_OPTIONS[1]);
  const [notification, setNotification] = useState({ type: '', message: '' });

  const charCount = script.length;
  const charLimit = 3000;
  const progressPercent = Math.min((charCount / charLimit) * 100, 100);
  const estTime = Math.ceil(charCount / 15);

  const handleGenerateAudio = async () => {
    if (!script.trim()) {
      setNotification({ type: 'error', message: 'Script masih kosong!' });
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);
    setNotification({ type: '', message: '' });

    try {
      const voiceConfig = INDONESIAN_VOICES.find(v => v.name === selectedVoice);
      const apiVoiceId = voiceConfig ? voiceConfig.id : 'Kore';

      let finalPrompt = script;
      let instructions = [];
      
      if (geminiStyle && geminiStyle !== 'Normal') {
        instructions.push(`dengan gaya bicara ${geminiStyle.toLowerCase()}`);
      }
      if (speechSpeed.value !== 'normal') {
        instructions.push(`dengan tempo ${speechSpeed.value}`);
      }

      if (instructions.length > 0) {
        finalPrompt = `Ucapkan kalimat berikut ${instructions.join(' dan ')}:\n"${script}"`;
      }

      const payload = {
        contents: [{ parts: [{ text: finalPrompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: apiVoiceId } }
          }
        },
        model: "gemini-3.8-flash-tts"
      };
      
      const result = await fetchGeminiContent('v1beta/models/gemini-3.8-flash-tts:generateContent', payload);
      
      if (result.error) throw new Error(result.error.message || "Failed to generate audio");
      
      const part = result?.candidates?.[0]?.content?.parts?.[0];
      const audioData = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;

      if (audioData && mimeType && mimeType.startsWith("audio/")) {
        const sampleRate = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || "24000", 10);
        const pcmData = base64ToArrayBuffer(audioData);
        const pcm16 = new Int16Array(pcmData);
        const wavBlob = pcmToWav(pcm16, sampleRate);
        const url = URL.createObjectURL(wavBlob);
        setAudioUrl(url);
        setNotification({ type: 'success', message: 'Audio berhasil dibuat!' });

        setTimeout(() => {
          const audioElement = document.getElementById('result-audio') as HTMLAudioElement;
          if (audioElement) {
            audioElement.playbackRate = speechSpeed.rate;
          }
        }, 100);

      } else {
        throw new Error("Format audio tidak valid dari API.");
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAIAutoWrite = () => {
    setScript("Halo, selamat datang di Falah. Ini adalah contoh teks yang dihasilkan otomatis untuk kamu coba konversi menjadi suara. Keren kan?");
  };

  return (
    <div className="min-h-full bg-[#050505] text-white font-sans selection:bg-lime-500/30 pb-20 rounded-2xl overflow-hidden relative">
      <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center shadow-lg shadow-lime-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-950 w-6 h-6"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight leading-none">FA<span className="text-lime-500">LAH</span></h1>
              <p className="text-xs text-white/50 mt-0.5 font-medium">Teks to Suara</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="space-y-6">
            <div className="bg-[#0f111a] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-lime-500"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
                <h2 className="font-bold text-sm tracking-wide text-white/90">KONFIGURASI</h2>
              </div>
              
              <div className="p-5 space-y-5">
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lime-500/10 border border-lime-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-lime-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                    <span className="text-xs font-medium text-lime-400">Gratis & Cepat</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
                      Narator Suara
                    </label>
                    <select 
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 appearance-none text-white cursor-pointer"
                    >
                      {INDONESIAN_VOICES.map(v => (
                        <option key={v.name} value={v.name}>
                          {v.name} - {v.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
                      Tempo / Speed
                    </label>
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                      {SPEED_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSpeechSpeed(opt)}
                          className={`flex-1 text-[11px] py-2.5 rounded-lg transition-all font-semibold ${
                            speechSpeed.value === opt.value 
                              ? 'bg-lime-500 text-black shadow-md' 
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {opt.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
                      Emotion Style
                    </label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {STYLE_PRESETS.map(preset => (
                        <button 
                          key={preset}
                          onClick={() => setGeminiStyle(preset)}
                          className={`text-[10px] uppercase font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                            geminiStyle === preset 
                              ? 'bg-lime-500/20 border-lime-500/50 text-lime-400 scale-[1.02]' 
                              : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:block bg-[#0f111a] rounded-3xl border border-white/5 p-5">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-white/50">Panjang Karakter</span>
                  <span className="font-mono text-lg font-bold text-white/90">{charCount}<span className="text-xs text-white/30 font-sans">/{charLimit}</span></span>
                </div>
                
                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-lime-500 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-xs font-medium text-white/40">Estimasi Waktu</span>
                  <span className="text-sm font-medium text-lime-400">~{estTime} detik</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#0f111a] rounded-3xl border border-white/5 h-[450px] flex flex-col overflow-hidden relative shadow-xl">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
                <span className="font-bold text-xs tracking-widest text-white/50">SCRIPT EDITOR</span>
                <button 
                  onClick={handleAIAutoWrite}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 text-xs font-semibold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
                  AI Auto-Write
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-hidden">
                <textarea 
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Ketik atau paste text kamu di sini..."
                  className="w-full h-full bg-transparent resize-none outline-none text-lg leading-relaxed placeholder:text-white/20 text-white/90 custom-scrollbar"
                  maxLength={charLimit}
                />
              </div>

              <div className="p-4 bg-black/40 border-t border-white/5 shrink-0 flex flex-col gap-3">
                {notification.message && (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm animate-in slide-in-from-bottom-2 ${
                    notification.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-lime-500/10 text-lime-400 border border-lime-500/20'
                  }`}>
                    {notification.type === 'error' ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                    {notification.message}
                  </div>
                )}

                <button 
                  onClick={handleGenerateAudio}
                  disabled={isGenerating}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                    isGenerating 
                      ? 'bg-neutral-800 text-white/40 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-lime-500 to-lime-400 text-black shadow-lg shadow-lime-500/20 hover:scale-[1.01] active:scale-95'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      Menciptakan Suara...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                      Generate Suara Sekarang
                    </>
                  )}
                </button>
              </div>
            </div>

            {audioUrl && (
              <div className="bg-[#0f111a] rounded-3xl border border-lime-500/30 p-6 animate-in slide-in-from-bottom flex flex-col md:flex-row items-center gap-6 shadow-2xl shadow-lime-500/5">
                <div className="w-16 h-16 rounded-full bg-lime-500/20 flex items-center justify-center shrink-0 border border-lime-500/30 relative">
                  <div className="absolute inset-0 rounded-full border border-lime-500/50 animate-ping opacity-20"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-lime-400"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                </div>
                
                <div className="flex-1 w-full space-y-4 text-center md:text-left">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-lg text-white leading-none">Audio Berhasil Dibuat</h3>
                    <p className="text-xs font-medium text-white/50">
                      {selectedVoice} • Gaya {geminiStyle} • {speechSpeed.label}
                    </p>
                  </div>
                  <audio id="result-audio" controls src={audioUrl} className="w-full h-10 rounded-full focus:outline-none custom-audio-player"></audio>
                </div>

                <a 
                  href={audioUrl} 
                  download={`falah-tts-${Date.now()}.wav`}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors shrink-0 w-full md:w-auto justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-audio-player::-webkit-media-controls-panel {
          background-color: #262626;
        }
        .custom-audio-player::-webkit-media-controls-play-button,
        .custom-audio-player::-webkit-media-controls-mute-button {
          background-color: #84cc16;
          border-radius: 50%;
        }
        .custom-audio-player::-webkit-media-controls-current-time-display,
        .custom-audio-player::-webkit-media-controls-time-remaining-display {
          color: #fff;
        }
      `}</style>
    </div>
  );
};
