import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadPage from './components/UploadPage';
import LoadingPage from './components/LoadingPage';
import EditorPage from './components/EditorPage';

type PageState = 'upload' | 'loading' | 'editor';

function App() {
  const [page, setPage] = useState<PageState>('upload');

  const handleUploadStart = () => {
    setPage('loading');
  };

  useEffect(() => {
    if (page === 'loading') {
      const timer = setTimeout(() => {
        setPage('editor');
      }, 3000); // Simulate 3 seconds processing
      return () => clearTimeout(timer);
    }
  }, [page]);

  const handleExport = () => {
    alert('Export functionality would generate the PDF here!');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-700">
      <Navbar canExport={page === 'editor'} onExport={handleExport} />
      
      <main className="h-full">
        {page === 'upload' && (
          <UploadPage onUploadStart={handleUploadStart} />
        )}
        
        {page === 'loading' && (
          <LoadingPage />
        )}
        
        {page === 'editor' && (
          <EditorPage />
        )}
      </main>
    </div>
  );
}

export default App;
