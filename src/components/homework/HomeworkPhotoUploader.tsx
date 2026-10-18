import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Plus,
  Camera,
  FileCheck,
} from 'lucide-react';

interface HomeworkPhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  disabled?: boolean;
}

export const HomeworkPhotoUploader: React.FC<HomeworkPhotoUploaderProps> = ({
  photos,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Lightbox
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Helper to compress image via canvas
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;
    setIsProcessing(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type.startsWith('image/')) {
          const dataUrl = await processImageFile(file);
          newUrls.push(dataUrl);
        }
      }
      if (newUrls.length > 0) {
        onChange([...photos, ...newUrls]);
      }
    } catch (err) {
      console.error('Error processing uploaded images', err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    if (disabled) return;
    const filtered = photos.filter((_, idx) => idx !== indexToRemove);
    onChange(filtered);
    if (activePhotoIndex === indexToRemove) {
      setActivePhotoIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-mono text-xs font-bold text-[#1B1B19] dark:text-[#F3F3EE] flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-[#D4AF37]" />
          Фотографии решений (тетрадь, черновик, формулы):
        </label>
        <span className="font-mono text-[10px] text-[#1B1B19]/60 dark:text-gray-400">
          {photos.length > 0 ? `Прикреплено: ${photos.length} фото` : 'Не прикреплено'}
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Dropzone */}
      {!disabled && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 border-2 border-dashed transition cursor-pointer text-center rounded-xs ${
            isDragging
              ? 'border-[#D4AF37] bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-[#1B1B19]/25 dark:border-[#383C4A] hover:border-[#1B1B19] dark:hover:border-[#E5C048] bg-[#FAF9F5] dark:bg-[#1A1C24]'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5 text-xs font-mono">
            <Upload className="w-5 h-5 text-[#D4AF37]" />
            <div className="font-bold text-[#1B1B19] dark:text-[#F3F3EE]">
              {isProcessing
                ? 'Обработка и сжатие фотографий...'
                : 'Нажмите или перетащите фото тетради сюда'}
            </div>
            <p className="text-[10px] text-[#1B1B19]/60 dark:text-gray-400">
              Поддерживаются форматы JPG, PNG, фото со смартфона • Можно прикрепить несколько страниц
            </p>
          </div>
        </div>
      )}

      {/* Photos Thumbnail Gallery */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
          {photos.map((photo, idx) => (
            <div
              key={idx}
              className="group relative border border-[#1B1B19]/20 dark:border-[#383C4A] bg-white dark:bg-[#12141A] p-1 shadow-2xs overflow-hidden"
            >
              <div
                onClick={() => {
                  setActivePhotoIndex(idx);
                  setZoom(1);
                  setRotation(0);
                }}
                className="aspect-3/4 w-full bg-[#FAF9F5] dark:bg-[#181A22] overflow-hidden flex items-center justify-center cursor-pointer relative"
              >
                <img
                  src={photo}
                  alt={`Лист #${idx + 1}`}
                  className="object-contain w-full h-full group-hover:scale-105 transition duration-150"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-[#1B1B19]/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-xs flex items-center gap-1 transition">
                    <Maximize2 className="w-2.5 h-2.5" /> Просмотр
                  </span>
                </div>
              </div>

              <div className="mt-1 flex items-center justify-between font-mono text-[10px] px-1">
                <span className="text-[#1B1B19]/70 dark:text-gray-300">Лист #{idx + 1}</span>

                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(idx);
                    }}
                    className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                    title="Удалить это фото"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {!disabled && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-3/4 flex flex-col items-center justify-center border border-dashed border-[#1B1B19]/30 dark:border-[#383C4A] bg-[#FAF9F5] dark:bg-[#181A22] hover:border-[#1B1B19] dark:hover:border-[#E5C048] transition cursor-pointer text-xs font-mono text-[#1B1B19]/60 dark:text-gray-400 gap-1 p-2"
            >
              <Plus className="w-5 h-5 text-[#D4AF37]" />
              <span className="text-[10px] text-center font-bold">+ Добавить страницу</span>
            </button>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {activePhotoIndex !== null && (
        <div className="fixed inset-0 z-70 bg-black/95 flex flex-col p-4 animate-in fade-in duration-100">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/20 px-2">
            <span className="font-mono text-xs font-bold text-[#E5C048]">
              Страница {activePhotoIndex + 1} из {photos.length}
            </span>

            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xs transition text-white"
                title="Увеличить"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xs transition text-white"
                title="Уменьшить"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xs transition text-white"
                title="Повернуть на 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="p-1.5 bg-rose-600 hover:bg-rose-700 rounded-xs transition text-white ml-2"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={photos[activePhotoIndex]}
                alt={`Лист #${activePhotoIndex + 1}`}
                className="max-w-[85vw] max-h-[80vh] object-contain shadow-2xl rounded-xs bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
