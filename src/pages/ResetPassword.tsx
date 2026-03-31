import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const nextPassword = password.trim();
    if (nextPassword.length < 8) {
      setError("Escribe una contraseña de al menos 8 caracteres");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: nextPassword });
      if (updateError) throw updateError;
      setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar contraseña");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="p-6">
        <div className="text-sm font-semibold">Restablecer contraseña</div>
        <div className="mt-1 text-xs text-zinc-400">
          Abre esta página desde el enlace del email para completar el cambio.
        </div>

        {error ? <div className="mt-4 text-xs text-red-400">{error}</div> : null}
        {message ? <div className="mt-4 text-xs text-green-400">{message}</div> : null}

        <form className="mt-5 space-y-3" onSubmit={onSubmit}>
          <div>
            <div className="text-xs text-zinc-400">Nueva contraseña</div>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Actualizar
          </Button>
        </form>

        <div className="mt-4 text-xs">
          <Link to="/login" className="text-zinc-300 hover:text-white">
            Volver a login
          </Link>
        </div>
      </Card>
    </div>
  );
}
