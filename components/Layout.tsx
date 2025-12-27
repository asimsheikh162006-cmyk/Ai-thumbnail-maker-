
import React from 'react';
import { Camera, Zap, Image as ImageIcon, Layout as LayoutIcon, Wand2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 rounded-lg shadow-lg shadow-red-600/20">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AI Thumbnails Maker</h1>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
          <span className="hover:text-white cursor-pointer transition-colors">How it works</span>
          <span className="hover:text-white cursor-pointer transition-colors">Templates</span>
          <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all border border-white/5">
            My Gallery
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {children}
      </main>

      <footer className="border-t border-white/5 px-6 py-4 bg-black/20 backdrop-blur-sm z-50">
        <div className="max-w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-zinc-500 text-[11px] font-medium tracking-wide">
            © 2025 AI Thumbnails Maker. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-zinc-600 text-[9px] uppercase font-bold tracking-widest">Systems Operational</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-zinc-600 text-[10px] uppercase font-bold tracking-tighter">
              <span className="hover:text-zinc-400 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-zinc-400 cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-zinc-400 cursor-pointer transition-colors">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
