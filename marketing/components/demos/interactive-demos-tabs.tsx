'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import InstallPixelDemo from './install-pixel-demo';
import IdentifyVisitorsDemo from './identify-visitors-demo';
import BuildAudienceDemo from './build-audience-demo';
import LaunchCampaignsDemo from './launch-campaigns-demo';

const DEMO_TABS = [
  {
    id: 'install',
    label: '1. Install Pixel',
    component: InstallPixelDemo,
  },
  {
    id: 'identify',
    label: '2. Identify Visitors',
    component: IdentifyVisitorsDemo,
  },
  {
    id: 'build',
    label: '3. Build Audience',
    component: BuildAudienceDemo,
  },
  {
    id: 'launch',
    label: '4. Launch Campaigns',
    component: LaunchCampaignsDemo,
  },
];

export function InteractiveDemosTabs() {
  const [activeTab, setActiveTab] = useState('install');

  const ActiveComponent = DEMO_TABS.find(tab => tab.id === activeTab)?.component || InstallPixelDemo;

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4">
            How <span className="font-cursive text-gray-600">Cursive</span> Works
          </h2>
          <p className="text-xl text-gray-600">Get started in minutes, not weeks</p>
        </div>

        {/* Horizontal Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-lg border border-gray-200 p-1">
            {DEMO_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-3 rounded-md text-sm font-medium transition-all
                  ${activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#007AFF] rounded-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveComponent />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
