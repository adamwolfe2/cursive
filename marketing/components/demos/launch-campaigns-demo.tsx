'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Linkedin, MessageSquare, Package, Target, Slack, Check } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  icon: React.ReactNode;
  metric: string;
  angle: number;
  isActive: boolean;
}

interface Particle {
  id: string;
  angle: number;
  delay: number;
}

const CHANNELS: Omit<Channel, 'isActive'>[] = [
  {
    id: 'email',
    name: 'Email',
    icon: <Mail className="w-6 h-6" />,
    metric: '18% reply rate',
    angle: 0,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <Linkedin className="w-6 h-6" />,
    metric: '34% acceptance',
    angle: 60,
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: <MessageSquare className="w-6 h-6" />,
    metric: '42% open rate',
    angle: 120,
  },
  {
    id: 'mail',
    name: 'Direct Mail',
    icon: <Package className="w-6 h-6" />,
    metric: '8% response',
    angle: 180,
  },
  {
    id: 'retargeting',
    name: 'Retargeting',
    icon: <Target className="w-6 h-6" />,
    metric: '2.4% CTR',
    angle: 240,
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: <Slack className="w-6 h-6" />,
    metric: '67% engagement',
    angle: 300,
  },
];

export default function LaunchCampaignsDemo() {
  const [channels, setChannels] = useState<Channel[]>(
    CHANNELS.map(ch => ({ ...ch, isActive: false }))
  );
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      // Stagger activate channels
      CHANNELS.forEach((channel, index) => {
        setTimeout(() => {
          setChannels(prev =>
            prev.map(ch =>
              ch.id === channel.id ? { ...ch, isActive: true } : ch
            )
          );
        }, 500 + index * 500);
      });
    }
  }, [isInView]);

  useEffect(() => {
    // Create particles for active channels
    const activeChannels = channels.filter(ch => ch.isActive);

    if (activeChannels.length > 0) {
      const interval = setInterval(() => {
        const newParticles: Particle[] = activeChannels.map((channel, index) => ({
          id: `${channel.id}-${Date.now()}-${index}`,
          angle: channel.angle,
          delay: index * 0.1,
        }));
        setParticles(prev => [...prev, ...newParticles]);
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [channels]);

  const getOrbitPosition = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  const handleChannelClick = (channelId: string) => {
    setChannels(prev =>
      prev.map(ch =>
        ch.id === channelId ? { ...ch, isActive: !ch.isActive } : ch
      )
    );
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
          Launch Campaigns
        </h3>
        <p className="text-base text-gray-600">
          Orchestrate personalized outreach across every channel
        </p>
      </motion.div>

      {/* Network Visualization */}
      <div className="relative w-full h-[500px] flex items-center justify-center">
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
            className="relative w-[120px] h-[120px] rounded-full bg-white flex items-center justify-center shadow-2xl"
          >
            {/* Cursive "C" Logo */}
            <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.85 0 5.42-1.19 7.24-3.1"
                stroke="#000"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-2xl" />
          </motion.div>
        </motion.div>

        {/* Channel Nodes */}
        {channels.map((channel, index) => {
          const position = getOrbitPosition(channel.angle, 280);

          return (
            <React.Fragment key={channel.id}>
              {/* Connection Line */}
              <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                width="600"
                height="600"
                style={{ overflow: 'visible' }}
              >
                <motion.line
                  x1="300"
                  y1="300"
                  x2={300 + position.x}
                  y2={300 + position.y}
                  stroke={channel.isActive ? '#007AFF' : 'rgba(0,0,0,0.1)'}
                  strokeWidth={channel.isActive ? '2' : '1'}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{
                    pathLength: 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: 0.3 + index * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    filter: channel.isActive ? 'drop-shadow(0 0 4px #007AFF)' : 'none',
                  }}
                />
              </svg>

              {/* Channel Node */}
              <motion.div
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
                <motion.div
                  onClick={() => handleChannelClick(channel.id)}
                  onMouseEnter={() => setHoveredChannel(channel.id)}
                  onMouseLeave={() => setHoveredChannel(null)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    relative w-[70px] h-[70px] rounded-full flex items-center justify-center cursor-pointer
                    transition-all duration-300
                    ${channel.isActive
                      ? 'bg-white text-gray-900 border-2 border-blue-500 shadow-lg'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-md'
                    }
                  `}
                  style={{
                    boxShadow: channel.isActive ? '0 0 20px rgba(0, 122, 255, 0.3)' : undefined,
                  }}
                >
                  {channel.icon}

                  {/* Active Checkmark */}
                  {channel.isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}

                  {/* Pulse effect when active */}
                  {channel.isActive && (
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="absolute inset-0 rounded-full border-2 border-blue-500"
                    />
                  )}
                </motion.div>

                {/* Channel Name */}
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {channel.name}
                  </div>
                  {hoveredChannel === channel.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-gray-600"
                    >
                      {channel.metric}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}

        {/* Animated Particles */}
        {particles.map((particle) => {
          const startPosition = { x: 0, y: 0 };
          const endPosition = getOrbitPosition(particle.angle, 280);

          return (
            <motion.div
              key={particle.id}
              initial={{
                x: startPosition.x,
                y: startPosition.y,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: endPosition.x,
                y: endPosition.y,
                opacity: 0,
                scale: 0.3,
              }}
              transition={{
                duration: 1.2,
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
              className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
            />
          );
        })}
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mt-6"
      >
        <p className="text-sm text-gray-600">
          Click channels to toggle • Hover to view metrics
        </p>
      </motion.div>

      {/* Active Channels Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center gap-3 mt-6"
      >
        <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 border border-blue-200 rounded-full">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-blue-700">
            {channels.filter(ch => ch.isActive).length} of {channels.length} channels active
          </span>
        </div>
      </motion.div>
    </div>
  );
}
