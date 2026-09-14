'use client'

import { useState } from 'react'
import { X, Sparkles, CreditCard, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { useCredits } from './CreditContext'

export function CreditModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [selectedTier, setSelectedTier] = useState('pro')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle')
  const { addCredits } = useCredits()

  if (!isOpen) return null

  const handlePayment = () => {
    setPaymentStatus('processing')
    setTimeout(() => {
      setPaymentStatus('success')
      let amount = 500
      if (selectedTier === 'pro') amount = 2200
      if (selectedTier === 'scale') amount = 12000
      addCredits(amount)
      
      setTimeout(() => {
        setPaymentStatus('idle')
        onClose()
      }, 2000)
    }, 3000)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-white/50 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          disabled={paymentStatus === 'processing'}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-melon)] to-[var(--color-melon-light)] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">Buy Compute Credits</h2>
          <p className="text-[var(--color-slate)] mb-6 text-sm">
            Purchase ATMA credits instantly with a card to run decentralized AI workloads.
          </p>

          <div className="space-y-3">
            {/* Starter Tier */}
            <div 
              onClick={() => setSelectedTier('starter')}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                selectedTier === 'starter' 
                  ? 'border-[var(--color-melon)] bg-[var(--color-peach)]/20 shadow-sm' 
                  : 'border-gray-200 bg-white/50 hover:border-[var(--color-melon)]/50'
              }`}
            >
              <div>
                <h3 className="font-semibold text-[var(--color-charcoal)]">Starter</h3>
                <p className="text-sm text-[var(--color-slate)]">500 ATMA Credits</p>
              </div>
              <span className="font-bold text-[var(--color-charcoal)]">$5.00</span>
            </div>
            
            {/* Pro Tier (Most Popular) */}
            <div 
              onClick={() => setSelectedTier('pro')}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border relative ${
                selectedTier === 'pro' 
                  ? 'border-[var(--color-melon)] bg-[var(--color-peach)]/20 shadow-sm' 
                  : 'border-gray-200 bg-white/50 hover:border-[var(--color-melon)]/50'
              }`}
            >
              <div className="absolute -top-3 left-4 bg-gradient-to-r from-[var(--color-melon)] to-[var(--color-melon-light)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Most Popular
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-charcoal)]">Pro</h3>
                <p className="text-sm text-[var(--color-slate)]">2,200 ATMA Credits</p>
              </div>
              <span className="font-bold text-[var(--color-charcoal)]">$20.00</span>
            </div>

            {/* Scale Tier */}
            <div 
              onClick={() => setSelectedTier('scale')}
              className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${
                selectedTier === 'scale' 
                  ? 'border-[var(--color-melon)] bg-[var(--color-peach)]/20 shadow-sm' 
                  : 'border-gray-200 bg-white/50 hover:border-[var(--color-melon)]/50'
              }`}
            >
              <div>
                <h3 className="font-semibold text-[var(--color-charcoal)]">Scale</h3>
                <p className="text-sm text-[var(--color-slate)]">12,000 ATMA Credits</p>
              </div>
              <span className="font-bold text-[var(--color-charcoal)]">$100.00</span>
            </div>
          </div>

          <button 
            onClick={handlePayment}
            disabled={paymentStatus !== 'idle'}
            className="w-full mt-8 bg-gradient-to-r from-[var(--color-charcoal)] to-gray-800 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {paymentStatus === 'idle' && (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Pay with Card (Stripe)</span>
              </>
            )}
            {paymentStatus === 'processing' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing fiat conversion...</span>
              </>
            )}
            {paymentStatus === 'success' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Successfully deposited to Escrow!</span>
              </>
            )}
          </button>
          
          <div className="mt-5 flex items-center justify-center space-x-1.5 text-xs text-gray-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-melon)]" />
            <span>Funds are securely locked in the Autonome Smart Escrow on BOT Chain.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
