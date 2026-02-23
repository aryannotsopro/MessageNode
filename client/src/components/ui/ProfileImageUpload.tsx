import { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileImageUploadProps {
  currentImage?: string;
  name: string;
  onUpload: (file: File) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ProfileImageUpload({
  currentImage,
  name,
  onUpload,
  size = 'lg'
}: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      onUpload(file);
    }
  };

  const displayImage = preview || currentImage;

  return (
    <div className="relative group">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 cursor-pointer relative`}
        onClick={() => inputRef.current?.click()}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-6 h-6 text-white" />
        </div>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}