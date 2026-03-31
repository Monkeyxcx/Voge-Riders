import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommentEntityType, MemberComment } from "@/types/domain";
import { canEditComment, createComment, deleteComment, listComments, updateComment } from "@/features/comments/commentsRepo";
import { useAuthStore } from "@/features/auth/useAuthStore";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import Card from "@/components/ui/Card";

function shortId(id: string) {
  if (!id) return "";
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

export default function CommentsSection({
  entityType,
  entityId,
}: {
  entityType: CommentEntityType;
  entityId: string;
}) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");

  const key = useMemo(() => ["comments", entityType, entityId] as const, [entityType, entityId]);

  const commentsQuery = useQuery({
    queryKey: key,
    queryFn: () => listComments(entityType, entityId),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Necesitas iniciar sesión para comentar");
      const body = draft.trim();
      if (!body) throw new Error("Escribe un comentario");
      return createComment({ userId: user.id, entityType, entityId, body });
    },
    onSuccess: async () => {
      setDraft("");
      await qc.invalidateQueries({ queryKey: key });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("No hay comentario en edición");
      const body = editingBody.trim();
      if (!body) throw new Error("Escribe un comentario");
      return updateComment({ id: editingId, body });
    },
    onSuccess: async () => {
      setEditingId(null);
      setEditingBody("");
      await qc.invalidateQueries({ queryKey: key });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteComment(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: key });
    },
  });

  const errorMessage =
    (commentsQuery.error instanceof Error ? commentsQuery.error.message : null) ||
    (createMutation.error instanceof Error ? createMutation.error.message : null) ||
    (updateMutation.error instanceof Error ? updateMutation.error.message : null) ||
    (deleteMutation.error instanceof Error ? deleteMutation.error.message : null);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Comentarios</div>
          <div className="mt-1 text-xs text-zinc-400">Comparte tu experiencia y soluciones</div>
        </div>
      </div>

      {errorMessage ? <div className="mt-3 text-xs text-red-400">{errorMessage}</div> : null}

      <div className="mt-4">
        {status === "authenticated" ? (
          <div className="flex flex-col gap-2">
            <Textarea
              rows={3}
              placeholder="Escribe tu comentario…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                Publicar
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-sm text-zinc-300">
            Inicia sesión para publicar comentarios.
          </div>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {commentsQuery.isLoading ? (
          <div className="text-sm text-zinc-400">Cargando comentarios…</div>
        ) : null}

        {commentsQuery.data?.length === 0 ? (
          <div className="text-sm text-zinc-400">Aún no hay comentarios.</div>
        ) : null}

        {commentsQuery.data?.map((c) => (
          <CommentRow
            key={c.id}
            comment={c}
            currentUserId={user?.id}
            editingId={editingId}
            editingBody={editingBody}
            onStartEdit={() => {
              setEditingId(c.id);
              setEditingBody(c.body);
            }}
            onCancelEdit={() => {
              setEditingId(null);
              setEditingBody("");
            }}
            onChangeEditingBody={setEditingBody}
            onSave={() => updateMutation.mutate()}
            onDelete={() => deleteMutation.mutate(c.id)}
            saving={updateMutation.isPending}
            deleting={deleteMutation.isPending}
          />
        ))}
      </div>
    </Card>
  );
}

function CommentRow({
  comment,
  currentUserId,
  editingId,
  editingBody,
  onStartEdit,
  onCancelEdit,
  onChangeEditingBody,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  comment: MemberComment;
  currentUserId?: string | null;
  editingId: string | null;
  editingBody: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditingBody: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  deleting: boolean;
}) {
  const isOwner = canEditComment(comment.user_id, currentUserId);
  const isEditing = editingId === comment.id;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-zinc-500">
            {shortId(comment.user_id)} · {new Date(comment.created_at).toLocaleString()}
          </div>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea rows={3} value={editingBody} onChange={(e) => onChangeEditingBody(e.target.value)} />
              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={onCancelEdit} disabled={saving || deleting}>
                  Cancelar
                </Button>
                <Button onClick={onSave} disabled={saving || deleting}>
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-100 whitespace-pre-wrap">{comment.body}</div>
          )}
        </div>

        {isOwner && !isEditing ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onStartEdit} disabled={saving || deleting}>
              Editar
            </Button>
            <Button variant="danger" onClick={onDelete} disabled={saving || deleting}>
              Eliminar
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

