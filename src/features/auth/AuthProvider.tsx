import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "@/features/auth/useAuthStore";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const status = useAuthStore((s) => s.status);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    init().catch((e: unknown) => {
      if (!mounted) return;
      setError(e instanceof Error ? e.message : "Error inicializando sesión");
    });
    return () => {
      mounted = false;
    };
  }, [init]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-zinc-800 bg-[#121826] p-6">
          <div className="text-sm text-zinc-200">No se pudo iniciar la app</div>
          <div className="mt-2 text-xs text-zinc-400 break-words">{error}</div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-zinc-100 flex items-center justify-center">
        <div className="text-sm text-zinc-300">Cargando…</div>
      </div>
    );
  }

  return children;
}
