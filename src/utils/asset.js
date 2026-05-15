export function resolveAssetUrl(url) {
  if (!url) return "";
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
  if (url.startsWith("/api/")) return url.replace(/^\/api/, "");
  if (url.startsWith("/")) return url;
  return `/${url}`;
}
