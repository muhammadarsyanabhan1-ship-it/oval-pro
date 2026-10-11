import React, { useState, useEffect } from 'react';
import { Icons, loadFromDB, saveToDB, getApiUrl } from '../types.tsx';

export const AnimationModule = ({ showToast }: { showToast: (msg: string, type?: string) => void }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [animView, setAnimView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('info');

  const isObjectTalkGenre = (genre: string) => {
    if (!genre) return false;
    const lower = genre.toLowerCase();
    return lower.includes('objek') || lower.includes('benda');
  };

  useEffect(() => {
    const loadData = async () => {
      const savedData = await loadFromDB('oval_anim_projects');
      if (savedData) {
        setProjects(savedData);
      } else {
        const oldSaved = localStorage.getItem('oval_anim_projects');
        if (oldSaved) {
          try {
            const parsed = JSON.parse(oldSaved);
            setProjects(parsed);
            saveToDB('oval_anim_projects', parsed);
            localStorage.removeItem('oval_anim_projects');
          } catch (e) {
            console.error("Failed to parse projects", e);
          }
        }
      }
    };
    loadData();
  }, []);

  const saveProjects = (newProjects: any[]) => {
    setProjects(newProjects);
    saveToDB('oval_anim_projects', newProjects);
  };

  const [wizardData, setWizardData] = useState({
    title: '', premise: '', genre: 'Petualangan', visualStyle: '3D animated family film',
    aspectRatio: '16:9', duration: '30', sceneCount: '4', 
    language: 'Indonesia', useVoiceOver: false, voiceOverType: 'Full Narator'
  });

  const [customMode, setCustomMode] = useState({
    genre: false, visualStyle: false, duration: false, sceneCount: false
  });

  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingChar, setIsGeneratingChar] = useState(false);
  const [isGeneratingEnv, setIsGeneratingEnv] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  
  const [charInput, setCharInput] = useState({ name: '', desc: '' });
  const [envInput, setEnvInput] = useState({ name: '', desc: '' });
  const [generatingSheetId, setGeneratingSheetId] = useState<string | null>(null);
  const [varInputs, setVarInputs] = useState<Record<string, string>>({});

  const activeProject = projects.find(p => p.id === activeProjectId);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast("Prompt berhasil disalin!", "success");
    }).catch(() => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast("Prompt berhasil disalin!", "success");
      } catch (err) {
        showToast("Gagal menyalin prompt", "error");
      }
      document.body.removeChild(textArea);
    });
  };

  const callGemini = async (promptText: string, systemText: string, schema: any = null) => {
    const payload: any = {
      contents: [{ role: "user", parts: [{ text: promptText }] }],
      systemInstruction: { parts: [{ text: systemText }] },
      generationConfig: { responseMimeType: "application/json" }
    };
    if (schema) {
      payload.generationConfig.responseSchema = schema;
    }
    const apiUrl = getApiUrl('v1beta/models/gemini-3.8-flash:generateContent');
    const response = await fetch(apiUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  };

  const generatePromptsBackground = async (project: any, scenes: any[], chars: any[], envs: any[]) => {
    for (const scene of scenes) {
      try {
        const charPrompts = chars.filter(c => scene.characterIds.includes(c.id)).map(c => `[CHARACTER: ${c.name}, ${c.basePrompt}]`).join(" ");
        const env = envs.find(e => e.id === scene.environmentId);
        const envPrompt = env ? `[ENVIRONMENT: ${env.name}, ${env.basePrompt}]` : "";
        
        let voInstructions = "TIDAK ADA Voice Over, narasi, atau dialog audio. Fokus murni pada aksi visual.";
        if (project.useVoiceOver) {
          voInstructions = `Sertakan skrip Voice Over/Dialog dalam bahasa ${project.language}. Tipe VO: ${project.voiceOverType}. `;
          if (project.voiceOverType === 'Full Narator') voInstructions += `Karakter HANYA bergerak, DILARANG lipsync/berbicara.`;
          else if (project.voiceOverType === 'Full Karakter') voInstructions += `Karakter WAJIB lipsync dan berbicara ke kamera/antar karakter.`;
          else voInstructions += `Campuran narator off-screen dan karakter lipsync.`;
        }

        const sys = "Anda adalah Prompt Engineer & Animation Director. Buat Text-to-Image (TTI) prompt statis dan Text-to-Video (TTV) prompt pergerakan berdasarkan input. Pastikan instruksi visual kamera/karakter menggunakan bahasa Inggris agar kompatibel dengan AI Video Generator. Jika ada Audio Script, letakkan di dalam ttvPrompt dan gunakan bahasa target yang diminta.";
        const usr = `Aksi Scene: ${scene.action}. \nIdentitas Karakter: ${charPrompts} \nIdentitas Lingkungan: ${envPrompt} \nGaya Visual: ${project.visualStyle}\nInstruksi Audio: ${voInstructions}`;

        const result = await callGemini(usr, sys, {
          type: "OBJECT",
          properties: {
            ttiPrompt: { type: "STRING" },
            ttvPrompt: { type: "STRING" }
          },
          required: ["ttiPrompt", "ttvPrompt"]
        });

        setProjects(prev => {
          const updated = prev.map(p => {
            if (p.id === project.id) {
              return { ...p, scenes: p.scenes.map((s: any) => s.id === scene.id ? { ...s, ttiPrompt: result.ttiPrompt, ttvPrompt: result.ttvPrompt, isGenerating: false } : s) };
            }
            return p;
          });
          saveToDB('oval_anim_projects', updated);
          return updated;
        });
      } catch (e) {
        console.error("Failed scene prompt", e);
        setProjects(prev => {
          const updated = prev.map(p => p.id === project.id ? { ...p, scenes: p.scenes.map((s: any) => s.id === scene.id ? { ...s, isGenerating: false } : s) } : p);
          saveToDB('oval_anim_projects', updated);
          return updated;
        });
      }
    }
  };

  const handleAutoGenerateProject = async () => {
    if (!wizardData.title || !wizardData.premise || !wizardData.genre || !wizardData.visualStyle || !wizardData.duration || !wizardData.sceneCount) {
      showToast("Mohon lengkapi semua isian form termasuk field kustom", "error");
      return;
    }
    setIsAutoGenerating(true);
    try {
      let genreInstruction = "";
      if (isObjectTalkGenre(wizardData.genre)) {
        genreInstruction = `\n\nINSTRUKSI KHUSUS GENRE ("Objek Berbicara"): Proyek ini berpusat pada benda mati yang hidup (Talking Objects). SEMUA karakter yang Anda rancang WAJIB berupa benda mati (seperti alat sehari-hari, makanan, tumbuhan, organ tubuh seperti jantung/lambung) yang memiliki nyawa. Mereka harus digambarkan memiliki wajah lucu (mata besar dan mulut) serta tangan/kaki kartun yang menyatu dengan tubuh objeknya. DILARANG KERAS membuat karakter manusia.`;
      }

      const sys = `Anda adalah Sutradara Animasi & Story Planner ahli. Berdasarkan input pengguna, hasilkan struktur proyek animasi yang koheren. Hasilkan Outline Naskah, Karakter Utama (1-3), Lingkungan (1-3), dan bagikan secara logis menjadi TEPAT beberapa adegan (scene) sesuai permintaan pengguna. 
      Pastikan naskah dan deskripsi aksi menggunakan Bahasa ${wizardData.language}.${genreInstruction}`;
      
      let audioNote = "TIDAK ADA Voice Over atau Dialog.";
      if (wizardData.useVoiceOver) {
        audioNote = `MENGGUNAKAN Voice Over/Dialog (${wizardData.voiceOverType}). Pastikan skrip narasi/dialog disisipkan pada kolom action/cerita per scene.`;
      }
      
      const usr = `Judul: ${wizardData.title}\nPremis: ${wizardData.premise}\nGenre: ${wizardData.genre}\nStyle: ${wizardData.visualStyle}\nJumlah Scene Diminta: ${wizardData.sceneCount}\nDurasi Total: ${wizardData.duration}s.\nBahasa Naskah: ${wizardData.language}\nInfo Audio: ${audioNote}`;

      const schema = {
        type: "OBJECT",
        properties: {
          storyOutline: { type: "STRING" },
          characters: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" }, description: { type: "STRING" }, appearance: { type: "STRING" }, personality: { type: "STRING" }, basePrompt: { type: "STRING" }
              }, required: ["name", "description", "appearance", "personality", "basePrompt"]
            }
          },
          environments: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" }, description: { type: "STRING" }, architecture: { type: "STRING" }, lighting: { type: "STRING" }, basePrompt: { type: "STRING" }
              }, required: ["name", "description", "architecture", "lighting", "basePrompt"]
            }
          },
          scenes: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                action: { type: "STRING", description: "Cerita dan aksi pada scene ini" },
                characterNames: { type: "ARRAY", items: { type: "STRING" }, description: "Nama karakter yang ada di scene ini" },
                environmentName: { type: "STRING", description: "Nama lingkungan/lokasi scene ini" }
              }, required: ["action", "characterNames", "environmentName"]
            }
          }
        }, required: ["storyOutline", "characters", "environments", "scenes"]
      };

      const result = await callGemini(usr, sys, schema);
      const safeId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

      const charsWithIds = (result.characters || []).map((c: any) => ({...c, id: 'char_' + safeId()}));
      const envsWithIds = (result.environments || []).map((e: any) => ({...e, id: 'env_' + safeId()}));

      const scenesWithIds = (result.scenes || []).map((s: any, i: number) => {
        const charIds = (s.characterNames || []).map((name: string) => charsWithIds.find((c: any) => c.name.toLowerCase() === name.toLowerCase())?.id).filter(Boolean);
        const envId = envsWithIds.find((e: any) => e.name.toLowerCase() === (s.environmentName || '').toLowerCase())?.id || (envsWithIds[0]?.id || '');
        return {
          id: 'scene_' + safeId(),
          order: i + 1,
          action: s.action || '',
          characterIds: charIds,
          environmentId: envId,
          ttiPrompt: null,
          ttvPrompt: null,
          isGenerating: true 
        };
      });

      while (scenesWithIds.length < parseInt(wizardData.sceneCount)) {
        scenesWithIds.push({
          id: 'scene_' + safeId(), order: scenesWithIds.length + 1, action: 'Melanjutkan adegan sebelumnya...',
          characterIds: [], environmentId: envsWithIds[0]?.id || '', ttiPrompt: null, ttvPrompt: null, isGenerating: true
        });
      }
      scenesWithIds.splice(parseInt(wizardData.sceneCount)); 

      const newProject = {
        id: 'proj_' + safeId(),
        ...wizardData,
        storyOutline: result.storyOutline || '',
        characters: charsWithIds,
        environments: envsWithIds,
        scenes: scenesWithIds,
        createdAt: new Date().toISOString()
      };

      saveProjects([newProject, ...projects]);
      setActiveProjectId(newProject.id);
      setAnimView('editor');
      setActiveTab('storyboard');
      showToast("Konsep berhasil dibuat! AI sedang menyusun prompt per adegan...", "success");

      generatePromptsBackground(newProject, scenesWithIds, charsWithIds, envsWithIds);

    } catch (err) {
      console.error(err);
      showToast("Gagal menyusun konsep otomatis. Silakan coba lagi.", "error");
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const deleteProject = (id: string) => {
    if (confirm("Hapus proyek ini?")) {
      saveProjects(projects.filter(p => p.id !== id));
      showToast("Proyek dihapus", "success");
    }
  };

  const updateActiveProject = (updates: any) => {
    const updated = projects.map(p => p.id === activeProjectId ? { ...p, ...updates } : p);
    saveProjects(updated);
  };

  const generateStoryOutline = async () => {
    if (!activeProject) return;
    setIsGeneratingStory(true);
    try {
      const systemPrompt = "Anda adalah penulis skenario animasi. Buat outline cerita terstruktur berdasarkan input. Kembalikan JSON: { outline: string }";
      const userPrompt = `Buat outline cerita untuk proyek: ${activeProject.title}. Premis: ${activeProject.premise}. Genre: ${activeProject.genre}. Durasi: ${activeProject.duration} detik. Jumlah scene: ${activeProject.sceneCount}.`;
      const result = await callGemini(userPrompt, systemPrompt);
      updateActiveProject({ storyOutline: result.outline });
      showToast("Naskah berhasil di-generate", "success");
    } catch (err) {
      showToast("Gagal men-generate naskah", "error");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const generateCharacter = async () => {
    if (!activeProject) return;
    if (!charInput.name || !charInput.desc) return showToast("Nama dan deskripsi wajib diisi", "error");
    setIsGeneratingChar(true);
    try {
      const sys = "Anda adalah Character Designer. Kembalikan JSON: { appearance: string, basePrompt: string, personality: string }";
      
      let usr = `Buat Character Bible detail. Nama: ${charInput.name}. Deskripsi: ${charInput.desc}. Gaya Visual: ${activeProject.visualStyle}`;
      if (isObjectTalkGenre(activeProject.genre)) {
        usr += `\n\nINSTRUKSI SANGAT PENTING: Proyek ini bergenre "Objek Berbicara". Karakter ini adalah "Talking Object" (Benda Mati yang Hidup). Karakter ini BUKAN MANUSIA, melainkan benda mati yang memiliki wajah bergaya kartun 3D (mata besar yang ekspresif, dan mulut tersenyum/lipsync) lengkap dengan lengan/kaki kecil menyatu di tubuh objeknya. Pastikan 'basePrompt' sangat menekankan "anthropomorphic cute object, living inanimate object with cute expressive face, big eyes, and mouth, 3d pixar animation style".`;
      }

      const result = await callGemini(usr, sys);
      
      const newChar = {
        id: Date.now().toString(),
        name: charInput.name,
        description: charInput.desc,
        appearance: result.appearance,
        personality: result.personality,
        basePrompt: result.basePrompt
      };
      
      updateActiveProject({ characters: [...activeProject.characters, newChar] });
      setCharInput({ name: '', desc: '' });
      showToast("Karakter ditambahkan", "success");
    } catch (e) {
      showToast("Gagal men-generate karakter", "error");
    } finally {
      setIsGeneratingChar(false);
    }
  };

  const generateEnvironment = async () => {
    if (!activeProject) return;
    if (!envInput.name || !envInput.desc) return showToast("Nama dan deskripsi wajib diisi", "error");
    setIsGeneratingEnv(true);
    try {
      const sys = "Anda adalah Environment Concept Artist. Kembalikan JSON: { architecture: string, lighting: string, basePrompt: string }";
      const usr = `Buat Environment Bible detail. Nama: ${envInput.name}. Deskripsi: ${envInput.desc}. Gaya Visual: ${activeProject.visualStyle}`;
      const result = await callGemini(usr, sys);
      
      const newEnv = {
        id: Date.now().toString(),
        name: envInput.name,
        description: envInput.desc,
        architecture: result.architecture,
        lighting: result.lighting,
        basePrompt: result.basePrompt
      };
      
      updateActiveProject({ environments: [...activeProject.environments, newEnv] });
      setEnvInput({ name: '', desc: '' });
      showToast("Lingkungan ditambahkan", "success");
    } catch (e) {
      showToast("Gagal men-generate lingkungan", "error");
    } finally {
      setIsGeneratingEnv(false);
    }
  };

  const addCharacterVariation = (charId: string) => {
    if (!activeProject) return;
    const text = varInputs[charId];
    if (!text) return showToast("Masukkan nama/deskripsi variasi", "error");
    
    const newVar = { id: 'var_' + Date.now(), description: text, sheetImage: null };
    const updatedChars = activeProject.characters.map((c: any) => 
      c.id === charId ? { ...c, variations: [...(c.variations || []), newVar] } : c
    );
    updateActiveProject({ characters: updatedChars });
    setVarInputs({ ...varInputs, [charId]: '' });
  };

  const deleteCharacterVariation = (charId: string, varId: string) => {
    if (!activeProject) return;
    const updatedChars = activeProject.characters.map((c: any) => 
      c.id === charId ? { ...c, variations: (c.variations || []).filter((v: any) => v.id !== varId) } : c
    );
    updateActiveProject({ characters: updatedChars });
  };

  const generateCharacterSheet = async (characterId: string, variationId: string | null = null) => {
    if (!activeProject) return;
    const char = activeProject.characters.find((c: any) => c.id === characterId);
    if (!char) return;

    const isVariation = variationId !== null;
    let variationDesc = "";
    if (isVariation) {
      const variation = (char.variations || []).find((v: any) => v.id === variationId);
      if(variation) variationDesc = variation.description;
    }

    setGeneratingSheetId(isVariation ? variationId : characterId);
    try {
      let prompt = `A professional 3D character design model sheet for animation.
Character Name: ${char.name}.
Description: ${char.appearance}. `;

      if (isObjectTalkGenre(activeProject.genre)) {
        prompt += `CRITICAL INSTRUCTION: This is an ANTHROPOMORPHIC LIVING OBJECT (Talking Object). It MUST be the inanimate object described but heavily stylized like a 3D animated Pixar/Disney movie where everyday objects come to life. It MUST have a cute, expressive face, large eyes, and a mouth directly on the object's body, along with cartoonish small arms and legs. DO NOT draw a human. `;
      }

      if (isVariation) {
        prompt += `CRITICAL VARIATION INSTRUCTION: The character must be depicted with this specific costume/variation: "${variationDesc}". Ensure high character identity consistency. `;
      }

      prompt += `Style: ${activeProject.visualStyle}.
Layout: Model sheet with front view, side view, back view, and 3 expressive facial closeups, neutral studio background, 8k resolution, award winning 3D concept art --ar 16:9`;

      const updatedChars = activeProject.characters.map((c: any) => {
        if (c.id === characterId) {
          if (isVariation) {
            const updatedVars = (c.variations || []).map((v: any) => v.id === variationId ? { ...v, sheetPrompt: prompt } : v);
            return { ...c, variations: updatedVars };
          } else {
            return { ...c, sheetPrompt: prompt };
          }
        }
        return c;
      });
      updateActiveProject({ characters: updatedChars });
      showToast(`Prompt Visual Karakter ${isVariation ? 'variasi ' : ''}berhasil dibuat!`, "success");
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan saat menyusun prompt visual.", "error");
    } finally {
      setGeneratingSheetId(null);
    }
  };

  const generatePromptsForScene = async (sceneId: string) => {
    if (!activeProject) return;
    const scene = activeProject.scenes.find((s: any) => s.id === sceneId);
    if (!scene.action || !scene.environmentId) return showToast("Aksi dan lingkungan wajib dipilih", "error");
    
    setIsGeneratingPrompts(true);
    try {
      const env = activeProject.environments.find((e: any) => e.id === scene.environmentId);
      const chars = activeProject.characters.filter((c: any) => scene.characterIds.includes(c.id));
      
      const isObjTalk = isObjectTalkGenre(activeProject.genre);
      const charPrompts = chars.map((c: any) => {
        let base = `[CHARACTER: ${c.name}, ${c.basePrompt}]`;
        if (isObjTalk) base += ` (NOTE: This is a living talking object with a cute cartoon face, big eyes and limbs, NOT a human)`;
        return base;
      }).join(" ");
      const envPrompt = `[ENVIRONMENT: ${env.name}, ${env.basePrompt}]`;
      
      let voInstructions = "TIDAK ADA Voice Over, narasi, atau dialog audio. Fokus murni pada aksi visual.";
      if (activeProject.useVoiceOver) {
        voInstructions = `Sertakan skrip Voice Over/Dialog dalam bahasa ${activeProject.language || 'Indonesia'}. Tipe VO: ${activeProject.voiceOverType}. `;
        if (activeProject.voiceOverType === 'Full Narator') voInstructions += `Karakter HANYA bergerak, DILARANG lipsync/berbicara.`;
        else if (activeProject.voiceOverType === 'Full Karakter') voInstructions += `Karakter WAJIB lipsync dan berbicara ke kamera/antar karakter.`;
        else voInstructions += `Campuran narator off-screen dan karakter lipsync.`;
      }

      const sys = "Anda adalah Prompt Engineer & Animation Director. Berdasarkan data scene, buat Text-to-Image (TTI) prompt yang fokus pada komposisi statis, dan Text-to-Video (TTV) prompt yang menjelaskan pergerakan kamera & karakter. Pastikan instruksi visual kamera/karakter menggunakan bahasa Inggris agar kompatibel dengan AI Video Generator. Jika ada Audio Script, letakkan di dalam ttvPrompt dan gunakan bahasa target yang diminta. Kembalikan JSON: { ttiPrompt: string, ttvPrompt: string, continuityNotes: string }";
      const usr = `Aksi Scene: ${scene.action}. \n\nIdentitas Karakter: ${charPrompts} \n\nIdentitas Lingkungan: ${envPrompt} \nGaya Visual: ${activeProject.visualStyle}\nInstruksi Audio: ${voInstructions}`;
      
      const result = await callGemini(usr, sys);
      
      const updatedScenes = activeProject.scenes.map((s: any) => 
        s.id === sceneId ? { ...s, ttiPrompt: result.ttiPrompt, ttvPrompt: result.ttvPrompt, continuityNotes: result.continuityNotes } : s
      );
      updateActiveProject({ scenes: updatedScenes });
      showToast(`Prompt Scene ${scene.order} berhasil dibuat`, "success");
    } catch (e) {
      showToast("Gagal men-generate prompt scene", "error");
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const updateScene = (sceneId: string, field: string, value: any) => {
    if (!activeProject) return;
    const updatedScenes = activeProject.scenes.map((s: any) => 
      s.id === sceneId ? { ...s, [field]: value } : s
    );
    updateActiveProject({ scenes: updatedScenes });
  };

  if (animView === 'dashboard') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white">Oval Animation Studio</h2>
            <p className="text-slate-400">Manajemen Proyek Pra-Produksi Animasi AI</p>
          </div>
          <button onClick={() => setAnimView('wizard')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-colors">
            <Icons.Plus /> Buat Proyek
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              <Icons.Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Belum ada proyek. Buat proyek pertamamu.</p>
            </div>
          ) : (
            projects.map(p => (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 truncate">{p.title}</h3>
                  <p className="text-xs text-indigo-400 mb-3">{p.genre} • {p.visualStyle}</p>
                  <p className="text-sm text-slate-400 line-clamp-2">{p.premise}</p>
                </div>
                <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-800">
                  <span className="text-xs text-slate-500">{p.sceneCount} Scenes</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setActiveProjectId(p.id); setAnimView('editor'); }} className="text-xs bg-slate-800 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-white transition-colors cursor-pointer">Buka</button>
                    <button onClick={() => deleteProject(p.id)} className="text-xs bg-slate-800 hover:bg-red-600 px-3 py-1.5 rounded-lg text-white transition-colors cursor-pointer"><Icons.Trash /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (animView === 'wizard') {
    return (
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-white">Buat Proyek Animasi</h2>
          <button onClick={() => setAnimView('dashboard')} className="text-sm text-slate-400 hover:text-white cursor-pointer">Batal</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Judul Proyek</label>
            <input type="text" value={wizardData.title} onChange={e => setWizardData({...wizardData, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1 text-sm outline-none focus:border-indigo-500" placeholder="Contoh: Petualangan Arka" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Premis Cerita</label>
            <textarea value={wizardData.premise} onChange={e => setWizardData({...wizardData, premise: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1 h-24 text-sm outline-none focus:border-indigo-500" placeholder="Deskripsi singkat cerita utama..."></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Genre</label>
              {customMode.genre ? (
                <div className="flex gap-2 mt-1">
                  <input type="text" value={wizardData.genre} onChange={e => setWizardData({...wizardData, genre: e.target.value})} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm" placeholder="Ketik genre..." autoFocus />
                  <button onClick={() => { setCustomMode({...customMode, genre: false}); setWizardData({...wizardData, genre: 'Petualangan'}); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer">Batal</button>
                </div>
              ) : (
                <select value={wizardData.genre} onChange={e => {
                  if (e.target.value === 'KUSTOM') { setCustomMode({...customMode, genre: true}); setWizardData({...wizardData, genre: ''}); }
                  else setWizardData({...wizardData, genre: e.target.value})
                }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1 text-sm cursor-pointer">
                  {["Petualangan", "Objek Berbicara (Benda Hidup)", "Fantasi", "Sci-Fi", "Horor", "Misteri", "Drama", "Komedi", "Action", "Iklan", "Edukasi", "Dokumenter"].map(g => <option key={g} value={g}>{g}</option>)}
                  <option value="KUSTOM" className="text-indigo-400 font-bold">+ Ketik Kustom...</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Gaya Visual</label>
              {customMode.visualStyle ? (
                <div className="flex gap-2 mt-1">
                  <input type="text" value={wizardData.visualStyle} onChange={e => setWizardData({...wizardData, visualStyle: e.target.value})} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm" placeholder="Ketik gaya..." autoFocus />
                  <button onClick={() => { setCustomMode({...customMode, visualStyle: false}); setWizardData({...wizardData, visualStyle: '3D animated family film'}); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer">Batal</button>
                </div>
              ) : (
                <select value={wizardData.visualStyle} onChange={e => {
                  if (e.target.value === 'KUSTOM') { setCustomMode({...customMode, visualStyle: true}); setWizardData({...wizardData, visualStyle: ''}); }
                  else setWizardData({...wizardData, visualStyle: e.target.value})
                }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1 text-sm cursor-pointer">
                  {["3D animated family film", "Anime 2D", "Stop motion", "Cinematic Realistic", "Watercolor", "Cyberpunk", "Pixel Art", "Comic Book", "Flat Design", "Claymation"].map(g => <option key={g} value={g}>{g}</option>)}
                  <option value="KUSTOM" className="text-indigo-400 font-bold">+ Ketik Kustom...</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Durasi Total</label>
              {customMode.duration ? (
                <div className="flex gap-2 mt-1">
                  <input type="number" min="1" value={wizardData.duration} onChange={e => setWizardData({...wizardData, duration: e.target.value})} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm" placeholder="Detik..." autoFocus />
                  <button onClick={() => { setCustomMode({...customMode, duration: false}); setWizardData({...wizardData, duration: '30'}); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer">Batal</button>
                </div>
              ) : (
                <select value={wizardData.duration} onChange={e => {
                  if (e.target.value === 'KUSTOM') { setCustomMode({...customMode, duration: true}); setWizardData({...wizardData, duration: ''}); }
                  else setWizardData({...wizardData, duration: e.target.value})
                }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1 text-sm cursor-pointer">
                  {["10", "15", "20", "30", "60"].map(d => <option key={d} value={d}>{d} Detik</option>)}
                  <option value="KUSTOM" className="text-indigo-400 font-bold">+ Ketik Angka...</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Jumlah Scene</label>
              {customMode.sceneCount ? (
                <div className="flex gap-2 mt-1">
                  <input type="number" min="1" value={wizardData.sceneCount} onChange={e => setWizardData({...wizardData, sceneCount: e.target.value})} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-sm" placeholder="Total Scene..." autoFocus />
                  <button onClick={() => { setCustomMode({...customMode, sceneCount: false}); setWizardData({...wizardData, sceneCount: '4'}); }} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer">Batal</button>
                </div>
              ) : (
                <select value={wizardData.sceneCount} onChange={e => {
                  if (e.target.value === 'KUSTOM') { setCustomMode({...customMode, sceneCount: true}); setWizardData({...wizardData, sceneCount: ''}); }
                  else setWizardData({...wizardData, sceneCount: e.target.value})
                }} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1 text-sm cursor-pointer">
                  {["3", "4", "6", "8"].map(s => <option key={s} value={s}>{s} Scene</option>)}
                  <option value="KUSTOM" className="text-indigo-400 font-bold">+ Ketik Angka...</option>
                </select>
              )}
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Bahasa Output</label>
              <select value={wizardData.language} onChange={e => setWizardData({...wizardData, language: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white mt-1 text-sm cursor-pointer">
                {["Indonesia", "Inggris"].map(lang => <option key={lang} value={lang}>{lang}</option>)}
              </select>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-200 cursor-pointer">
              <input type="checkbox" checked={wizardData.useVoiceOver} onChange={e => setWizardData({...wizardData, useVoiceOver: e.target.checked})} className="accent-indigo-500 w-4 h-4 cursor-pointer" />
              Gunakan Voice Over / Dialog Audio
            </label>

            {wizardData.useVoiceOver && (
              <div className="pl-7 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-semibold text-slate-400 uppercase">Tipe Voice Over</label>
                <select value={wizardData.voiceOverType} onChange={e => setWizardData({...wizardData, voiceOverType: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white mt-1 text-sm cursor-pointer">
                  <option value="Full Narator">Full Narator (Karakter Diam/Tidak Lipsync)</option>
                  <option value="Full Karakter">Full Karakter (Karakter Lipsync/Bicara)</option>
                  <option value="Campuran">Campuran (Sebagian Narator, Sebagian Lipsync)</option>
                </select>
              </div>
            )}
          </div>
          
          <button onClick={handleAutoGenerateProject} disabled={isAutoGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl mt-4 flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
            {isAutoGenerating ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Menyusun Konsep & Naskah...</>
            ) : (
              <><Icons.Wand /> Auto-Generate Proyek AI</>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (animView === 'editor' && activeProject) {
    return (
      <div className="h-full flex flex-col border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
        <div className="bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setAnimView('dashboard')} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-lg cursor-pointer"><Icons.Copy /></button>
            <h2 className="font-bold text-lg text-white">{activeProject.title}</h2>
            <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs">{activeProject.sceneCount} Scenes</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 bg-slate-900 border-r border-slate-800 flex flex-col p-2 gap-1 shrink-0">
            <button onClick={() => setActiveTab('info')} className={`flex items-center gap-2 p-3 text-sm rounded-lg text-left cursor-pointer ${activeTab === 'info' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Icons.Layout /> Naskah
            </button>
            <button onClick={() => setActiveTab('characters')} className={`flex items-center gap-2 p-3 text-sm rounded-lg text-left cursor-pointer ${activeTab === 'characters' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Icons.Users /> Karakter
            </button>
            <button onClick={() => setActiveTab('environments')} className={`flex items-center gap-2 p-3 text-sm rounded-lg text-left cursor-pointer ${activeTab === 'environments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Icons.Map /> Lingkungan
            </button>
            <button onClick={() => setActiveTab('storyboard')} className={`flex items-center gap-2 p-3 text-sm rounded-lg text-left cursor-pointer ${activeTab === 'storyboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Icons.Film /> Storyboard
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
            {activeTab === 'info' && (
              <div className="max-w-3xl space-y-6">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                  <h3 className="font-bold text-white mb-2">Premis Cerita</h3>
                  <p className="text-slate-300 text-sm">{activeProject.premise}</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-white">Naskah / Outline</h3>
                    <button onClick={generateStoryOutline} disabled={isGeneratingStory} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 cursor-pointer">
                      {isGeneratingStory ? 'Menyusun...' : 'Generate Naskah (AI)'}
                    </button>
                  </div>
                  <textarea 
                    value={activeProject.storyOutline} 
                    onChange={(e) => updateActiveProject({ storyOutline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 h-96 text-sm outline-none focus:border-indigo-500"
                    placeholder="Kosong. Klik Generate Naskah atau ketik outline Anda di sini."
                  />
                </div>
              </div>
            )}

            {activeTab === 'characters' && (
              <div className="max-w-4xl space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Icons.Users /> Tambah Karakter Baru</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-1">
                      <input type="text" placeholder="Nama Karakter (Cth: Budi / Si Gelas)" value={charInput.name} onChange={e=>setCharInput({...charInput, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Deskripsi fisik & pakaian (Cth: Gelas keramik biru dengan senyuman lebar)" value={charInput.desc} onChange={e=>setCharInput({...charInput, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>

                  <button onClick={generateCharacter} disabled={isGeneratingChar} className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg w-full disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                    {isGeneratingChar && <Icons.Wand className="animate-spin w-4 h-4" />} {isGeneratingChar ? 'Menyusun Bible...' : 'Generate Character Bible'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {activeProject.characters.map((c: any) => (
                    <div key={c.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 relative overflow-hidden">
                      {isObjectTalkGenre(activeProject.genre) && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-600 to-indigo-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-lg">
                          <Icons.Animation /> Karakter Benda Hidup
                        </div>
                      )}
                      <div className="pr-32">
                        <h4 className="font-bold text-indigo-400 mb-1 text-lg">{c.name}</h4>
                        <p className="text-sm text-slate-400 mb-3">{c.description}</p>
                        <div className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 break-words max-h-32 overflow-y-auto custom-scrollbar">
                          {c.basePrompt}
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-800 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-bold text-slate-300">Prompt Visual Karakter (Model Sheet)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border border-slate-800 rounded-lg p-3 bg-slate-950/50 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-indigo-400 uppercase">Prompt Visual Utama</span>
                              <div className="flex gap-2">
                                {c.sheetPrompt && (
                                  <button onClick={() => copyToClipboard(c.sheetPrompt)} className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer">
                                    <Icons.Copy /> Salin
                                  </button>
                                )}
                                <button
                                  onClick={() => generateCharacterSheet(c.id)}
                                  disabled={generatingSheetId === c.id}
                                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  {generatingSheetId === c.id ? <Icons.Wand className="animate-spin w-3 h-3" /> : <Icons.Wand className="w-3 h-3" />}
                                  {c.sheetPrompt ? 'Regenerate' : 'Buat Prompt'}
                                </button>
                              </div>
                            </div>
                            {c.sheetPrompt ? (
                              <div className="p-3 bg-black/60 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar select-all">
                                {c.sheetPrompt}
                              </div>
                            ) : (
                              <div className="h-24 rounded-lg border border-slate-800 border-dashed flex flex-col items-center justify-center text-slate-500 bg-slate-950/50">
                                <span className="text-[11px] font-medium text-slate-400">Klik "Buat Prompt" untuk membuat prompt model sheet</span>
                              </div>
                            )}
                          </div>

                          {(c.variations || []).map((v: any) => (
                            <div key={v.id} className="border border-slate-800 rounded-lg p-3 bg-slate-950/50 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase truncate pr-2">Var: {v.description}</span>
                                <div className="flex gap-2 shrink-0">
                                  <button onClick={() => deleteCharacterVariation(c.id, v.id)} className="text-xs text-rose-500 hover:text-rose-400 p-1 cursor-pointer"><Icons.Trash /></button>
                                  {v.sheetPrompt && (
                                    <button onClick={() => copyToClipboard(v.sheetPrompt)} className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer">
                                      <Icons.Copy /> Salin
                                    </button>
                                  )}
                                  <button
                                    onClick={() => generateCharacterSheet(c.id, v.id)}
                                    disabled={generatingSheetId === v.id}
                                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded disabled:opacity-50 flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    {generatingSheetId === v.id ? <Icons.Wand className="animate-spin w-3 h-3" /> : <Icons.Wand className="w-3 h-3" />}
                                    {v.sheetPrompt ? 'Regenerate' : 'Buat Prompt'}
                                  </button>
                                </div>
                              </div>
                              {v.sheetPrompt ? (
                                <div className="p-3 bg-black/60 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar select-all">
                                  {v.sheetPrompt}
                                </div>
                              ) : (
                                <div className="h-24 rounded-lg border border-slate-800 border-dashed flex flex-col items-center justify-center text-slate-500 bg-slate-950/50">
                                  <span className="text-[11px] font-medium text-slate-400">Klik "Buat Prompt" untuk variasi ini</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 flex gap-2 max-w-md">
                          <input 
                            type="text" 
                            placeholder="Tambah variasi baru (cth: Waktu Kecil, Pakai Jas...)" 
                            value={varInputs[c.id] || ''}
                            onChange={e => setVarInputs({...varInputs, [c.id]: e.target.value})}
                            onKeyPress={e => e.key === 'Enter' && addCharacterVariation(c.id)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                          />
                          <button 
                            onClick={() => addCharacterVariation(c.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Icons.Plus /> Tambah Variasi
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'environments' && (
              <div className="max-w-4xl space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Icons.Map /> Tambah Lokasi Baru</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <input type="text" placeholder="Nama Lokasi" value={envInput.name} onChange={e=>setEnvInput({...envInput, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white outline-none focus:border-indigo-500" />
                    </div>
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Deskripsi arsitektur, suasana, cuaca..." value={envInput.desc} onChange={e=>setEnvInput({...envInput, desc: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <button onClick={generateEnvironment} disabled={isGeneratingEnv} className="mt-4 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg w-full disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                    {isGeneratingEnv && <Icons.Wand className="animate-spin w-4 h-4" />} {isGeneratingEnv ? 'Menyusun Bible...' : 'Generate Environment Bible'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeProject.environments.map((e: any) => (
                    <div key={e.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <h4 className="font-bold text-teal-400 mb-1">{e.name}</h4>
                      <p className="text-xs text-slate-400 mb-3">{e.description}</p>
                      <div className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 break-words h-24 overflow-y-auto custom-scrollbar">
                        {e.basePrompt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'storyboard' && (
              <div className="max-w-5xl space-y-6">
                {activeProject.scenes.map((scene: any) => (
                  <div key={scene.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col lg:flex-row">
                    <div className="p-5 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-900/50 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-slate-800 text-white font-bold px-3 py-1 rounded-lg text-sm">SCENE {scene.order}</span>
                      </div>
                      
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Aksi / Cerita Scene Ini</label>
                        <textarea 
                          value={scene.action} 
                          onChange={(e) => updateScene(scene.id, 'action', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white h-24 outline-none focus:border-indigo-500"
                          placeholder="Karakter masuk ke ruangan, melihat ke sekeliling..."
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Lokasi (Environment)</label>
                        <select 
                          value={scene.environmentId} 
                          onChange={(e) => updateScene(scene.id, 'environmentId', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white cursor-pointer"
                        >
                          <option value="">-- Pilih Lokasi --</option>
                          {activeProject.environments.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Karakter yang Muncul</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                          {activeProject.characters.map((c: any) => (
                            <label key={c.id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={scene.characterIds.includes(c.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked 
                                    ? [...scene.characterIds, c.id] 
                                    : scene.characterIds.filter((id: string) => id !== c.id);
                                  updateScene(scene.id, 'characterIds', newIds);
                                }}
                                className="accent-indigo-500"
                              />
                              {c.name}
                            </label>
                          ))}
                          {activeProject.characters.length === 0 && <span className="text-xs text-rose-400">Belum ada karakter di proyek ini.</span>}
                        </div>
                      </div>

                      <button 
                        onClick={() => generatePromptsForScene(scene.id)} 
                        disabled={scene.isGenerating || isGeneratingPrompts}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        {scene.isGenerating ? <><Icons.Wand className="animate-spin w-4 h-4" /> Sedang Merakit Prompt...</> : 'Regenerate Prompts (TTI & TTV)'}
                      </button>
                    </div>

                    <div className="p-5 lg:w-2/3 flex flex-col gap-4 bg-slate-950">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-bold text-pink-400 uppercase">Text-to-Image (Keyframe)</h4>
                          {scene.ttiPrompt && <button onClick={() => copyToClipboard(scene.ttiPrompt)} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 cursor-pointer"><Icons.Copy /> Copy</button>}
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-32 overflow-y-auto text-sm font-mono text-slate-300 custom-scrollbar whitespace-pre-wrap relative">
                          {scene.isGenerating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl">
                              <Icons.Wand className="w-5 h-5 text-pink-400 animate-spin mb-2"/>
                              <span className="text-xs text-pink-400 font-sans">Menyusun TTI Prompt...</span>
                            </div>
                          ) : scene.ttiPrompt ? scene.ttiPrompt : <span className="text-slate-600 italic">Prompt gambar belum dibuat. Lengkapi info scene dan klik Generate.</span>}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase">Text-to-Video (Motion)</h4>
                          {scene.ttvPrompt && <button onClick={() => copyToClipboard(scene.ttvPrompt)} className="text-xs text-slate-500 hover:text-white flex items-center gap-1 cursor-pointer"><Icons.Copy /> Copy</button>}
                        </div>
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-32 overflow-y-auto text-sm font-mono text-slate-300 custom-scrollbar whitespace-pre-wrap relative">
                          {scene.isGenerating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-xl">
                              <Icons.Wand className="w-5 h-5 text-indigo-400 animate-spin mb-2"/>
                              <span className="text-xs text-indigo-400 font-sans">Menyusun TTV Prompt...</span>
                            </div>
                          ) : scene.ttvPrompt ? scene.ttvPrompt : <span className="text-slate-600 italic">Prompt video belum dibuat. Lengkapi info scene dan klik Generate.</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
