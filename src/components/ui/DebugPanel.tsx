'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { getActiveScene, SCENES } from '@/config/scenes';
import { scrollToProgress } from '../experience/ScrollDirector';

interface DebugPanelProps {
  progress: number;
}

export function DebugPanel({ progress }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const activeScene = getActiveScene(progress);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDev = process.env.NODE_ENV !== 'production';
      const hasDebugParam = window.location.search.includes('debug=true');
      setShowDebug(isDev || hasDebugParam);
    }
  }, []);

  if (!showDebug) return null;

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
              <span className="text-gray-400">Rigged Model:</span>
              <span className="text-green-400 flex items-center gap-1">
                <CheckCircle size={11} />
                <span>graduate_rigged.glb</span>
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Jump to Chapter:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {SCENES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => scrollToProgress(scene.range[0] + 0.02)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors text-left truncate ${
                    activeScene.id === scene.id
                      ? 'bg-iuh text-white'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {scene.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="glass-panel px-3 py-1.5 rounded-full border border-gold/30 text-gray-300 hover:text-gold flex items-center gap-1.5 shadow-md"
        >
          <Settings size={13} className="text-gold" />
          <span className="font-mono text-[11px]">p: {progress.toFixed(3)}</span>
          <ChevronUp size={13} />
        </button>
      )}
    </div>
  );
}
