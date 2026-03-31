import { supabase } from "@/lib/supabase";
import type { Workshop } from "@/types/domain";

export async function listWorkshops(params: { q?: string; city?: string; tag?: string }) {
  let query = supabase
    .from("workshops")
    .select("id, name, city, address, contact, tags, notes")
    .order("name");

  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.tag) query = query.ilike("tags", `%${params.tag}%`);
  if (params.q) query = query.ilike("name", `%${params.q}%`);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Workshop[];
}

export async function getWorkshopById(id: string) {
  const { data, error } = await supabase
    .from("workshops")
    .select("id, name, city, address, contact, tags, notes")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Workshop | null;
}

