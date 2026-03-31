import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AppRole = "user" | "editor" | "admin";

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  role: AppRole;
  isAdmin: boolean;
  isEditor: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  session: null,
  user: null,
  role: "user",
  isAdmin: false,
  isEditor: false,
  init: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const session = data.session;
    let role: AppRole = "user";
    if (session) {
      const { data: roleData } = await supabase.rpc("get_my_role");
      if (roleData === "user" || roleData === "editor" || roleData === "admin") role = roleData;
    }
    set({
      session,
      user: session?.user ?? null,
      status: session ? "authenticated" : "anonymous",
      role,
      isAdmin: role === "admin",
      isEditor: role === "editor" || role === "admin",
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        set({ session: null, user: null, status: "anonymous", role: "user", isAdmin: false, isEditor: false });
        return;
      }

      set({ session: nextSession, user: nextSession.user, status: "authenticated" });
      (async () => {
        const { data: roleData, error: roleError } = await supabase.rpc("get_my_role");
        if (roleError) {
          set({ role: "user", isAdmin: false, isEditor: false });
          return;
        }
        const role: AppRole = roleData === "editor" || roleData === "admin" ? roleData : "user";
        set({ role, isAdmin: role === "admin", isEditor: role === "editor" || role === "admin" });
      })().catch(() => set({ role: "user", isAdmin: false, isEditor: false }));
    });

    window.addEventListener(
      "beforeunload",
      () => {
        sub.subscription.unsubscribe();
      },
      { once: true }
    );
  },
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (get().status !== "anonymous") {
      set({ status: "anonymous", session: null, user: null, role: "user", isAdmin: false, isEditor: false });
    }
  },
}));
