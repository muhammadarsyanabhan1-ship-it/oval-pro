import React, { useState, useRef } from 'react';
import { Icons } from '../types.tsx';

export const ImageCropperModal = ({ data, onSave, onCancel }: { data: any; onSave: (val: string) => void; onCancel: () => void }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState({ left: 10, top: 10, width: 80, height: 80 });
  const [dragInfo, setDragInfo] = useState<any>(null);
  
  const handlePointerDown = (e: any, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragInfo({ handle, startX: clientX, startY: clientY, startBox: { ...box } });
  };

  const handlePointerMove = (e: any) => {
    if (!dragInfo || !imgRef.current) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const rect = imgRef.current.getBoundingClientRect();
    const deltaX = ((clientX - dragInfo.startX) / rect.width) * 100;
    const deltaY = ((clientY - dragInfo.startY) / rect.height) * 100;

    let newBox = { ...dragInfo.startBox };

    if (dragInfo.handle === 'move') {
      newBox.left += deltaX;
      newBox.top += deltaY;
    } else {
      if (dragInfo.handle.includes('w')) {
        newBox.left += deltaX;
        newBox.width -= deltaX;
      }
      if (dragInfo.handle.includes('e')) {
        newBox.width += deltaX;
      }
      if (dragInfo.handle.includes('n')) {
        newBox.top += deltaY;
        newBox.height -= deltaY;
      }
      if (dragInfo.handle.includes('s')) {
        newBox.height += deltaY;
      }
    }

    // Constraints
    if (newBox.width < 10) newBox.width = 10;
    if (newBox.height < 10) newBox.height = 10;
    if (newBox.left < 0) newBox.left = 0;
    if (newBox.top < 0) newBox.top = 0;
    if (newBox.left + newBox.width > 100) {
      if (dragInfo.handle === 'move') newBox.left = 100 - newBox.width;
      else newBox.width = 100 - newBox.left;
    }
    if (newBox.top + newBox.height > 100) {
      if (dragInfo.handle === 'move') newBox.top = 100 - newBox.height;
      else newBox.height = 100 - newBox.top;
    }

    setBox(newBox);
  };

  const handlePointerUp = () => setDragInfo(null);

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    const sx = (box.left / 100) * img.naturalWidth;
    const sy = (box.top / 100) * img.naturalHeight;
    const sWidth = (box.width / 100) * img.naturalWidth;
    const sHeight = (box.height / 100) * img.naturalHeight;

    canvas.width = sWidth;
    canvas.height = sHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
    onSave(canvas.toDataURL(data.file.type || 'image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4"
         onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
         onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}>
      <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl w-full max-w-2xl border border-white/10 flex flex-col items-center shadow-2xl">
        <div className="w-full flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">Potong Gambar (Crop)</h3>
          <button onClick={onCancel} className="text-white/50 hover:text-white"><Icons.Trash /></button>
        </div>
        
        <div className="relative max-w-full max-h-[60vh] flex items-center justify-center bg-black select-none overflow-hidden touch-none rounded-lg">
          <img ref={imgRef} src={data.preview} alt="Crop Target" className="max-w-full max-h-[60vh] object-contain select-none pointer-events-none" draggable="false" />
          
          {/* Darken area outside crop box */}
          <div className="absolute inset-0 bg-black/60 pointer-events-none" style={{
            clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${box.left}% ${box.top}%, ${box.left}% ${box.top + box.height}%, ${box.left + box.width}% ${box.top + box.height}%, ${box.left + box.width}% ${box.top}%, ${box.left}% ${box.top}%)`
          }}></div>

          {/* Cropper Box */}
          <div className="absolute border-[2px] border-lime-500 cursor-move shadow-[0_0_15px_rgba(132,204,22,0.3)] group hover:bg-lime-500/10 transition-colors"
               style={{ left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }}
               onMouseDown={(e) => handlePointerDown(e, 'move')}
               onTouchStart={(e) => handlePointerDown(e, 'move')}
          >
            {/* 4 Corner Handles */}
            <div className="absolute -left-2.5 -top-2.5 w-5 h-5 bg-white border-[3px] border-lime-500 rounded-full cursor-nwse-resize shadow-md" onMouseDown={(e) => handlePointerDown(e, 'nw')} onTouchStart={(e) => handlePointerDown(e, 'nw')} />
            <div className="absolute -right-2.5 -top-2.5 w-5 h-5 bg-white border-[3px] border-lime-500 rounded-full cursor-nesw-resize shadow-md" onMouseDown={(e) => handlePointerDown(e, 'ne')} onTouchStart={(e) => handlePointerDown(e, 'ne')} />
            <div className="absolute -left-2.5 -bottom-2.5 w-5 h-5 bg-white border-[3px] border-lime-500 rounded-full cursor-nesw-resize shadow-md" onMouseDown={(e) => handlePointerDown(e, 'sw')} onTouchStart={(e) => handlePointerDown(e, 'sw')} />
            <div className="absolute -right-2.5 -bottom-2.5 w-5 h-5 bg-white border-[3px] border-lime-500 rounded-full cursor-nwse-resize shadow-md" onMouseDown={(e) => handlePointerDown(e, 'se')} onTouchStart={(e) => handlePointerDown(e, 'se')} />
          </div>
        </div>
        <p className="text-white/50 text-xs mt-4 text-center">Geser kotak tengah atau tarik 4 titik sudut untuk menyesuaikan area gambar.</p>
        
        <div className="flex gap-4 w-full mt-6">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors">Batal</button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] transition-all">Potong & Gunakan</button>
        </div>
      </div>
    </div>
  );
};
