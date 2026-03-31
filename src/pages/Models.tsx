import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { listModels } from "@/features/models/modelsRepo";

export default function Models() {
  const [sp, setSp] = useSearchParams();
  const initialQ = sp.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const type = sp.get("type") ?? "";

  const modelsQuery = useQuery({
    queryKey: ["models", { q: initialQ, type }],
    queryFn: () => listModels({ q: initialQ || undefined, type: type || undefined }),
  });

  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);

  const applyFilters = () => {
    const next = new URLSearchParams();
    const query = q.trim();
    if (query) next.set("q", query);
    if (type) next.set("type", type);
    setSp(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Modelos</h1>
        <p className="text-sm text-zinc-400">Explora los modelos Voge del grupo y consulta fallas comunes.</p>
      </div>

      <Card className="p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre del modelo…"
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
          <Button onClick={applyFilters}>Buscar</Button>
        </div>
        <div className="mt-3 text-xs text-zinc-500">Resultados: {models.length}</div>
      </Card>

      {modelsQuery.isLoading ? <div className="text-sm text-zinc-400">Cargando modelos…</div> : null}
      {modelsQuery.error instanceof Error ? (
        <div className="text-sm text-red-400">{modelsQuery.error.message}</div>
      ) : null}

      {models.length === 0 && !modelsQuery.isLoading ? (
        <Card className="p-6">
          <div className="text-sm text-zinc-300">No hay resultados.</div>
          <div className="mt-2 text-xs text-zinc-500">Prueba quitando filtros o cambiando el término.</div>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-2">
        {models.map((m) => (
          <Link
            key={m.id}
            to={`/modelos/${m.slug}`}
            className="rounded-xl border border-[#223042] bg-[#121826] p-5 hover:brightness-110 transition"
          >
            {m.image_url ? (
              <img
                src={m.image_url}
                alt={m.name}
                loading="lazy"
                className="mb-4 aspect-[16/9] w-full rounded-lg border border-zinc-800 object-cover"
              />
            ) : (
              <div className="mb-4 aspect-[16/9] w-full rounded-lg border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-800" />
            )}
            <div className="text-sm font-semibold truncate">{m.name}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
              {m.type ? <span className="rounded-full border border-zinc-700 px-2 py-1">{m.type}</span> : null}
              {m.cc ? <span className="rounded-full border border-zinc-700 px-2 py-1">{m.cc}cc</span> : null}
              {m.year ? <span className="rounded-full border border-zinc-700 px-2 py-1">{m.year}</span> : null}
            </div>
            <div className="mt-4 text-xs text-zinc-400">Ver ficha →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
