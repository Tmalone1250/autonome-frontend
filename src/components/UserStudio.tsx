'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Globe, Code, Image as ImageIcon, Wrench, Send, Loader2, CheckCircle2, Clock, Pause, Play, Trash2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useCredits } from './CreditContext'

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
  const [pipelineState, setPipelineState] = useState("")
  const [result, setResult] = useState<any>(null)
  
  // Session State
  const [mode, setMode] = useState<'oneshot' | 'session'>('oneshot')
  const [intervalMins, setIntervalMins] = useState(15)
  const [durationHours, setDurationHours] = useState(24)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)

  const { address } = useAccount()
  const { deductCredits, credits } = useCredits()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (activeSessionId) {
      timer = setInterval(async () => {
        try {
          const res = await fetch(`/api/orchestrator/sessions/${activeSessionId}`)
          if (res.ok) {
            const data = await res.json()
            setSessionData(data)
          }
        } catch (e) {}
      }, 5000)
    }
    return () => clearInterval(timer)
  }, [activeSessionId])

  const handleSend = async () => {
    if (!prompt.trim()) return

    if (mode === 'oneshot') {
      if (credits < activeTab.cost) return
      setIsRouting(true)
      setResult(null)
      setActiveSessionId(null)
      setPipelineState("Parsing Intent (Llama 3)...")
      deductCredits(activeTab.cost)

      try {
        setTimeout(() => setPipelineState("Routing to Sub-Agent..."), 1500)
        setTimeout(() => setPipelineState("Executing on DePIN Node..."), 3000)
        
        const res = await fetch(`/api/orchestrator/orchestrate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            domain: activeTab.label,
            user_address: address || "0x0000000000000000000000000000000000000000"
          })
        })

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const data = await res.json()
        
        if (data.sub_agent_result?.status === "enqueued") {
          setPipelineState("Task Enqueued. Waiting for DePIN Node...")
          const taskId = data.sub_agent_result.task_id
          while (true) {
            await new Promise(r => setTimeout(r, 3000))
            const statusRes = await fetch(`/api/orchestrator/tasks/status/${taskId}`)
            if (!statusRes.ok) throw new Error(`HTTP error checking status! status: ${statusRes.status}`)
            const statusData = await statusRes.json()
            
            if (statusData.status === "completed") {
              if (statusData.result?.error) {
                setPipelineState("Relayer settlement failed: " + statusData.result.error)
                setResult({ ...data, sub_agent_result: statusData.result })
                break
              } else if (statusData.result?.settlement_tx_hash === "PENDING") {
                setPipelineState("Relayer is settling transaction on-chain...")
              } else {
                setResult({ ...data, sub_agent_result: statusData.result })
                break
              }
            } else if (statusData.status === "processing") {
              setPipelineState("DePIN Node is processing...")
            } else if (statusData.status === "pending") {
              setPipelineState("Waiting for DePIN Node to pull task...")
            }
          }
        } else {
          setResult(data)
        }
      } catch (err: any) {
        setResult({ error: err.message })
      } finally {
        setIsRouting(false)
        setPipelineState("")
      }
    } else {
      // Session Mode
      const intervalSecs = intervalMins * 60
      const durationSecs = durationHours * 3600
      const totalTicks = Math.floor(durationSecs / intervalSecs)
      const costPerTick = 10
      const totalCost = totalTicks * costPerTick
      
      if (credits < totalCost) {
         alert("Insufficient credits for this session.")
         return
      }

      setIsRouting(true)
      setResult(null)
      setPipelineState(`Pre-authorizing ${totalCost} credits...`)
      deductCredits(totalCost)

      try {
        const res = await fetch(`/api/orchestrator/sessions/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent: "alpine",
            interval: intervalSecs,
            duration: durationSecs,
            parameters: { "PROMPT": prompt },
            operator_vault: "0x0000000000000000000000000000000000000000",
            user_address: address || "0x0000000000000000000000000000000000000000"
          })
        })
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const data = await res.json()
        setActiveSessionId(data.session_id)
        
        // Initial fetch
        const sessRes = await fetch(`/api/orchestrator/sessions/${data.session_id}`)
        if (sessRes.ok) setSessionData(await sessRes.json())
        
      } catch (err: any) {
         setResult({ error: err.message })
      } finally {
         setIsRouting(false)
         setPipelineState("")
      }
    }
  }

  const toggleSessionPause = async () => {
    if (!activeSessionId) return
    await fetch(`/api/orchestrator/sessions/${activeSessionId}/pause`, { method: "PATCH" })
    const res = await fetch(`/api/orchestrator/sessions/${activeSessionId}`)
    if (res.ok) setSessionData(await res.json())
  }

  const cancelSession = async () => {
    if (!activeSessionId) return
    await fetch(`/api/orchestrator/sessions/${activeSessionId}`, { method: "DELETE" })
    setActiveSessionId(null)
    setSessionData(null)
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-[700px] overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-[var(--color-offwhite)] flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-charcoal)]">Agent Studio</h2>
          </div>
          <p className="text-sm text-[var(--color-slate)]">Deploy modular AI workflows dynamically onto the compute network.</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="bg-gray-100 p-1 rounded-xl flex items-center space-x-1">
          <button 
            onClick={() => setMode('oneshot')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'oneshot' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            One-Shot
          </button>
          <button 
            onClick={() => setMode('session')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'session' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Session
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6 bg-gray-50/50 flex flex-col overflow-y-auto">
        {!isRouting && !result && !activeSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-gray-300">
              {mode === 'oneshot' ? <Sparkles className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
            </div>
            <p className="text-[var(--color-slate)] font-medium">
              {mode === 'oneshot' ? "Select a module and prompt your agent." : "Configure an autonomous session."}
            </p>
          </div>
        ) : activeSessionId && sessionData ? (
          // Session Dashboard
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-charcoal)] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    Active Session: {activeSessionId.substring(0, 10)}...
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Agent running on interval.</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${sessionData.status === 'RUNNING' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {sessionData.status}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Pre-Auth Credits</p>
                  <p className="text-xl font-bold text-[var(--color-charcoal)]">{Number(sessionData.pre_auth_credits).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Ticks Executed</p>
                  <p className="text-xl font-bold text-[var(--color-charcoal)]">{sessionData.tick_count}</p>
                </div>
              </div>
              
              {sessionData.last_result && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-[var(--color-charcoal)] mb-2">Last Execution Result</p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-32">
                    {JSON.parse(sessionData.last_result).inference_result}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button 
                  onClick={toggleSessionPause}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors font-medium text-sm text-[var(--color-charcoal)]"
                >
                  {sessionData.status === 'RUNNING' ? <><Pause className="w-4 h-4"/> Pause</> : <><Play className="w-4 h-4"/> Resume</>}
                </button>
                <button 
                  onClick={cancelSession}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4"/> End
                </button>
              </div>
            </div>
          </div>
        ) : (
          // One-shot Result Canvas
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] text-sm shadow-sm">
                {prompt}
              </div>
            </div>

            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-sm w-[90%] text-sm shadow-sm space-y-4">
                <div className="flex items-start space-x-3">
                  {isRouting && !result ? (
                    <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-[var(--color-charcoal)]">
                      {isRouting && !result ? pipelineState : "Intent Parsed & Routed"}
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

                {result && (
                  <div className="flex items-start space-x-3 pt-2 border-t border-gray-100">
                    {result.sub_agent_result?.error || result.error ? (
                      <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-red-500 font-bold text-xs">X</span>
                      </div>
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-[var(--color-charcoal)]">Sub-Agent Execution</p>
                      {result.sub_agent_result?.error || result.error ? (
                        <p className="text-red-500 text-xs mt-1">{result.sub_agent_result?.error || result.error}</p>
                      ) : (
                        <div className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 text-xs text-gray-600 overflow-x-auto">
                          <p className="font-mono">{result.sub_agent_result?.inference_result || result.response || "Executed Successfully"}</p>
                          {(result.sub_agent_result?.settlement_tx_hash || result.tx_hash) && (
                            <a 
                              href={`https://scan.bohr.life/tx/${result.sub_agent_result?.settlement_tx_hash || result.tx_hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-500 hover:underline mt-2 inline-block font-mono"
                            >
                              View Settlement Tx ↗
                            </a>
                          )}
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

      {/* Input Section */}
      <div className="p-6 bg-white border-t border-gray-100">
        {mode === 'oneshot' && (
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
        )}

        {mode === 'session' && !activeSessionId && (
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Interval (Minutes)</label>
              <input 
                type="number" 
                value={intervalMins} 
                onChange={e => setIntervalMins(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Duration (Hours)</label>
              <input 
                type="number" 
                value={durationHours} 
                onChange={e => setDurationHours(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mt-1 text-sm outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        <div className="relative">
          {!activeSessionId && (
            <div className="absolute -top-6 right-2 text-xs font-bold text-[var(--color-slate)] bg-[var(--color-peach)]/50 px-3 py-1 rounded-full border border-[var(--color-peach)] flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-[var(--color-melon)]" />
              <span>
                {mode === 'oneshot' 
                  ? `${result?.parsed_intent?.estimated_credits || activeTab.cost} Credits` 
                  : `${Math.floor((durationHours * 60) / intervalMins) * 10} Credits (Pre-Auth)`}
              </span>
            </div>
          )}
          {!activeSessionId && (
            <div className="flex items-center bg-[var(--color-offwhite)] border border-gray-200 rounded-2xl p-2 focus-within:border-[var(--color-melon)] focus-within:ring-2 focus-within:ring-[var(--color-peach)] transition-all">
              <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isRouting}
                placeholder={mode === 'oneshot' ? `Prompt the ${activeTab.label} agent...` : "Define the ongoing objective..."}
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
          )}
        </div>
      </div>
    </div>
  )
}
