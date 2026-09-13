'use client'

import { useState } from 'react'
import { Sparkles, Globe, Code, Image as ImageIcon, Wrench, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { useAccount } from 'wagmi'

const TABS = [
  { id: 'web3', label: 'Web3 & DeFi', icon: Globe, cost: 10 },
  { id: 'code', label: 'Code & Dev', icon: Code, cost: 5 },
  { id: 'media', label: 'Media Creation', icon: ImageIcon, cost: 8 },
  { id: 'utility', label: 'General Utility', icon: Wrench, cost: 1 },
]

export function UserStudio() {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [prompt, setPrompt] = useState("")
  const [isRouting, setIsRouting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { address } = useAccount()

  const handleSend = async () => {
    if (!prompt.trim()) return
    setIsRouting(true)
    setResult(null)

    try {
      const res = await fetch("http://localhost:8001/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          domain: activeTab.label,
          user_address: address || "0x0000000000000000000000000000000000000000"
        })
      })

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      console.error(err)
      setResult({ error: err.message })
    } finally {
      setIsRouting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-[600px] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-[var(--color-offwhite)]">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-charcoal)]">Agent Studio</h2>
        </div>
        <p className="text-sm text-[var(--color-slate)]">Deploy modular AI workflows dynamically onto the compute network.</p>
      </div>

      {/* Canvas Area (Empty state / chat history) */}
      <div className="flex-1 p-6 bg-gray-50/50 flex flex-col overflow-y-auto">
        {!isRouting && !result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-gray-300">
              <Sparkles className="w-8 h-8" />
            </div>
            <p className="text-[var(--color-slate)] font-medium">Select a module and prompt your agent.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Prompt */}
            <div className="flex justify-end">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-sm">
                {prompt}
              </div>
            </div>

            {/* Pipeline Status */}
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm w-[90%] text-sm shadow-sm space-y-4">
                
                {/* Orchestrator Parsing */}
                <div className="flex items-start space-x-3">
                  {isRouting && !result ? (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-[var(--color-charcoal)]">
                      {isRouting && !result ? "Routing to Sub-Agent..." : "Intent Parsed & Routed"}
                    </p>
                    {result?.parsed_intent && (
                      <div className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs font-mono text-gray-600 overflow-x-auto">
                        <p><span className="text-indigo-600">Task Type:</span> {result.parsed_intent.task_type}</p>
                        <p><span className="text-indigo-600">Credits:</span> {result.parsed_intent.estimated_credits}</p>
                        <p><span className="text-indigo-600">Params:</span> {JSON.stringify(result.parsed_intent.parameters)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-Agent Execution */}
                {result && (
                  <div className="flex items-start space-x-3 pt-2 border-t border-gray-100">
                    {result.sub_agent_result?.error ? (
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-red-500 font-bold text-xs">X</span>
                      </div>
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-[var(--color-charcoal)]">Sub-Agent Execution</p>
                      {result.sub_agent_result?.error ? (
                        <p className="text-red-500 text-xs mt-1">{result.sub_agent_result.error}</p>
                      ) : (
                        <div className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs text-gray-600 overflow-x-auto">
                          <p className="font-mono">{result.sub_agent_result?.inference_result || "Executed Successfully"}</p>
                          <a 
                            href={`https://scan.bohr.life/tx/${result.sub_agent_result?.settlement_tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-500 hover:underline mt-2 inline-block font-mono"
                          >
                            View Settlement Tx ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orchestrator Switcher & Input */}
      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab.id === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                disabled={isRouting}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                  isActive 
                    ? 'bg-[var(--color-charcoal)] text-white shadow-md' 
                    : 'bg-[var(--color-offwhite)] text-[var(--color-slate)] hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <div className="absolute -top-6 right-2 text-xs font-bold text-[var(--color-slate)] bg-[var(--color-peach)]/50 px-3 py-1 rounded-full border border-[var(--color-peach)] flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-[var(--color-melon)]" />
            <span>{result?.parsed_intent?.estimated_credits || activeTab.cost} Credits</span>
          </div>
          <div className="flex items-center bg-[var(--color-offwhite)] border border-gray-200 rounded-2xl p-2 focus-within:border-[var(--color-melon)] focus-within:ring-2 focus-within:ring-[var(--color-peach)] transition-all">
            <input 
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isRouting}
              placeholder={`Prompt the ${activeTab.label} agent...`}
              className="flex-1 bg-transparent px-4 py-2 outline-none text-[var(--color-charcoal)] placeholder:text-gray-400 disabled:opacity-50"
            />
            <button 
              onClick={handleSend}
              disabled={isRouting || !prompt.trim()}
              className="bg-gradient-to-r from-[var(--color-melon)] to-[var(--color-melon-light)] p-3 rounded-xl text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isRouting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
