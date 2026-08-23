import { toPlainText } from "./lib/util.js";

// One index per language, at /search-index.json and /es/search-index.json.
export const data = {
  pagination: { data: "i18n.list", size: 1, alias: "loc" },
  permalink: (data) => `${data.loc.home}search-index.json`,
  eleventyExcludeFromCollections: true,
};

// URLs are stored without the GitHub Pages path prefix; the client joins them
// onto window.SITE_BASE so the same index works locally and when deployed.
export function render(data) {
  const lang = data.loc.code;
  const entries = (data.collections.localeRecipes[lang] || []).map((recipe) => ({
    t: recipe.data.title || "",
    u: recipe.url,
    c: recipe.category || "",
    n: data.loc.categories[recipe.category] || recipe.data.categoryName || recipe.category,
    d: recipe.data.description || "",
    g: (recipe.data.tags || []).map(String),
    b: toPlainText(recipe.item.templateContent || "").slice(0, 1200),
  }));
  return JSON.stringify(entries);
}
