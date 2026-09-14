'use client'

import React, { createContext, useContext, useState } from 'react'

interface CreditContextType {
  credits: number
  addCredits: (amount: number) => void
  deductCredits: (amount: number) => void
}

const CreditContext = createContext<CreditContextType | undefined>(undefined)

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<number>(120)

  const addCredits = (amount: number) => setCredits(c => c + amount)
  const deductCredits = (amount: number) => setCredits(c => Math.max(0, c - amount))

  return (
    <CreditContext.Provider value={{ credits, addCredits, deductCredits }}>
      {children}
    </CreditContext.Provider>
  )
}

export function useCredits() {
  const context = useContext(CreditContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditProvider')
  }
  return context
}
