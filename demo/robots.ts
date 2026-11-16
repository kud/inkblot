export const isBareHost = (hostname: string) =>
  hostname.endsWith(".vercel.app")

export const keepBareHostOutOfSearch = (doc: Document, hostname: string) => {
  if (!isBareHost(hostname)) return
  if (doc.head.querySelector('meta[name="robots"]')) return
  const meta = doc.createElement("meta")
  meta.name = "robots"
  meta.content = "noindex"
  doc.head.append(meta)
}
