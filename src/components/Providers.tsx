'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { useState } from 'react'
import { CreditProvider } from '@/components/CreditContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <CreditProvider>
          {children}
        </CreditProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
