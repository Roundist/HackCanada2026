import { useState, useRef, useCallback, useEffect } from 'react';
import { NODES } from './types';
import NeuralOrb from './NeuralOrb';
import NeuralPathways from './NeuralPathways';
import NeuralGrid from './NeuralGrid';
import PipelineBar from './PipelineBar';

const NeuralNetworkView = () => {
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
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ background: 'hsl(var(--neural-bg))' }}
      onMouseMove={handleMouseMove}
    >
      <NeuralGrid />

      {dimensions.width > 0 && (
        <NeuralPathways
          width={dimensions.width}
          height={dimensions.height}
          mouseOffset={mouseOffset}
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

      {NODES.map(node => (
        <NeuralOrb key={node.id} node={node} mouseOffset={mouseOffset} />
      ))}

      <PipelineBar />
    </div>
  );
};

export default NeuralNetworkView;
