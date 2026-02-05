'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

const PIXEL_CODE = `<!-- Cursive Tracking Pixel -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.cursive.io/pixel.js';
    script.async = true;
    script.dataset.projectId = 'proj_abc123xyz';
    document.head.appendChild(script);
  })();
</script>`;

interface Visitor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
}

const VISITORS: Visitor[] = [
  { id: 1, firstName: 'Sarah', lastName: 'Chen', email: 'sarah@techcorp.com', jobTitle: 'VP of Marketing' },
  { id: 2, firstName: 'Michael', lastName: 'Rodriguez', email: 'michael@startup.io', jobTitle: 'Head of Growth' },
  { id: 3, firstName: 'Emma', lastName: 'Williams', email: 'emma@enterprise.com', jobTitle: 'Director of Sales' },
  { id: 4, firstName: 'James', lastName: 'Park', email: 'james@saascompany.com', jobTitle: 'CEO' },
];

export default function InstallPixelDemo() {
  const [typedCode, setTypedCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [showVisitors, setShowVisitors] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView && !isTyping) {
      setIsTyping(true);
      let currentIndex = 0;

      const typingInterval = setInterval(() => {
        if (currentIndex <= PIXEL_CODE.length) {
          setTypedCode(PIXEL_CODE.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          // Start counter animation after typing completes
          setTimeout(() => {
            animateCounter();
          }, 500);
        }
      }, 20);

      return () => clearInterval(typingInterval);
    }
  }, [isInView]);

  const animateCounter = () => {
    const duration = 3000;
    const steps = 60;
    const increment = 47 / steps;
    let current = 0;

    const counterInterval = setInterval(() => {
      current += increment;
      if (current >= 47) {
        setVisitorCount(47);
        clearInterval(counterInterval);
        // Show visitor cards after counter completes
        setTimeout(() => {
          setShowVisitors(true);
        }, 500);
      } else {
        setVisitorCount(Math.floor(current));
      }
    }, duration / steps);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PIXEL_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div ref={ref} className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          Install Tracking Pixel
        </h3>
        <p className="text-base text-gray-600">
          Add one line of code to start identifying your website visitors
        </p>
      </motion.div>

      {/* Code Editor */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full mb-8"
      >
        <div className="relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300 bg-white">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <span className="text-sm text-gray-600 font-mono">index.html</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-all"
              aria-label="Copy code"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Code Content */}
          <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto">
            <pre className="text-gray-800">
              <code>
                <span className="text-gray-500">&lt;!-- Cursive Tracking Pixel --&gt;</span>
                {'\n'}
                <span className="text-[#E36209]">&lt;script&gt;</span>
                {'\n'}
                {'  '}
                <span className="text-[#CF222E]">(function</span>
                <span className="text-gray-800">()</span>
                {' '}
                <span className="text-[#E36209]">{'{'}</span>
                {'\n'}
                {'    '}
                <span className="text-[#0550AE]">var</span>
                {' '}
                <span className="text-gray-800">script</span>
                {' = '}
                <span className="text-gray-800">document</span>
                <span className="text-[#E36209]">.</span>
                <span className="text-[#8250DF]">createElement</span>
                <span className="text-gray-800">(</span>
                <span className="text-[#0A3069]">'script'</span>
                <span className="text-gray-800">);</span>
                {'\n'}
                {'    '}
                <span className="text-gray-800">script</span>
                <span className="text-[#E36209]">.</span>
                <span className="text-gray-800">src</span>
                {' = '}
                <span className="text-[#0A3069]">'https://cdn.cursive.io/pixel.js'</span>
                <span className="text-gray-800">;</span>
                {'\n'}
                {'    '}
                <span className="text-gray-800">script</span>
                <span className="text-[#E36209]">.</span>
                <span className="text-gray-800">async</span>
                {' = '}
                <span className="text-[#0550AE]">true</span>
                <span className="text-gray-800">;</span>
                {'\n'}
                {'    '}
                <span className="text-gray-800">script</span>
                <span className="text-[#E36209]">.</span>
                <span className="text-gray-800">dataset</span>
                <span className="text-[#E36209]">.</span>
                <span className="text-gray-800">projectId</span>
                {' = '}
                <span className="text-[#0A3069]">'proj_abc123xyz'</span>
                <span className="text-gray-800">;</span>
                {'\n'}
                {'    '}
                <span className="text-gray-800">document</span>
                <span className="text-[#E36209]">.</span>
                <span className="text-gray-800">head</span>
                <span className="text-[#E36209]">.</span>
                <span className="text-[#8250DF]">appendChild</span>
                <span className="text-gray-800">(script);</span>
                {'\n'}
                {'  '}
                <span className="text-[#E36209]">{'}'}</span>
                <span className="text-gray-800">)();</span>
                {'\n'}
                <span className="text-[#E36209]">&lt;/script&gt;</span>
              </code>
            </pre>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: typedCode.length === PIXEL_CODE.length ? 1 : 0 }}
              className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"
            />
          </div>
        </div>

        {/* Success Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: visitorCount > 0 ? 1 : 0,
            y: visitorCount > 0 ? 0 : 10
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center gap-3 mt-6 text-gray-700"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Installed!</span>
          </div>
          <span className="text-sm">
            Tracking{' '}
            <motion.span
              key={visitorCount}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-semibold text-gray-900"
            >
              {visitorCount}
            </motion.span>
            {' '}visitors
          </span>
        </motion.div>
      </motion.div>

      {/* Visitor Cards */}
      {showVisitors && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {VISITORS.map((visitor, index) => (
            <motion.div
              key={visitor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.3,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{
                y: -4,
                transition: { duration: 0.2 }
              }}
              className="group relative bg-white p-5 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {visitor.firstName[0]}{visitor.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {visitor.firstName} {visitor.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 truncate">
                    {visitor.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {visitor.jobTitle}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
