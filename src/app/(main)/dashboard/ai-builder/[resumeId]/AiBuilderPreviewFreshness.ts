export function hasCurrentPreview(
  previewCache: Record<string, string>,
  renderedVersions: Record<string, number>,
  themeId: string,
  version: number,
) {
  return Boolean(previewCache[themeId]) && renderedVersions[themeId] === version;
}
