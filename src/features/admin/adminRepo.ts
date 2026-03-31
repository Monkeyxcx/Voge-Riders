import { supabase } from "@/lib/supabase";
import type { IssueSolution, ModelIssue, MotoModel } from "@/types/domain";

export async function createModel(input: {
  slug: string;
  name: string;
  type?: string | null;
  cc?: number | null;
  year?: number | null;
}) {
  const { data, error } = await supabase
    .from("moto_models")
    .insert({ slug: input.slug, name: input.name, type: input.type ?? null, cc: input.cc ?? null, year: input.year ?? null })
    .select("id, slug, name, type, cc, year, image_url, image_path")
    .single();
  if (error) throw error;
  return data as MotoModel;
}

export async function updateModel(input: {
  id: string;
  slug: string;
  name: string;
  type?: string | null;
  cc?: number | null;
  year?: number | null;
}) {
  const { data, error } = await supabase
    .from("moto_models")
    .update({ slug: input.slug, name: input.name, type: input.type ?? null, cc: input.cc ?? null, year: input.year ?? null })
    .eq("id", input.id)
    .select("id, slug, name, type, cc, year, image_url, image_path")
    .single();
  if (error) throw error;
  return data as MotoModel;
}

export async function deleteModelCascade(modelId: string) {
  const { data: issues, error: issuesError } = await supabase
    .from("model_issues")
    .select("id")
    .eq("model_id", modelId);
  if (issuesError) throw issuesError;

  const issueIds = (issues ?? []).map((r) => r.id as string);
  if (issueIds.length > 0) {
    const { error: solError } = await supabase.from("issue_solutions").delete().in("issue_id", issueIds);
    if (solError) throw solError;
    const { error: imgError } = await supabase.from("model_issue_images").delete().in("issue_id", issueIds);
    if (imgError) throw imgError;
    const { error: issuesDelError } = await supabase.from("model_issues").delete().in("id", issueIds);
    if (issuesDelError) throw issuesDelError;
  }

  const { error } = await supabase.from("moto_models").delete().eq("id", modelId);
  if (error) throw error;
}

export async function createIssue(input: {
  modelId: string;
  title: string;
  symptoms?: string | null;
  severity?: string | null;
}) {
  const { data, error } = await supabase
    .from("model_issues")
    .insert({ model_id: input.modelId, title: input.title, symptoms: input.symptoms ?? null, severity: input.severity ?? null })
    .select("id, model_id, title, symptoms, severity")
    .single();
  if (error) throw error;
  return data as ModelIssue;
}

export async function updateIssue(input: {
  id: string;
  title: string;
  symptoms?: string | null;
  severity?: string | null;
}) {
  const { data, error } = await supabase
    .from("model_issues")
    .update({ title: input.title, symptoms: input.symptoms ?? null, severity: input.severity ?? null })
    .eq("id", input.id)
    .select("id, model_id, title, symptoms, severity")
    .single();
  if (error) throw error;
  return data as ModelIssue;
}

export async function deleteIssueCascade(issueId: string) {
  const { error: solError } = await supabase.from("issue_solutions").delete().eq("issue_id", issueId);
  if (solError) throw solError;
  const { error: imgError } = await supabase.from("model_issue_images").delete().eq("issue_id", issueId);
  if (imgError) throw imgError;
  const { error } = await supabase.from("model_issues").delete().eq("id", issueId);
  if (error) throw error;
}

export async function createSolution(input: { issueId: string; steps: string; parts?: string | null }) {
  const { data, error } = await supabase
    .from("issue_solutions")
    .insert({ issue_id: input.issueId, steps: input.steps, parts: input.parts ?? null })
    .select("id, issue_id, steps, parts")
    .single();
  if (error) throw error;
  return data as IssueSolution;
}

export async function updateSolution(input: { id: string; steps: string; parts?: string | null }) {
  const { data, error } = await supabase
    .from("issue_solutions")
    .update({ steps: input.steps, parts: input.parts ?? null })
    .eq("id", input.id)
    .select("id, issue_id, steps, parts")
    .single();
  if (error) throw error;
  return data as IssueSolution;
}

export async function deleteSolution(id: string) {
  const { error } = await supabase.from("issue_solutions").delete().eq("id", id);
  if (error) throw error;
}
