"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseAbiItem } from "viem";
import { Server, Activity, ShieldCheck, Cpu } from "lucide-react";

const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS || "0xc92Fab9251A4dAfd4278A373a0452db12BDD8005") as `0x${string}`;

export default function RegisterNode() {
  const { address } = useAccount();
  const [nodeAddress, setNodeAddress] = useState("");
  
  const { writeContract, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !nodeAddress.startsWith("0x") || nodeAddress.length !== 42) return;
    
    writeContract({
      address: REGISTRY_ADDRESS,
      abi: [
        parseAbiItem("function registerNode(address ephemeralNode, address operatorVault) external")
      ],
      functionName: 'registerNode',
      args: [nodeAddress as `0x${string}`, address],
    });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
      <div className="flex items-center space-x-2 mb-4 border-b border-slate-700 pb-4">
        <Server className="w-6 h-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-slate-100">Register Worker Node</h2>
      </div>

      <p className="text-slate-400 text-sm mb-6">
        Link your ephemeral DePIN compute node to your operator vault (connected wallet) to receive your 15% settlement allocation. 
        Unregistered node shares are automatically routed to the deflationary burn pool.
      </p>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Ephemeral Node Address
          </label>
          <input
            type="text"
            value={nodeAddress}
            onChange={(e) => setNodeAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Operator Vault (Receiver)
          </label>
          <div className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-400 font-mono text-sm flex items-center">
            {address ? (
              <>
                <ShieldCheck className="w-4 h-4 mr-2 text-indigo-400" />
                {address}
              </>
            ) : (
              "Connect wallet to populate..."
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!address || isPending || isConfirming || nodeAddress.length !== 42}
          className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          {isPending ? (
            "Waiting for Wallet..."
          ) : isConfirming ? (
            "Confirming..."
          ) : (
            <>
              <Cpu className="w-4 h-4 mr-2" />
              Register to Registry
            </>
          )}
        </button>

        {isConfirmed && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center text-emerald-400 text-sm">
            <Activity className="w-4 h-4 mr-2" />
            Node successfully linked to your vault!
          </div>
        )}
      </form>
    </div>
  );
}
