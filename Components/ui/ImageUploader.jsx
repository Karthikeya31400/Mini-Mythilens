import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUploader({ onImageSelect, isUploading, preview, onClear }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png')) {
      onImageSelect(file);
    } else if (file) {
      alert('Please upload only JPG or PNG images');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/png')) {
      onImageSelect(file);
    } else if (file) {
      alert('Please upload only JPG or PNG images');
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-2xl overflow-hidden bg-stone-100 border-2 border-amber-200"
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-cover"
            />
            <button
              onClick={onClear}
              className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <X className="w-5 h-5 text-stone-600" />
            </button>
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  <span className="text-stone-700 font-medium">Uploading...</span>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-12
              transition-all duration-300 ease-out
              ${isDragging 
                ? 'border-amber-500 bg-amber-50' 
                : 'border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`
                p-4 rounded-full transition-colors duration-300
                ${isDragging ? 'bg-amber-100' : 'bg-stone-100'}
              `}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-amber-600' : 'text-stone-400'}`} />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-stone-700">
                  Drop your image here
                </p>
                <p className="text-stone-500 mt-1">
                  or click to browse
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-400">
                <ImageIcon className="w-4 h-4" />
                <span>JPG or PNG only, up to 10MB</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
