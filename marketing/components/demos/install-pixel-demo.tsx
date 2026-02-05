'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, Eye } from 'lucide-react';

const CODE_LINES = [
  "<!-- Cursive Tracking Pixel -->",
  "<script>",
  "  (function() {",
  "    var script = document.createElement('script');",
  "    script.src = 'https://cdn.cursive.io/pixel.js';",
  "    script.async = true;",
  "    script.dataset.projectId = 'proj_abc123xyz';",
  "    document.head.appendChild(script);",
  "  })();",
  "</script>"
];

export default function InstallPixelDemo() {
  const [currentLine, setCurrentLine] = useState(0);
  const [showInstalled, setShowInstalled] = useState(false);
  const [showEyes, setShowEyes] = useState(false);
  const [eyePositions, setEyePositions] = useState<Array<{ x: number; y: number; delay: number }>>([]);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView && currentLine === 0) {
      // Type out code lines
      const interval = setInterval(() => {
        setCurrentLine((prev) => {
          if (prev < CODE_LINES.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            // Show "Installed" button after typing completes
            setTimeout(() => {
              setShowInstalled(true);
              // Generate random eye positions
              const eyes = Array.from({ length: 15 }, (_, i) => ({
                x: Math.random() * 100,
                y: Math.random() * 100,
                delay: i * 0.05
              }));
              setEyePositions(eyes);
              setShowEyes(true);
            }, 300);
            return prev;
          }
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isInView, currentLine]);

  return (
    <div ref={ref} className="w-full relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-light text-gray-900 mb-2">
          Install Tracking Pixel
        </h3>
        <p className="text-base text-gray-600">
          Add one line of code to start identifying your website visitors
        </p>
      </motion.div>

      {/* Code Editor */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden border border-gray-700 mb-6">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm text-gray-400 font-mono">index.html</span>
        </div>

        {/* Code Content with Typing Animation */}
        <div className="p-6 font-mono text-sm leading-relaxed">
          {CODE_LINES.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: index <= currentLine ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-gray-300"
            >
              {line}
              {index === currentLine && index < CODE_LINES.length - 1 && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-blue-500 ml-1"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Installed Button */}
      {showInstalled && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 px-6 py-3 bg-green-50 border-2 border-green-500 rounded-full">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-lg font-medium text-green-700">Installed!</span>
          </div>
        </motion.div>
      )}

      {/* Eyeball Icons Popping Up */}
      {showEyes && eyePositions.map((pos, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: pos.delay, type: "spring", duration: 0.4 }}
          style={{
            position: 'absolute',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
          }}
          className="pointer-events-none"
        >
          <Eye className="w-6 h-6 text-[#007AFF]" />
        </motion.div>
      ))}
    </div>
  );
}
