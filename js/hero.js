/* Fills in the home page hero from Sanity.

   The hero used to be written into index.html by a build script, which meant it
   was there the instant the page arrived. Reading it live is the trade for
   edits appearing without a rebuild, and the cost is that the painting cannot
   be in the HTML any more.

   Two things keep that from being a visible regression:

     - the markup below reserves the hero's full height before anything loads,
       so the page never jumps
     - Sanity ships a tiny blurred copy of every image (its "lqip"), inlined as
       text in the same response as the painting details. That is painted first,
       so the space is filled with a soft version of the actual painting rather
       than an empty rectangle, and the real file fades in over it.

   If the request fails the hero keeps whatever is already in the HTML, which is
   a plain heading on the paper background. Not pretty, but not broken. */

(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  var PROJECT = '3zrcphqr';
  var API = 'https://' + PROJECT + '.apicdn.sanity.io/v2024-01-01/data/query/production';

  var GROQ =
    '*[_id=="siteSettings"][0]{heroHeadingLine1,heroHeadingLine2,heroTagline,' +
    '"painting":hero->{title,alt,' +
    '"url":photo.asset->url,' +
    '"width":photo.asset->metadata.dimensions.width,' +
    '"height":photo.asset->metadata.dimensions.height,' +
    '"lqip":photo.asset->metadata.lqip}}';

  var STEPS = [800, 1200, 1600, 2000, 2560];

  function srcset(p) {
    return STEPS.filter(function (w) { return w <= p.width; })
      .concat(p.width < 800 ? [p.width] : [])
      .map(function (w) { return p.url + '?w=' + w + '&q=80&auto=format ' + w + 'w'; })
      .join(', ');
  }

  function text(selector, value) {
    var el = hero.querySelector(selector);
    if (el && value) el.textContent = value;
  }

  var fetchHero = (window.SamRudd && window.SamRudd.query)
    ? window.SamRudd.query(GROQ)
    : fetch(API + '?query=' + encodeURIComponent(GROQ), {cache: 'no-cache'})
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (body) { return body.result; });

  fetchHero
    .then(function (s) {
      if (!s) return;

      var heading = hero.querySelector('.hero__title');
      if (heading && s.heroHeadingLine1) {
        heading.textContent = '';
        heading.appendChild(document.createTextNode(s.heroHeadingLine1));
        if (s.heroHeadingLine2) {
          heading.appendChild(document.createElement('br'));
          heading.appendChild(document.createTextNode(s.heroHeadingLine2));
        }
      }
      text('.hero__tagline', s.heroTagline);

      var p = s.painting;
      if (!p || !p.url) return;
      text('.hero__caption', p.title);

      var media = hero.querySelector('.hero__media');
      if (!media) return;

      if (p.lqip) media.style.background = 'url(' + p.lqip + ') center / cover no-repeat';

      var img = document.createElement('img');
      img.src = p.url + '?w=1600&q=80&auto=format';
      img.srcset = srcset(p);
      img.sizes = '100vw';
      img.alt = p.alt || p.title || '';
      img.width = p.width;
      img.height = p.height;
      img.decoding = 'async';
      img.setAttribute('fetchpriority', 'high');
      img.dataset.loaded = 'false';
      img.addEventListener('load', function () { img.dataset.loaded = 'true'; });
      img.addEventListener('error', function () { img.dataset.loaded = 'true'; });

      var picture = document.createElement('picture');
      picture.appendChild(img);
      media.insertBefore(picture, media.firstChild);
    })
    .catch(function (error) {
      if (window.console) console.error('Could not load the hero from Sanity:', error);
    });
})();
