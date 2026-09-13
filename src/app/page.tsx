import { UserStudio } from '@/components/UserStudio'
import { NodeDashboard } from '@/components/NodeDashboard'
import { ArrowRight, Server } from 'lucide-react'

export default async function Home({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const resolvedParams = await searchParams
  const view = resolvedParams.view || 'Studio'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] flex items-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover opacity-20"
          >
            <source src="/Hero_Banner.mp4" type="video/mp4" />
          </video>
          {/* Gradient Mask */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/50 to-white" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-12 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-peach)]/30 text-[var(--color-melon)] font-semibold text-sm mb-6 border border-[var(--color-peach)]">
            Powered by BOT Chain
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-[var(--color-charcoal)] tracking-tighter mb-6">
            The Decentralized<br />AI Agent Compute Layer
          </h1>
          <p className="text-xl text-[var(--color-slate)] max-w-2xl mx-auto mb-10">
            Build, execute, and settle autonomous AI agents with zero gas fees. Frictionless credit billing meets verifiable on-chain execution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="flex items-center space-x-2 bg-gradient-to-r from-[var(--color-melon)] to-[var(--color-melon-light)] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-[var(--color-melon)]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <span>Launch User Studio</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="flex items-center space-x-2 bg-white text-[var(--color-charcoal)] px-8 py-4 rounded-full font-bold border-2 border-[var(--color-peach)] hover:bg-[var(--color-offwhite)] transition-all">
              <Server className="w-5 h-5" />
              <span>Connect Compute Node</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main App Canvas */}
      <section className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 pb-24">
        {view === 'Node Operator' ? (
          <NodeDashboard />
        ) : (
          <UserStudio />
        )}
      </section>
    </div>
  )
}
