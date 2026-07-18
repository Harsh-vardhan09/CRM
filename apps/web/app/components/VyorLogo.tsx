'use client';

import { motion } from 'framer-motion';

export function VyorLogo({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer seal — ink stroke, draws once on mount */}
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
        d="M24 4L4 14V34L24 44L44 34V14L24 4Z"
        stroke="url(#seal_stroke)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner node — the single memory point */}
      <motion.circle
        cx="24"
        cy="24"
        r="5"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.65, duration: 0.5, ease: 'easeOut' }}
        fill="url(#seal_fill)"
      />

      {/* Faint spoke lines connecting node to edges — memory traces */}
      <motion.line
        x1="24" y1="19" x2="24" y2="4"
        stroke="#34E7C4" strokeOpacity="0.15" strokeWidth="0.75"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      />
      <motion.line
        x1="24" y1="29" x2="24" y2="44"
        stroke="#34E7C4" strokeOpacity="0.15" strokeWidth="0.75"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ delay: 0.95, duration: 0.5 }}
      />
      <motion.line
        x1="19.5" y1="21.5" x2="4" y2="14"
        stroke="#34E7C4" strokeOpacity="0.12" strokeWidth="0.75"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ delay: 1.0, duration: 0.5 }}
      />
      <motion.line
        x1="28.5" y1="21.5" x2="44" y2="14"
        stroke="#34E7C4" strokeOpacity="0.12" strokeWidth="0.75"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ delay: 1.05, duration: 0.5 }}
      />

      <defs>
        <linearGradient id="seal_stroke" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34E7C4" />
          <stop offset="1" stopColor="#6B5B95" />
        </linearGradient>
        <linearGradient id="seal_fill" x1="19" y1="19" x2="29" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34E7C4" />
          <stop offset="1" stopColor="#EDE6D6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
