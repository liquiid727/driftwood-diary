import { useRef } from 'react';
import type { FC, ChangeEvent } from 'react';
import { Upload, Leaf, Star, Cloud } from 'lucide-react';

interface UploadPageProps {
  onUploadStart: () => void;
}

const UploadPage: FC<UploadPageProps> = ({ onUploadStart }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadStart();
    }
  };

  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen pt-16 flex items-center justify-center bg-pastel-green relative overflow-hidden">
      {/* Decorative Elements */}
      <Leaf className="absolute top-24 left-20 text-icon-green w-12 h-12 rotate-[-15deg] animate-float" />
      <Leaf className="absolute bottom-20 right-24 text-icon-green w-16 h-16 rotate-[30deg] animate-float" style={{ animationDelay: '1s' }} />
      <Star className="absolute top-32 right-32 text-pastel-orange w-10 h-10 animate-pulse" />
      <Cloud className="absolute bottom-32 left-32 text-pastel-blue w-20 h-20 opacity-60 animate-float" style={{ animationDelay: '2s' }} />

      {/* Upload Card */}
      <div 
        className="relative bg-white rounded-[24px] border-2 border-dashed border-border-blue p-10 md:p-[60px_40px] shadow-lg max-w-lg w-full text-center cursor-pointer transition-transform hover:scale-105 group z-10"
        onClick={handleCardClick}
      >
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-pastel-blue rounded-full group-hover:bg-blue-200 transition-colors">
            <Upload className="w-12 h-12 text-blue-500" />
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-3">
          Import the image that inspires your scrapbook style.
        </h2>
        
        <p className="text-gray-400 text-sm md:text-base mb-8">
          We'll automatically extract its style elements to create your unique scrapbook.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
        
        <button className="px-8 py-3 bg-blue-500 text-white rounded-full font-medium shadow-md hover:bg-blue-600 transition-all">
          Select Image
        </button>
      </div>
    </div>
  );
};

export default UploadPage;
