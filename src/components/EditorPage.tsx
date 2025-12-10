import { useState, useRef, useEffect } from 'react';
import type { FC, DragEvent, ChangeEvent } from 'react';
import { Image, Star, Type, PenTool, Layout, Box, Plus, Search, BookOpen, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'images', label: 'Images', icon: <Image size={20} /> },
  { id: 'decorations', label: 'Decorations', icon: <Star size={20} /> },
  { id: 'text', label: 'Text', icon: <Type size={20} /> },
  { id: 'doodles', label: 'Doodles', icon: <PenTool size={20} /> },
  { id: 'backgrounds', label: 'Backgrounds', icon: <Layout size={20} /> },
];

const ITEMS: Record<string, Array<{ id: string, label: string, icon: React.ReactNode }>> = {
  decorations: [
    { id: 'star', label: 'Star', icon: <Star className="text-yellow-400" /> },
    { id: 'ribbon', label: 'Ribbon', icon: <div className="w-6 h-6 bg-pink-300 rounded-full" /> },
    { id: 'cap', label: 'Cap', icon: <div className="w-6 h-6 bg-blue-800 rounded-sm" /> },
    { id: 'flower', label: 'Flower', icon: <div className="w-6 h-6 bg-red-400 rounded-full" /> },
  ],
  images: [
    { id: 'img1', label: 'Photo 1', icon: <div className="w-8 h-8 bg-gray-200" /> },
    { id: 'img2', label: 'Photo 2', icon: <div className="w-8 h-8 bg-gray-300" /> },
  ],
  text: [
    { id: 'title', label: 'Title', icon: <span className="font-bold text-lg">T</span> },
    { id: 'body', label: 'Body', icon: <span className="text-sm">txt</span> },
  ],
  doodles: [
    { id: 'line', label: 'Line', icon: <div className="w-8 h-1 bg-black" /> },
    { id: 'circle', label: 'Circle', icon: <div className="w-6 h-6 border-2 border-black rounded-full" /> },
  ],
  backgrounds: [
    { id: 'paper', label: 'Paper', icon: <div className="w-6 h-6 bg-yellow-100" /> },
    { id: 'grid', label: 'Grid', icon: <div className="w-6 h-6 bg-white border border-gray-200" /> },
  ],
};

interface DroppedItem {
  id: string;
  x: number;
  y: number;
  item: any;
  width?: number;
  height?: number;
}

interface Page {
  id: string;
  title: string;
  items: DroppedItem[];
}

const EditorPage: FC = () => {
  const [activeTab, setActiveTab] = useState('decorations');
  const [pages, setPages] = useState<Page[]>([
    { id: '1', title: 'Cover', items: [] },
  ]);
  const [activePageId, setActivePageId] = useState('1');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [customImages, setCustomImages] = useState<Array<{ id: string, label: string, icon: React.ReactNode, src: string }>>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newImage = {
            id: `custom-img-${Date.now()}`,
            label: file.name,
            src: event.target.result as string,
            icon: <img src={event.target.result as string} alt={file.name} className="w-full h-full object-cover rounded-md" />,
            type: 'image'
          };
          setCustomImages([...customImages, newImage]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragStart = (e: DragEvent, item: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const item = JSON.parse(data);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setPages((prevPages) =>
        prevPages.map((page) =>
          page.id === activePageId
            ? {
                ...page,
                items: [
                  ...page.items,
                  { 
                    id: Date.now().toString(), 
                    x, 
                    y, 
                    item,
                    width: item.type === 'image' ? 150 : undefined,
                    height: item.type === 'image' ? 150 : undefined
                  },
                ],
              }
            : page
        )
      );
    }
  };

  const updateItemSize = (itemId: string, width: number, height: number) => {
    setPages((prevPages) =>
      prevPages.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              items: page.items.map((it) =>
                it.id === itemId ? { ...it, width, height } : it
              ),
            }
          : page
      )
    );
  };

  const handleAddPage = () => {
    const newPageId = (pages.length + 1).toString();
    setPages([
      ...pages,
      { id: newPageId, title: `Page ${newPageId}`, items: [] },
    ]);
    setActivePageId(newPageId);
  };

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemsForTab = (tab: string) => {
    if (tab === 'images') {
      return [...customImages, ...ITEMS['images']];
    }
    return ITEMS[tab] || [];
  };

  return (
    <div className="flex h-[calc(100vh-64px)] mt-16 overflow-hidden bg-gray-50">
      {/* Left Handbook Area */}
      <div className="w-4/5 flex items-center justify-center p-8 bg-parchment relative">
        {/* Handbook Container */}
        <div className="flex w-full max-w-6xl h-[85vh] bg-[#5d4037] rounded-r-3xl rounded-l-md shadow-2xl relative overflow-hidden border-l-[12px] border-[#3e2723] flex-row">
          
          {/* Handbook Binding/Spine */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/20 to-transparent z-30 pointer-events-none" />

          {/* Left Sidebar: Page Manager (Expandable) */}
          <motion.div 
            className="bg-[#efebe9] border-r border-[#d7ccc8] flex flex-col z-20 shadow-inner absolute left-0 top-0 bottom-0 overflow-hidden"
            initial={{ width: 60 }}
            animate={{ width: isSidebarOpen ? 280 : 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onMouseEnter={() => setIsSidebarOpen(true)}
            onMouseLeave={() => setIsSidebarOpen(false)}
          >
            <div className="p-4 border-b border-[#d7ccc8] bg-[#d7ccc8]/30 flex items-center h-[72px]">
              <div className="flex items-center gap-3 text-[#5d4037] font-bold min-w-max">
                <BookOpen size={24} className="ml-1" />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      My Scrapbook
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-3 border-b border-[#d7ccc8]">
              <div className="relative h-9">
                 <Search className="absolute left-2 top-2.5 text-gray-400 w-4 h-4 z-10" />
                 <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.input
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: '100%' }}
                      exit={{ opacity: 0, width: 0 }}
                      type="text"
                      placeholder="Search pages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="absolute inset-0 pl-8 pr-3 py-2 text-sm bg-white border border-[#bcaaa4] rounded-md focus:outline-none focus:ring-2 focus:ring-[#8d6e63]"
                    />
                  )}
                 </AnimatePresence>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar overflow-x-hidden">
              {filteredPages.map((page) => (
                <div
                  key={page.id}
                  onClick={() => setActivePageId(page.id)}
                  className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all min-w-max ${
                    activePageId === page.id
                      ? 'bg-white shadow-md border-l-4 border-[#8d6e63]'
                      : 'hover:bg-white/50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="w-8 h-10 bg-white border border-gray-200 shadow-sm flex-shrink-0 flex items-center justify-center text-[8px] text-gray-300 overflow-hidden relative">
                    {/* Tiny preview placeholder */}
                     {page.items.length > 0 ? (
                       <div className="w-2 h-2 rounded-full bg-blue-300" />
                     ) : (
                       <div className="w-full h-full bg-gray-50" />
                     )}
                  </div>
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`text-sm font-medium ${activePageId === page.id ? 'text-[#5d4037]' : 'text-gray-600'}`}
                      >
                        {page.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#d7ccc8] bg-[#efebe9]">
              <button
                onClick={handleAddPage}
                className={`flex items-center justify-center gap-2 py-2 bg-[#8d6e63] text-white rounded-lg hover:bg-[#6d4c41] transition-colors shadow-sm font-medium text-sm overflow-hidden whitespace-nowrap ${isSidebarOpen ? 'w-full px-4' : 'w-10 px-0'}`}
              >
                <Plus size={20} />
                {isSidebarOpen && <span>Add Page</span>}
              </button>
            </div>
          </motion.div>

          {/* Right Main Content: Active Page */}
          <div className="flex-1 bg-[#f5f5f5] relative overflow-hidden flex items-center justify-center p-8 perspective-1000 ml-[60px] transition-all duration-300">
             {/* Paper Texture Overlay */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/paper-fibers.png")' }} />

             <AnimatePresence mode="wait">
              <motion.div
                key={activePageId}
                initial={{ opacity: 0, rotateY: 90, x: 20 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: -90, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative"
              >
                <div
                  className={`w-[500px] h-[707px] bg-white shadow-lg relative transition-all duration-300 ${
                    isDraggingOver
                      ? 'ring-4 ring-blue-300 scale-[1.01]'
                      : 'ring-1 ring-gray-200'
                  }`}
                  style={{
                     // Simulating paper texture on the page itself
                     backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)',
                     backgroundSize: '20px 20px'
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {activePage.items.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                      <span className="text-2xl font-handwriting opacity-50">Drag elements here</span>
                    </div>
                  )}

                  {activePage.items.map((dropped) => (
                    <div
                      key={dropped.id}
                      className={`absolute cursor-move group ${selectedItemId === dropped.id ? 'z-50' : 'z-10'}`}
                      style={{ 
                        left: dropped.x - (dropped.width ? dropped.width / 2 : 20), 
                        top: dropped.y - (dropped.height ? dropped.height / 2 : 20),
                        width: dropped.width,
                        height: dropped.height
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedItemId(dropped.id);
                      }}
                    >
                      <div className={`relative w-full h-full ${selectedItemId === dropped.id ? 'ring-2 ring-blue-500' : 'hover:ring-2 ring-blue-300'} rounded`}>
                        {dropped.item.type === 'image' ? (
                          <img 
                            src={dropped.item.src} 
                            alt={dropped.item.label} 
                            className="w-full h-full object-cover rounded pointer-events-none" 
                          />
                        ) : (
                          ITEMS[
                            Object.keys(ITEMS).find((k) =>
                              ITEMS[k].some((i) => i.id === dropped.item.id)
                            ) || 'decorations'
                          ]
                            .find((i) => i.id === dropped.item.id)?.icon || <Box />
                        )}

                        {/* Resize Handle */}
                        {selectedItemId === dropped.id && dropped.width && (
                          <div
                            className="absolute bottom-[-5px] right-[-5px] w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-se-resize z-50"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startWidth = dropped.width || 0;
                              const startHeight = dropped.height || 0;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
                                const newHeight = Math.max(50, startHeight + (moveEvent.clientY - startY));
                                updateItemSize(dropped.id, newWidth, newHeight);
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Page Shadow/Curve effect on the left side */}
                <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none rounded-l-sm" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Materials */}
      <div className="w-1/5 bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)] flex flex-col z-20" onClick={() => setSelectedItemId(null)}>
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center p-3 min-w-[70px] transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-500 border-b-2 border-blue-500 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Materials Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
            {TABS.find((t) => t.id === activeTab)?.label}
          </h3>
          
          {activeTab === 'images' && (
            <div className="mb-4">
               <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Upload size={20} />
                <span className="text-sm font-medium">Upload Image</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {getItemsForTab(activeTab).map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-200 transition-all aspect-square"
              >
                <div className="text-2xl transform transition-transform group-hover:scale-110">
                  {item.icon}
                </div>
                <span className="text-xs text-gray-600 font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
