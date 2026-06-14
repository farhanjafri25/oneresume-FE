export function keepSelectedPreviewOnly(
  cache: Record<string, string>,
  selectedThemeId: string,
) {
  const selectedPreview = cache[selectedThemeId];
  return selectedPreview ? { [selectedThemeId]: selectedPreview } : {};
}
