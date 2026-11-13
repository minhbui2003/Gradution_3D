'use client';

import React, { useState } from 'react';
import { Settings, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { getActiveScene, SCENES } from '@/config/scenes';
import { scrollToProgress } from '../experience/ScrollDirector';

interface DebugPanelProps {
  progress: number;
}

export function DebugPanel({ progress }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeScene = getActiveScene(progress);

  return (
    <div className="fixed bottom-4 left-4 z-40 pointer-events-auto text-xs">
      {isOpen ? (
        <div className="glass-panel p-3.5 rounded-2xl border border-gold/40 shadow-xl w-64 text-gray-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
            <span className="font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
              <Settings size={13} />
              <span>3D Debug Inspector</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <ChevronDown size={15} />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px] mb-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Progress p:</span>
              <span className="font-mono text-gold font-bold">{progress.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Scene:</span>
              <span className="text-white font-medium">{activeScene.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Scene Range:</span>
              <span className="font-mono text-gray-300">
                [{activeScene.range[0].toFixed(2)}, {activeScene.range[1].toFixed(2)}]
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-white/5">
              <span className="text-gray-400">Model:</span>
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle size={11} />
                <span>graduate.glb loaded</span>
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Jump to Chapter:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {SCENES.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => scrollToProgress((sc.range[0] + sc.range[1]) / 2)}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 text-left text-[10px] text-gray-300 truncate transition-colors"
                >
                  {sc.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel border border-gold/30 text-gray-300 hover:text-gold text-[11px] font-medium shadow-md transition-all"
        >
          <Settings size={13} className="text-gold" />
          <span>p: {progress.toFixed(3)}</span>
          <ChevronUp size={13} />
        </button>
      )}
    </div>
  );
}
