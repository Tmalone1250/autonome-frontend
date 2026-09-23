"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import AdminPanel from "@/components/AdminPanel";
import RegisterNode from "@/components/RegisterNode";
import { ShieldAlert } from "lucide-react";

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase() || "0x7a8c761afbbb1fc86454dfa1a963370265804b85";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const isAuthorized = isConnected && address?.toLowerCase() === ADMIN_WALLET;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <main className="flex-1 w-full max-w-7xl mx-auto p-6">
        {!isAuthorized ? (
          <div className="flex flex-col items-center justify-center h-[70vh]">
            <ShieldAlert className="w-24 h-24 text-red-500 mb-6" />
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Access Denied</h1>
            <p className="text-slate-400 text-lg max-w-md text-center">
              Protocol Administrators Only. Please connect with the authorized deployer wallet to view telemetry.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <RegisterNode />
            <AdminPanel />
          </div>
        )}
      </main>
    </div>
  );
}
