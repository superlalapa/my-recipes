(() => {
  "use strict";

  const BASE = (window.SITE_BASE || "/").replace(/\/*$/, "/");
  const url = (path) => BASE + String(path).replace(/^\/+/, "");

  /* ------------------------------------------------------------- search */
  const layer = document.querySelector("[data-search-layer]");

  if (layer) {
    const input = layer.querySelector("[data-search-input]");
    const list = layer.querySelector("[data-search-results]");
    const empty = layer.querySelector("[data-search-empty]");
    let index = null;
    let loading = null;
    let lastFocus = null;

    const loadIndex = () => {
      if (!loading) {
        loading = fetch(window.SEARCH_INDEX || url("search-index.json"))
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
          .then((data) => (index = data))
          .catch(() => {
            // Drop the memo so the next keystroke retries instead of the
            // search staying permanently empty after one flaky request.
            loading = null;
            index = null;
          });
      }
      return loading;
    };

    const escapeHtml = (s) =>
      String(s).replace(/[&<>"']/g, (c) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
      );

    // Mark in ONE pass over the raw text using control-character sentinels,
    // then escape, then swap the sentinels for tags. Escaping first and looping
    // per term makes later terms match the &amp;/<mark> markup already inserted.
    const OPEN = "\u0001";
    const CLOSE = "\u0002";

    const highlight = (text, terms) => {
      const useful = terms
        .filter((t) => t.length >= 2)
        .sort((a, b) => b.length - a.length)
        .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

      let marked = String(text);
      if (useful.length) {
        marked = marked.replace(new RegExp(`(${useful.join("|")})`, "ig"), `${OPEN}$1${CLOSE}`);
      }
      return escapeHtml(marked).split(OPEN).join("<mark>").split(CLOSE).join("</mark>");
    };

    // Every term must appear somewhere; title and tag hits rank above body hits.
    const score = (entry, terms) => {
      const title = entry.t.toLowerCase();
      const tags = entry.g.join(" ").toLowerCase();
      const meta = `${entry.c} ${entry.n} ${entry.d}`.toLowerCase();
      const body = entry.b.toLowerCase();
      let total = 0;

      for (const term of terms) {
        let best = 0;
        if (title.startsWith(term)) best = 100;
        else if (title.includes(term)) best = 60;
        else if (tags.includes(term)) best = 40;
        else if (meta.includes(term)) best = 20;
        else if (body.includes(term)) best = 8;
        if (!best) return 0;
        total += best;
      }
      return total;
    };

    const status = layer.querySelector("[data-search-status]");

    const render = (query) => {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      list.innerHTML = "";

      if (!terms.length) {
        empty.hidden = true;
        if (status) status.textContent = "";
        return;
      }

      if (index === null) {
        empty.hidden = true;
        return;
      }

      const hits = (index || [])
        .map((entry) => ({ entry, score: score(entry, terms) }))
        .filter((hit) => hit.score > 0)
        .sort((a, b) => b.score - a.score || a.entry.t.localeCompare(b.entry.t))
        .slice(0, 30);

      empty.hidden = hits.length > 0;
      if (status) status.textContent = String(hits.length);

      const frag = document.createDocumentFragment();
      for (const { entry } of hits) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = url(entry.u);
        a.innerHTML =
          `<span class="r-title">${highlight(entry.t, terms)}</span>` +
          `<span class="r-meta">${escapeHtml(entry.n || entry.c)}` +
          (entry.d ? ` · ${highlight(entry.d, terms)}` : "") +
          `</span>`;
        li.appendChild(a);
        frag.appendChild(li);
      }
      list.appendChild(frag);
    };

    const behind = () =>
      document.querySelectorAll("body > header, body > main, body > footer");
    const triggers = () => document.querySelectorAll("[data-search-open]");

    const open = () => {
      lastFocus = document.activeElement;
      layer.hidden = false;
      document.body.classList.add("search-open");
      // Real modality: everything behind the dialog leaves the a11y tree and
      // the tab order, which is what aria-modal promises.
      behind().forEach((el) => (el.inert = true));
      triggers().forEach((b) => b.setAttribute("aria-expanded", "true"));
      input.focus();
      input.select();
      loadIndex().then(() => render(input.value));
    };

    const close = () => {
      layer.hidden = true;
      document.body.classList.remove("search-open");
      behind().forEach((el) => (el.inert = false));
      triggers().forEach((b) => b.setAttribute("aria-expanded", "false"));
      if (lastFocus instanceof HTMLElement) lastFocus.focus();
    };

    document.querySelectorAll("[data-search-open]").forEach((btn) =>
      btn.addEventListener("click", open)
    );
    layer.querySelector("[data-search-close]").addEventListener("click", close);
    layer.addEventListener("click", (e) => {
      if (e.target === layer) close();
    });
    input.addEventListener("input", () => loadIndex().then(() => render(input.value)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !layer.hidden) close();
      if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && layer.hidden) {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        open();
      }
    });
  }

  /* -------------------------------------------------- recipe interaction */
  const body = document.querySelector("[data-recipe-body]");
  if (!body) {
    registerServiceWorker();
    return;
  }

  const storeKey = `ticks:${location.pathname}`;
  const ticked = new Set(JSON.parse(localStorage.getItem(storeKey) || "[]"));
  const saveTicks = () => localStorage.setItem(storeKey, JSON.stringify([...ticked]));

  // Ids are derived from the item's text, not its position, so inserting or
  // reordering an ingredient doesn't shift everyone else's saved ticks.
  const seenIds = new Map();
  const makeId = (prefix, text) => {
    let h = 5381;
    const norm = text.trim().toLowerCase().replace(/\s+/g, " ");
    for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) | 0;
    const base = `${prefix}-${(h >>> 0).toString(36)}`;
    const n = (seenIds.get(base) || 0) + 1;
    seenIds.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };

  const INGREDIENTS = /ingredient|ingrediente|shopping|you.?ll need|necesitas|lista de la compra/i;
  const STEPS =
    /method|instruction|direction|step|how to|make it|preparaci[oó]n|elaboraci[oó]n|pasos|instrucciones|modo de/i;

  let mode = null;
  let sawIngredients = false;
  let sawSteps = false;
  let sawHeadings = false;

  for (const node of [...body.children]) {
    if (/^H[1-6]$/.test(node.tagName)) {
      sawHeadings = true;
      const text = node.textContent;
      mode = INGREDIENTS.test(text) ? "ingredients" : STEPS.test(text) ? "steps" : null;
      continue;
    }
    if (node.tagName === "UL" && mode === "ingredients") {
      makeChecklist(node);
      sawIngredients = true;
    } else if ((node.tagName === "OL" || node.tagName === "UL") && mode === "steps") {
      makeSteps(node);
      sawSteps = true;
    }
  }

  // Only guess when there are no headings at all. Guessing in a recipe that
  // *has* headings turns the Notes list into a shopping list.
  if (!sawHeadings) {
    if (!sawIngredients) {
      const firstUl = body.querySelector("ul:not(.checklist):not(.steps)");
      if (firstUl) makeChecklist(firstUl);
    }
    if (!sawSteps) {
      const firstOl = body.querySelector("ol:not(.steps)");
      if (firstOl) makeSteps(firstOl);
    }
  }

  function bindTick(input, id) {
    input.checked = ticked.has(id);
    input.addEventListener("change", () => {
      if (input.checked) ticked.add(id);
      else ticked.delete(id);
      saveTicks();
    });
  }

  function makeChecklist(ul) {
    ul.classList.add("checklist");
    ul.setAttribute("role", "list");
    for (const li of [...ul.children]) {
      if (li.tagName !== "LI") continue;
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";

      const span = document.createElement("span");
      while (li.firstChild) span.appendChild(li.firstChild);
      // Keep the markup, not just the text: bold, links and nested lists must
      // survive the scaler restoring the original.
      span.dataset.originalHtml = span.innerHTML;

      label.append(input, span);
      li.appendChild(label);
      bindTick(input, makeId("ing", span.textContent));
    }
  }

  function makeSteps(list) {
    list.classList.add("steps");
    list.setAttribute("role", "list");
    let n = 0;
    for (const li of [...list.children]) {
      if (li.tagName !== "LI") continue;
      n += 1;
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";

      const num = document.createElement("span");
      num.className = "step-n";
      num.textContent = String(n);

      const text = document.createElement("span");
      text.className = "step-text";
      while (li.firstChild) text.appendChild(li.firstChild);

      label.append(input, num, text);
      li.appendChild(label);
      bindTick(input, makeId("step", text.textContent));
    }
  }

  const resetBtn = document.querySelector("[data-reset-checks]");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      ticked.clear();
      saveTicks();
      body.querySelectorAll('input[type="checkbox"]').forEach((i) => (i.checked = false));
    });
  }

  /* ------------------------------------------------------------ scaling */
  const scaler = document.querySelector("[data-scaler]");
  if (scaler) {
    const FACTORS = [0.5, 1, 1.5, 2, 3, 4];
    const VULGAR = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };
    const NICE = [
      [1 / 8, "⅛"], [1 / 6, "⅙"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"],
      [1 / 2, "½"], [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [5 / 6, "⅚"], [7 / 8, "⅞"],
    ];
    const GLYPHS = "¼½¾⅓⅔⅛⅜⅝⅞";

    // Ordered longest-match-first: thousands, mixed glyph ("1½"), mixed
    // fraction ("1 1/2"), fraction, bare glyph, decimal.
    const QTY = new RegExp(
      "^(\\s*)(" +
        "\\d{1,3}(?:,\\d{3})+(?:\\.\\d+)?" +
        `|\\d+\\s*[${GLYPHS}]` +
        "|\\d+\\s+\\d+/\\d+" +
        "|\\d+/\\d+" +
        `|[${GLYPHS}]` +
        "|\\d+(?:[.,]\\d+)?" +
      ")(\\s*(?:[-–—]|to)\\s*(" +
        `\\d+(?:[.,]\\d+)?|\\d+/\\d+|[${GLYPHS}]` +
      "))?"
    );

    const parseQty = (raw) => {
      const s = String(raw).trim();
      if (VULGAR[s] !== undefined) return VULGAR[s];
      let m = s.match(new RegExp(`^(\\d+)\\s*([${GLYPHS}])$`));
      if (m) return Number(m[1]) + VULGAR[m[2]];
      m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
      if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
      m = s.match(/^(\d+)\/(\d+)$/);
      if (m) return Number(m[1]) / Number(m[2]);
      if (/^\d{1,3}(,\d{3})+/.test(s)) return Number(s.replace(/,/g, ""));
      return Number(s.replace(",", "."));
    };

    const formatQty = (n) => {
      if (!isFinite(n) || n <= 0) return "0";
      if (n >= 1000) return Math.round(n).toLocaleString(window.SITE_LANG === "es" ? "es-ES" : "en-US");
      const whole = Math.floor(n + 1e-9);
      const rest = n - whole;
      for (const [value, glyph] of NICE) {
        if (Math.abs(rest - value) < 0.02) return whole ? `${whole}${glyph}` : glyph;
      }
      if (rest < 0.02) return String(whole);
      return n < 10 ? String(Math.round(n * 100) / 100) : String(Math.round(n));
    };

    const baseServings = Number(scaler.dataset.baseServings) || null;
    const readout = scaler.querySelector("[data-scale-readout]");
    const servingsOut = document.querySelector("[data-servings-readout]");
    const downBtn = scaler.querySelector("[data-scale-down]");
    const upBtn = scaler.querySelector("[data-scale-up]");
    let idx = FACTORS.indexOf(1);

    // Rewrites only the leading quantity, inside whatever element holds it, so
    // surrounding markup is untouched.
    const scaleSpan = (span, factor) => {
      span.innerHTML = span.dataset.originalHtml;
      if (factor === 1) return;

      const walker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      // Loose lists wrap each item in <p>, putting a whitespace-only node first.
      while (node && !node.nodeValue.trim()) node = walker.nextNode();
      if (!node) return;
      const match = node.nodeValue.match(QTY);
      if (!match || !match[2]) return;

      const first = formatQty(parseQty(match[2]) * factor);
      const second = match[4] ? `–${formatQty(parseQty(match[4]) * factor)}` : "";

      const frag = document.createDocumentFragment();
      if (match[1]) frag.append(match[1]);
      const mark = document.createElement("span");
      mark.className = "scaled";
      mark.textContent = first + second;
      frag.append(mark, node.nodeValue.slice(match[0].length));
      node.parentNode.replaceChild(frag, node);
    };

    const apply = () => {
      const factor = FACTORS[idx];
      readout.textContent = `${factor}×`;
      if (servingsOut && baseServings) servingsOut.textContent = formatQty(baseServings * factor);
      body
        .querySelectorAll(".checklist span[data-original-html]")
        .forEach((span) => scaleSpan(span, factor));
      downBtn.disabled = idx === 0;
      upBtn.disabled = idx === FACTORS.length - 1;
    };

    downBtn.addEventListener("click", () => { if (idx > 0) { idx--; apply(); } });
    upBtn.addEventListener("click", () => { if (idx < FACTORS.length - 1) { idx++; apply(); } });
    apply();
  }

  /* ----------------------------------------------------------- wake lock */
  const wakeBtn = document.querySelector("[data-wakelock]");
  if (wakeBtn && "wakeLock" in navigator) {
    let lock = null;
    // The UA drops the lock when the tab hides, which fires `release` and
    // clears aria-pressed — so intent has to be tracked separately.
    let wanted = false;
    wakeBtn.hidden = false;

    const setPressed = (on) => wakeBtn.setAttribute("aria-pressed", on ? "true" : "false");

    const acquire = async () => {
      if (lock) return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        // Intent can flip while the request is in flight.
        if (!wanted) {
          sentinel.release().catch(() => {});
          return;
        }
        lock = sentinel;
        lock.addEventListener("release", () => {
          lock = null;
          setPressed(false);
        });
        setPressed(true);
      } catch {
        wanted = false;
        setPressed(false);
      }
    };

    const release = async () => {
      try { await lock?.release(); } catch { /* already gone */ }
      lock = null;
      setPressed(false);
    };

    wakeBtn.addEventListener("click", () => {
      wanted = !wanted;
      if (wanted) acquire();
      else release();
    });

    document.addEventListener("visibilitychange", () => {
      if (wanted && document.visibilityState === "visible") acquire();
    });
  }

  registerServiceWorker();

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register(url("sw.js"), { scope: BASE }).catch(() => {});
    });
  }
})();
