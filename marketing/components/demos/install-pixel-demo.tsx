'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Eye } from 'lucide-react';

const FULL_CODE = `<!-- Cursive Tracking Pixel -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.cursive.io/pixel.js';
    script.async = true;
    script.dataset.projectId = 'proj_abc123xyz';
    document.head.appendChild(script);
  })();
</script>`;

export default function InstallPixelDemo() {
  const [displayedCode, setDisplayedCode] = useState('');
  const [showInstalled, setShowInstalled] = useState(false);
  const [showEyes, setShowEyes] = useState(false);
  const [eyePositions, setEyePositions] = useState<Array<{ x: number; y: number; delay: number }>>([]);
  const [hasAnimated, setHasAnimated] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.3 });

  useEffect(() => {
    // Start animation when component comes into view (and hasn't animated yet)
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < FULL_CODE.length) {
          setDisplayedCode(FULL_CODE.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          // Show "Installed" text after typing completes
          setTimeout(() => {
            setShowInstalled(true);
            // Generate random eye positions
            const eyes = Array.from({ length: 20 }, (_, i) => ({
              x: Math.random() * 100,
              y: Math.random() * 100,
              delay: i * 0.05
            }));
            setEyePositions(eyes);
            setShowEyes(true);
          }, 300);
        }
      }, 40); // Type at 40ms per character for smooth effect

      return () => clearInterval(typingInterval);
    }
  }, [isInView, hasAnimated]);

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

      {/* Code Editor - Light Theme */}
      <div className="relative bg-white rounded-xl overflow-hidden border-2 border-gray-200 mb-6 shadow-sm">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-sm text-gray-600 font-mono">index.html</span>
        </div>

        {/* Code Content with Character-by-Character Typing */}
        <div className="p-6 font-mono text-sm leading-relaxed min-h-[240px]">
          <pre className="text-gray-800 whitespace-pre-wrap">
            {displayedCode}
            {displayedCode.length < FULL_CODE.length && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-[#007AFF] ml-0.5"
              />
            )}
          </pre>
        </div>
      </div>

      {/* Installed Text */}
      {showInstalled && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="text-2xl font-medium text-green-600">
            Installed
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
