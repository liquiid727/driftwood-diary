import type { FC } from 'react';
import { Sun, Cloud } from 'lucide-react';

const LoadingPage: FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/92 backdrop-blur-sm">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <Sun className="w-full h-full text-orange-400 animate-spin-slow" />
          <Cloud className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-white drop-shadow-md" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'cursive' }}>
          Good wine takes time, beauty is worth the wait.
        </h2>
        
        <p className="text-gray-500 text-lg">
          AI is analyzing styles and generating your template…
        </p>
      </div>
    </div>
  );
};

export default LoadingPage;
