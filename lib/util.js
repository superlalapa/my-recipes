import i18n from "../_data/i18n.js";

/**
 * The top-level folder inside `recipes/` is the category.
 *   recipes/mains/thai-green-curry.md  ->  "mains"
 *   recipes/loose-recipe.md            ->  "uncategorised"
 */
export function categoryFromInputPath(inputPath) {
  const parts = String(inputPath).replace(/^\.?\/+/, "").split("/");
  return parts[0] === "recipes" && parts.length >= 3 ? parts[1] : "uncategorised";
}

/** "side-dishes" -> "Side Dishes" */
export function titleize(slug) {
  return String(slug)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** Fallback emoji so a brand-new folder still looks intentional on the home screen. */
const CATEGORY_ICONS = {
  breakfast: "\u{1F373}",
  brunch: "\u{1F95E}",
  lunch: "\u{1F96A}",
  mains: "\u{1F35B}",
  dinner: "\u{1F35D}",
  sides: "\u{1F957}",
  salads: "\u{1F96C}",
  soups: "\u{1F372}",
  smoothies: "\u{1F964}",
  bread: "\u{1F35E}",
  baking: "\u{1F9C1}",
  desserts: "\u{1F370}",
  drinks: "\u{1F379}",
  sauces: "\u{1F36F}",
  snacks: "\u{1F968}",
  uncategorised: "\u{1F4D2}",
};

export function iconForCategory(slug) {
  return CATEGORY_ICONS[slug] || "\u{1F374}";
}

/** Strip HTML + collapse whitespace, for the search index. */
export function toPlainText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------------------------- languages */
/* Derived from _data/i18n.js so adding a language means editing one file. */

export const LANGS = i18n.list.map((l) => l.code);
export const DEFAULT_LANG = i18n.list[0].code;

export const otherLang = (lang) => i18n.strings[lang]?.other || DEFAULT_LANG;

const NON_DEFAULT = LANGS.filter((l) => l !== DEFAULT_LANG).join("|");
const FILE_SUFFIX = new RegExp(`\\.(${NON_DEFAULT})\\.md$`, "i");
const STEM_SUFFIX = new RegExp(`\\.(${NON_DEFAULT})$`, "i");

/** A `.es.md` suffix marks the Spanish variant; a bare `.md` is the default. */
export function langFromInputPath(inputPath) {
  const match = String(inputPath).match(FILE_SUFFIX);
  return match ? match[1].toLowerCase() : DEFAULT_LANG;
}

/**
 * Identity of a recipe across languages.
 *   recipes/mains/poke.md     -> "recipes/mains/poke"
 *   recipes/mains/poke.es.md  -> "recipes/mains/poke"
 */
export function translationKeyFromInputPath(inputPath) {
  return String(inputPath)
    .replace(/^\.?\/+/, "")
    .replace(/\.md$/i, "")
    .replace(STEM_SUFFIX, "");
}

/** The default language lives at the root; others get a prefix segment. */
export function localeHome(lang) {
  return i18n.strings[lang]?.home || "/";
}

export function recipeUrl(inputPath) {
  return localeHome(langFromInputPath(inputPath)) + translationKeyFromInputPath(inputPath) + "/";
}
