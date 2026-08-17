/* Click-to-edit overlays, loaded only inside Sanity's Preview panel.

   Ordinary visitors never run any of this. `SamRudd.inPreview` is false for
   them and the file exits immediately, so the public site downloads nothing
   extra. That matters: the overlay bundle is a few hundred kilobytes from a
   CDN, which would be an absurd thing to inflict on someone looking at
   paintings.

   The clickable outlines come from markers hidden in the text itself, added by
   the stega-enabled client in content.js, so nothing on the page has to be
   annotated by hand. Anything already rendered from Sanity becomes editable on
   its own.

   ?bundle and a pinned version, for the same reason as in content.js: the
   unbundled form arrives as hundreds of requests. This is the larger of the
   two at roughly 770KB, which is fine for an editing tool nobody but Sam
   loads, and unthinkable for a visitor. */

(function () {
  'use strict';

  if (!window.SamRudd || !window.SamRudd.inPreview) return;

  document.documentElement.dataset.sanityPreview = 'true';

  import('https://esm.sh/@sanity/visual-editing-standalone@2.0.1?bundle')
    .then(function (mod) {
      var enable = mod.enableVisualEditing || mod.default;
      if (typeof enable !== 'function') {
        if (window.console) console.warn('Preview: no enableVisualEditing export found');
        return;
      }
      enable();
      if (window.console) console.info('Preview: click-to-edit is on');
    })
    .catch(function (e) {
      if (window.console) console.error('Preview: could not load the overlays', e);
    });
})();
