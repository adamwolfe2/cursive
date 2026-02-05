'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Mail, Linkedin, MessageSquare, Phone, RefreshCw, Database } from 'lucide-react';

export default function LaunchCampaignsDemo() {
  const [activeChannels, setActiveChannels] = useState<number[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const channels = [
    { name: 'Email', icon: Mail },
    { name: 'LinkedIn', icon: Linkedin },
    { name: 'Direct Mail', icon: MessageSquare },
    { name: 'Phone', icon: Phone },
    { name: 'SMS', icon: MessageSquare },
    { name: 'Database Reactivation', icon: RefreshCw },
  ];

  useEffect(() => {
    if (isInView && activeChannels.length === 0) {
      // Light up channels one by one
      channels.forEach((_, index) => {
        setTimeout(() => {
          setActiveChannels(prev => [...prev, index]);
        }, 800 + (index * 300));
      });
    }
  }, [isInView, activeChannels.length]);

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
          Launch Campaigns
        </h3>
        <p className="text-base text-gray-600">
          Orchestrate personalized outreach across every channel
        </p>
      </motion.div>

      {/* Channel Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {channels.map((channel, index) => {
          const Icon = channel.icon;
          const isActive = activeChannels.includes(index);

          return (
            <motion.div
              key={channel.name}
              initial={{ opacity: 0.4, scale: 0.95 }}
              animate={{
                opacity: isActive ? 1 : 0.4,
                scale: isActive ? 1 : 0.95,
                borderColor: isActive ? '#007AFF' : '#E5E7EB',
              }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-xl p-6 border-2 text-center"
            >
              <motion.div
                animate={{
                  backgroundColor: isActive ? '#EFF6FF' : '#F9FAFB',
                }}
                transition={{ duration: 0.4 }}
                className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3"
              >
                <motion.div
                  animate={{
                    color: isActive ? '#007AFF' : '#9CA3AF',
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
              </motion.div>
              <motion.div
                animate={{
                  color: isActive ? '#111827' : '#9CA3AF',
                }}
                transition={{ duration: 0.4 }}
                className="text-sm font-medium"
              >
                {channel.name}
              </motion.div>
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-xs text-[#007AFF] mt-2 flex items-center justify-center gap-1"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 bg-[#007AFF] rounded-full"
                  />
                  Active
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 text-center"
        >
          <div className="text-3xl font-light text-gray-900 mb-1">6</div>
          <div className="text-sm text-gray-600">Active Channels</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 border border-gray-200 text-center"
        >
          <div className="text-3xl font-light text-gray-900 mb-1">14%</div>
          <div className="text-sm text-gray-600">Reply Rate</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 border border-gray-200 text-center"
        >
          <div className="text-3xl font-light text-gray-900 mb-1">98%</div>
          <div className="text-sm text-gray-600">Deliverability</div>
        </motion.div>
      </div>

      {/* Features List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7 }}
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
              <div className="text-gray-900 font-medium mb-1">AI Personalization</div>
              <div className="text-sm text-gray-600">Every message customized for the recipient</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Multi-Touch Sequences</div>
              <div className="text-sm text-gray-600">Coordinated outreach across channels</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Smart Timing</div>
              <div className="text-sm text-gray-600">Send at optimal times for engagement</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Real-Time Analytics</div>
              <div className="text-sm text-gray-600">Track performance across all channels</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
