/* Shared helpers for reading content out of Sanity.

   Loaded before the page-specific scripts, which use window.SamRudd.

   Everything here builds the page with createElement and textContent rather
   than innerHTML. That is deliberate: the text comes from a CMS, and if it were
   pasted into innerHTML then anything Sam typed, or anything a stray character
   in a title did, could change the structure of the page. */

window.SamRudd = (function () {
  'use strict';

  var PROJECT = '3zrcphqr';
  var API = 'https://' + PROJECT + '.apicdn.sanity.io/v2024-01-01/data/query/production';

  function query(groq) {
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
    query: query,
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
