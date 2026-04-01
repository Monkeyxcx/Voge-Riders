import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/useAuthStore";

export default function Register() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const status = useAuthStore((s) => s.status);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await signUp(email.trim(), password);
      setMessage("Cuenta creada. Si tu proyecto requiere confirmación por email, revisa tu bandeja.");
      navigate("/login");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al registrar");
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
        <div className="text-sm font-semibold">Crear cuenta</div>
        <div className="mt-1 text-xs text-zinc-400">Solo miembros autenticados pueden publicar comentarios</div>

        {error ? <div className="mt-4 text-xs text-red-400">{error}</div> : null}
        {message ? <div className="mt-4 text-xs text-green-400">{message}</div> : null}

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <div>
            <div className="text-xs text-zinc-400">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" />
          </div>
          <div>
            <div className="text-xs text-zinc-400">Contraseña</div>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" />
            <div className="mt-1 text-[11px] text-zinc-500">Mínimo recomendado: 8 caracteres.</div>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            Registrarme
          </Button>
        </form>

        <div className="mt-4 text-xs">
          <Link to="/login" className="text-zinc-300 hover:text-white">
            Ya tengo cuenta
          </Link>
        </div>
      </Card>
    </div>
  );
}
