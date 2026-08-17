/* Shared helpers for reading content out of Sanity.

   Loaded before the page-specific scripts, which use window.SamRudd.

   Everything here builds the page with createElement and textContent rather
   than innerHTML. That is deliberate: the text comes from a CMS, and if it were
   pasted into innerHTML then anything Sam typed, or anything a stray character
   in a title did, could change the structure of the page. */

window.SamRudd = (function () {
  'use strict';

  var PROJECT = '3zrcphqr';
  var STUDIO = 'https://samrudd.sanity.studio';
  var API = 'https://' + PROJECT + '.apicdn.sanity.io/v2024-01-01/data/query/production';

  /* Is this page being shown inside the Studio's Preview panel?

     Being in an iframe is not enough on its own: anyone can embed the site, and
     that is no reason to load an editing toolkit and start asking for drafts.
     So the test is that we are framed *by the Studio*.

     Three ways of establishing that, because no single one is reliable. The URL
     parameters are only present on some navigations, ancestorOrigins does not
     exist in Firefox, and the referrer is empty once the panel navigates within
     itself. Any one of them is enough. */
  /* The Studio is reachable at <project>.sanity.studio and also embedded in
     Sanity's dashboard on sanity.io, so both count as being inside the Studio.
     Anchored at the end and requiring a dot or start before it, so a lookalike
     like notsanity.studio or sanity.io.attacker.com does not match. */
  var STUDIO_HOST = /(^|\.)sanity\.(studio|io)$/;

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return ''; }
  }

  var inPreview = (function () {
    try {
      if (window.self === window.top) return false;

      var params = new URLSearchParams(location.search);
      if (params.has('sanity-preview-pathname') ||
          params.has('sanity-preview-perspective') ||
          params.get('preview') === 'true') return true;

      var ancestors = location.ancestorOrigins;
      if (ancestors) {
        for (var i = 0; i < ancestors.length; i++) {
          if (STUDIO_HOST.test(hostOf(ancestors[i]))) return true;
        }
      }

      if (document.referrer && STUDIO_HOST.test(hostOf(document.referrer))) return true;

      return false;
    } catch (e) {
      return false;   // a frame we cannot inspect: treat as an ordinary visit
    }
  })();

  /* In the preview, responses need markers saying which field each value came
     from, which is what makes clicking the page open the right box. That needs
     Sanity's client library, so it is fetched on demand and only here. Every
     query waits on the same promise, so the first render already carries the
     markers and nothing has to be drawn twice.

     ?bundle matters: without it esm.sh serves the library as hundreds of
     separate modules, which took over twenty seconds to finish and left the
     preview blank meanwhile. Bundled it is one file. The version is pinned so
     a future release cannot quietly change either. */
  var clientReady = inPreview
    ? import('https://esm.sh/@sanity/client@8.0.0?bundle')
        .then(function (mod) {
          return mod.createClient({
            projectId: PROJECT,
            dataset: 'production',
            apiVersion: '2024-01-01',
            useCdn: false,             // a preview should never lag behind
            /* Published content, deliberately.

               Showing unpublished drafts here needs the request to be
               authenticated, and the preview is an iframe on our own domain
               calling Sanity, which is a cross-site request. Browsers do not
               send the Sanity session cookie in that position, so the request
               arrives unauthenticated and every draft query comes back empty.
               That is what left the hero blank: paintings have a fallback,
               siteSettings does not, so the hero simply had no data.

               Doing drafts properly means the Studio fetching them itself and
               passing the results into the frame, which is what Sanity's
               loaders are for and is a larger piece of work. Until then the
               preview shows the published site, which is honest and which
               always works. */
            perspective: 'published',
            stega: {enabled: true, studioUrl: STUDIO}
          });
        })
        .catch(function (e) {
          if (window.console) console.error('Preview: falling back to plain fetch', e);
          return null;
        })
    : null;

  function plainFetch(groq) {
    /* no-cache revalidates with Sanity rather than reusing whatever the browser
       has. Their CDN sends max-age=3, which is short but long enough that a
       reload straight after an edit could show the old content, and the whole
       reason for reading live is that it does not. */
    return fetch(API + '?query=' + encodeURIComponent(groq), {cache: 'no-cache'})
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (body) { return body.result; });
  }

  function query(groq) {
    if (!clientReady) return plainFetch(groq);
    return clientReady.then(function (client) {
      if (!client) return plainFetch(groq);
      return client.fetch(groq).catch(function (e) {
        if (window.console) console.warn('Preview: query failed, falling back', e);
        return plainFetch(groq);
      });
    });
  }

  /* --- Live updates, in the preview only ---------------------------------

     Anything drawn from Sanity registers how to draw itself again. A single
     subscription watches the dataset and, when anything changes, asks them all
     to redraw. Debounced, because typing produces an event per keystroke and
     redrawing on each one would be wasteful and visibly jumpy. */

  var redrawers = [];
  var redrawTimer = null;

  function onContentChange(fn) {
    if (typeof fn === 'function') redrawers.push(fn);
  }

  function redrawAll() {
    redrawers.forEach(function (fn) {
      try { fn(); } catch (e) {
        if (window.console) console.error('Preview: a section failed to redraw', e);
      }
    });
  }

  if (inPreview && clientReady) {
    clientReady.then(function (client) {
      if (!client) return;
      client
        .listen('*', {}, {includeResult: false, visibility: 'query'})
        .subscribe({
          next: function () {
            clearTimeout(redrawTimer);
            redrawTimer = setTimeout(redrawAll, 300);
          },
          error: function (e) {
            if (window.console) console.error('Preview: live updates stopped', e);
          }
        });
    });
  }

  /* Strip the invisible characters stega hides in strings.

     They are harmless in text meant for reading, and necessary there, since
     they are what makes click-to-edit work. But any value used as data rather
     than prose has to be cleaned first: two identical categories arrive as two
     different strings, so comparing or de-duplicating them silently fails. That
     is what produced nine "Coastal" filter buttons instead of one. */
  function clean(value) {
    if (typeof value !== 'string') return value;
    // Unicode tag characters, U+E0000 to U+E007F, plus a zero-width space.
    return value.replace(/[\u{E0000}-\u{E007F}\u200B]/gu, '');
  }

  /* Sanity resizes on request, so a width is just a parameter on the URL. */
  function imageUrl(url, width) {
    return url + '?w=' + width + '&q=80&auto=format';
  }

  function srcset(url, naturalWidth, steps) {
    return steps
      .filter(function (w) { return w <= naturalWidth; })
      .concat(naturalWidth < steps[0] ? [naturalWidth] : [])
      .map(function (w) { return imageUrl(url, w) + ' ' + w + 'w'; })
      .join(', ');
  }

  /* --- Rich text ---------------------------------------------------------

     Sanity stores formatted text as structured data, not HTML: a list of
     blocks, each with spans that carry marks like bold or a link. This walks
     that structure and builds real elements. Only the formatting the schema
     actually offers is handled; anything unrecognised falls back to plain
     text rather than being dropped silently. */

  function renderSpans(parent, block) {
    var links = {};
    (block.markDefs || []).forEach(function (def) { links[def._key] = def; });

    (block.children || []).forEach(function (span) {
      var node = document.createTextNode(span.text || '');
      var marks = span.marks || [];

      // Wrap innermost first, so bold inside a link nests correctly.
      marks.forEach(function (mark) {
        var wrapper;
        if (mark === 'strong') wrapper = document.createElement('strong');
        else if (mark === 'em') wrapper = document.createElement('em');
        else if (links[mark] && links[mark]._type === 'link' && links[mark].href) {
          wrapper = document.createElement('a');
          wrapper.className = 'link';
          wrapper.href = links[mark].href;
          if (!/^(\/|#|mailto:)/.test(links[mark].href)) {
            wrapper.target = '_blank';
            wrapper.rel = 'noopener';
          }
        }
        if (wrapper) {
          wrapper.appendChild(node);
          node = wrapper;
        }
      });

      parent.appendChild(node);
    });
  }

  function renderRichText(blocks, into) {
    if (!blocks || !blocks.length) return false;
    var list = null;

    blocks.forEach(function (block) {
      if (block._type !== 'block') return;

      if (block.listItem === 'bullet') {
        if (!list) {
          list = document.createElement('ul');
          list.className = 'prose-list';
          into.appendChild(list);
        }
        var li = document.createElement('li');
        renderSpans(li, block);
        list.appendChild(li);
        return;
      }

      list = null;
      var el = document.createElement(block.style === 'h2' ? 'h2' : 'p');
      renderSpans(el, block);
      into.appendChild(el);
    });

    return true;
  }

  /* --- Small helpers ----------------------------------------------------- */

  /** Set an element's text, leaving the existing text if there is nothing new. */
  function setText(selector, value, root) {
    var el = (root || document).querySelector(selector);
    if (el && value) el.textContent = value;
    return el;
  }

  /** A plain sentence when a page has nothing on it yet. */
  function emptyState(into, message) {
    var p = document.createElement('p');
    p.className = 'lede';
    p.textContent = message;
    into.appendChild(p);
  }

  /** Says something useful when Sanity cannot be reached. */
  function loadFailed(into, what) {
    var p = document.createElement('p');
    p.className = 'lede';
    p.appendChild(document.createTextNode('The ' + what + ' could not be loaded just now. Please refresh, or '));
    var a = document.createElement('a');
    a.className = 'link';
    a.href = 'contact.html';
    a.textContent = 'get in touch';
    p.appendChild(a);
    p.appendChild(document.createTextNode('.'));
    into.appendChild(p);
  }

  /** "12 March 2026", or a year when that is all we have. */
  function formatDate(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'});
  }

  /** "12 to 30 March 2026", collapsing the parts that repeat. */
  function formatRange(start, end) {
    if (!start) return '';
    if (!end || end === start) return formatDate(start);
    var a = new Date(start);
    var b = new Date(end);
    if (isNaN(a) || isNaN(b)) return formatDate(start);
    var sameYear = a.getFullYear() === b.getFullYear();
    var sameMonth = sameYear && a.getMonth() === b.getMonth();
    var from = sameMonth
      ? a.getDate()
      : a.toLocaleDateString('en-GB', sameYear
          ? {day: 'numeric', month: 'long'}
          : {day: 'numeric', month: 'long', year: 'numeric'});
    return from + ' to ' + formatDate(end);
  }

  return {
    inPreview: inPreview,
    query: query,
    clean: clean,
    onContentChange: onContentChange,
    imageUrl: imageUrl,
    srcset: srcset,
    renderRichText: renderRichText,
    setText: setText,
    emptyState: emptyState,
    loadFailed: loadFailed,
    formatDate: formatDate,
    formatRange: formatRange
  };
})();
