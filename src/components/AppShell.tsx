import Button from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { cn } from "@/lib/utils";
import { Bike, Home, LogIn, LogOut, Menu, Shield, Wrench, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

export default function AppShell({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isEditor = useAuthStore((s) => s.isEditor);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkBase = "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition";

  const navItems = useMemo(
    () =>
      [
        { to: "/inicio", label: "Inicio", icon: <Home className="h-4 w-4" /> },
        { to: "/modelos", label: "Modelos", icon: <Bike className="h-4 w-4" /> },
        { to: "/talleres", label: "Talleres", icon: <Wrench className="h-4 w-4" /> },
      ] as const,
    []
  );

  const showPanel = status === "authenticated" && (isEditor || isAdmin);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

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

          <button
            type="button"
            aria-label="Abrir menú"
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/20 p-2 text-zinc-200 hover:bg-zinc-900/40 transition"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  cn(navLinkBase, isActive ? "bg-zinc-900/60 text-white" : "text-zinc-300 hover:bg-zinc-900/40")
                }
              >
                {it.icon}
                {it.label}
              </NavLink>
            ))}

            {showPanel ? (
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

          <div className="hidden md:flex items-center gap-2">
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

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[320px] max-w-[90vw] border-l border-zinc-800 bg-[#0B0F14] shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#FF3D2E]" />
                <div className="leading-tight">
                  <div className="text-sm font-semibold">Grupo Voge</div>
                  <div className="text-[11px] text-zinc-400">Menú</div>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/20 p-2 text-zinc-200 hover:bg-zinc-900/40 transition"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-4 py-4">
              {status === "authenticated" ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
                  <div className="text-xs text-zinc-400">Sesión</div>
                  <div className="mt-1 text-sm text-zinc-200 break-words">{user?.email ?? user?.id}</div>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
                  <div className="text-xs text-zinc-400">Sesión</div>
                  <div className="mt-1 text-sm text-zinc-300">No has iniciado sesión.</div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {navItems.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition",
                        isActive
                          ? "border-[#FF3D2E] bg-[#FF3D2E]/10 text-white"
                          : "border-zinc-800 bg-zinc-900/20 text-zinc-200 hover:bg-zinc-900/40"
                      )
                    }
                  >
                    {it.icon}
                    {it.label}
                  </NavLink>
                ))}

                {showPanel ? (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition",
                        isActive
                          ? "border-[#FF3D2E] bg-[#FF3D2E]/10 text-white"
                          : "border-zinc-800 bg-zinc-900/20 text-zinc-200 hover:bg-zinc-900/40"
                      )
                    }
                  >
                    <Shield className="h-4 w-4" />
                    Panel
                  </NavLink>
                ) : null}
              </div>

              <div className="mt-6">
                {status === "authenticated" ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() =>
                      signOut()
                        .then(() => navigate("/modelos"))
                        .catch(() => {})
                    }
                  >
                    <LogOut className="h-4 w-4" />
                    Salir
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" onClick={() => navigate("/login")}>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}
