'use client'

import { 
  Activity, 
  Cpu, 
  Database, 
  HardDrive, 
  CheckCircle2, 
  Copy,
  TerminalSquare,
  Zap,
  ShieldCheck,
  Server,
  Clock,
  Lock,
  Download,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useSwitchChain } from 'wagmi'
import { formatUnits, encodeFunctionData } from 'viem'

const ENTRY_POINT = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'
const SIMPLE_ACCOUNT_FACTORY = '0xBC88d6012b3bf8426C2851d3798cEB5257658332'
const ATMA_TOKEN = '0xd29dE89D308b3F1eAcF3c36f821842F8F6f3f840'

const SIMPLE_ACCOUNT_FACTORY_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'salt', type: 'uint256' }],
    name: 'getAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'salt', type: 'uint256' }],
    name: 'createAccount',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

// SimpleAccount execute() ABI — calls any target with value+calldata
const SIMPLE_ACCOUNT_ABI = [
  {
    inputs: [
      { name: 'dest', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'func', type: 'bytes' }
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

const ERC20_TRANSFER_ABI = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

export function NodeDashboard() {
  const [copied, setCopied] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [isDownloadsModalOpen, setIsDownloadsModalOpen] = useState(false)
  const [installInstructionsModal, setInstallInstructionsModal] = useState<'appimage' | 'deb' | 'rpm' | null>(null)
  const { address: userAddress, chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()
  
  // 1. Fetch Local Hardware Telemetry
  const { data: telemetryData, isError: isTelemetryError } = useQuery({
    queryKey: ['node-telemetry'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/status')
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    },
    refetchInterval: 2500,
    retry: false
  })

  const telemetry = isTelemetryError ? null : telemetryData
  const nodeAddress = telemetry?.node_address || "0x0000000000000000000000000000000000000000"

  // 1.5 Smart Account (ERC-4337) Logic
  const { data: vaultAddressData } = useReadContract({
    address: SIMPLE_ACCOUNT_FACTORY,
    abi: SIMPLE_ACCOUNT_FACTORY_ABI,
    functionName: 'getAddress',
    args: userAddress ? [userAddress, BigInt(0)] : undefined,
    chainId: 968,
    query: { enabled: !!userAddress }
  })
  const vaultAddress = vaultAddressData as `0x${string}` | undefined

  const { data: vaultBytecode } = useQuery({
    queryKey: ['vault-bytecode', vaultAddress],
    queryFn: async () => {
      if (!vaultAddress || !publicClient) return null
      const code = await publicClient.getBytecode({ address: vaultAddress })
      return code || null
    },
    enabled: !!vaultAddress && !!publicClient,
    refetchInterval: 5000
  })
  
  const isVaultDeployed = vaultBytecode && vaultBytecode !== '0x'
  const balanceTarget = isVaultDeployed ? vaultAddress : nodeAddress

  const { writeContract, data: deployTxHash, isPending: isDeploying } = useWriteContract()
  const { isLoading: isWaitingTx } = useWaitForTransactionReceipt({ hash: deployTxHash })
  const isDeployActive = isDeploying || isWaitingTx

  // Claim Rewards write hook (separate instance from deploy)
  const { writeContract: writeClaimContract, data: claimTxHash, isPending: isClaiming } = useWriteContract()
  const { isLoading: isWaitingClaim } = useWaitForTransactionReceipt({ hash: claimTxHash })
  const isClaimActive = isClaiming || isWaitingClaim

  const executeDeploy = () => {
    writeContract({
      address: SIMPLE_ACCOUNT_FACTORY,
      abi: SIMPLE_ACCOUNT_FACTORY_ABI,
      functionName: 'createAccount',
      args: [userAddress, BigInt(0)],
      chainId: 968
    }, {
      onError: (err: any) => {
        console.error("Deploy error:", err)
        alert(`Deploy failed: ${err.shortMessage || err.message}`)
      }
    })
  }

  const handleDeployVault = () => {
    if (!userAddress) {
      alert("Please connect your wallet first.")
      return
    }
    
    if (chain?.id !== 968) {
      if (switchChain) {
        switchChain({ chainId: 968 }, {
          onSuccess: () => executeDeploy(),
          onError: (err: any) => alert(`Failed to switch network: ${err.message}`)
        })
      } else {
        alert("Please switch your wallet to Bohr Testnet (Chain ID 968) manually.")
      }
      return
    }

    executeDeploy()
  }

  const handleClaimRewards = () => {
    setClaimError(null)
    setClaimSuccess(null)

    if (!userAddress) {
      setClaimError("Connect your wallet first.")
      return
    }
    if (!vaultAddress) {
      setClaimError("Vault address not resolved yet.")
      return
    }
    if (!atmaBalance || (atmaBalance as bigint) === 0n) {
      setClaimError("No ATMA balance to claim.")
      return
    }
    if (chain?.id !== 968) {
      if (switchChain) {
        switchChain({ chainId: 968 }, {
          onSuccess: () => executeClaim(),
          onError: (err: any) => setClaimError(`Failed to switch network: ${err.message}`)
        })
      } else {
        setClaimError("Please switch to Bohr Testnet (Chain ID 968) manually.")
      }
      return
    }
    executeClaim()
  }

  const executeClaim = () => {
    if (!userAddress || !vaultAddress || !atmaBalance) return

    // Encode ERC-20 transfer(userAddress, fullBalance) as calldata
    const transferCalldata = encodeFunctionData({
      abi: ERC20_TRANSFER_ABI,
      functionName: 'transfer',
      args: [userAddress, atmaBalance as bigint]
    })

    // Call SimpleAccount.execute(ATMA_TOKEN, 0, transferCalldata)
    // This instructs the vault to move all ATMA to the operator's EOA
    writeClaimContract({
      address: vaultAddress,
      abi: SIMPLE_ACCOUNT_ABI,
      functionName: 'execute',
      args: [ATMA_TOKEN, 0n, transferCalldata],
      chainId: 968
    }, {
      onSuccess: (hash) => {
        setClaimSuccess(hash)
        console.log(`Claim tx submitted: ${hash}`)
      },
      onError: (err: any) => {
        setClaimError(err.shortMessage || err.message)
        console.error('Claim failed:', err)
      }
    })
  }
  
  // 2. Fetch On-Chain ATMA Balance
  const { data: atmaBalance } = useReadContract({
    address: '0xd29dE89D308b3F1eAcF3c36f821842F8F6f3f840',
    abi: [{
      constant: true,
      inputs: [{ name: '_owner', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: 'balance', type: 'uint256' }],
      type: 'function',
      stateMutability: 'view'
    }],
    functionName: 'balanceOf',
    args: balanceTarget && balanceTarget !== "0x0000000000000000000000000000000000000000" ? [balanceTarget] : undefined,
    chainId: 968,
    query: {
      enabled: !!balanceTarget,
      refetchInterval: 5000
    }
  })

  const formattedBalance = atmaBalance ? Number(formatUnits(atmaBalance as bigint, 18)).toFixed(2) : "0.00"
  
  const handleCopy = () => {
    navigator.clipboard.writeText(nodeAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0h 0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const isOnline = telemetry?.status === "ONLINE"

  const { data: logsData, isError: isLogsError } = useQuery({
    queryKey: ['node-logs'],
    queryFn: async () => {
      const res = await fetch('http://localhost:8000/logs')
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    },
    refetchInterval: 2500,
    retry: false
  })

  const logs = (isLogsError ? [] : logsData?.logs) || []

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000) - timestamp
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const handlePurgeMemory = async () => {
    try {
      const res = await fetch('http://localhost:8000/purge-memory', { method: 'POST' })
      if (res.ok) {
        alert("Model cache purged successfully. RAM released.")
      } else {
        alert("Failed to purge memory.")
      }
    } catch (e) {
      alert("Error purging memory.")
    }
  }

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[var(--color-peach)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${isOnline ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold tracking-wide">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <div className="flex items-center space-x-2 bg-[var(--color-offwhite)] px-3 py-1 rounded-full border border-gray-200 text-sm">
              <span className="font-mono text-[var(--color-charcoal)] font-medium">
                {nodeAddress !== "0x0000000000000000000000000000000000000000" ? `${nodeAddress.slice(0, 6)}...${nodeAddress.slice(-4)}` : (isOnline ? 'Connecting...' : 'Offline')}
              </span>
              <button onClick={handleCopy} className="text-gray-400 hover:text-[var(--color-charcoal)] transition-colors">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-[var(--color-slate)]">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Uptime: {formatUptime(telemetry?.uptime_seconds)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <TerminalSquare className="w-4 h-4" />
              <span>{telemetry?.model === 'llama3' ? 'Llama 3' : 'Initializing'} • Docker Container</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
           <button 
             onClick={() => setIsDownloadsModalOpen(true)}
             className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm"
           >
             <Download className="w-4 h-4" />
             <span>Download Node</span>
           </button>
           <button className="bg-[var(--color-charcoal)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm">
             Node Settings
           </button>
        </div>
      </div>

      {/* 2. Telemetry Grid (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Hardware Telemetry */}
        <div className="bg-[var(--color-offwhite)] rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Server className="w-5 h-5 text-[var(--color-charcoal)]" />
              <h3 className="font-bold text-[var(--color-charcoal)]">Hardware Telemetry</h3>
            </div>
            <button onClick={handlePurgeMemory} className="text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg shadow-sm transition-colors">
              Purge Model RAM
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--color-slate)] mb-1">
                <span>CPU Usage</span>
                <span>{telemetry?.hardware?.cpu_usage_pct || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-[var(--color-melon)] to-[var(--color-melon-light)] h-2 rounded-full transition-all duration-500" style={{ width: `${telemetry?.hardware?.cpu_usage_pct || 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-[var(--color-slate)] mb-1">
                <span>RAM Allocation</span>
                <span>{telemetry?.hardware?.ram_used_gb || 0} / {telemetry?.hardware?.ram_total_gb || 16} GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                <div className="bg-[var(--color-charcoal)] h-2 rounded-full transition-all duration-500" style={{ width: `${telemetry?.hardware?.ram_pct || 0}%` }} />
              </div>
              <div className="text-[10px] font-mono text-gray-400 text-right">
                Worker Node: {telemetry?.hardware?.process_ram_mb || 0} MB
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="text-xs">
                <p className="font-bold text-[var(--color-slate)]">Storage I/O</p>
                <p className="font-mono text-[var(--color-charcoal)]">{telemetry?.hardware?.disk_io_mb || 0} MB/s</p>
              </div>
              <div className="text-xs text-right">
                <p className="font-bold text-[var(--color-slate)]">Inference Speed</p>
                <p className="font-mono text-[var(--color-melon)] font-bold">24 tok/s</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Operator Vault & Earnings */}
        <div className="bg-white rounded-3xl p-6 border border-[var(--color-peach)] shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -top-6 bg-[var(--color-peach)]/30 w-32 h-32 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-[var(--color-melon)]" />
              <h3 className="font-bold text-[var(--color-charcoal)]">Vault & Earnings</h3>
            </div>
            {isVaultDeployed ? (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold">
                Active Vault
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg text-xs font-bold">
                Undeployed
              </span>
            )}
          </div>

          <div className="relative z-10 flex flex-col space-y-4 my-2 flex-1">
            <div>
              <p className="text-[var(--color-slate)] text-xs font-bold mb-1 uppercase tracking-wider">Vault (ERC-4337)</p>
              {vaultAddress ? (
                <a 
                  href={`https://scan.bohr.life/address/${vaultAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-sm text-indigo-500 hover:text-indigo-600 hover:underline bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100 inline-block transition-colors"
                >
                  {`${vaultAddress.slice(0, 10)}...${vaultAddress.slice(-8)}`}
                </a>
              ) : (
                <p className="font-mono text-sm text-[var(--color-charcoal)] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 inline-block">
                  Loading...
                </p>
              )}
            </div>
            
            <div className="pt-2">
              <p className="text-[var(--color-slate)] text-xs font-bold mb-1 uppercase tracking-wider">Claimable Balance</p>
              <p className="text-4xl font-extrabold text-[var(--color-charcoal)]">{formattedBalance} <span className="text-xl text-[var(--color-melon)]">ATMA</span></p>
              <div className="flex space-x-4 mt-2">
                <span className="text-xs text-gray-500 font-medium">Task Share: 15%</span>
                <span className="text-xs text-emerald-500 font-bold">Mining: Active</span>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 mt-4 flex flex-col space-y-3">
            {!isVaultDeployed && (
              <button 
                onClick={handleDeployVault}
                disabled={isDeployActive}
                className="w-full bg-[var(--color-charcoal)] hover:bg-gray-800 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all"
              >
                {isDeployActive ? 'Deploying...' : 'Deploy Smart Account'}
              </button>
            )}

            {claimError && (
              <p className="text-xs text-red-500 font-medium text-center">{claimError}</p>
            )}
            {claimSuccess && (
              <a
                href={`https://scan.bohr.life/tx/${claimSuccess}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 font-medium text-center hover:underline block"
              >
                ✅ Claimed! View Tx →
              </a>
            )}

            <button
              onClick={handleClaimRewards}
              disabled={isClaimActive || !atmaBalance || (atmaBalance as bigint) === 0n}
              className="w-full bg-[var(--color-melon)] hover:bg-[var(--color-melon-light)] disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-bold shadow-md transition-all"
            >
              {isWaitingClaim ? 'Confirming...' : isClaiming ? 'Sign in Wallet...' : 'Claim Rewards'}
            </button>
          </div>
        </div>

        {/* Card 3: Paymaster & Consensus */}
        <div className="bg-[var(--color-offwhite)] rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="flex items-center space-x-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-[var(--color-charcoal)]" />
            <h3 className="font-bold text-[var(--color-charcoal)]">Network Consensus</h3>
          </div>
          <div className="space-y-4 flex-1">
            <div className="bg-white p-3 rounded-xl border border-gray-100">
              <p className="text-xs text-[var(--color-slate)] font-bold mb-1 uppercase">MegaFuel Paymaster</p>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-mono font-medium text-[var(--color-charcoal)]">pm_isSponsorable: <span className="text-emerald-500">True</span></span>
              </div>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-[var(--color-slate)] uppercase">Avg Finality</p>
                <p className="text-lg font-bold text-[var(--color-charcoal)]">~0.75s</p>
              </div>
              <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg border border-indigo-100 text-xs font-bold">
                Bohr Testnet 968
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Verifiable Execution Log */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1">
        <h3 className="font-bold text-[var(--color-charcoal)] mb-4">Verifiable Execution Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 px-4 text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider">Timestamp</th>
                <th className="py-3 px-4 text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider">Network Job ID</th>
                <th className="py-3 px-4 text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider">Origin Domain</th>
                <th className="py-3 px-4 text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider">Proof Hash</th>
                <th className="py-3 px-4 text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider">Settlement Tx</th>
                <th className="py-3 px-4 text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider">Reward</th>
                <th className="py-3 px-4 text-xs font-bold text-[var(--color-slate)] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative flex items-center justify-center w-12 h-12">
                        <div className="absolute w-full h-full bg-emerald-500 rounded-full opacity-20 animate-ping"></div>
                        <div className="relative w-4 h-4 bg-emerald-500 rounded-full"></div>
                      </div>
                      <p className="text-[var(--color-slate)] text-sm max-w-sm mx-auto">
                        Worker active and listening for orchestrator dispatches. Awaiting inbound tasks from the Autonome Network...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-4 text-sm text-[var(--color-slate)]">{timeAgo(log.timestamp)}</td>
                    <td className="py-4 px-4 text-sm font-mono text-[var(--color-charcoal)]">
                      {log.task_id.slice(0, 6)}...{log.task_id.slice(-4)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-[var(--color-offwhite)] px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--color-charcoal)] border border-gray-200">
                        {log.domain}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-gray-500 group-hover:text-[var(--color-charcoal)] flex items-center space-x-2">
                      <span>{log.proof_hash.slice(0, 6)}...{log.proof_hash.slice(-4)}</span>
                      <Copy className="w-3 h-3 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigator.clipboard.writeText(log.proof_hash)} />
                    </td>
                    <td className="py-4 px-4 text-sm font-mono">
                      {log.tx_hash && log.tx_hash.startsWith("0x") ? (
                        <a href={`https://scan.bohr.life/tx/${log.tx_hash}`} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">
                          {log.tx_hash.slice(0, 6)}...{log.tx_hash.slice(-4)}
                        </a>
                      ) : (
                        <span className="bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-lg text-xs font-bold border border-yellow-200">
                          Pending...
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-[var(--color-melon)]">{log.reward}</td>
                    <td className="py-4 px-4">
                      <span className="flex items-center space-x-1 text-emerald-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold">{log.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modals */}
      {isDownloadsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full border border-[var(--color-peach)] shadow-xl relative">
            <button 
              onClick={() => setIsDownloadsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-extrabold text-[var(--color-charcoal)] mb-2">Download Node Client</h2>
            <p className="text-[var(--color-slate)] text-sm mb-6">Autonome Desktop v0.1.0 for Linux.</p>

            <div className="space-y-4">
              {/* AppImage */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center">
                <a 
                  href="https://github.com/Tmalone1250/autonome-frontend/releases/download/v0.1.3/autonome-desktop_0.1.0_amd64.AppImage" 
                  className="flex items-center space-x-2 bg-[var(--color-melon)] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[var(--color-melon-light)] transition-colors w-full justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .AppImage (Universal)</span>
                </a>
                <button 
                  onClick={() => setInstallInstructionsModal('appimage')}
                  className="mt-3 text-xs text-indigo-500 font-bold hover:underline"
                >
                  View Install Instructions
                </button>
              </div>

              {/* Deb */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center">
                <a 
                  href="https://github.com/Tmalone1250/autonome-frontend/releases/download/v0.1.3/autonome-desktop_0.1.0_amd64.deb" 
                  className="flex items-center space-x-2 bg-[var(--color-charcoal)] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-gray-800 transition-colors w-full justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .deb (Debian/Ubuntu)</span>
                </a>
                <button 
                  onClick={() => setInstallInstructionsModal('deb')}
                  className="mt-3 text-xs text-indigo-500 font-bold hover:underline"
                >
                  View Install Instructions
                </button>
              </div>

              {/* RPM */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center">
                <a 
                  href="https://github.com/Tmalone1250/autonome-frontend/releases/download/v0.1.3/autonome-desktop-0.1.0-1.x86_64.rpm" 
                  className="flex items-center space-x-2 bg-[var(--color-charcoal)] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-gray-800 transition-colors w-full justify-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .rpm (Fedora/RHEL)</span>
                </a>
                <button 
                  onClick={() => setInstallInstructionsModal('rpm')}
                  className="mt-3 text-xs text-indigo-500 font-bold hover:underline"
                >
                  View Install Instructions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {installInstructionsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-indigo-100 shadow-xl relative">
            <button 
              onClick={() => setInstallInstructionsModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[var(--color-charcoal)] mb-4">
              {installInstructionsModal === 'appimage' && 'AppImage Install Instructions'}
              {installInstructionsModal === 'deb' && '.deb Install Instructions'}
              {installInstructionsModal === 'rpm' && '.rpm Install Instructions'}
            </h2>
            
            <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 overflow-x-auto space-y-2">
              {installInstructionsModal === 'appimage' && (
                <>
                  <p className="text-gray-400"># 1. Download the file</p>
                  <p className="text-gray-400"># 2. Make it executable</p>
                  <p>chmod +x autonome-desktop_0.1.0_amd64.AppImage</p>
                  <p className="text-gray-400"># 3. Run the application</p>
                  <p>./autonome-desktop_0.1.0_amd64.AppImage</p>
                </>
              )}
              {installInstructionsModal === 'deb' && (
                <>
                  <p className="text-gray-400"># 1. Download the file</p>
                  <p className="text-gray-400"># 2. Install via apt</p>
                  <p>sudo apt install ./autonome-desktop_0.1.0_amd64.deb</p>
                  <p className="text-gray-400"># 3. Launch from applications menu</p>
                </>
              )}
              {installInstructionsModal === 'rpm' && (
                <>
                  <p className="text-gray-400"># 1. Download the file</p>
                  <p className="text-gray-400"># 2. Install via dnf or rpm</p>
                  <p>sudo dnf install ./autonome-desktop-0.1.0-1.x86_64.rpm</p>
                  <p className="text-gray-400"># 3. Launch from applications menu</p>
                </>
              )}
            </div>

            <button 
              onClick={() => setInstallInstructionsModal(null)}
              className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
