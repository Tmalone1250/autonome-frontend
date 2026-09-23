"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { parseAbiItem, formatEther } from "viem";
import { Activity, Server, Cpu, Layers, Database, ShieldCheck, Flame, RefreshCcw } from "lucide-react";

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as `0x${string}`;
const ORCHESTRATOR_URL = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:8002";

interface NodeData {
  node_id: string;
  vault: string;
  status: string;
  last_heartbeat: number;
  max_acus: number;
  hardware: {
    cpu_usage_pct?: number;
    ram_used_gb?: number;
    ram_total_gb?: number;
    ram_pct?: number;
  };
}

interface QueueData {
  pending_tasks: number;
  completed_tasks: number;
  requeued_tasks: number;
  domain_health: Record<string, number>;
}

export default function AdminPanel() {
  const publicClient = usePublicClient();
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [queues, setQueues] = useState<QueueData | null>(null);
  const [events, setEvents] = useState<any[]>([]);

  // Telemetry Polling
  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const [nodeRes, queueRes] = await Promise.all([
          fetch(`/api/admin/nodes`),
          fetch(`/api/admin/queues`)
        ]);
        if (nodeRes.ok) {
          const data = await nodeRes.json();
          setNodes(data.nodes || []);
        }
        if (queueRes.ok) {
          const data = await queueRes.json();
          setQueues(data);
        }
      } catch (e) {
        console.error("Failed to fetch admin telemetry", e);
      }
    };
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  // On-Chain Event Fetching
  useEffect(() => {
    const fetchLogs = async () => {
      if (!publicClient) return;
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;

        const eventLogs = await publicClient.getLogs({
          address: ESCROW_ADDRESS,
          event: parseAbiItem(
            "event TaskSettled(bytes32 indexed taskId, address indexed subAgent, address[] computeNodes, uint256 subAgentReward, uint256 totalNodeReward, uint256 polAllocation, uint256 burnedAmount)"
          ),
          fromBlock,
          toBlock: currentBlock,
        });

        setEvents(eventLogs.reverse());
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, [publicClient]);

  // Aggregations
  const totalSubAgent = events.reduce((acc, ev) => acc + (ev.args.subAgentReward || 0n), 0n);
  const totalNode = events.reduce((acc, ev) => acc + (ev.args.totalNodeReward || 0n), 0n);
  const totalPol = events.reduce((acc, ev) => acc + (ev.args.polAllocation || 0n), 0n);
  const totalBurn = events.reduce((acc, ev) => acc + (ev.args.burnedAmount || 0n), 0n);
  const globalDistributed = totalSubAgent + totalNode;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Info */}
      <div className="flex justify-between items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
            Protocol Control Panel
          </h1>
          <p className="text-slate-400 mt-1">Network Telemetry & Escrow Ledger</p>
        </div>
        <div className="flex space-x-6 text-sm">
          <div className="text-right">
            <p className="text-slate-400">Total ATMA Distributed</p>
            <p className="font-mono text-xl text-teal-400 font-bold">{Number(formatEther(globalDistributed)).toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400">Total ATMA Burned</p>
            <p className="font-mono text-xl text-orange-400 font-bold flex items-center justify-end">
              <Flame className="w-4 h-4 mr-1" /> {Number(formatEther(totalBurn)).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout for Queues and Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Orchestrator Health */}
        <div className="col-span-1 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-lg text-slate-100">Orchestrator Health</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Pending Tasks</p>
                <p className="text-2xl font-bold text-white">{queues?.pending_tasks || 0}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-green-400">{queues?.completed_tasks || 0}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Re-queued</p>
                <p className="text-2xl font-bold text-orange-400 flex items-center">
                  {queues?.requeued_tasks || 0}
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700/50">
                <p className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wider">Active Nodes</p>
                <p className="text-2xl font-bold text-blue-400">{nodes.filter(n => n.status === 'ONLINE').length}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Domain Traffic</h3>
              <div className="space-y-2">
                {Object.entries(queues?.domain_health || {}).map(([domain, count]) => (
                  <div key={domain} className="flex justify-between items-center text-sm bg-slate-700/30 px-3 py-2 rounded-lg">
                    <span className="text-slate-300">{domain}</span>
                    <span className="font-mono text-slate-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DePIN Fleet Roster */}
        <div className="col-span-1 lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-lg text-slate-100">DePIN Fleet Roster</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Node Operator</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">System Load</th>
                  <th className="px-6 py-4 font-medium">Last Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {nodes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No compute nodes connected to Orchestrator.</td>
                  </tr>
                ) : (
                  nodes.map((node) => (
                    <tr key={node.node_id} className="bg-slate-800 hover:bg-slate-750 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-slate-200">{node.node_id.slice(0, 8)}...{node.node_id.slice(-6)}</span>
                          <span className="text-xs text-slate-500 font-mono mt-1">Vault: {node.vault ? `${node.vault.slice(0, 6)}...${node.vault.slice(-4)}` : 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          node.status === 'ONLINE' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${node.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          {node.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3 text-xs text-slate-300">
                          <span className="flex items-center text-teal-400 font-semibold border border-teal-400/20 bg-teal-400/10 px-2 py-0.5 rounded">
                            {node.max_acus ?? 0} ACU
                          </span>
                          <span className="flex items-center"><Cpu className="w-3 h-3 mr-1 text-slate-400"/> {node.hardware?.cpu_usage_pct ?? 0}%</span>
                          <span className="flex items-center"><Layers className="w-3 h-3 mr-1 text-slate-400"/> {node.hardware?.ram_pct ?? 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        {Math.floor(Date.now()/1000 - node.last_heartbeat)}s ago
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global Settlement Ledger */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-lg text-slate-100">Global Settlement Ledger (On-Chain)</h2>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Task ID</th>
                <th className="px-6 py-4 font-medium">Sub-Agent (70%)</th>
                <th className="px-6 py-4 font-medium">Node (15%)</th>
                <th className="px-6 py-4 font-medium">POL (10%)</th>
                <th className="px-6 py-4 font-medium">Burn (5%)</th>
                <th className="px-6 py-4 font-medium">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">No recent settlement events found in the last 10,000 blocks.</td>
                </tr>
              ) : (
                events.map((ev, i) => (
                  <tr key={`${ev.transactionHash}-${i}`} className="bg-slate-800 hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {ev.args.taskId.slice(0, 10)}...
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-mono text-slate-400">{ev.args.subAgent.slice(0, 8)}...</div>
                      <div className="text-emerald-400 font-semibold">+{Number(formatEther(ev.args.subAgentReward || 0n)).toFixed(2)} ATMA</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-mono text-slate-400 group relative">
                        {ev.args.computeNodes && ev.args.computeNodes.length > 0 ? (
                          <>
                            {ev.args.computeNodes.length === 1 
                              ? `${ev.args.computeNodes[0].slice(0, 8)}...` 
                              : `${ev.args.computeNodes.length} Nodes Distributed`}
                            {ev.args.computeNodes.length > 1 && (
                              <div className="absolute hidden group-hover:block bg-slate-900 border border-slate-700 p-2 rounded -top-8 left-0 z-10 w-48 shadow-lg">
                                {ev.args.computeNodes.map((n: string, idx: number) => (
                                  <div key={idx} className="truncate">{n}</div>
                                ))}
                              </div>
                            )}
                          </>
                        ) : "0x00...00"}
                      </div>
                      <div className="text-emerald-400 font-semibold">+{Number(formatEther(ev.args.totalNodeReward || 0n)).toFixed(2)} ATMA</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-blue-400 font-semibold">
                      +{Number(formatEther(ev.args.polAllocation || 0n)).toFixed(2)} ATMA
                    </td>
                    <td className="px-6 py-4 text-xs text-orange-400 font-semibold flex items-center pt-5">
                      <Flame className="w-3 h-3 mr-1" /> {Number(formatEther(ev.args.burnedAmount || 0n)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <a href={`https://scan.bohr.life/tx/${ev.transactionHash}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center text-xs font-mono">
                        {ev.transactionHash.slice(0, 10)}...
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
