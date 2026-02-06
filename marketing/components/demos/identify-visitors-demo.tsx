'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Eye } from 'lucide-react';

export default function IdentifyVisitorsDemo() {
  const [showEyes, setShowEyes] = useState(false);
  const [eyePositions, setEyePositions] = useState<Array<{ x: number; y: number; delay: number; duration: number }>>([]);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView && !showEyes) {
      // Generate random eye positions after a short delay
      setTimeout(() => {
        const eyes = Array.from({ length: 25 }, (_, i) => ({
          x: 5 + Math.random() * 90, // Keep away from edges
          y: 5 + Math.random() * 90,
          delay: i * 0.06,
          duration: 1.5 + Math.random() * 2 // Random fade duration between 1.5-3.5s
        }));
        setEyePositions(eyes);
        setShowEyes(true);
      }, 800);
    }
  }, [isInView, showEyes]);

  return (
    <div ref={ref} className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-light text-gray-900 mb-2">
          Identify Visitors
        </h3>
        <p className="text-base text-gray-600">
          Connect your tools to automatically reveal who's on your site
        </p>
      </motion.div>

      {/* Website Screenshot with Eye Icons */}
      <div className="relative mb-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg"
        >
          <img
            src="/cursive-social-preview.png"
            alt="Website visitor tracking"
            className="w-full h-auto"
          />

          {/* Live Badge */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring", duration: 0.6 }}
            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-green-500 rounded-full shadow-lg"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-white rounded-full"
            />
            <span className="text-sm font-medium text-white">Live</span>
          </motion.div>

          {/* Eyeball Icons Flashing and Fading */}
          {showEyes && eyePositions.map((pos, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 1, 1],
                opacity: [0, 1, 0.4, 1, 0.3, 1]
              }}
              transition={{
                delay: pos.delay,
                duration: pos.duration,
                repeat: Infinity,
                repeatDelay: 0.5,
                times: [0, 0.2, 0.4, 0.6, 0.8, 1]
              }}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
              }}
              className="pointer-events-none"
            >
              <Eye className="w-5 h-5 text-[#007AFF]" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
