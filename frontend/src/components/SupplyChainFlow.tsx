export default function SupplyChainFlow() {
  const nodes = [
    { label: "US Supplier", sub: "Michigan, OH, TX" },
    { label: "Border", sub: "CBSA Checkpoint" },
    { label: "ON Warehouse", sub: "Distribution Hub" },
    { label: "Customer", sub: "Canadian Market" },
  ];

  return (
    <div>
      <div className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-3">
        Supply Chain Flow
      </div>
      <div className="flex items-center gap-1">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex items-center gap-1">
            <div className="border border-white/[0.08] px-2 py-1.5 text-center" style={{ background: "rgba(15,17,23,0.8)", minWidth: 58 }}>
              <div className="text-[9px] font-medium text-white/50 whitespace-nowrap">{node.label}</div>
              <div className="text-[7px] font-mono text-white/15 mt-0.5 whitespace-nowrap">{node.sub}</div>
            </div>
            {i < nodes.length - 1 && (
              <div className="flex items-center">
                <div className="w-3 h-px bg-white/10" />
                <div className="text-white/20 text-[8px] flow-arrow">&#9654;</div>
                <div className="w-3 h-px bg-white/10" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-red/50" />
        <span className="text-[8px] font-mono text-white/20">25% tariff applied at border</span>
      </div>
    </div>
  );
}
