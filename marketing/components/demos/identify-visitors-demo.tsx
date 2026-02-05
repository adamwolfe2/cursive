'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  angle: number;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: (
      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
    angle: 0,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: (
      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    angle: 72,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: (
      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    angle: 144,
  },
  {
    id: 'google',
    name: 'Google',
    icon: (
      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    angle: 216,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: (
      <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    angle: 288,
  },
];

interface Particle {
  id: string;
  fromAngle: number;
  delay: number;
}

export default function IdentifyVisitorsDemo() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [identifiedPercent, setIdentifiedPercent] = useState(0);
  const [contactsCount, setContactsCount] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      // Start particle animation
      const particleInterval = setInterval(() => {
        const newParticles: Particle[] = INTEGRATIONS.map((integration, index) => ({
          id: `${integration.id}-${Date.now()}-${index}`,
          fromAngle: integration.angle,
          delay: index * 0.2,
        }));
        setParticles(prev => [...prev, ...newParticles]);
      }, 2000);

      // Animate stats
      animateStats();

      return () => clearInterval(particleInterval);
    }
  }, [isInView]);

  const animateStats = () => {
    const duration = 2000;
    const steps = 60;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeOutCubic(progress);

      setIdentifiedPercent(Math.floor(70 * easeProgress));
      setContactsCount(Math.floor(2847 * easeProgress));
      setProgressPercent(Math.floor(70 * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const getOrbitPosition = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
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
          Identify Visitors
        </h3>
        <p className="text-base text-gray-600">
          Connect your tools to automatically reveal who's on your site
        </p>
      </motion.div>

      {/* Network Visualization */}
      <div className="relative w-full h-[500px] flex items-center justify-center mb-8">
        {/* Center Node - Cursive Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute z-20"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative w-[100px] h-[100px] rounded-full bg-white flex items-center justify-center shadow-2xl"
          >
            {/* Cursive "C" Logo */}
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.85 0 5.42-1.19 7.24-3.1"
                stroke="#000"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl" />
          </motion.div>
        </motion.div>

        {/* Integration Nodes */}
        {INTEGRATIONS.map((integration, index) => {
          const position = getOrbitPosition(integration.angle, 250);

          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.3 + index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
              }}
              className="z-10"
            >
              <div className="relative w-[50px] h-[50px] rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center group hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                {integration.icon}

                {/* Connection Line */}
                <svg
                  className="absolute top-1/2 left-1/2 pointer-events-none"
                  style={{
                    width: Math.abs(position.x) + 30,
                    height: Math.abs(position.y) + 30,
                    transform: `translate(-50%, -50%)`,
                  }}
                >
                  <line
                    x1={position.x > 0 ? 0 : Math.abs(position.x)}
                    y1={position.y > 0 ? 0 : Math.abs(position.y)}
                    x2={position.x > 0 ? Math.abs(position.x) : 0}
                    y2={position.y > 0 ? Math.abs(position.y) : 0}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth="1"
                  />
                </svg>

                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 px-3 py-1 rounded text-sm text-white pointer-events-none">
                  {integration.name}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Animated Particles */}
        {particles.map((particle) => {
          const position = getOrbitPosition(particle.fromAngle, 250);

          return (
            <motion.div
              key={particle.id}
              initial={{
                x: position.x,
                y: position.y,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: 0,
                y: 0,
                opacity: 0,
                scale: 0.5,
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => {
                setParticles(prev => prev.filter(p => p.id !== particle.id));
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
              }}
              className="w-2 h-2 rounded-full bg-blue-500"
            />
          );
        })}
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center bg-white p-4 rounded-lg border border-gray-200">
            <motion.div
              key={identifiedPercent}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 mb-1"
            >
              {identifiedPercent}%
            </motion.div>
            <div className="text-gray-600 text-sm">Identified</div>
          </div>

          <div className="text-center bg-white p-4 rounded-lg border border-gray-200">
            <motion.div
              key={contactsCount}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 mb-1"
            >
              {contactsCount.toLocaleString()}
            </motion.div>
            <div className="text-gray-600 text-sm">Contacts</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Anonymous</span>
            <span>Known</span>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
