import { HtmlBasePlugin } from "@11ty/eleventy";
import {
  categoryFromInputPath,
  titleize,
  iconForCategory,
  toPlainText,
  LANGS,
  DEFAULT_LANG,
  langFromInputPath,
  translationKeyFromInputPath,
  localeHome,
  otherLang,
} from "./lib/util.js";
import i18n from "./_data/i18n.js";

// GitHub Pages serves project sites from /<repo>/. CI passes the prefix in;
// locally it's just "/". HtmlBasePlugin applies it to the HTML output.
const pathPrefix = normalisePrefix(process.env.PATH_PREFIX);

function normalisePrefix(value) {
  const trimmed = String(value || "").replace(/^\/+|\/+$/g, "");
  return trimmed ? `/${trimmed}/` : "/";
}

export const tagSlug = (tag) =>
  String(tag).toLowerCase().trim().replace(/\s+/g, "-");

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPassthroughCopy("assets");
  // Photos can live next to the recipe that uses them.
  eleventyConfig.addPassthroughCopy("recipes/**/*.{jpg,jpeg,png,webp,avif,gif,svg}");
  eleventyConfig.addWatchTarget("./assets/");

  eleventyConfig.addFilter("titleize", titleize);
  eleventyConfig.addFilter("plainText", toPlainText);
  eleventyConfig.addFilter("tagSlug", tagSlug);

  eleventyConfig.addFilter("truncate", (text, length = 180) => {
    const clean = toPlainText(text);
    return clean.length <= length ? clean : `${clean.slice(0, length).trimEnd()}…`;
  });

  // "{n} recipes" / "{n} receta" — picks singular or plural, then substitutes.
  eleventyConfig.addFilter("count", (n, t) =>
    (n === 1 ? t.countOne : t.countMany).replace("{n}", n)
  );

  eleventyConfig.addFilter("fill", (template, value, token = "{n}") =>
    String(template).replace(token, value)
  );

  eleventyConfig.addFilter("jsonify", (value) => JSON.stringify(value));

  /* ------------------------------------------------------------ recipe units
   * A "unit" is one recipe across all its languages. `foo.md` and `foo.es.md`
   * are two variants of the same unit, so a listing can fall back to whichever
   * language exists.
   */
  const buildUnits = (api) => {
    const units = new Map();
    for (const item of api.getFilteredByGlob("recipes/**/*.md")) {
      if (item.data.draft) continue;
      const key = translationKeyFromInputPath(item.inputPath);
      if (!units.has(key)) {
        units.set(key, {
          key,
          category: categoryFromInputPath(item.inputPath),
          variants: {},
        });
      }
      units.get(key).variants[langFromInputPath(item.inputPath)] = item;
    }
    return [...units.values()];
  };

  const resolve = (unit, lang) => {
    const item =
      unit.variants[lang] || unit.variants[DEFAULT_LANG] || Object.values(unit.variants)[0];
    return {
      key: unit.key,
      category: unit.category,
      lang,
      // False when this language falls back to another one's content.
      translated: Boolean(unit.variants[lang]),
      contentLang: langFromInputPath(item.inputPath),
      url: item.url,
      date: item.date,
      data: item.data,
      // The template itself, NOT its rendered content: reading templateContent
      // while collections are being built throws TemplateContentPrematureUse.
      // Consumers that need the body read it at render time.
      item,
    };
  };

  const byTitle = (lang) => (a, b) =>
    String(a.data.title).localeCompare(String(b.data.title), lang, { sensitivity: "base" });

  eleventyConfig.addCollection("localeRecipes", (api) => {
    const units = buildUnits(api);
    return Object.fromEntries(
      LANGS.map((lang) => [lang, units.map((u) => resolve(u, lang)).sort(byTitle(lang))])
    );
  });

  eleventyConfig.addCollection("localeRecent", (api) => {
    const units = buildUnits(api);
    return Object.fromEntries(
      LANGS.map((lang) => [
        lang,
        units.map((u) => resolve(u, lang)).sort((a, b) => b.date - a.date),
      ])
    );
  });

  eleventyConfig.addCollection("categories", (api) => {
    const units = buildUnits(api);
    const entries = [];
    const urlBySlug = {};

    for (const lang of LANGS) {
      const names = i18n.strings[lang].categories;
      const bucket = new Map();
      for (const unit of units) {
        const recipe = resolve(unit, lang);
        const slug = unit.category;
        if (!bucket.has(slug)) {
          bucket.set(slug, {
            slug,
            lang,
            name: names[slug] || recipe.data.categoryName || titleize(slug),
            icon: recipe.data.categoryIcon || iconForCategory(slug),
            url: `${localeHome(lang)}recipes/${slug}/`,
            recipes: [],
          });
        }
        bucket.get(slug).recipes.push(recipe);
      }
      for (const entry of bucket.values()) {
        entry.recipes.sort(byTitle(lang));
        entry.count = entry.recipes.length;
        (urlBySlug[entry.slug] ||= {})[lang] = entry.url;
        entries.push(entry);
      }
    }

    // null, not the other language's home: base.njk only claims an hreflang
    // alternate when a genuine counterpart page exists.
    for (const entry of entries) {
      entry.altUrl = urlBySlug[entry.slug]?.[otherLang(entry.lang)] || null;
    }
    return entries.sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
  });

  eleventyConfig.addCollection("recipeTags", (api) => {
    const units = buildUnits(api);
    const entries = [];
    const urlBySlug = {};

    for (const lang of LANGS) {
      const bucket = new Map();
      for (const unit of units) {
        const recipe = resolve(unit, lang);
        for (const tag of recipe.data.tags || []) {
          const slug = tagSlug(tag);
          if (!slug) continue;
          if (!bucket.has(slug)) {
            bucket.set(slug, {
              slug,
              lang,
              name: String(tag).trim(),
              url: `${localeHome(lang)}tags/${slug}/`,
              recipes: [],
            });
          }
          bucket.get(slug).recipes.push(recipe);
        }
      }
      for (const entry of bucket.values()) {
        entry.recipes.sort(byTitle(lang));
        entry.count = entry.recipes.length;
        (urlBySlug[entry.slug] ||= {})[lang] = entry.url;
        entries.push(entry);
      }
    }

    for (const entry of entries) {
      entry.altUrl = urlBySlug[entry.slug]?.[otherLang(entry.lang)] || null;
    }
    return entries.sort(
      (a, b) => a.lang.localeCompare(b.lang) || b.count - a.count || a.name.localeCompare(b.name)
    );
  });

  // key -> { en: url, es: url } for the language switcher. Only real variants
  // are listed, so the switcher can tell a translation from a fallback.
  eleventyConfig.addCollection("translations", (api) => {
    const map = {};
    for (const unit of buildUnits(api)) {
      map[unit.key] = Object.fromEntries(
        Object.entries(unit.variants).map(([lang, item]) => [lang, item.url])
      );
    }
    return map;
  });
}

export const config = {
  pathPrefix,
  dir: { input: ".", output: "_site", includes: "_includes", data: "_data" },
  // Recipes stay plain Markdown — no template syntax to escape when writing them.
  markdownTemplateEngine: false,
  htmlTemplateEngine: "njk",
  templateFormats: ["njk", "md", "11ty.js"],
};
