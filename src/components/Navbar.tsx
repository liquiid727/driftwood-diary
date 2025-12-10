import React from 'react';
import { Download, LogIn } from 'lucide-react';

interface NavbarProps {
  canExport: boolean;
  onExport: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ canExport, onExport }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm border-b border-pastel-blue z-50 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400" style={{ fontFamily: 'cursive' }}>
          Youth Scrapbook
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onExport}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
            canExport
              ? 'bg-pastel-blue text-blue-700 hover:bg-blue-200 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={!canExport}
        >
          <Download size={18} />
          Export PDF
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 shadow-md transition-all">
          <LogIn size={18} />
          Login
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
