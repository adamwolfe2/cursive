'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Filter, Zap } from 'lucide-react';

const SAMPLE_CONTACTS = [
  { firstName: 'Sarah', lastName: 'Johnson', email: 's.johnson@techcorp.com' },
  { firstName: 'Michael', lastName: 'Chen', email: 'm.chen@innovate.io' },
  { firstName: 'Emily', lastName: 'Rodriguez', email: 'e.rodriguez@startup.co' },
  { firstName: 'David', lastName: 'Kim', email: 'd.kim@enterprise.com' },
  { firstName: 'Jessica', lastName: 'Taylor', email: 'j.taylor@growth.co' },
];

export default function BuildAudienceDemo() {
  const [visibleContacts, setVisibleContacts] = useState<typeof SAMPLE_CONTACTS>([]);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView && visibleContacts.length === 0) {
      // Add contacts one by one
      SAMPLE_CONTACTS.forEach((contact, index) => {
        setTimeout(() => {
          setVisibleContacts(prev => [...prev, contact]);
        }, 1000 + (index * 400));
      });
    }
  }, [isInView, visibleContacts.length]);

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
          Build Your Audience
        </h3>
        <p className="text-base text-gray-600">
          Create targeted segments that grow automatically
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-8 border border-gray-200 text-center"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-[#007AFF]" />
          </div>
          <div className="text-4xl font-light text-gray-900 mb-2">280M+</div>
          <div className="text-sm text-gray-600">Total Profiles</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-8 border border-gray-200 text-center"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Filter className="w-6 h-6 text-[#007AFF]" />
          </div>
          <div className="text-4xl font-light text-gray-900 mb-2">30,000+</div>
          <div className="text-sm text-gray-600">Intent Categories</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-8 border border-gray-200 text-center"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-[#007AFF]" />
          </div>
          <div className="text-4xl font-light text-gray-900 mb-2">Instant</div>
          <div className="text-sm text-gray-600">Sync Speed</div>
        </motion.div>
      </div>

      {/* CRM Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8"
      >
        {/* Table Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium text-gray-700">First Name</div>
            <div className="text-sm font-medium text-gray-700">Last Name</div>
            <div className="text-sm font-medium text-gray-700">Email</div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {visibleContacts.map((contact, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20, backgroundColor: '#DBEAFE' }}
              animate={{ opacity: 1, x: 0, backgroundColor: '#FFFFFF' }}
              transition={{ duration: 0.5, backgroundColor: { delay: 0.3, duration: 0.8 } }}
              className="px-6 py-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-900">{contact.firstName}</div>
                <div className="text-sm text-gray-900">{contact.lastName}</div>
                <div className="text-sm text-gray-600">{contact.email}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Loading State */}
        {visibleContacts.length < SAMPLE_CONTACTS.length && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full"
              />
              <span>Adding new contacts...</span>
            </div>
          </div>
        )}
      </motion.div>

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
              <div className="text-gray-900 font-medium mb-1">Intent-Based Targeting</div>
              <div className="text-sm text-gray-600">Target buyers based on active search behavior</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Unlimited Segments</div>
              <div className="text-sm text-gray-600">Create as many audiences as you need</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Auto-Refresh</div>
              <div className="text-sm text-gray-600">Audiences update automatically with fresh data</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#007AFF] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-medium mb-1">Multi-Channel Export</div>
              <div className="text-sm text-gray-600">Activate across ads, email, and CRM</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
