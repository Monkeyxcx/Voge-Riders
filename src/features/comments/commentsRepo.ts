import { supabase } from "@/lib/supabase";
import type { CommentEntityType, MemberComment } from "@/types/domain";

export async function listComments(entityType: CommentEntityType, entityId: string) {
  const { data, error } = await supabase
    .from("member_comments")
    .select("id, user_id, entity_type, entity_id, body, created_at, updated_at")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MemberComment[];
}

export async function createComment(input: {
  userId: string;
  entityType: CommentEntityType;
  entityId: string;
  body: string;
}) {
  const { data, error } = await supabase
    .from("member_comments")
    .insert({
      user_id: input.userId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      body: input.body,
    })
    .select("id, user_id, entity_type, entity_id, body, created_at, updated_at")
    .single();
  if (error) throw error;
  return data as MemberComment;
}

export async function updateComment(input: { id: string; body: string }) {
  const { data, error } = await supabase
    .from("member_comments")
    .update({ body: input.body })
    .eq("id", input.id)
    .select("id, user_id, entity_type, entity_id, body, created_at, updated_at")
    .single();
  if (error) throw error;
  return data as MemberComment;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("member_comments").delete().eq("id", id);
  if (error) throw error;
}

export async function listRecentComments(limit: number) {
  const { data, error } = await supabase
    .from("member_comments")
    .select("id, user_id, entity_type, entity_id, body, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MemberComment[];
}

export function canEditComment(commentUserId: string, currentUserId: string | null | undefined) {
  return !!currentUserId && commentUserId === currentUserId;
}

