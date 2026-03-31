import { supabase } from "@/lib/supabase";

function getFileExt(fileName: string) {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "jpg";
  const ext = fileName.slice(lastDot + 1).toLowerCase();
  return ext || "jpg";
}

export async function uploadPublicImage(input: { bucket: string; objectPath: string; file: File }) {
  const { data, error } = await supabase.storage.from(input.bucket).upload(input.objectPath, input.file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from(input.bucket).getPublicUrl(data.path);
  return { publicUrl: urlData.publicUrl, objectPath: data.path };
}

export async function deleteObject(input: { bucket: string; objectPath: string }) {
  const { error } = await supabase.storage.from(input.bucket).remove([input.objectPath]);
  if (error) throw error;
}

export function buildModelImageObjectPath(modelId: string, fileName: string) {
  const ext = getFileExt(fileName);
  return `models/${modelId}/${crypto.randomUUID()}.${ext}`;
}

export function buildIssueImageObjectPath(userId: string, issueId: string, fileName: string) {
  const ext = getFileExt(fileName);
  return `${userId}/issues/${issueId}/${crypto.randomUUID()}.${ext}`;
}
