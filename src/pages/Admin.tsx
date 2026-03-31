import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import { useAuthStore } from "@/features/auth/useAuthStore";
import { supabase } from "@/lib/supabase";
import {
  deleteIssueImage,
  listIssueImagesByIssueIds,
  listIssuesByModelId,
  listModels,
  listSolutionsByIssueIds,
} from "@/features/models/modelsRepo";
import {
  createIssue,
  createModel,
  createSolution,
  deleteIssueCascade,
  deleteModelCascade,
  deleteSolution,
  updateIssue,
  updateModel,
  updateSolution,
} from "@/features/admin/adminRepo";
import { buildModelImageObjectPath, deleteObject, uploadPublicImage } from "@/features/media/mediaRepo";
import { updateModelImage } from "@/features/models/modelsRepo";
import type { IssueSolution, ModelIssue, ModelIssueImage, MotoModel } from "@/types/domain";

export default function Admin() {
  const auth = useAuthStore();
  const qc = useQueryClient();
  const [sp, setSp] = useSearchParams();
  const selectedModelId = sp.get("model") ?? "";
  const [q, setQ] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", slug: "", type: "", cc: "", year: "" });
  const [editForm, setEditForm] = useState({ id: "", name: "", slug: "", type: "", cc: "", year: "" });
  const [error, setError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [tab, setTab] = useState<"contenido" | "usuarios">("contenido");

  const modelsQuery = useQuery({
    queryKey: ["admin", "models", { q }],
    enabled: auth.status === "authenticated" && (auth.isAdmin || auth.isEditor),
    queryFn: () => listModels({ q: q.trim() || undefined }),
  });

  const models = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);
  const selectedModel = useMemo(() => models.find((m) => m.id === selectedModelId) ?? null, [models, selectedModelId]);

  useEffect(() => {
    if (!selectedModel) return;
    setEditForm({
      id: selectedModel.id,
      name: selectedModel.name,
      slug: selectedModel.slug,
      type: selectedModel.type ?? "",
      cc: selectedModel.cc ? String(selectedModel.cc) : "",
      year: selectedModel.year ? String(selectedModel.year) : "",
    });
  }, [selectedModel]);

  const createModelMutation = useMutation({
    mutationFn: async () => {
      const name = createForm.name.trim();
      const slug = createForm.slug.trim();
      if (!name) throw new Error("El nombre es requerido.");
      if (!slug) throw new Error("El slug es requerido.");
      const cc = createForm.cc.trim() ? Number(createForm.cc) : null;
      const year = createForm.year.trim() ? Number(createForm.year) : null;
      if (cc !== null && Number.isNaN(cc)) throw new Error("CC inválido.");
      if (year !== null && Number.isNaN(year)) throw new Error("Año inválido.");
      return createModel({ name, slug, type: createForm.type.trim() || null, cc, year });
    },
    onSuccess: (m) => {
      setError(null);
      setCreateForm({ name: "", slug: "", type: "", cc: "", year: "" });
      qc.invalidateQueries({ queryKey: ["admin", "models"] });
      const next = new URLSearchParams(sp);
      next.set("model", m.id);
      setSp(next);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "No se pudo crear el modelo."),
  });

  const updateModelMutation = useMutation({
    mutationFn: async () => {
      const name = editForm.name.trim();
      const slug = editForm.slug.trim();
      if (!editForm.id) throw new Error("Selecciona un modelo.");
      if (!name) throw new Error("El nombre es requerido.");
      if (!slug) throw new Error("El slug es requerido.");
      const cc = editForm.cc.trim() ? Number(editForm.cc) : null;
      const year = editForm.year.trim() ? Number(editForm.year) : null;
      if (cc !== null && Number.isNaN(cc)) throw new Error("CC inválido.");
      if (year !== null && Number.isNaN(year)) throw new Error("Año inválido.");
      return updateModel({ id: editForm.id, name, slug, type: editForm.type.trim() || null, cc, year });
    },
    onSuccess: () => {
      setError(null);
      qc.invalidateQueries({ queryKey: ["admin", "models"] });
      qc.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "No se pudo guardar el modelo."),
  });

  const deleteModelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedModelId) throw new Error("Selecciona un modelo.");
      await deleteModelCascade(selectedModelId);
    },
    onSuccess: () => {
      setError(null);
      const next = new URLSearchParams(sp);
      next.delete("model");
      setSp(next);
      qc.invalidateQueries({ queryKey: ["admin", "models"] });
      qc.invalidateQueries({ queryKey: ["models"] });
      qc.invalidateQueries({ queryKey: ["model"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "No se pudo eliminar el modelo."),
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedModel) throw new Error("Selecciona un modelo.");
      const { publicUrl, objectPath } = await uploadPublicImage({
        bucket: "voge-media",
        objectPath: buildModelImageObjectPath(selectedModel.id, file.name),
        file,
      });
      const updated = await updateModelImage({ modelId: selectedModel.id, imageUrl: publicUrl, imagePath: objectPath });
      if (selectedModel.image_path && selectedModel.image_path !== objectPath) {
        await deleteObject({ bucket: "voge-media", objectPath: selectedModel.image_path });
      }
      return updated;
    },
    onSuccess: () => {
      setCoverError(null);
      qc.invalidateQueries({ queryKey: ["admin", "models"] });
      qc.invalidateQueries({ queryKey: ["models"] });
      qc.invalidateQueries({ queryKey: ["model"] });
    },
    onError: (e) => setCoverError(e instanceof Error ? e.message : "No se pudo subir la foto."),
  });

  const issuesQuery = useQuery({
    queryKey: ["admin", "model", selectedModelId, "issues"],
    enabled: !!selectedModelId && auth.status === "authenticated" && (auth.isAdmin || auth.isEditor),
    queryFn: () => listIssuesByModelId(selectedModelId),
  });

  const issueIds = useMemo(() => (issuesQuery.data ?? []).map((i) => i.id), [issuesQuery.data]);

  const solutionsQuery = useQuery({
    queryKey: ["admin", "model", selectedModelId, "solutions"],
    enabled: issueIds.length > 0 && auth.status === "authenticated" && (auth.isAdmin || auth.isEditor),
    queryFn: () => listSolutionsByIssueIds(issueIds),
  });

  const issueImagesQuery = useQuery({
    queryKey: ["admin", "model", selectedModelId, "issue-images"],
    enabled: issueIds.length > 0 && auth.status === "authenticated" && (auth.isAdmin || auth.isEditor),
    queryFn: () => listIssueImagesByIssueIds(issueIds),
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    enabled: auth.status === "authenticated" && auth.isAdmin && tab === "usuarios",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("list_users_with_roles");
      if (error) throw error;
      return (data ?? []) as Array<{ user_id: string; email: string | null; created_at: string; role: string }>;
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async (input: { userId: string; role: "user" | "editor" | "admin" }) => {
      const { error } = await supabase.rpc("set_user_role", { target_user_id: input.userId, new_role: input.role });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  const solutionsByIssue = useMemo(() => {
    const map = new Map<string, IssueSolution[]>();
    for (const s of solutionsQuery.data ?? []) {
      const list = map.get(s.issue_id) ?? [];
      list.push(s);
      map.set(s.issue_id, list);
    }
    return map;
  }, [solutionsQuery.data]);

  const imagesByIssue = useMemo(() => {
    const map = new Map<string, ModelIssueImage[]>();
    for (const img of issueImagesQuery.data ?? []) {
      const list = map.get(img.issue_id) ?? [];
      list.push(img);
      map.set(img.issue_id, list);
    }
    return map;
  }, [issueImagesQuery.data]);

  if (auth.status !== "authenticated") {
    return (
      <Card className="p-6">
        <div className="text-sm font-semibold">Admin</div>
        <div className="mt-2 text-sm text-zinc-400">Debes iniciar sesión para acceder.</div>
        <div className="mt-4">
          <Link to="/login" className="text-sm text-zinc-200 hover:text-white">
            Ir a login →
          </Link>
        </div>
      </Card>
    );
  }

  if (!auth.isAdmin && !auth.isEditor) {
    return (
      <Card className="p-6">
        <div className="text-sm font-semibold">Panel</div>
        <div className="mt-2 text-sm text-zinc-400">Tu usuario no tiene permisos de editor o admin.</div>
        <div className="mt-4 text-xs text-zinc-500">
          Un admin debe asignarte el rol en el panel de administración.
        </div>
        <div className="mt-2 text-xs text-zinc-500">Tu user_id: {auth.user?.id}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Panel</h1>
        <p className="text-sm text-zinc-400">
          {auth.isAdmin ? "Admin: gestionar usuarios, modelos, fallas y soluciones." : "Editor: editar fallas y soluciones."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant={tab === "contenido" ? "primary" : "secondary"} onClick={() => setTab("contenido")}>
          Contenido
        </Button>
        {auth.isAdmin ? (
          <Button variant={tab === "usuarios" ? "primary" : "secondary"} onClick={() => setTab("usuarios")}>
            Usuarios
          </Button>
        ) : null}
      </div>

      {tab === "usuarios" && auth.isAdmin ? (
        <Card className="p-5">
          <div className="text-sm font-semibold">Usuarios registrados</div>
          <div className="mt-1 text-xs text-zinc-400">Asigna roles: user, editor o admin.</div>
          {usersQuery.isLoading ? <div className="mt-4 text-sm text-zinc-400">Cargando usuarios…</div> : null}
          {usersQuery.error instanceof Error ? <div className="mt-4 text-sm text-red-400">{usersQuery.error.message}</div> : null}
          <div className="mt-4 space-y-2">
            {(usersQuery.data ?? []).map((u) => (
              <div key={u.user_id} className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{u.email ?? "(sin email)"}</div>
                  <div className="mt-1 text-xs text-zinc-500 truncate">{u.user_id}</div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={(u.role === "admin" || u.role === "editor" ? u.role : "user") as string}
                    onChange={(e) => {
                      const role = e.target.value as "user" | "editor" | "admin";
                      setRoleMutation.mutate({ userId: u.user_id, role });
                    }}
                    className="rounded-lg border border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="user">user</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {tab !== "contenido" ? null : (

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="mt-3">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca por nombre…" />
            </div>
            {modelsQuery.isLoading ? <div className="mt-3 text-xs text-zinc-400">Cargando…</div> : null}
            {modelsQuery.error instanceof Error ? <div className="mt-3 text-xs text-red-400">{modelsQuery.error.message}</div> : null}
            <div className="mt-4 space-y-2">
              {models.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    const next = new URLSearchParams(sp);
                    next.set("model", m.id);
                    setSp(next);
                  }}
                  className={
                    "w-full text-left rounded-lg border px-3 py-2 text-sm transition " +
                    (m.id === selectedModelId
                      ? "border-[#FF3D2E] bg-[#FF3D2E]/10"
                      : "border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/40")
                  }
                >
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="mt-1 text-xs text-zinc-500 truncate">{m.slug}</div>
                </button>
              ))}
            </div>
          </Card>

          {auth.isAdmin ? (
            <Card className="p-5">
              <div className="text-sm font-semibold">Crear modelo</div>
              <div className="mt-3 grid gap-3">
                <Input value={createForm.name} onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))} placeholder="Nombre" />
                <Input value={createForm.slug} onChange={(e) => setCreateForm((s) => ({ ...s, slug: e.target.value }))} placeholder="Slug (voge-500ds)" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input value={createForm.type} onChange={(e) => setCreateForm((s) => ({ ...s, type: e.target.value }))} placeholder="Tipo" />
                  <Input value={createForm.cc} onChange={(e) => setCreateForm((s) => ({ ...s, cc: e.target.value }))} placeholder="CC" />
                </div>
                <Input value={createForm.year} onChange={(e) => setCreateForm((s) => ({ ...s, year: e.target.value }))} placeholder="Año" />
                <Button disabled={createModelMutation.isPending} onClick={() => createModelMutation.mutate()}>
                  {createModelMutation.isPending ? "Creando…" : "Crear"}
                </Button>
                {error ? <div className="text-xs text-red-400">{error}</div> : null}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          {!selectedModel ? (
            <Card className="p-6">
              <div className="text-sm text-zinc-400">Selecciona un modelo para editar.</div>
            </Card>
          ) : (
            <>
              {auth.isAdmin ? (
              <Card className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">Editar modelo</div>
                    <div className="mt-1 text-xs text-zinc-500 truncate">{selectedModel.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.open(`/modelos/${selectedModel.slug}`, "_blank");
                      }}
                    >
                      Ver ficha
                    </Button>
                    <Button
                      variant="danger"
                      disabled={deleteModelMutation.isPending}
                      onClick={() => {
                        if (!window.confirm("¿Eliminar modelo y sus fallas/soluciones?")) return;
                        deleteModelMutation.mutate();
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <Input value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} placeholder="Nombre" />
                  <Input value={editForm.slug} onChange={(e) => setEditForm((s) => ({ ...s, slug: e.target.value }))} placeholder="Slug" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input value={editForm.type} onChange={(e) => setEditForm((s) => ({ ...s, type: e.target.value }))} placeholder="Tipo" />
                    <Input value={editForm.cc} onChange={(e) => setEditForm((s) => ({ ...s, cc: e.target.value }))} placeholder="CC" />
                    <Input value={editForm.year} onChange={(e) => setEditForm((s) => ({ ...s, year: e.target.value }))} placeholder="Año" />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button disabled={updateModelMutation.isPending} onClick={() => updateModelMutation.mutate()}>
                      {updateModelMutation.isPending ? "Guardando…" : "Guardar"}
                    </Button>

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="admin-model-cover"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        uploadCoverMutation.mutate(file);
                        e.currentTarget.value = "";
                      }}
                    />
                    <Button
                      variant="secondary"
                      disabled={uploadCoverMutation.isPending}
                      onClick={() => {
                        document.getElementById("admin-model-cover")?.click();
                      }}
                    >
                      {uploadCoverMutation.isPending ? "Subiendo…" : selectedModel.image_url ? "Cambiar foto" : "Subir foto"}
                    </Button>

                    {coverError ? <div className="text-xs text-red-400">{coverError}</div> : null}
                    {error ? <div className="text-xs text-red-400">{error}</div> : null}
                  </div>
                </div>
              </Card>
              ) : (
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">Modelo seleccionado</div>
                      <div className="mt-1 text-xs text-zinc-500 truncate">{selectedModel.name}</div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.open(`/modelos/${selectedModel.slug}`, "_blank");
                      }}
                    >
                      Ver ficha
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-zinc-500">Como editor no puedes modificar datos del modelo ni su foto principal.</div>
                </Card>
              )}

              <AdminIssues
                model={selectedModel}
                issues={issuesQuery.data ?? []}
                solutionsByIssue={solutionsByIssue}
                imagesByIssue={imagesByIssue}
                loading={issuesQuery.isLoading}
                issuesError={issuesQuery.error instanceof Error ? issuesQuery.error.message : null}
                canDelete={auth.isAdmin}
              />
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function AdminIssues({
  model,
  issues,
  solutionsByIssue,
  imagesByIssue,
  loading,
  issuesError,
  canDelete,
}: {
  model: MotoModel;
  issues: ModelIssue[];
  solutionsByIssue: Map<string, IssueSolution[]>;
  imagesByIssue: Map<string, ModelIssueImage[]>;
  loading: boolean;
  issuesError: string | null;
  canDelete: boolean;
}) {
  const qc = useQueryClient();
  const [newIssue, setNewIssue] = useState({ title: "", severity: "", symptoms: "" });
  const [err, setErr] = useState<string | null>(null);

  const createIssueMutation = useMutation({
    mutationFn: async () => {
      const title = newIssue.title.trim();
      if (!title) throw new Error("El título es requerido.");
      return createIssue({
        modelId: model.id,
        title,
        severity: newIssue.severity.trim() || null,
        symptoms: newIssue.symptoms.trim() || null,
      });
    },
    onSuccess: () => {
      setErr(null);
      setNewIssue({ title: "", severity: "", symptoms: "" });
      qc.invalidateQueries({ queryKey: ["admin", "model", model.id, "issues"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "No se pudo crear la falla."),
  });

  return (
    <Card className="p-5">
      <div className="text-sm font-semibold">Fallas</div>
      <div className="mt-1 text-xs text-zinc-400">Crea fallas por modelo y agrega soluciones.</div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
        <div className="text-sm font-semibold">Nueva falla</div>
        <div className="mt-3 grid gap-3">
          <Input value={newIssue.title} onChange={(e) => setNewIssue((s) => ({ ...s, title: e.target.value }))} placeholder="Título" />
          <Input
            value={newIssue.severity}
            onChange={(e) => setNewIssue((s) => ({ ...s, severity: e.target.value }))}
            placeholder="Severidad (baja/media/alta)"
          />
          <Textarea
            value={newIssue.symptoms}
            onChange={(e) => setNewIssue((s) => ({ ...s, symptoms: e.target.value }))}
            placeholder="Síntomas"
          />
          <Button disabled={createIssueMutation.isPending} onClick={() => createIssueMutation.mutate()}>
            {createIssueMutation.isPending ? "Creando…" : "Crear falla"}
          </Button>
          {err ? <div className="text-xs text-red-400">{err}</div> : null}
        </div>
      </div>

      {loading ? <div className="mt-4 text-sm text-zinc-400">Cargando fallas…</div> : null}
      {issuesError ? <div className="mt-4 text-sm text-red-400">{issuesError}</div> : null}

      {issues.length === 0 && !loading ? <div className="mt-4 text-sm text-zinc-400">Aún no hay fallas.</div> : null}

      <div className="mt-4 space-y-4">
        {issues.map((issue) => (
          <AdminIssueEditor
            key={issue.id}
            issue={issue}
            solutions={solutionsByIssue.get(issue.id) ?? []}
            images={imagesByIssue.get(issue.id) ?? []}
            modelId={model.id}
            canDelete={canDelete}
          />
        ))}
      </div>
    </Card>
  );
}

function AdminIssueEditor({
  issue,
  solutions,
  images,
  modelId,
  canDelete,
}: {
  issue: ModelIssue;
  solutions: IssueSolution[];
  images: ModelIssueImage[];
  modelId: string;
  canDelete: boolean;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: issue.title, severity: issue.severity ?? "", symptoms: issue.symptoms ?? "" });
  const [solForm, setSolForm] = useState({ steps: "", parts: "" });
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setForm({ title: issue.title, severity: issue.severity ?? "", symptoms: issue.symptoms ?? "" });
  }, [issue.id, issue.title, issue.severity, issue.symptoms]);

  const updateIssueMutation = useMutation({
    mutationFn: async () => {
      const title = form.title.trim();
      if (!title) throw new Error("El título es requerido.");
      return updateIssue({ id: issue.id, title, severity: form.severity.trim() || null, symptoms: form.symptoms.trim() || null });
    },
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "model", modelId, "issues"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "No se pudo guardar la falla."),
  });

  const deleteIssueMutation = useMutation({
    mutationFn: async () => {
      await deleteIssueCascade(issue.id);
    },
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "model", modelId, "issues"] });
      qc.invalidateQueries({ queryKey: ["admin", "model", modelId, "solutions"] });
      qc.invalidateQueries({ queryKey: ["admin", "model", modelId, "issue-images"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "No se pudo eliminar la falla."),
  });

  const createSolutionMutation = useMutation({
    mutationFn: async () => {
      const steps = solForm.steps.trim();
      if (!steps) throw new Error("Los pasos son requeridos.");
      return createSolution({ issueId: issue.id, steps, parts: solForm.parts.trim() || null });
    },
    onSuccess: () => {
      setErr(null);
      setSolForm({ steps: "", parts: "" });
      qc.invalidateQueries({ queryKey: ["admin", "model", modelId, "solutions"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "No se pudo crear la solución."),
  });

  const updateSolutionMutation = useMutation({
    mutationFn: async (input: { id: string; steps: string; parts: string }) => {
      const steps = input.steps.trim();
      if (!steps) throw new Error("Los pasos son requeridos.");
      return updateSolution({ id: input.id, steps, parts: input.parts.trim() || null });
    },
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "model", modelId, "solutions"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "No se pudo actualizar la solución."),
  });

  const deleteSolutionMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteSolution(id);
    },
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "model", modelId, "solutions"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "No se pudo eliminar la solución."),
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (img: ModelIssueImage) => {
      if (img.object_path) {
        await deleteObject({ bucket: "voge-media", objectPath: img.object_path });
      }
      await deleteIssueImage(img.id);
    },
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin", "model", modelId, "issue-images"] });
    },
    onError: (e) => setErr(e instanceof Error ? e.message : "No se pudo eliminar la foto."),
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold">{issue.title}</div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled={updateIssueMutation.isPending} onClick={() => updateIssueMutation.mutate()}>
            {updateIssueMutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
          {canDelete ? (
            <Button
              variant="danger"
              disabled={deleteIssueMutation.isPending}
              onClick={() => {
                if (!window.confirm("¿Eliminar esta falla y sus soluciones?")) return;
                deleteIssueMutation.mutate();
              }}
            >
              Eliminar
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <Input value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} placeholder="Título" />
        <Input
          value={form.severity}
          onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value }))}
          placeholder="Severidad (baja/media/alta)"
        />
        <Textarea
          value={form.symptoms}
          onChange={(e) => setForm((s) => ({ ...s, symptoms: e.target.value }))}
          placeholder="Síntomas"
        />
      </div>

      <div className="mt-4">
        <div className="text-xs text-zinc-400">Fotos ({images.length})</div>
        {images.length === 0 ? (
          <div className="mt-2 text-sm text-zinc-500">Aún no hay fotos.</div>
        ) : (
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-lg border border-zinc-800">
                <a href={img.url} target="_blank" rel="noreferrer">
                  <img src={img.url} alt={issue.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </a>
                <button
                  type="button"
                  disabled={deleteImageMutation.isPending}
                  onClick={() => deleteImageMutation.mutate(img)}
                  className="absolute right-2 top-2 hidden rounded-md border border-zinc-700 bg-zinc-950/80 px-2 py-1 text-xs text-zinc-200 group-hover:block"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="text-xs text-zinc-400">Soluciones ({solutions.length})</div>
        <div className="mt-3 space-y-3">
          {solutions.map((s) => (
            <SolutionEditor
              key={s.id}
              solution={s}
              onSave={(next) => updateSolutionMutation.mutate({ id: s.id, steps: next.steps, parts: next.parts })}
                onDelete={canDelete ? () => deleteSolutionMutation.mutate(s.id) : undefined}
            />
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/20 p-4">
          <div className="text-sm font-semibold">Nueva solución</div>
          <div className="mt-3 grid gap-3">
            <Textarea value={solForm.steps} onChange={(e) => setSolForm((s) => ({ ...s, steps: e.target.value }))} placeholder="Pasos" />
            <Input value={solForm.parts} onChange={(e) => setSolForm((s) => ({ ...s, parts: e.target.value }))} placeholder="Piezas (opcional)" />
            <Button disabled={createSolutionMutation.isPending} onClick={() => createSolutionMutation.mutate()}>
              {createSolutionMutation.isPending ? "Creando…" : "Agregar solución"}
            </Button>
          </div>
        </div>
      </div>

      {err ? <div className="mt-3 text-xs text-red-400">{err}</div> : null}
    </div>
  );
}

function SolutionEditor({
  solution,
  onSave,
  onDelete,
}: {
  solution: IssueSolution;
  onSave: (next: { steps: string; parts: string }) => void;
  onDelete?: () => void;
}) {
  const [steps, setSteps] = useState(solution.steps);
  const [parts, setParts] = useState(solution.parts ?? "");

  useEffect(() => {
    setSteps(solution.steps);
    setParts(solution.parts ?? "");
  }, [solution.id, solution.steps, solution.parts]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => onSave({ steps, parts })}>
          Guardar
        </Button>
        {onDelete ? (
          <Button variant="danger" onClick={onDelete}>
            Eliminar
          </Button>
        ) : null}
      </div>
      <div className="mt-3 grid gap-3">
        <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="Pasos" />
        <Input value={parts} onChange={(e) => setParts(e.target.value)} placeholder="Piezas" />
      </div>
    </div>
  );
}
