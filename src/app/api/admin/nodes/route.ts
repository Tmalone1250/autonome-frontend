import { NextResponse } from 'next/server';

// ORCHESTRATOR_URL is server-side only (no NEXT_PUBLIC_ prefix)
// Set this in Vercel env vars to your VPS public URL, e.g. http://1.2.3.4:8002
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:8002";

export async function GET() {
  // Temporary debug: expose which URL we're using
  const debugUrl = ORCHESTRATOR_URL;
  try {
    const res = await fetch(`${ORCHESTRATOR_URL}/admin/nodes`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: `Orchestrator returned ${res.status}`, using_url: debugUrl }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying to orchestrator:", error);
    return NextResponse.json({ error: "Failed to connect to Orchestrator", using_url: debugUrl }, { status: 500 });
  }
}
