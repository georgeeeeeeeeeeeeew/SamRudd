/* Renders painting cards from content/gallery.json and runs the lightbox.
   Used by both the home page (featured works) and the gallery page.

   The paintings live in a JSON file rather than in this script so that the CMS
   can edit them. One consequence: the page must be served over http, because a
   browser refuses to fetch a local file from a page opened with file://. Use
   the dev server (see README) rather than double-clicking index.html. */

(function () {
  'use strict';

  var BASE = 'images/paintings/';
  var DATA = 'content/gallery.json';

  function srcset(p, ext) {
    return p.widths
      .map(function (w) {
        return BASE + p.slug + '/' + p.slug + '-' + w + '.' + ext + ' ' + w + 'w';
      })
      .join(', ');
  }

  function fallbackSrc(p) {
    var w = p.widths[Math.min(1, p.widths.length - 1)];
    return BASE + p.slug + '/' + p.slug + '-' + w + '.jpg';
  }

  function subtitle(p) {
    return [p.year, p.medium].filter(Boolean).join(' · ');
  }

  function details(p) {
    return [p.medium, p.dimensions, p.year].filter(Boolean).join(' · ');
  }

  /* Build a <picture> for one painting. `sizes` tells the browser how wide the
     image will render, so it can pick the smallest file that still looks sharp. */
  function buildPicture(p, sizes, eager) {
    var picture = document.createElement('picture');

    var webp = document.createElement('source');
    webp.type = 'image/webp';
    webp.srcset = srcset(p, 'webp');
    webp.sizes = sizes;
    picture.appendChild(webp);

    var img = document.createElement('img');
    img.src = fallbackSrc(p);
    img.srcset = srcset(p, 'jpg');
    img.sizes = sizes;
    img.alt = p.alt;
    img.width = p.width;
    img.height = p.height;
    img.decoding = 'async';

    if (eager) {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
    } else {
      img.loading = 'lazy';
      img.dataset.loaded = 'false';
      if (img.complete) {
        img.dataset.loaded = 'true';
      } else {
        img.addEventListener('load', function () {
          img.dataset.loaded = 'true';
        });
        // A broken file shouldn't leave a permanently invisible slot.
        img.addEventListener('error', function () {
          img.dataset.loaded = 'true';
        });
      }
    }

    picture.appendChild(img);
    return picture;
  }

  function buildCard(p, index, sizes) {
    var li = document.createElement('li');

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'artwork';
    button.dataset.index = String(index);
    button.setAttribute('aria-label', 'View ' + p.title + ' larger');

    var frame = document.createElement('div');
    frame.className = 'artwork__frame';
    frame.appendChild(buildPicture(p, sizes, index < 2));
    button.appendChild(frame);

    var meta = document.createElement('div');
    meta.className = 'artwork__meta';

    var title = document.createElement('span');
    title.className = 'artwork__title';
    title.textContent = p.title;
    meta.appendChild(title);

    // Year/medium are often not known yet, so only add the line if there is one.
    var subText = subtitle(p);
    if (subText) {
      var sub = document.createElement('span');
      sub.className = 'artwork__sub';
      sub.textContent = subText;
      meta.appendChild(sub);
    }

    button.appendChild(meta);
    li.appendChild(button);
    return li;
  }

  /* --- Lightbox ---------------------------------------------------------- */

  /* One instance per page, created once. Rebuilding it whenever the grid
     changes would leave orphaned dialogs in the DOM and, worse, add another
     document keydown listener every time, so Escape would eventually fire on
     a stack of dead lightboxes. setItems swaps the contents instead. */
  function Lightbox() {
    var items = [];
    var root = document.createElement('div');
    root.className = 'lightbox';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Artwork viewer');
    root.innerHTML =
      '<div class="lightbox__stage">' +
      '<p class="lightbox__counter" aria-hidden="true"></p>' +
      '<button type="button" class="lightbox__btn lightbox__close" aria-label="Close viewer">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<button type="button" class="lightbox__btn lightbox__prev" aria-label="Previous artwork">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button type="button" class="lightbox__btn lightbox__next" aria-label="Next artwork">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      '</div>' +
      '<div class="lightbox__caption">' +
      '<h2 class="lightbox__title"></h2>' +
      '<p class="lightbox__details"></p>' +
      '</div>' +
      '<p class="visually-hidden" role="status" aria-live="polite"></p>';
    document.body.appendChild(root);

    var stage = root.querySelector('.lightbox__stage');
    var titleEl = root.querySelector('.lightbox__title');
    var detailsEl = root.querySelector('.lightbox__details');
    var counterEl = root.querySelector('.lightbox__counter');
    var liveEl = root.querySelector('[role="status"]');
    var closeBtn = root.querySelector('.lightbox__close');
    var prevBtn = root.querySelector('.lightbox__prev');
    var nextBtn = root.querySelector('.lightbox__next');
    var picture = null;
    var current = -1;
    var lastFocused = null;

    function render(index) {
      var p = items[index];
      if (!p) return;
      current = index;

      if (picture) picture.remove();
      picture = buildPicture(p, '100vw', true);
      stage.appendChild(picture);

      titleEl.textContent = p.title;
      detailsEl.textContent = details(p);
      detailsEl.hidden = !detailsEl.textContent;
      counterEl.textContent = index + 1 + ' / ' + items.length;
      liveEl.textContent = p.title + ', image ' + (index + 1) + ' of ' + items.length;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === items.length - 1;

      if (history.replaceState) {
        history.replaceState(null, '', '#painting=' + p.slug);
      }
    }

    function open(index, trigger) {
      lastFocused = trigger || document.activeElement;
      render(index);
      root.dataset.open = 'true';
      document.body.dataset.lightboxOpen = 'true';
      closeBtn.focus();
    }

    function close() {
      root.dataset.open = 'false';
      delete document.body.dataset.lightboxOpen;
      current = -1;
      if (history.replaceState) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    }

    function step(delta) {
      var next = current + delta;
      if (next >= 0 && next < items.length) render(next);
    }

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { step(-1); });
    nextBtn.addEventListener('click', function () { step(1); });

    // Clicking the backdrop (but not the artwork itself) closes.
    root.addEventListener('click', function (event) {
      if (event.target === root || event.target === stage) close();
    });

    document.addEventListener('keydown', function (event) {
      if (root.dataset.open !== 'true') return;
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'ArrowLeft') { step(-1); return; }
      if (event.key === 'ArrowRight') { step(1); return; }
      if (event.key !== 'Tab') return;

      // Keep focus inside the dialog while it is open.
      var focusables = Array.prototype.filter.call(
        root.querySelectorAll('button:not([disabled])'),
        function (el) { return el.offsetParent !== null; }
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    function setItems(next) {
      items = next;
    }

    return { open: open, setItems: setItems };
  }

  /* --- Wire up ----------------------------------------------------------- */

  function failed(grid, reason) {
    // Better a plain sentence and a way to reach Sam than an empty page.
    var p = document.createElement('p');
    p.className = 'lede';
    p.innerHTML =
      'The paintings could not be loaded just now. Please refresh, or ' +
      '<a class="link" href="contact.html">get in touch</a> and Sam will gladly send images of the current work.';
    grid.parentNode.insertBefore(p, grid.nextSibling);
    if (window.console) console.error('Could not load ' + DATA + ':', reason);
  }

  /* How many cards to add each time. Drawing several hundred at once is slow
     on a phone even with the images lazy-loaded, because every card is still
     DOM the browser has to lay out. */
  var PAGE_SIZE = 24;

  function render(grid, paintings) {
    var all = paintings.slice();

    var limit = parseInt(grid.dataset.limit, 10);
    if (!isNaN(limit)) all = all.slice(0, limit);

    // Past 82rem the page stops widening, so the last value is a fixed px cap
    // rather than a vw fraction that would keep over-requesting.
    var sizes = grid.dataset.sizes ||
      '(max-width: 37.5rem) 92vw, (max-width: 62rem) 46vw, (max-width: 82rem) 31vw, 380px';

    var paged = grid.dataset.paged === 'true';
    var moreBtn = document.querySelector('[data-gallery-more]');
    var countEl = document.querySelector('[data-gallery-count]');
    var filterBar = document.querySelector('[data-gallery-filters]');

    var visible = [];      // what is currently in the grid, in order
    var lightbox = Lightbox();
    var activeSeries = 'all';

    function matching() {
      if (activeSeries === 'all') return all;
      return all.filter(function (p) { return p.series === activeSeries; });
    }

    function appendCards(from, list) {
      var fragment = document.createDocumentFragment();
      var upto = paged ? Math.min(from + PAGE_SIZE, list.length) : list.length;
      for (var i = from; i < upto; i++) {
        fragment.appendChild(buildCard(list[i], i, sizes));
        visible.push(list[i]);
      }
      grid.appendChild(fragment);
      return upto;
    }

    function updateChrome(shown, total) {
      if (moreBtn) {
        moreBtn.hidden = shown >= total;
        moreBtn.textContent = 'Show more paintings';
      }
      if (countEl) {
        countEl.textContent = shown >= total
          ? 'Showing all ' + total + (total === 1 ? ' painting' : ' paintings')
          : 'Showing ' + shown + ' of ' + total + ' paintings';
      }
    }

    function draw() {
      var list = matching();
      grid.textContent = '';
      visible = [];
      var shown = appendCards(0, list);
      lightbox.setItems(visible);
      updateChrome(shown, list.length);
    }

    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        var list = matching();
        var shown = appendCards(visible.length, list);
        // The viewer needs to know about the newly added works too.
        lightbox.setItems(visible);
        updateChrome(shown, list.length);
        // Move focus to the first new card so keyboard users are not dropped
        // back at the top of the page.
        var firstNew = grid.children[shown - Math.min(PAGE_SIZE, shown)];
        if (firstNew) {
          var btn = firstNew.querySelector('.artwork');
          if (btn) btn.focus();
        }
      });
    }

    if (filterBar) {
      var series = [];
      all.forEach(function (p) {
        if (p.series && series.indexOf(p.series) === -1) series.push(p.series);
      });

      // One group is not a choice, so only offer filters when there are two.
      if (series.length > 1) {
        filterBar.hidden = false;
        ['all'].concat(series).forEach(function (name) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'filter-btn';
          btn.textContent = name === 'all' ? 'All' : name;
          btn.setAttribute('aria-pressed', String(name === 'all'));
          btn.addEventListener('click', function () {
            activeSeries = name;
            filterBar.querySelectorAll('.filter-btn').forEach(function (b) {
              b.setAttribute('aria-pressed', String(b === btn));
            });
            draw();
          });
          filterBar.appendChild(btn);
        });
      }
    }

    draw();

    grid.addEventListener('click', function (event) {
      var card = event.target.closest('.artwork');
      if (card) lightbox.open(Number(card.dataset.index), card);
    });

    // Shared links like paintings.html#painting=blue-boats open that work
    // directly. The painting may sit beyond the first page, so keep adding
    // pages until it is present rather than silently doing nothing.
    var match = /#painting=([\w-]+)/.exec(location.hash);
    if (match) {
      var list = matching();
      var target = list.findIndex(function (p) { return p.slug === match[1]; });
      if (target > -1) {
        while (visible.length <= target && visible.length < list.length) {
          appendCards(visible.length, list);
        }
        lightbox.setItems(visible);
        updateChrome(visible.length, list.length);
        lightbox.open(target, null);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.querySelector('[data-gallery]');
    if (!grid) return;

    // The home page reads a much smaller file holding only the paintings it
    // shows, so it does not download the whole collection to display six.
    DATA = grid.dataset.src || DATA;

    fetch(DATA, { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        var paintings = (data && data.paintings) || [];
        if (!paintings.length) throw new Error('no paintings in ' + DATA);
        render(grid, paintings);
      })
      .catch(function (error) {
        failed(grid, error);
      });
  });
})();
