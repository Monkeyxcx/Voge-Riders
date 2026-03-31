import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/features/auth/useAuthStore";
import {
  buildIssueImageObjectPath,
  buildModelImageObjectPath,
  deleteObject,
  uploadPublicImage,
} from "@/features/media/mediaRepo";
import {
  createIssueImage,
  deleteIssueImage,
  getModelBySlug,
  listIssueImagesByIssueIds,
  listIssuesByModelId,
  listSolutionsByIssueIds,
  updateModelImage,
} from "@/features/models/modelsRepo";
import CommentsSection from "@/features/comments/CommentsSection";
import type { IssueSolution, ModelIssue, ModelIssueImage } from "@/types/domain";

export default function ModelDetail() {
  const { slug } = useParams();
  const qc = useQueryClient();
  const auth = useAuthStore();
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const coverMutation = useMutation({
    mutationFn: async (input: { file: File; prevPath: string | null; modelId: string }) => {
      const { publicUrl, objectPath } = await uploadPublicImage({
        bucket: "voge-media",
        objectPath: buildModelImageObjectPath(input.modelId, input.file.name),
        file: input.file,
      });

      const updated = await updateModelImage({ modelId: input.modelId, imageUrl: publicUrl, imagePath: objectPath });

      if (input.prevPath && input.prevPath !== objectPath) {
        await deleteObject({ bucket: "voge-media", objectPath: input.prevPath });
      }

      return updated;
    },
    onSuccess: () => {
      setCoverError(null);
      qc.invalidateQueries({ queryKey: ["model", slug] });
      qc.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (err) => {
      setCoverError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    },
  });

  const modelQuery = useQuery({
    queryKey: ["model", slug],
    queryFn: () => (slug ? getModelBySlug(slug) : Promise.resolve(null)),
  });

  const issuesQuery = useQuery({
    queryKey: ["model", slug, "issues"],
    enabled: !!modelQuery.data?.id,
    queryFn: () => listIssuesByModelId(modelQuery.data!.id),
  });

  const solutionsQuery = useQuery({
    queryKey: ["model", slug, "solutions"],
    enabled: (issuesQuery.data?.length ?? 0) > 0,
    queryFn: () => listSolutionsByIssueIds((issuesQuery.data ?? []).map((i) => i.id)),
  });

  const issues = useMemo(() => issuesQuery.data ?? [], [issuesQuery.data]);

  const issueImagesQuery = useQuery({
    queryKey: ["model", slug, "issue-images"],
    enabled: (issuesQuery.data?.length ?? 0) > 0,
    queryFn: () => listIssueImagesByIssueIds((issuesQuery.data ?? []).map((i) => i.id)),
  });

  const imagesByIssue = useMemo(() => {
    const map = new Map<string, ModelIssueImage[]>();
    for (const img of issueImagesQuery.data ?? []) {
      const list = map.get(img.issue_id) ?? [];
      list.push(img);
      map.set(img.issue_id, list);
    }
    return map;
  }, [issueImagesQuery.data]);
  const solutionsByIssue = useMemo(() => {
    const map = new Map<string, IssueSolution[]>();
    for (const s of solutionsQuery.data ?? []) {
      const list = map.get(s.issue_id) ?? [];
      list.push(s);
      map.set(s.issue_id, list);
    }
    return map;
  }, [solutionsQuery.data]);

  if (modelQuery.isLoading) return <div className="text-sm text-zinc-400">Cargando…</div>;
  if (modelQuery.error instanceof Error) return <div className="text-sm text-red-400">{modelQuery.error.message}</div>;
  if (!modelQuery.data) {
    return (
      <Card className="p-6">
        <div className="text-sm text-zinc-300">Modelo no encontrado.</div>
        <div className="mt-3">
          <Link to="/modelos" className="text-sm text-zinc-200 hover:text-white">
            Volver a modelos
          </Link>
        </div>
      </Card>
    );
  }

  const model = modelQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="text-xs text-zinc-500">
          <Link to="/modelos" className="hover:text-zinc-200">
            Modelos
          </Link>
          <span className="mx-2">/</span>
          <span>{model.name}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-[220px_1fr] items-start">
          {model.image_url ? (
            <img
              src={model.image_url}
              alt={model.name}
              className="aspect-[16/9] w-full max-w-[360px] rounded-xl border border-zinc-800 object-cover"
            />
          ) : (
            <div className="aspect-[16/9] w-full max-w-[360px] rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-800" />
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{model.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-300">
              {model.type ? <span className="rounded-full border border-zinc-700 px-2 py-1">{model.type}</span> : null}
              {model.cc ? <span className="rounded-full border border-zinc-700 px-2 py-1">{model.cc}cc</span> : null}
              {model.year ? <span className="rounded-full border border-zinc-700 px-2 py-1">{model.year}</span> : null}
            </div>
            {auth.status === "authenticated" && auth.isAdmin ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={coverMutation.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    coverMutation.mutate({ file, prevPath: model.image_path, modelId: model.id });
                    e.currentTarget.value = "";
                  }}
                />
                <Button
                  disabled={coverMutation.isPending}
                  onClick={() => {
                    coverFileRef.current?.click();
                  }}
                >
                  {coverMutation.isPending ? "Subiendo…" : model.image_url ? "Cambiar foto" : "Subir foto"}
                </Button>
                {coverError ? <div className="text-xs text-red-400">{coverError}</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="text-sm font-semibold">Fallas frecuentes</div>
            <div className="mt-1 text-xs text-zinc-400">Síntomas y soluciones sugeridas por el grupo</div>
            <div className="mt-4 space-y-3">
              {issuesQuery.isLoading ? <div className="text-sm text-zinc-400">Cargando fallas…</div> : null}
              {issuesQuery.error instanceof Error ? (
                <div className="text-sm text-red-400">{issuesQuery.error.message}</div>
              ) : null}
              {issues.length === 0 && !issuesQuery.isLoading ? (
                <div className="text-sm text-zinc-400">Aún no hay fallas registradas para este modelo.</div>
              ) : null}
              {issues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  solutions={solutionsByIssue.get(issue.id) ?? []}
                  images={imagesByIssue.get(issue.id) ?? []}
                />
              ))}
            </div>
          </Card>

          <CommentsSection entityType="model" entityId={model.id} />
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-sm font-semibold">Enlaces rápidos</div>
            <div className="mt-3 space-y-2">
              <Link
                to="/talleres"
                className="block rounded-lg border border-zinc-800 bg-zinc-900/20 px-3 py-2 text-sm hover:bg-zinc-900/40 transition"
              >
                Ver talleres recomendados
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function IssueCard({
  issue,
  solutions,
  images,
}: {
  issue: ModelIssue;
  solutions: IssueSolution[];
  images: ModelIssueImage[];
}) {
  const { slug } = useParams();
  const qc = useQueryClient();
  const auth = useAuthStore();
  const currentUserId = auth.user?.id ?? null;
  const [imageError, setImageError] = useState<string | null>(null);
  const issueFileRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!currentUserId) throw new Error("Debes iniciar sesión para subir imágenes.");
      const { publicUrl, objectPath } = await uploadPublicImage({
        bucket: "voge-media",
        objectPath: buildIssueImageObjectPath(currentUserId, issue.id, file.name),
        file,
      });
      return createIssueImage({ issueId: issue.id, userId: currentUserId, url: publicUrl, objectPath });
    },
    onSuccess: () => {
      setImageError(null);
      qc.invalidateQueries({ queryKey: ["model", slug, "issue-images"] });
    },
    onError: (err) => {
      setImageError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (img: ModelIssueImage) => {
      if (img.object_path) {
        await deleteObject({ bucket: "voge-media", objectPath: img.object_path });
      }
      await deleteIssueImage(img.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["model", slug, "issue-images"] });
    },
    onError: (err) => {
      setImageError(err instanceof Error ? err.message : "No se pudo eliminar la imagen.");
    },
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{issue.title}</div>
          {issue.severity ? <div className="mt-1 text-xs text-zinc-400">Severidad: {issue.severity}</div> : null}
        </div>
      </div>
      {issue.symptoms ? (
        <div className="mt-3">
          <div className="text-xs text-zinc-400">Síntomas</div>
          <div className="mt-1 text-sm text-zinc-200 whitespace-pre-wrap">{issue.symptoms}</div>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">Fotos</div>
          {auth.status === "authenticated" && auth.isEditor ? (
            <>
              <input
                ref={issueFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadImageMutation.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  uploadImageMutation.mutate(file);
                  e.currentTarget.value = "";
                }}
              />
              <Button
                disabled={uploadImageMutation.isPending}
                onClick={() => {
                  issueFileRef.current?.click();
                }}
              >
                {uploadImageMutation.isPending ? "Subiendo…" : "Subir foto"}
              </Button>
            </>
          ) : null}
        </div>

        {imageError ? <div className="mt-2 text-xs text-red-400">{imageError}</div> : null}

        {images.length === 0 ? (
          <div className="mt-2 text-sm text-zinc-400">Aún no hay fotos para esta falla.</div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {images.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-lg border border-zinc-800">
                <a href={img.url} target="_blank" rel="noreferrer">
                  <img src={img.url} alt={issue.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </a>
                {currentUserId && img.user_id === currentUserId ? (
                  <button
                    type="button"
                    disabled={deleteImageMutation.isPending}
                    onClick={() => deleteImageMutation.mutate(img)}
                    className="absolute right-2 top-2 hidden rounded-md border border-zinc-700 bg-zinc-950/80 px-2 py-1 text-xs text-zinc-200 group-hover:block"
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-xs text-zinc-400">Soluciones</div>
        {solutions.length === 0 ? (
          <div className="mt-1 text-sm text-zinc-400">Aún no hay soluciones registradas.</div>
        ) : (
          <div className="mt-2 space-y-3">
            {solutions.map((s) => (
              <div key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-950/20 p-3">
                <div className="text-sm text-zinc-100 whitespace-pre-wrap">{s.steps}</div>
                {s.parts ? <div className="mt-2 text-xs text-zinc-400">Piezas: {s.parts}</div> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
