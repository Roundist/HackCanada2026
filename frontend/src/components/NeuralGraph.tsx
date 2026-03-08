import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import NeuralOrb from './NeuralOrb';
import NeuralPathways from './NeuralPathways';
import NeuralGrid from './NeuralGrid';
import NeuralPipelineBar from './NeuralPipelineBar';
import type { NeuralNode, NeuralConnection } from './NeuralTypes';
import type { AgentInfo } from '../types/index';

interface NeuralGraphProps {
  agents: AgentInfo[];
  onSelectAgent: (id: string | null) => void;
  selectedAgent: string | null;
}

// Maps our AgentInfo IDs to synapse-grid NeuralNode config
const AGENT_NODE_CONFIG: Record<string, Omit<NeuralNode, 'id' | 'label' | 'status' | 'findings'>> = {
  supply_chain: {
    x: 50, y: 18, scale: 1.3,
    color: { h: 205, s: 85, l: 55 },
    glowColor: { h: 205, s: 90, l: 65 },
    icon: 'circle',
  },
  tariff_calculator: {
    x: 22, y: 45, scale: 0.95,
    color: { h: 355, s: 75, l: 55 },
    glowColor: { h: 355, s: 80, l: 65 },
    icon: 'diamond',
  },
  geopolitical: {
    x: 78, y: 45, scale: 0.95,
    color: { h: 35, s: 85, l: 55 },
    glowColor: { h: 35, s: 90, l: 65 },
    icon: 'diamond-outline',
  },
  supplier_scout: {
    x: 32, y: 75, scale: 0.9,
    color: { h: 155, s: 65, l: 45 },
    glowColor: { h: 155, s: 70, l: 55 },
    icon: 'diamond-filled',
  },
  strategy: {
    x: 65, y: 75, scale: 0.9,
    color: { h: 265, s: 60, l: 58 },
    glowColor: { h: 265, s: 65, l: 68 },
    icon: 'target',
  },
};

const CONNECTIONS: NeuralConnection[] = [
  { from: 'supply_chain', to: 'tariff_calculator' },
  { from: 'supply_chain', to: 'geopolitical' },
  { from: 'supply_chain', to: 'supplier_scout' },
  { from: 'supply_chain', to: 'strategy' },
  { from: 'tariff_calculator', to: 'supplier_scout' },
  { from: 'geopolitical', to: 'strategy' },
  { from: 'tariff_calculator', to: 'strategy' },
  { from: 'geopolitical', to: 'supplier_scout' },
];

export default function NeuralGraph({ agents }: NeuralGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setMouseOffset({
      x: (e.clientX - rect.left - cx) / cx,
      y: (e.clientY - rect.top - cy) / cy,
    });
  }, []);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Convert AgentInfo[] → NeuralNode[]
  const neuralNodes: NeuralNode[] = useMemo(() => {
    return agents
      .filter(a => AGENT_NODE_CONFIG[a.id])
      .map(a => ({
        id: a.id,
        label: a.name,
        status:
          a.status === 'running'
            ? 'ACTIVE'
            : a.status === 'done'
            ? 'DONE'
            : a.status === 'error'
            ? 'ERROR'
            : 'STANDBY',
        findings: a.messages.slice(-3),
        ...AGENT_NODE_CONFIG[a.id],
      }));
  }, [agents]);

  // Pipeline stages from agents in order
  const pipelineStages = useMemo(() => {
    const order = ['supply_chain', 'tariff_calculator', 'geopolitical', 'supplier_scout', 'strategy'];
    const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));
    return order.map(id => {
      const a = agentMap[id];
      const status: "done" | "active" | "queued" =
        a?.status === 'done'
          ? 'done'
          : a?.status === 'running'
          ? 'active'
          : 'queued';
      return {
        label: a?.name ?? id,
        status,
      };
    });
  }, [agents]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: 'hsl(var(--neural-bg))' }}
      onMouseMove={handleMouseMove}
    >
      <NeuralGrid />

      {dimensions.width > 0 && (
        <NeuralPathways
          width={dimensions.width}
          height={dimensions.height}
          mouseOffset={mouseOffset}
          nodes={neuralNodes}
          connections={CONNECTIONS}
        />
      )}

      {/* Ambient glow around active zone */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '18%',
          width: 400,
          height: 400,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, hsla(205, 85%, 55%, 0.04), transparent 70%)',
        }}
      />

      {neuralNodes.map(node => (
        <NeuralOrb key={node.id} node={node} mouseOffset={mouseOffset} />
      ))}

      <NeuralPipelineBar stages={pipelineStages} />
    </div>
  );
}
