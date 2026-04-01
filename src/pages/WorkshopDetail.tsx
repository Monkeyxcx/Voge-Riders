import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Card from "@/components/ui/Card";
import { getWorkshopById } from "@/features/workshops/workshopsRepo";
import CommentsSection from "@/features/comments/CommentsSection";
import { buildGoogleMapsEmbedUrl, buildGoogleMapsSearchUrl } from "@/features/maps/maps";

export default function WorkshopDetail() {
  const { id } = useParams();
  const workshopQuery = useQuery({
    queryKey: ["workshop", id],
    queryFn: () => (id ? getWorkshopById(id) : Promise.resolve(null)),
  });

  if (workshopQuery.isLoading) return <div className="text-sm text-zinc-400">Cargando…</div>;
  if (workshopQuery.error instanceof Error) return <div className="text-sm text-red-400">{workshopQuery.error.message}</div>;
  if (!workshopQuery.data) {
    return (
      <Card className="p-6">
        <div className="text-sm text-zinc-300">Taller no encontrado.</div>
        <div className="mt-3">
          <Link to="/talleres" className="text-sm text-zinc-200 hover:text-white">
            Volver a talleres
          </Link>
        </div>
      </Card>
    );
  }

  const w = workshopQuery.data;
  const tags = parseTags(w.tags);
  const mapQuery = w.maps_query ?? [w.name, w.address, w.city].filter(Boolean).join(" - ");
  const embedUrl = buildGoogleMapsEmbedUrl(mapQuery);
  const openUrl = w.maps_url || buildGoogleMapsSearchUrl(mapQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-zinc-500">
          <Link to="/talleres" className="hover:text-zinc-200">
            Talleres
          </Link>
          <span className="mx-2">/</span>
          <span>{w.name}</span>
        </div>
        <h1 className="text-xl font-semibold">{w.name}</h1>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-200">
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="text-sm font-semibold">Datos</div>
            <div className="mt-4 grid gap-3 text-sm text-zinc-200">
              {w.city ? (
                <div>
                  <div className="text-xs text-zinc-500">Ciudad</div>
                  <div className="mt-1">{w.city}</div>
                </div>
              ) : null}
              {w.address ? (
                <div>
                  <div className="text-xs text-zinc-500">Dirección</div>
                  <div className="mt-1 whitespace-pre-wrap">{w.address}</div>
                </div>
              ) : null}
              {w.contact ? (
                <div>
                  <div className="text-xs text-zinc-500">Contacto</div>
                  <div className="mt-1 whitespace-pre-wrap">{w.contact}</div>
                </div>
              ) : null}
            </div>
            {w.notes ? (
              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
                <div className="text-xs text-zinc-500">Notas del grupo</div>
                <div className="mt-2 text-sm text-zinc-200 whitespace-pre-wrap">{w.notes}</div>
              </div>
            ) : null}
          </Card>

          {embedUrl ? (
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Ubicación</div>
                  <div className="mt-1 text-xs text-zinc-400">Vista previa en Google Maps</div>
                </div>
                {openUrl ? (
                  <a href={openUrl} target="_blank" rel="noreferrer" className="text-xs text-zinc-300 hover:text-white">
                    Abrir →
                  </a>
                ) : null}
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
                <iframe
                  title={`Mapa ${w.name}`}
                  src={embedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[260px] w-full"
                />
              </div>
            </Card>
          ) : null}

          <CommentsSection entityType="workshop" entityId={w.id} />
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-sm font-semibold">Sugerencias</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-300">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/20 px-3 py-2">
                Añade comentarios con tu experiencia: diagnóstico, tiempos y costos.
              </div>
            </div>
          </Card>
        </div>
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
