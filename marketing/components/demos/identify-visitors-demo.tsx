'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Eye } from 'lucide-react';

export default function IdentifyVisitorsDemo() {
  const [showEyes, setShowEyes] = useState(false);
  const [eyePositions, setEyePositions] = useState<Array<{ x: number; y: number; delay: number }>>([]);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView && !showEyes) {
      // Generate random eye positions after a short delay
      setTimeout(() => {
        const eyes = Array.from({ length: 12 }, (_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          delay: i * 0.08
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
      <div className="relative mb-8">
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
        </motion.div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 text-center"
          >
            <div className="text-3xl font-light text-[#007AFF] mb-1">70%</div>
            <div className="text-sm text-gray-600">Visitors Identified</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.3 }}
            className="bg-white rounded-xl p-6 border border-gray-200 text-center"
          >
            <div className="text-3xl font-light text-green-600 mb-1">Real-Time</div>
            <div className="text-sm text-gray-600">Live Tracking</div>
          </motion.div>
        </div>
      </div>

      {/* Features List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="bg-[#F7F9FB] rounded-xl p-8"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Company Identification</div>
              <div className="text-sm text-gray-600">Reveal which companies are visiting your site</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Contact Enrichment</div>
              <div className="text-sm text-gray-600">Get full contact details for decision makers</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Intent Signals</div>
              <div className="text-sm text-gray-600">Track behavior and buying signals</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">CRM Sync</div>
              <div className="text-sm text-gray-600">Automatically push data to your CRM</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
