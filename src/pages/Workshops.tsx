import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { listWorkshops } from "@/features/workshops/workshopsRepo";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl } from "@/features/maps/maps";

export default function Workshops() {
  const [sp, setSp] = useSearchParams();
  const initialQ = sp.get("q") ?? "";
  const initialCity = sp.get("city") ?? "";
  const initialTag = sp.get("tag") ?? "";

  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCity);
  const [tag, setTag] = useState(initialTag);

  const workshopsQuery = useQuery({
    queryKey: ["workshops", { q: initialQ, city: initialCity, tag: initialTag }],
    queryFn: () =>
      listWorkshops({
        q: initialQ || undefined,
        city: initialCity || undefined,
        tag: initialTag || undefined,
      }),
  });

  const workshops = useMemo(() => workshopsQuery.data ?? [], [workshopsQuery.data]);

  const applyFilters = () => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (city.trim()) next.set("city", city.trim());
    if (tag.trim()) next.set("tag", tag.trim());
    setSp(next);
  };

  const clear = () => {
    setQ("");
    setCity("");
    setTag("");
    setSp(new URLSearchParams());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Talleres recomendados</h1>
        <p className="text-sm text-zinc-400">Lugares recomendados por el grupo para mantenimiento y reparación.</p>
      </div>

      <Card className="p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre…" />
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad / zona…" />
          <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Etiqueta (p. ej. oficial)…" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-zinc-500">Resultados: {workshops.length}</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={clear}>
              Limpiar
            </Button>
            <Button onClick={applyFilters}>Aplicar</Button>
          </div>
        </div>
      </Card>

      {workshopsQuery.isLoading ? <div className="text-sm text-zinc-400">Cargando talleres…</div> : null}
      {workshopsQuery.error instanceof Error ? (
        <div className="text-sm text-red-400">{workshopsQuery.error.message}</div>
      ) : null}

      {workshops.length === 0 && !workshopsQuery.isLoading ? (
        <Card className="p-6">
          <div className="text-sm text-zinc-300">No hay resultados.</div>
          <div className="mt-2 text-xs text-zinc-500">Prueba cambiando los filtros.</div>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-2">
        {workshops.map((w) => (
          <Link
            key={w.id}
            to={`/talleres/${w.id}`}
            className="rounded-xl border border-[#223042] bg-[#121826] p-5 hover:brightness-110 transition"
          >
            {(() => {
              const mapQuery = w.maps_query ?? [w.name, w.address, w.city].filter(Boolean).join(" - ");
              const embedUrl = buildGoogleMapsEmbedUrl(mapQuery);
              const openUrl = w.maps_url || buildGoogleMapsSearchUrl(mapQuery);
              if (!embedUrl) return null;
              return (
                <div className="relative mb-4 overflow-hidden rounded-lg border border-zinc-800">
                  <div className="pointer-events-none">
                    <iframe
                      title={`Mapa ${w.name}`}
                      src={embedUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-36 w-full"
                    />
                  </div>
                  {openUrl ? (
                    <div className="absolute bottom-2 right-2 rounded-md border border-zinc-700 bg-zinc-950/70 px-2 py-1 text-[11px] text-zinc-200">
                      Vista previa
                    </div>
                  ) : null}
                </div>
              );
            })()}
            <div className="text-sm font-semibold truncate">{w.name}</div>
            <div className="mt-2 text-xs text-zinc-400">
              {w.city ? <div className="truncate">{w.city}</div> : null}
              {w.address ? <div className="truncate">{w.address}</div> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {parseTags(w.tags).slice(0, 3).map((t) => (
                <span key={t} className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-200">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 text-xs text-zinc-400">Ver taller →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function parseTags(tags: string | null) {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
