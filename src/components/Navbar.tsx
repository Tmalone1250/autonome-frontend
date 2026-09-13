'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet, Coins } from 'lucide-react'
import { CreditModal } from './CreditModal'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const searchParams = useSearchParams()
  const activeView = searchParams.get('view') || 'Studio'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const views = [
    { name: 'Studio', desc: 'For consumers/end-users spending credits to run tasks.' },
    { name: 'Node Operator', desc: 'For compute providers monitoring hardware and network reward earnings.' },
    { name: 'Agent Hub', desc: 'For developers deploying and monetizing sub-agent tools.' }
  ]

  return (
    <>
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 h-16 flex items-center justify-between px-6">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-bold text-[var(--color-charcoal)] tracking-tighter">
            Autonome
          </h1>
          <div className="hidden md:flex space-x-1 bg-[var(--color-offwhite)] p-1 rounded-full border border-gray-200">
            {views.map(view => (
              <Link
                key={view.name}
                href={`/?view=${view.name}`}
                title={view.desc}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeView === view.name 
                    ? 'bg-white shadow-sm text-[var(--color-charcoal)]' 
                    : 'text-[var(--color-slate)] hover:text-[var(--color-charcoal)]'
                }`}
              >
                {view.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-[var(--color-offwhite)] px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-semibold text-[var(--color-charcoal)]"
          >
            <Coins className="w-4 h-4 text-[var(--color-melon)]" />
            <span>{mounted && isConnected ? '120 Credits' : '50 Free Credits'}</span>
          </button>
          
          {mounted && isConnected ? (
            <button 
              onClick={() => disconnect()}
              className="flex items-center space-x-2 bg-[var(--color-charcoal)] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span>{address?.slice(0,6)}...{address?.slice(-4)}</span>
            </button>
          ) : (
            <button 
              onClick={() => connect({ connector: connectors[0] })}
              className="flex items-center space-x-2 bg-[var(--color-charcoal)] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect</span>
            </button>
          )}
        </div>
      </nav>

      <CreditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
