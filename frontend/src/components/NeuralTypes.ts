export interface NeuralNode {
  id: string;
  label: string;
  status: 'ACTIVE' | 'STANDBY' | 'DONE' | 'ERROR';
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
