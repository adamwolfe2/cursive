'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface DataPoint {
  date: string;
  tech: number;
  intent: number;
  enterprise: number;
}

const DATA: DataPoint[] = [
  { date: 'Jan 1', tech: 0, intent: 0, enterprise: 0 },
  { date: 'Jan 8', tech: 12.5, intent: 8.3, enterprise: 6.2 },
  { date: 'Jan 15', tech: 23.7, intent: 15.8, enterprise: 11.9 },
  { date: 'Jan 22', tech: 34.2, intent: 22.4, enterprise: 17.3 },
  { date: 'Jan 29', tech: 42.8, intent: 30.1, enterprise: 24.6 },
  { date: 'Feb 5', tech: 48.9, intent: 36.7, enterprise: 30.2 },
  { date: 'Feb 12', tech: 52.4, intent: 40.5, enterprise: 34.8 },
  { date: 'Feb 19', tech: 56.3, intent: 44.2, enterprise: 38.7 },
];

interface Segment {
  id: string;
  name: string;
  color: string;
  gradient: string;
  finalValue: number;
}

const SEGMENTS: Segment[] = [
  {
    id: 'tech',
    name: 'Technology Companies',
    color: '#FF6B9D',
    gradient: 'rgba(255, 107, 157, 0.15)',
    finalValue: 56.3,
  },
  {
    id: 'intent',
    name: 'Intent Signals',
    color: '#4ADE80',
    gradient: 'rgba(74, 222, 128, 0.15)',
    finalValue: 44.2,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    color: '#FB923C',
    gradient: 'rgba(251, 146, 60, 0.15)',
    finalValue: 38.7,
  },
];

export default function BuildAudienceDemo() {
  const [animatedData, setAnimatedData] = useState<DataPoint[]>([DATA[0]]);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (isInView) {
      // Animate data points appearing
      DATA.forEach((_, index) => {
        setTimeout(() => {
          setAnimatedData(DATA.slice(0, index + 1));
        }, index * 200);
      });
    }
  }, [isInView]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const getPathData = (data: DataPoint[], key: 'tech' | 'intent' | 'enterprise') => {
    if (data.length === 0) return '';

    const width = 1000;
    const height = 400;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((d, i) => {
      const x = padding + (i / (DATA.length - 1)) * chartWidth;
      const y = padding + chartHeight - (d[key] / 100) * chartHeight;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    return path;
  };

  const getGradientPathData = (data: DataPoint[], key: 'tech' | 'intent' | 'enterprise') => {
    if (data.length === 0) return '';

    const width = 1000;
    const height = 400;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((d, i) => {
      const x = padding + (i / (DATA.length - 1)) * chartWidth;
      const y = padding + chartHeight - (d[key] / 100) * chartHeight;
      return { x, y };
    });

    let path = `M ${points[0].x} ${height - padding}`;
    path += ` L ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    path += ` L ${points[points.length - 1].x} ${height - padding}`;
    path += ' Z';

    return path;
  };

  const getClosestPoint = (x: number, y: number, data: DataPoint[], key: 'tech' | 'intent' | 'enterprise') => {
    const width = 1000;
    const height = 400;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data.map((d, i) => {
      const px = padding + (i / (DATA.length - 1)) * chartWidth;
      const py = padding + chartHeight - (d[key] / 100) * chartHeight;
      return { x: px, y: py, value: d[key] };
    });

    let closest = points[0];
    let minDistance = Infinity;

    points.forEach(point => {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    });

    return minDistance < 50 ? closest : null;
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
          Build Your Audience
        </h3>
        <p className="text-base text-gray-600">
          Create targeted segments that grow automatically
        </p>
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <div
          ref={chartRef}
          className="relative w-full aspect-[5/2] bg-white rounded-lg border border-gray-200 p-6"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <svg
            viewBox="0 0 1000 400"
            className="w-full h-full"
            style={{ overflow: 'visible' }}
          >
            {/* Grid Lines */}
            {[0, 25, 50, 75, 100].map(value => {
              const y = 40 + 320 - (value / 100) * 320;
              return (
                <g key={value}>
                  <line
                    x1={40}
                    y1={y}
                    x2={960}
                    y2={y}
                    stroke="rgba(0,0,0,0.08)"
                    strokeWidth="1"
                  />
                  <text
                    x={20}
                    y={y + 5}
                    fill="rgba(0,0,0,0.5)"
                    fontSize="12"
                    textAnchor="end"
                  >
                    {value}%
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            <text
              x={40}
              y={380}
              fill="rgba(0,0,0,0.5)"
              fontSize="12"
              textAnchor="start"
            >
              Jan 1
            </text>
            <text
              x={960}
              y={380}
              fill="rgba(0,0,0,0.5)"
              fontSize="12"
              textAnchor="end"
            >
              Feb 19
            </text>

            {/* Gradient Fills */}
            <defs>
              {SEGMENTS.map(segment => (
                <linearGradient
                  key={`gradient-${segment.id}`}
                  id={`gradient-${segment.id}`}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={segment.color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={segment.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {/* Draw gradient areas */}
            {SEGMENTS.map((segment, index) => (
              <motion.path
                key={`area-${segment.id}`}
                d={getGradientPathData(animatedData, segment.id as 'tech' | 'intent' | 'enterprise')}
                fill={`url(#gradient-${segment.id})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}

            {/* Draw lines */}
            {SEGMENTS.map((segment, index) => (
              <motion.path
                key={`line-${segment.id}`}
                d={getPathData(animatedData, segment.id as 'tech' | 'intent' | 'enterprise')}
                stroke={segment.color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: {
                    duration: 1.5,
                    delay: index * 0.2,
                    ease: [0.22, 1, 0.36, 1],
                  },
                  opacity: {
                    duration: 0.3,
                    delay: index * 0.2,
                  },
                }}
                onMouseEnter={() => setHoveredSegment(segment.id)}
                className="cursor-pointer"
                style={{
                  filter: hoveredSegment === segment.id ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                  opacity: hoveredSegment && hoveredSegment !== segment.id ? 0.3 : 1,
                }}
              />
            ))}

            {/* Invisible hover areas for better interaction */}
            {SEGMENTS.map(segment => (
              <path
                key={`hover-${segment.id}`}
                d={getPathData(animatedData, segment.id as 'tech' | 'intent' | 'enterprise')}
                stroke="transparent"
                strokeWidth="20"
                fill="none"
                onMouseEnter={() => setHoveredSegment(segment.id)}
                className="cursor-pointer"
              />
            ))}
          </svg>

          {/* Tooltip */}
          {hoveredSegment && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: 'absolute',
                left: mousePosition.x,
                top: mousePosition.y - 60,
                transform: 'translateX(-50%)',
              }}
              className="pointer-events-none z-50"
            >
              <div className="bg-gray-900 px-4 py-2 rounded-lg whitespace-nowrap shadow-lg">
                <div className="text-sm font-medium text-white mb-1">
                  {SEGMENTS.find(s => s.id === hoveredSegment)?.name}
                </div>
                <div className="text-lg font-semibold" style={{ color: SEGMENTS.find(s => s.id === hoveredSegment)?.color }}>
                  {SEGMENTS.find(s => s.id === hoveredSegment)?.finalValue}%
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center gap-8 mt-8"
        >
          {SEGMENTS.map((segment, index) => (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 1 + index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              onMouseEnter={() => setHoveredSegment(segment.id)}
              onMouseLeave={() => setHoveredSegment(null)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className="w-4 h-4 rounded-full transition-all group-hover:scale-110"
                style={{
                  backgroundColor: segment.color,
                  boxShadow: hoveredSegment === segment.id ? `0 0 12px ${segment.color}` : 'none',
                }}
              />
              <div>
                <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                  {segment.name}
                </div>
                <div
                  className="text-base font-semibold transition-all"
                  style={{
                    color: hoveredSegment === segment.id ? segment.color : '#111827',
                  }}
                >
                  {segment.finalValue}%
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
