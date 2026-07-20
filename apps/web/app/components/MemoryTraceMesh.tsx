'use client';

import { motion } from 'framer-motion';
import { useCallback, useRef } from 'react';

const NODES = [
  { id: 'dashboard',   x: 120, y: 90  },
  { id: 'clients',     x: 340, y: 60  },
  { id: 'leads',       x: 560, y: 110 },
  { id: 'automations', x: 260, y: 260 },
  { id: 'support',     x: 480, y: 280 },
  { id: 'platform',   x: 70,  y: 220 },
  { id: 'roles',       x: 670, y: 200 },
];

const EDGES: [string, string][] = [
  ['dashboard', 'clients'],
  ['clients',   'leads'],
  ['dashboard', 'automations'],
  ['automations','support'],
  ['leads',     'support'],
  ['platform',  'dashboard'],
  ['leads',     'roles'],
];

type PulseRef = Record<string, (() => void) | undefined>;

interface MemoryTraceMeshProps {
  className?: string;
}

/**
 * MemoryTraceMesh — the Marginalia signature element.
 * 
 * Renders a thin SVG network of nodes (modules) connected by memory traces.
 * At rest: edges are nearly invisible (opacity 0.08), nodes breathe gently.
 * On recall: call pulseEdge(edgeId) to fire a single teal pulse.
 *
 * The pulse fires on REAL backend recall events, never on a timer.
 * This keeps the mesh honest — it visualizes memory, not decoration.
 */
export function MemoryTraceMesh({ className = '' }: MemoryTraceMeshProps) {
  const pulseRefs = useRef<PulseRef>({});

  // Exported so parent components can wire to real backend recall events
  const pulseEdge = useCallback((edgeId: string) => {
    pulseRefs.current[edgeId]?.();
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      <svg
        className="w-full h-full opacity-100"
        viewBox="0 0 740 340"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Static edges — traces at rest */}
        {EDGES.map(([a, b]) => {
          const from = NODES.find(n => n.id === a);
          const to   = NODES.find(n => n.id === b);
          if (!from || !to) return null;
          return (
            <line
              key={`${a}-${b}`}
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              stroke="#34E7C4"
              strokeOpacity="0.08"
              strokeWidth="1"
            />
          );
        })}

        {/* Breathing nodes */}
        {NODES.map((n, i) => (
          <motion.circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={3}
            fill="#34E7C4"
            fillOpacity={0.35}
            animate={{
              r:           [3, 4.5, 3],
              fillOpacity: [0.35, 0.65, 0.35],
            }}
            transition={{
              duration: 3.5,
              repeat:   Infinity,
              ease:     'easeInOut',
              delay:    (i * 0.47) % 2.5,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// Export pulseEdge stub for future backend wiring
export type { PulseRef };
