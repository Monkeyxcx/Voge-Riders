export function buildGoogleMapsEmbedUrl(query: string) {
  const q = query.trim();
  if (!q) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

export function buildGoogleMapsSearchUrl(query: string) {
  const q = query.trim();
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
