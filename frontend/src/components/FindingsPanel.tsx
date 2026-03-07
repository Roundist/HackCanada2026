import { motion, AnimatePresence } from "framer-motion";
import type { AgentInfo, SystemEvent } from "../types";

interface FindingsPanelProps {
  agents: AgentInfo[];
  pipelineDone: boolean;
  systemEvents: SystemEvent[];
}

export default function FindingsPanel({ agents, pipelineDone, systemEvents }: FindingsPanelProps) {
  const feed: { agent: AgentInfo; message: string; index: number; timestamp: number }[] = [];
  let cursor = 0;

  for (const agent of agents) {
    if (agent.status !== "idle") {
      feed.push({ agent, message: `${agent.name} activated`, index: cursor++, timestamp: Date.now() - 1000 * (agents.length - cursor) });
      for (const msg of agent.messages) {
        feed.push({ agent, message: msg, index: cursor++, timestamp: Date.now() + cursor });
      }
      if (agent.status === "done") {
        feed.push({ agent, message: `${agent.name} complete`, index: cursor++, timestamp: Date.now() + cursor });
      }
    }
  }

  systemEvents.slice(-5).forEach((evt) => {
    const pseudoAgent = agents[0];
    feed.push({ agent: pseudoAgent, message: evt.message, index: cursor++, timestamp: evt.timestamp });
  });

  const runningAgents = agents.filter((a) => a.status === "running");

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/45">Agent Console</div>
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <span className={`w-2 h-2 rounded-full ${pipelineDone ? "bg-green-400" : "bg-cyan-400 status-blink"}`} />
          <span className="text-white/50">{pipelineDone ? "stable" : "live"}</span>
        </div>
      </div>

      <div className="border-b border-white/10 grid grid-cols-2 gap-0 text-[10px] font-mono text-white/60">
        <div className="px-4 py-2 border-r border-white/10">{runningAgents.length} agents active</div>
        <div className="px-4 py-2">{feed.length} events</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
        <AnimatePresence>
          {feed.slice(-50).map((item) => (
            <motion.div
              key={item.index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="flex items-start gap-2 text-[11px] font-mono"
            >
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: item.agent.color }} />
              <span className="text-white/30 shrink-0" style={{ minWidth: 62 }}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className="text-white/45 uppercase tracking-[0.14em] truncate" style={{ minWidth: 82 }}>
                {shortName(item.agent.name)}
              </span>
              <span className="text-white/80 leading-relaxed flex-1">{item.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {runningAgents.length > 0 && (
          <div className="mt-3 space-y-1">
            {runningAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-2 text-[10px] font-mono text-white/50">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: agent.color }} />
                <div className="flex gap-1">
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
                  <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
                </div>
                <span className="uppercase tracking-[0.18em]">{shortName(agent.name)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function shortName(name: string) {
  const parts = name.split(" ");
  return (parts[0]?.[0] || "") + (parts[1] ? parts[1][0] : parts[0]?.slice(1, 3) || "");
}
