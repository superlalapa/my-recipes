import {
  categoryFromInputPath,
  langFromInputPath,
  translationKeyFromInputPath,
  recipeUrl,
} from "../lib/util.js";

// Applies to every Markdown file under recipes/, including new sub-folders,
// so adding a recipe never means remembering boilerplate front matter.
export default {
  layout: "layouts/recipe.njk",
  eleventyComputed: {
    // English at /recipes/…, Spanish at /es/recipes/…. Drafts stay visible in
    // `npm run dev` for previewing but are never written by a production build.
    permalink: (data) =>
      data.draft && process.env.ELEVENTY_RUN_MODE === "build"
        ? false
        : recipeUrl(data.page.inputPath),

    lang: (data) => langFromInputPath(data.page.inputPath),
    translationKey: (data) => translationKeyFromInputPath(data.page.inputPath),
    category: (data) => categoryFromInputPath(data.page.inputPath),

    eleventyExcludeFromCollections: (data) =>
      data.draft || data.eleventyExcludeFromCollections,

    // `image: curry.jpg` resolves against the folder the Markdown file is in,
    // which is language-independent — the photo is shared between translations.
    imageUrl: (data) => {
      const image = data.image;
      if (!image) return null;
      if (/^(https?:)?\/\//.test(image) || image.startsWith("/")) return image;
      const dir = translationKeyFromInputPath(data.page.inputPath).replace(/[^/]+$/, "");
      return `/${dir}${image}`;
    },
  },
};
