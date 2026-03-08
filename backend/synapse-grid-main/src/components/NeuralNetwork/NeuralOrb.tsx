import { useEffect, useRef } from 'react';
import type { NeuralNode } from './types';

interface Props {
  node: NeuralNode;
  mouseOffset: { x: number; y: number };
}

const NodeIcon = ({ icon, color }: { icon: string; color: string }) => {
  const size = 14;
  switch (icon) {
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 14 14">
          <circle cx="7" cy="7" r="5" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="7" cy="7" r="2" fill={color} />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={size} height={size} viewBox="0 0 14 14">
          <rect x="3" y="3" width="8" height="8" fill={color} transform="rotate(45 7 7)" />
        </svg>
      );
    case 'diamond-outline':
      return (
        <svg width={size} height={size} viewBox="0 0 14 14">
          <rect x="3" y="3" width="8" height="8" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(45 7 7)" />
        </svg>
      );
    case 'diamond-filled':
      return (
        <svg width={size} height={size} viewBox="0 0 14 14">
          <rect x="4" y="4" width="6" height="6" fill={color} transform="rotate(45 7 7)" />
        </svg>
      );
    case 'target':
      return (
        <svg width={size} height={size} viewBox="0 0 14 14">
          <circle cx="7" cy="7" r="5" fill="none" stroke={color} strokeWidth="1.5" />
          <circle cx="7" cy="7" r="2.5" fill="none" stroke={color} strokeWidth="1.5" />
          <circle cx="7" cy="7" r="1" fill={color} />
        </svg>
      );
    default:
      return null;
  }
};

const NeuralOrb = ({ node, mouseOffset }: Props) => {
  const orbRef = useRef<HTMLDivElement>(null);
  const { color, glowColor, scale, status, label, findings } = node;
  const isActive = status === 'ACTIVE';
  const baseSize = 110;
  const size = baseSize * scale;

  const hsl = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
  const glowHsl = `hsl(${glowColor.h}, ${glowColor.s}%, ${glowColor.l}%)`;

  // Parallax offset based on depth (scale)
  const parallaxStrength = scale * 8;
  const px = mouseOffset.x * parallaxStrength;
  const py = mouseOffset.y * parallaxStrength;

  return (
    <div
      ref={orbRef}
      className="absolute flex flex-col items-center"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        transform: `translate(-50%, -50%) translate(${px}px, ${py}px)`,
        zIndex: Math.round(scale * 10),
      }}
    >
      {/* Floating shadow */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.7,
          height: size * 0.15,
          bottom: -size * 0.25,
          background: `radial-gradient(ellipse, hsla(${color.h}, ${color.s}%, ${color.l}%, 0.15), transparent 70%)`,
          filter: 'blur(6px)',
        }}
      />

      {/* Ambient pulse for active */}
      {isActive && (
        <>
          <div
            className="absolute rounded-full animate-ping"
            style={{
              width: size * 1.6,
              height: size * 1.6,
              background: `radial-gradient(circle, hsla(${color.h}, ${color.s}%, ${color.l}%, 0.06), transparent 70%)`,
              animationDuration: '3s',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: size * 1.35,
              height: size * 1.35,
              border: `1.5px solid hsla(${color.h}, ${color.s}%, ${color.l}%, 0.3)`,
              animation: 'spin 20s linear infinite',
            }}
          />
        </>
      )}

      {/* Outer translucent ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 1.15,
          height: size * 1.15,
          border: `1.5px solid hsla(${color.h}, ${color.s}%, ${color.l}%, ${isActive ? 0.4 : 0.2})`,
        }}
      />

      {/* Main orb body */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `
            radial-gradient(ellipse at 35% 30%, hsla(0, 0%, 100%, ${isActive ? 0.35 : 0.22}), transparent 60%),
            radial-gradient(ellipse at 65% 70%, hsla(${color.h}, ${color.s}%, ${Math.max(color.l - 20, 10)}%, 0.25), transparent 60%),
            radial-gradient(circle at 50% 50%, hsla(${color.h}, ${color.s}%, ${color.l}%, ${isActive ? 0.15 : 0.07}), transparent 70%)
          `,
          border: `1.5px solid hsla(${color.h}, ${color.s}%, ${color.l}%, ${isActive ? 0.4 : 0.2})`,
          backdropFilter: 'blur(12px)',
          boxShadow: isActive
            ? `0 0 50px hsla(${glowColor.h}, ${glowColor.s}%, ${glowColor.l}%, 0.25), 0 0 20px hsla(${glowColor.h}, ${glowColor.s}%, ${glowColor.l}%, 0.15), inset 0 1px 2px hsla(0, 0%, 100%, 0.2)`
            : `0 0 25px hsla(${color.h}, ${color.s}%, ${color.l}%, 0.1), inset 0 1px 2px hsla(0, 0%, 100%, 0.12)`,
        }}
      >
        {/* Glass highlight */}
        <div
          className="absolute rounded-full"
          style={{
            width: '60%',
            height: '40%',
            top: '12%',
            left: '15%',
            background: `linear-gradient(180deg, hsla(0, 0%, 100%, ${isActive ? 0.12 : 0.06}), transparent)`,
            borderRadius: '50%',
          }}
        />

        {/* Inner energy core */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: size * 0.35,
            height: size * 0.35,
            background: `radial-gradient(circle, hsla(${color.h}, ${color.s}%, ${color.l}%, ${isActive ? 0.3 : 0.12}), transparent)`,
          }}
        >
          <NodeIcon icon={node.icon} color={hsl} />
        </div>
      </div>

      {/* Status label */}
      <div className="mt-3 text-center" style={{ minWidth: 140 }}>
        <span
          className="text-[10px] font-display tracking-[0.2em] uppercase block"
          style={{ color: isActive ? hsl : 'hsl(var(--muted-foreground))' }}
        >
          {status}
        </span>
        {isActive && (
          <span
            className="text-[10px] block mt-0.5 truncate max-w-[160px]"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Identified 5 US-sourced inputs e…
          </span>
        )}
        <span className="text-sm font-display font-semibold block mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>
          {label}
        </span>
        <span
          className="text-[10px] font-display tracking-[0.15em] uppercase block"
          style={{ color: isActive ? hsl : 'hsl(var(--muted-foreground))' }}
        >
          {status}
        </span>
      </div>

      {/* Findings tooltip for active */}
      {isActive && findings && (
        <div
          className="absolute rounded-lg px-4 py-3"
          style={{
            top: size * 0.55,
            left: size * 0.3,
            minWidth: 220,
            background: 'hsla(0, 0%, 100%, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 8px 32px hsla(0, 0%, 0%, 0.06)',
            zIndex: 20,
          }}
        >
          {findings.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'hsl(var(--foreground))' }}>
              <span style={{ color: hsl, marginTop: 4 }}>◆</span>
              <span>{f}</span>
            </div>
          ))}
          <div className="flex gap-1 mt-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: hsl }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: hsl, opacity: 0.5 }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: hsl, opacity: 0.3 }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NeuralOrb;
