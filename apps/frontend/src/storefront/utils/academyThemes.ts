export const ACADEMY_GLAZIER_THEME_IDS = new Set([
  'academy-stage-3d',
  'edu-academy-pro',
]);

export const isAcademyGlazierThemeId = (themeId?: string | null): boolean =>
  Boolean(themeId && ACADEMY_GLAZIER_THEME_IDS.has(themeId));

export const isCodingAcademyPresetId = (themeId?: string | null): boolean =>
  themeId === 'academy-stage-3d';
