import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { listRecentIssues, listModelsByIds } from "@/features/models/modelsRepo";
import { listRecentComments } from "@/features/comments/commentsRepo";

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const communityLinks = useMemo(
    () =>
      [
        {
          title: "✅ Centro de servicio autorizado Voge (Talleres)",
          url: "https://docs.google.com/spreadsheets/d/1b5wHzYYcZTHSzL5dJl9VusW8m4mVOJFwWwzLK0RLCco",
          description: "Listado de centros de servicio autorizados.",
        },
        {
          title: "🇨🇴 Convenios Voge Bikers Colombia",
          url: "https://docs.google.com/spreadsheets/d/1yECTwydfpq2hLZGxp_PAknCdVyBX3etwNttOOuNU0dk/edit?usp=drivesdk",
          description: "Beneficios y convenios para el grupo.",
        },
        {
          title: "✅ Catálogo de partes VOGE (300 DS, 300 AC, 300 RALLY)",
          url: "https://drive.google.com/drive/folders/1JyvHbpZjoJLM_nC9UHbt7gp5XbHK11Cp",
          description: "Carpeta con catálogos por modelo.",
        },
        {
          title: "✅ Repuestos Homologables VOGE ⚙️ 🔧",
          url: "https://docs.google.com/spreadsheets/d/1drIas7ppGRTc33vLHamIYUdyAJK4IQ73KBQXakzc54U/edit?usp=drivesdk",
          description: "Equivalencias y repuestos recomendados.",
        },
        {
          title: "✅ Manual de usuario VOGE (300 DS, 300 AC, 300 RALLY)",
          url: "https://drive.google.com/drive/folders/1KShmswNBuu4Xjq6aJzuu0SDryxMQ9gnQ",
          description: "Manuales de usuario en PDF.",
        },
        {
          title: "📍 Sitios de interés Voge Medellín",
          url: "https://maps.app.goo.gl/dRuxu6iFNWnLB6Uz7?g_st=ac",
          description: "Mapa con sitios recomendados.",
        },
      ] as const,
    []
  );

  const recentIssuesQuery = useQuery({
    queryKey: ["home", "recentIssues"],
    queryFn: async () => {
      const issues = await listRecentIssues(6);
      const modelIds = Array.from(new Set(issues.map((i) => i.model_id)));
      const models = await listModelsByIds(modelIds);
      const modelsById = new Map(models.map((m) => [m.id, m] as const));
      return issues.map((i) => ({ issue: i, model: modelsById.get(i.model_id) ?? null }));
    },
  });

  const recentCommentsQuery = useQuery({
    queryKey: ["home", "recentComments"],
    queryFn: () => listRecentComments(6),
  });

  const onSearch = () => {
    const query = q.trim();
    if (!query) {
      navigate("/modelos");
      return;
    }
    navigate(`/modelos?q=${encodeURIComponent(query)}`);
  };

  const recentComments = useMemo(() => recentCommentsQuery.data ?? [], [recentCommentsQuery.data]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="text-xs text-zinc-400">Comunidad</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Grupo Voge</h1>
          <p className="mt-2 text-sm text-zinc-300 max-w-[60ch]">
            Catálogo del grupo con modelos Voge, fallas comunes, soluciones y talleres recomendados.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca modelo, falla o palabra clave…"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
            />
            <Button onClick={onSearch}>Buscar</Button>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/modelos"
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/50 transition"
            >
              Ver catálogo
            </Link>
            <Link
              to="/talleres"
              className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900/50 transition"
            >
              Talleres recomendados
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-semibold">Accesos rápidos</div>
          <div className="mt-4 grid gap-3">
            <Link
              to="/modelos"
              className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 hover:bg-zinc-900/40 transition"
            >
              <div className="text-sm font-medium">Modelos</div>
              <div className="mt-1 text-xs text-zinc-400">Fallas, soluciones y experiencia del grupo</div>
            </Link>
            <Link
              to="/talleres"
              className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 hover:bg-zinc-900/40 transition"
            >
              <div className="text-sm font-medium">Talleres</div>
              <div className="mt-1 text-xs text-zinc-400">Dónde llevar tu moto con confianza</div>
            </Link>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-6">
          <div className="text-xs text-zinc-400">Comunidad Voge Medellín🇨🇴</div>
          <div className="mt-2 text-sm font-semibold">Recursos del grupo</div>
          <div className="mt-1 text-xs text-zinc-500">Enlaces externos a hojas de cálculo, catálogos y manuales.</div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {communityLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 hover:bg-zinc-900/40 transition"
              >
                <div className="text-sm font-medium">{l.title}</div>
                <div className="mt-1 text-xs text-zinc-400">{l.description}</div>
                <div className="mt-3 text-xs text-zinc-500 truncate">{l.url}</div>
              </a>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Fallas recientes</div>
              <div className="mt-1 text-xs text-zinc-400">Últimos registros del catálogo</div>
            </div>
            <Link to="/modelos" className="text-xs text-zinc-300 hover:text-white">
              Ver todo
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {recentIssuesQuery.isLoading ? <div className="text-sm text-zinc-400">Cargando…</div> : null}
            {recentIssuesQuery.data?.map(({ issue, model }) => (
              <Link
                key={issue.id}
                to={model ? `/modelos/${model.slug}` : "/modelos"}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 hover:bg-zinc-900/40 transition"
              >
                <div className="text-sm font-medium truncate">{issue.title}</div>
                <div className="mt-1 text-xs text-zinc-400 truncate">{model ? model.name : "Modelo"}</div>
              </Link>
            ))}
            {recentIssuesQuery.data?.length === 0 ? (
              <div className="text-sm text-zinc-400">Aún no hay fallas cargadas.</div>
            ) : null}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Comentarios recientes</div>
              <div className="mt-1 text-xs text-zinc-400">Últimas experiencias compartidas</div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {recentCommentsQuery.isLoading ? <div className="text-sm text-zinc-400">Cargando…</div> : null}
            {recentComments.map((c) => (
              <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
                <div className="text-xs text-zinc-500">{new Date(c.created_at).toLocaleString()}</div>
                <div className="mt-2 text-sm text-zinc-100 whitespace-pre-wrap">{c.body}</div>
                <div className="mt-2 text-xs text-zinc-400">Sobre: {labelEntity(c.entity_type)}</div>
              </div>
            ))}
            {recentComments.length === 0 ? <div className="text-sm text-zinc-400">Aún no hay comentarios.</div> : null}
          </div>
        </Card>
      </section>
    </div>
  );
}

function labelEntity(t: string) {
  if (t === "model") return "Modelo";
  if (t === "workshop") return "Taller";
  if (t === "issue") return "Falla";
  return "";
}
