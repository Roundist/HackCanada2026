export interface NeuralNode {
  id: string;
  label: string;
  status: 'ACTIVE' | 'STANDBY';
  x: number; // percentage
  y: number; // percentage
  scale: number;
  color: {
    h: number;
    s: number;
    l: number;
  };
  glowColor: {
    h: number;
    s: number;
    l: number;
  };
  icon: 'circle' | 'diamond' | 'diamond-outline' | 'diamond-filled' | 'target';
  findings?: string[];
}

export interface NeuralConnection {
  from: string;
  to: string;
}

export const NODES: NeuralNode[] = [
  {
    id: 'supply-chain',
    label: 'Supply Chain Analyst',
    status: 'ACTIVE',
    x: 50,
    y: 18,
    scale: 1.3,
    color: { h: 205, s: 85, l: 55 },
    glowColor: { h: 205, s: 90, l: 65 },
    icon: 'circle',
    findings: ['Mapped 5 supply chain inputs', 'Identified 5 US-sourced inputs ex…'],
  },
  {
    id: 'tariff',
    label: 'Tariff Calculator',
    status: 'STANDBY',
    x: 22,
    y: 45,
    scale: 0.95,
    color: { h: 355, s: 75, l: 55 },
    glowColor: { h: 355, s: 80, l: 65 },
    icon: 'diamond',
  },
  {
    id: 'geopolitical',
    label: 'Geopolitical Analyst',
    status: 'STANDBY',
    x: 78,
    y: 45,
    scale: 0.95,
    color: { h: 35, s: 85, l: 55 },
    glowColor: { h: 35, s: 90, l: 65 },
    icon: 'diamond-outline',
  },
  {
    id: 'supplier',
    label: 'Supplier Scout',
    status: 'STANDBY',
    x: 32,
    y: 75,
    scale: 0.9,
    color: { h: 155, s: 65, l: 45 },
    glowColor: { h: 155, s: 70, l: 55 },
    icon: 'diamond-filled',
  },
  {
    id: 'strategy',
    label: 'Strategy Architect',
    status: 'STANDBY',
    x: 65,
    y: 75,
    scale: 0.9,
    color: { h: 265, s: 60, l: 58 },
    glowColor: { h: 265, s: 65, l: 68 },
    icon: 'target',
  },
];

export const CONNECTIONS: NeuralConnection[] = [
  { from: 'supply-chain', to: 'tariff' },
  { from: 'supply-chain', to: 'geopolitical' },
  { from: 'supply-chain', to: 'supplier' },
  { from: 'supply-chain', to: 'strategy' },
  { from: 'tariff', to: 'supplier' },
  { from: 'geopolitical', to: 'strategy' },
  { from: 'tariff', to: 'strategy' },
  { from: 'geopolitical', to: 'supplier' },
];

export const PIPELINE_STAGES = [
  { label: 'Identified 5 US-sou…', active: true },
  { label: 'HS code + tariff map', active: false },
  { label: 'Geopolitical scenar…', active: false },
  { label: 'Supplier alternativ…', active: false },
  { label: 'Strategy synth…', active: false },
];
