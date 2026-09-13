'use client'

import { X, Sparkles } from 'lucide-react'

export function CreditModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-melon-light)] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">Fund Workspace</h2>
          <p className="text-[var(--color-slate)] mb-8">
            Deposit ATMA into the Autonome Settlement Escrow to instantly mint compute credits.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-[var(--color-melon)] bg-[var(--color-peach)]/20 rounded-xl cursor-pointer">
              <div>
                <h3 className="font-semibold text-[var(--color-charcoal)]">Pro Tier</h3>
                <p className="text-sm text-[var(--color-slate)]">1,000 Credits</p>
              </div>
              <span className="font-bold text-[var(--color-charcoal)]">10 ATMA</span>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 hover:border-[var(--color-melon)] bg-white rounded-xl cursor-pointer transition-colors">
              <div>
                <h3 className="font-semibold text-[var(--color-charcoal)]">Starter Tier</h3>
                <p className="text-sm text-[var(--color-slate)]">100 Credits</p>
              </div>
              <span className="font-bold text-[var(--color-charcoal)]">1 ATMA</span>
            </div>
          </div>

          <button className="w-full mt-8 bg-gradient-to-r from-[var(--color-melon)] to-[var(--color-melon-light)] text-white py-4 rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            Deposit via Web3
          </button>
        </div>
      </div>
    </div>
  )
}
