import { supabase } from "@/lib/supabase";
import type { IssueSolution, ModelIssue, ModelIssueImage, MotoModel } from "@/types/domain";

export async function listModels(params: {
  q?: string;
  type?: string;
  ccMin?: number;
  ccMax?: number;
  year?: number;
}) {
  let query = supabase
    .from("moto_models")
    .select("id, slug, name, type, cc, year, image_url, image_path")
    .order("name");

  if (params.type) query = query.eq("type", params.type);
  if (typeof params.year === "number") query = query.eq("year", params.year);
  if (typeof params.ccMin === "number") query = query.gte("cc", params.ccMin);
  if (typeof params.ccMax === "number") query = query.lte("cc", params.ccMax);
  if (params.q) query = query.ilike("name", `%${params.q}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MotoModel[];
}

export async function getModelBySlug(slug: string) {
  const { data, error } = await supabase
    .from("moto_models")
    .select("id, slug, name, type, cc, year, image_url, image_path")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as MotoModel | null;
}

export async function updateModelImage(input: { modelId: string; imageUrl: string | null; imagePath: string | null }) {
  const { data, error } = await supabase
    .from("moto_models")
    .update({ image_url: input.imageUrl, image_path: input.imagePath })
    .eq("id", input.modelId)
    .select("id, slug, name, type, cc, year, image_url, image_path")
    .single();
  if (error) throw error;
  return data as MotoModel;
}

export async function listIssuesByModelId(modelId: string) {
  const { data, error } = await supabase
    .from("model_issues")
    .select("id, model_id, title, symptoms, severity")
    .eq("model_id", modelId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ModelIssue[];
}

export async function listSolutionsByIssueIds(issueIds: string[]) {
  if (issueIds.length === 0) return [] as IssueSolution[];
  const { data, error } = await supabase
    .from("issue_solutions")
    .select("id, issue_id, steps, parts")
    .in("issue_id", issueIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as IssueSolution[];
}

export async function listIssueImagesByIssueIds(issueIds: string[]) {
  if (issueIds.length === 0) return [] as ModelIssueImage[];
  const { data, error } = await supabase
    .from("model_issue_images")
    .select("id, issue_id, user_id, url, object_path, created_at")
    .in("issue_id", issueIds)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ModelIssueImage[];
}

export async function createIssueImage(input: {
  issueId: string;
  userId: string;
  url: string;
  objectPath: string | null;
}) {
  const { data, error } = await supabase
    .from("model_issue_images")
    .insert({ issue_id: input.issueId, user_id: input.userId, url: input.url, object_path: input.objectPath })
    .select("id, issue_id, user_id, url, object_path, created_at")
    .single();
  if (error) throw error;
  return data as ModelIssueImage;
}

export async function deleteIssueImage(id: string) {
  const { error } = await supabase.from("model_issue_images").delete().eq("id", id);
  if (error) throw error;
}

export async function listRecentIssues(limit: number) {
  const { data, error } = await supabase
    .from("model_issues")
    .select("id, model_id, title, symptoms, severity")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ModelIssue[];
}

export async function listModelsByIds(ids: string[]) {
  if (ids.length === 0) return [] as MotoModel[];
  const { data, error } = await supabase
    .from("moto_models")
    .select("id, slug, name, type, cc, year, image_url, image_path")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as MotoModel[];
}
