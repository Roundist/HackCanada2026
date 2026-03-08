import { useEffect, useRef } from 'react';
import { NODES, CONNECTIONS } from './types';

interface Props {
  width: number;
  height: number;
  mouseOffset: { x: number; y: number };
}

const NeuralPathways = ({ width, height, mouseOffset }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const getNodePos = (id: string) => {
      const node = NODES.find(n => n.id === id);
      if (!node) return { x: 0, y: 0, scale: 1 };
      const parallax = node.scale * 8;
      return {
        x: (node.x / 100) * width + mouseOffset.x * parallax,
        y: (node.y / 100) * height + mouseOffset.y * parallax,
        scale: node.scale,
      };
    };

    const animate = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      CONNECTIONS.forEach((conn, ci) => {
        const from = getNodePos(conn.from);
        const to = getNodePos(conn.to);

        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        // Perpendicular offset for curve
        const perpX = -dy * 0.15;
        const perpY = dx * 0.15;
        const cpx = mx + perpX + Math.sin(t + ci) * 3;
        const cpy = my + perpY + Math.cos(t + ci) * 3;

        // Path
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
        ctx.strokeStyle = `hsla(205, 40%, 70%, 0.3)`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Flowing particles along path
        const particleCount = 3;
        for (let p = 0; p < particleCount; p++) {
          const prog = ((t * 0.3 + p / particleCount + ci * 0.13) % 1);
          const inv = 1 - prog;
          const px = inv * inv * from.x + 2 * inv * prog * cpx + prog * prog * to.x;
          const py = inv * inv * from.y + 2 * inv * prog * cpy + prog * prog * to.y;

          const fromNode = NODES.find(n => n.id === conn.from);
          const hue = fromNode ? fromNode.color.h : 205;
          const alpha = Math.sin(prog * Math.PI) * 0.85;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 60%, 65%, ${alpha})`;
          ctx.fill();

          // Tiny glow
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 60%, 65%, ${alpha * 0.25})`;
          ctx.fill();
        }

        // Synapse sparks (occasional)
        const sparkPhase = (t * 0.5 + ci * 1.7) % 4;
        if (sparkPhase < 0.1) {
          const sp = Math.random();
          const inv2 = 1 - sp;
          const sx = inv2 * inv2 * from.x + 2 * inv2 * sp * cpx + sp * sp * to.x;
          const sy = inv2 * inv2 * from.y + 2 * inv2 * sp * cpy + sp * sp * to.y;
          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(205, 80%, 75%, 0.4)`;
          ctx.fill();
        }
      });

      // Directional arrows on paths
      CONNECTIONS.forEach((conn, ci) => {
        const from = getNodePos(conn.from);
        const to = getNodePos(conn.to);
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        // Small arrow at midpoint
        const angle = Math.atan2(dy, dx);
        const arrowSize = 4;
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(angle) * arrowSize, my + Math.sin(angle) * arrowSize);
        ctx.lineTo(
          mx - Math.cos(angle - 0.5) * arrowSize,
          my - Math.sin(angle - 0.5) * arrowSize
        );
        ctx.lineTo(
          mx - Math.cos(angle + 0.5) * arrowSize,
          my - Math.sin(angle + 0.5) * arrowSize
        );
        ctx.closePath();
        ctx.fillStyle = `hsla(205, 40%, 70%, 0.2)`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [width, height, mouseOffset]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    />
  );
};

export default NeuralPathways;
