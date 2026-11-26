// expo-router's developer route index for /_sitemap. The phone page never links there, and the real one
// ships about 19 KB of code and images in every bundle, so the page build points expo-router here instead.
export function getNavOptions(): Record<string, never> {
  return {}
}

export function Sitemap(): null {
  return null
}
