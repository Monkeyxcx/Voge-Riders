import Button from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { cn } from "@/lib/utils";
import { Bike, Home, LogIn, LogOut, Shield, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export default function AppShell({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isEditor = useAuthStore((s) => s.isEditor);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  const navLinkBase = "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition";

  return (
    <div className="min-h-screen bg-[#0B0F14] text-zinc-100">
      <header className="sticky top-0 z-50 border-b border-zinc-900 bg-[#0B0F14]/80 backdrop-blur">
        <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/modelos" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#FF3D2E]" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">Grupo Voge</div>
              <div className="text-[11px] text-zinc-400">Modelos, catalogo, talleres, convenios, fallas, etc</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <NavLink
              to="/inicio"
              className={({ isActive }) =>
                cn(navLinkBase, isActive ? "bg-zinc-900/60 text-white" : "text-zinc-300 hover:bg-zinc-900/40")
              }
            >
              <Home className="h-4 w-4" />
              Inicio
            </NavLink>
            <NavLink
              to="/modelos"
              className={({ isActive }) =>
                cn(navLinkBase, isActive ? "bg-zinc-900/60 text-white" : "text-zinc-300 hover:bg-zinc-900/40")
              }
            >
              <Bike className="h-4 w-4" />
              Modelos
            </NavLink>
            <NavLink
              to="/talleres"
              className={({ isActive }) =>
                cn(navLinkBase, isActive ? "bg-zinc-900/60 text-white" : "text-zinc-300 hover:bg-zinc-900/40")
              }
            >
              <Wrench className="h-4 w-4" />
              Talleres
            </NavLink>
            {status === "authenticated" && (isEditor || isAdmin) ? (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(navLinkBase, isActive ? "bg-zinc-900/60 text-white" : "text-zinc-300 hover:bg-zinc-900/40")
                }
              >
                <Shield className="h-4 w-4" />
                Panel
              </NavLink>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            {status === "authenticated" ? (
              <>
                <div className="hidden sm:block text-xs text-zinc-400 max-w-[240px] truncate">
                  {user?.email ?? user?.id}
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    signOut()
                      .then(() => navigate("/modelos"))
                      .catch(() => {})
                  }
                >
                  <LogOut className="h-4 w-4" />
                  Salir
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => navigate("/login")}
              >
                <LogIn className="h-4 w-4" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}
