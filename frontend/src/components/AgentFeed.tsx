import { motion, AnimatePresence } from "framer-motion";
import type { AgentInfo } from "../types";

interface AgentFeedProps {
  agents: AgentInfo[];
}

export default function AgentFeed({ agents }: AgentFeedProps) {
  // Collect all messages with agent info, in order
  const allMessages: { agent: AgentInfo; message: string; index: number }[] = [];
  let globalIndex = 0;

  for (const agent of agents) {
    if (agent.status !== "idle") {
      if (agent.status === "running" || agent.status === "done") {
        allMessages.push({
          agent,
          message: `${agent.name} activated`,
          index: globalIndex++,
        });
      }
      for (const msg of agent.messages) {
        allMessages.push({ agent, message: msg, index: globalIndex++ });
      }
      if (agent.status === "done") {
        allMessages.push({
          agent,
          message: `${agent.name} completed`,
          index: globalIndex++,
        });
      }
    }
  }

  // Show typing indicator for running agents
  const runningAgents = agents.filter((a) => a.status === "running");

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-white/30">
          Live Agent Feed
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
        <AnimatePresence>
          {allMessages.slice(-30).map((item) => (
            <motion.div
              key={item.index}
              initial={{ opacity: 0, x: -10, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              className="flex items-start gap-2 text-xs font-mono"
            >
              <span
                className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                style={{ background: item.agent.color }}
              />
              <span className="text-white/25 shrink-0" style={{ minWidth: 16 }}>
                {">"}
              </span>
              <span className="text-white/50 leading-relaxed">{item.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {runningAgents.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2 mt-2">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: agent.color }}
            />
            <div className="flex gap-1">
              <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
              <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
              <div className="typing-dot w-1 h-1 rounded-full" style={{ background: agent.color }} />
            </div>
            <span className="text-[10px] font-mono text-white/20">{agent.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
