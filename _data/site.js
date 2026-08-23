const repo = process.env.GITHUB_REPOSITORY || "superlalapa/my-recipes";
const [owner, name] = repo.split("/");

const url = process.env.SITE_URL || `https://${owner}.github.io/${name}/`;

// Titles, taglines and descriptions live in _data/i18n.js — this file is only
// the deploy-time identity of the site.
export default {
  url,
  // Scheme + host only, so it composes with the `url` filter (which already
  // adds the GitHub Pages path prefix) to build absolute URLs.
  origin: new URL(url).origin,
  repo: `https://github.com/${repo}`,
  repoBranch: process.env.GITHUB_REF_NAME || "main",
};
