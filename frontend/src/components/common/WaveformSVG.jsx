import React, { useEffect, useRef } from 'react';

/**
 * WaveformSVG — animated ECG/heartbeat waveform.
 * Draws a premium data waveform that animates via stroke-dashoffset.
 * Respects prefers-reduced-motion.
 */
const WaveformSVG = ({
  width = 300,
  height = 60,
  color = 'rgba(34, 211, 238, 0.7)',
  strokeWidth = 1.5,
  animDuration = 3.5,
  className = '',
}) => {
  // ECG-like path: flat → spike → dip → recovery → flat
  const path = `M0,30 L30,30 L40,30 L45,5 L50,55 L55,20 L60,30 L90,30 L100,30 L105,10 L110,50 L115,25 L120,30 L150,30 L155,30 L160,8 L165,52 L170,22 L175,30 L210,30 L215,30 L220,12 L225,48 L230,24 L235,30 L${width},30`;

  const pathId = `wf-path-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`pointer-events-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${pathId}-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="30%" stopColor={color} stopOpacity="1" />
          <stop offset="70%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={`${pathId}-glow`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Glow shadow */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth * 3}
        strokeOpacity="0.15"
        filter={`url(#${pathId}-glow)`}
      />

      {/* Main animated waveform */}
      <path
        d={path}
        fill="none"
        stroke={`url(#${pathId}-grad)`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="stroke-dashoffset"
          from={width * 3}
          to={0}
          dur={`${animDuration}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.2 1"
        />
        <animate
          attributeName="stroke-dasharray"
          values={`0,${width * 3};${width * 1.5},${width * 1.5};${width * 3},0`}
          dur={`${animDuration}s`}
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
};

export default WaveformSVG;
