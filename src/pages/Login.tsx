import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const status = useAuthStore((s) => s.status);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate("/modelos");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  const onForgot = async () => {
    setError(null);
    setMessage(null);
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError("Escribe tu email para enviar el enlace de recuperación");
      return;
    }
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, { redirectTo });
      if (resetError) throw resetError;
      setMessage("Te envié un correo con el enlace para restablecer tu contraseña.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar recuperación");
    } finally {
      setBusy(false);
    }
  };

  if (status === "authenticated") {
    return (
      <Card className="max-w-md mx-auto p-6">
        <div className="text-sm text-zinc-200">Ya tienes sesión iniciada.</div>
        <div className="mt-4">
          <Link to="/modelos" className="text-sm text-zinc-200 hover:text-white">
            Ir a modelos
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <div className="text-sm font-semibold">Acceso</div>
        <div className="mt-1 text-xs text-zinc-400">Inicia sesión para comentar y aportar soluciones</div>

        {error ? <div className="mt-4 text-xs text-red-400">{error}</div> : null}
        {message ? <div className="mt-4 text-xs text-green-400">{message}</div> : null}

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <div>
            <div className="text-xs text-zinc-400">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
          </div>
          <div>
            <div className="text-xs text-zinc-400">Contraseña</div>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            Entrar
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button
            type="button"
            className="text-zinc-300 hover:text-white"
            onClick={onForgot}
            disabled={busy}
          >
            ¿Olvidaste tu contraseña?
          </button>
          <Link to="/registro" className="text-zinc-300 hover:text-white">
            Crear cuenta
          </Link>
        </div>
      </Card>
    </div>
  );
}
