import { createConfig, http } from 'wagmi'
import { injected } from 'wagmi/connectors'

export const bohrTestnet = {
  id: 968,
  name: 'Bohr Testnet',
  nativeCurrency: { name: 'Test BOT', symbol: 'tBOT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.bohr.life'] },
  },
} as const

export const config = createConfig({
  chains: [bohrTestnet],
  connectors: [injected()],
  transports: {
    [bohrTestnet.id]: http(),
  },
})
