import React from 'react';

export const Icons = {
  Image: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  ),
  Video: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
  ),
  Upload: ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  ),
  Trash: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  ),
  Wand: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"></path><path d="m14 7 3 3"></path><path d="M5 6v4"></path><path d="M19 14v4"></path><path d="M10 2v2"></path><path d="M7 8H3"></path><path d="M21 16h-4"></path><path d="M11 3H9"></path>
    </svg>
  ),
  Copy: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  Check: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  ),
  Download: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  ),
  Alert: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
  Text: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  ),
  Pen: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  ),
  Film: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="7" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="12" x2="22" y2="12"></line><line x1="17" y1="7" x2="22" y2="7"></line><line x1="17" y1="17" x2="22" y2="17"></line>
    </svg>
  ),
  Audio: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
  ),
  Design: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  ),
  Animation: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>
    </svg>
  ),
  Plus: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  ),
  Users: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  Map: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line>
    </svg>
  ),
  Layout: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>
    </svg>
  ),
  Save: ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  )
};

export const OPTIONS = {
  backgrounds: [
    "Ikuti deskripsi prompt", "Studio profesional", "Kamar tidur minimalis", "Ruang tamu elegan",
    "Dapur modern", "Kamar mandi mewah", "Kafe estetik", "Toko/Butik premium",
    "Meja kantor", "Outdoor alam", "Taman bunga", "Pantai tropis",
    "Jalan perkotaan (Street style)", "Latar putih polos (E-commerce)", "Latar gelap premium"
  ],
  angles: [
    "Eye-level", "Low angle", "High angle", "Bird's-eye view", "Top-down",
    "Close-up", "Extreme close-up", "Medium shot", "Medium close-up",
    "Wide shot", "Over-the-shoulder", "Side profile", "Mirror reflection", "POV"
  ],
  styles: [
    "Storyboard", "UGC (Natural & Autentik)", "Mirror Check", "POV Experience", "Testimonial",
    "Unboxing", "Before & After", "Product Showcase", "Lifestyle", "Flat Lay",
    "Cinematic Commercial", "Editorial Fashion", "Beauty Campaign", "Mirror Selfie",
    "Get Ready With Me (GRWM)", "Product Close-up", "Influencer Review", "Premium Minimalist"
  ],
  ratios: [
    { label: "1:1 (Square)", value: "1:1" },
    { label: "9:16 (Story/Reels)", value: "9:16" },
    { label: "16:9 (Landscape)", value: "16:9" },
    { label: "4:5 (Portrait Feed)", value: "4:5" },
    { label: "3:4 (Portrait Photo)", value: "3:4" }
  ],
  durations: ["10", "15", "20", "30"],
  counts: ["1", "2", "4"],
  storyboardStyles: [
    "Lifestyle (Keseharian)", "Unboxing", "Before & After", "Testimonial", 
    "Tutorial / How-to", "Product Showcase", "Cinematic Scene",
    "Behind the Scenes", "A Day in the Life", "Comedic Skit", 
    "Romantic Sequence", "Action Sequence", "Morning Routine", 
    "Travel Vlog Style", "Stop Motion Style", "Flat Lay Sequence"
  ],
  storyboardParts: ["1", "2", "3", "4"],
  storyboardGrids: ["2 Panel (Atas Bawah 1x2)", "2 Panel (Kiri Kanan 2x1)", "3 Panel (Grid 3x1)", "4 Panel (Grid 2x2)", "6 Panel (Grid 3x2)"]
};

export const INDONESIAN_VOICES = [
  { id: 'Fenrir', name: 'Ardi Pratama', desc: 'Pria • Tegas, Profesional' },
  { id: 'Puck', name: 'Bima Saputra', desc: 'Pria • Santai, Hangat' },
  { id: 'Charon', name: 'Dimas Wicaksono', desc: 'Pria • Dalam, Berwibawa' },
  { id: 'Aoede', name: 'Sinta Maharani', desc: 'Wanita • Lembut, Elegan' },
  { id: 'Kore', name: 'Nabila Putri', desc: 'Wanita • Ceria, Fresh' },
  { id: 'Zephyr', name: 'Ayu Lestari', desc: 'Wanita • Hangat, Storytelling' }
];

export const STYLE_PRESETS = ['Normal', 'Semangat', 'Tenang', 'Bahagia', 'Sedih', 'Tegas', 'Misterius'];

export const SPEED_OPTIONS = [
  { label: 'Lambat (0.75x)', value: 'lambat', rate: 0.75 },
  { label: 'Normal (1.0x)', value: 'normal', rate: 1.0 },
  { label: 'Cepat (1.25x)', value: 'cepat', rate: 1.25 }
];

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function pcmToWav(pcmData: Int16Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.byteLength, true);

  const blob = new Blob([view, pcmData.buffer as ArrayBuffer], { type: 'audio/wav' });
  return blob;
}

export const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = (error) => reject(error);
});

export const getMimeTypeFromBase64 = (base64: string) => {
  const match = base64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  return match ? match[1] : 'image/jpeg';
};

export const getBase64DataOnly = (base64: string) => {
  return base64.split(',')[1] || base64;
};

export const base64ToBlobUrl = (base64Data: string, mimeType: string) => {
  try {
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Blob conversion failed", e);
    return `data:${mimeType};base64,${base64Data}`;
  }
};

const DB_NAME = 'OvalAnimDB';
const STORE_NAME = 'projects';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveToDB = async (key: string, data: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("DB Save Error", e);
  }
};

export const loadFromDB = async (key: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error("DB Load Error", e);
    return null;
  }
};

export const getGeminiApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('oval_gemini_api_key');
    if (saved) return saved.trim();
  }
  const procKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '';
  const viteKey = typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GEMINI_API_KEY : '';
  return (procKey || viteKey || '').trim();
};

export const setGeminiApiKey = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('oval_gemini_api_key', key.trim());
  }
};

export async function fetchGeminiContent(endpoint: string, payload: any): Promise<any> {
  const apiKey = getGeminiApiKey();

  // Try server proxy first (works in preview / dev / Node environments)
  try {
    const proxyUrl = `/api/gemini/${endpoint}`;
    const proxyResp = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // If proxy returned 405 (Method Not Allowed on Vercel static), 404, or HTML error page:
    const contentType = proxyResp.headers.get('content-type') || '';
    if (proxyResp.status === 405 || proxyResp.status === 404 || contentType.includes('text/html')) {
      console.warn(`Proxy returned ${proxyResp.status}, falling back to direct Google API call...`);
      return await callDirectGemini(endpoint, payload, apiKey);
    }

    if (!proxyResp.ok) {
      const errData = await proxyResp.json().catch(() => ({}));
      // If server reports missing key but client has one, try direct
      if (errData?.error?.status === 'MISSING_API_KEY' && apiKey) {
        return await callDirectGemini(endpoint, payload, apiKey);
      }
      throw new Error(errData?.error?.message || `API Error: ${proxyResp.status}`);
    }

    return await proxyResp.json();
  } catch (err: any) {
    if (
      err.message?.includes('405') || 
      err.message?.includes('Failed to fetch') || 
      err.message?.includes('404') ||
      err.message?.includes('MISSING_API_KEY')
    ) {
      return await callDirectGemini(endpoint, payload, apiKey);
    }
    throw err;
  }
}

async function callDirectGemini(endpoint: string, payload: any, apiKey: string): Promise<any> {
  if (!apiKey) {
    throw new Error('API_KEY_REQUIRED');
  }
  const directUrl = `https://generativelanguage.googleapis.com/${endpoint}?key=${apiKey}`;
  const response = await fetch(directUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `API Error: ${response.status}`);
  }
  return await response.json();
}

export function getApiUrl(endpoint: string): string {
  return `/api/gemini/${endpoint}`;
}
