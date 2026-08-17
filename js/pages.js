/* Fills in the pages that are writing rather than paintings: About, Studio,
   Exhibitions, Courses, Contact, and the two text sections on the home page.

   Each page marks what it wants with a data attribute, so this one file serves
   all of them and a page that asks for nothing does nothing.

   The headings and opening lines are already in the HTML, holding the current
   wording. They are replaced when Sanity answers, so a slow or failed request
   leaves a readable page rather than an empty one. */

(function () {
  'use strict';

  var S = window.SamRudd;
  if (!S) return;

  var page = document.body.dataset.page;
  if (!page) return;

  /* --- Page headers ------------------------------------------------------

     Every page's eyebrow, heading and opening line come from a document of its
     own, so the wording at the top of a page is editable in the same place as
     the wording in it. Pages that are only a header, Paintings, Exhibitions and
     Courses, use the same document type with an empty body. */

  function applyHeader(doc) {
    if (!doc) return;
    S.setText('[data-page-eyebrow]', doc.eyebrow);
    S.setText('[data-page-heading]', doc.heading);
    S.setText('[data-page-lede]', doc.lede);
  }

  function renderHeaderOnly(id) {
    S.query('*[_id=="' + id + '"][0]{eyebrow,heading,lede}')
      .then(applyHeader)
      .catch(function (e) {
        if (window.console) console.error('Could not load ' + id + ':', e);
      });
  }

  /* --- About and Studio -------------------------------------------------- */

  function renderProsePage(id) {
    var body = document.querySelector('[data-page-body]');
    var groq = '*[_id=="' + id + '"][0]{eyebrow,heading,lede,body,imageAlt,' +
      '"imageUrl":image.asset->url,' +
      '"imageWidth":image.asset->metadata.dimensions.width,' +
      '"imageHeight":image.asset->metadata.dimensions.height}';

    S.query(groq)
      .then(function (doc) {
        if (!doc) return;
        applyHeader(doc);

        if (body) {
          body.textContent = '';
          if (!S.renderRichText(doc.body, body) && page === 'studio') {
            S.emptyState(body, 'There is nothing here yet. Please check back soon.');
          }
        }

        // A photograph on the page replaces the painting standing in for one.
        if (doc.imageUrl) {
          var img = document.querySelector('[data-page-image] img');
          if (img) {
            img.src = S.imageUrl(doc.imageUrl, 900);
            img.srcset = S.srcset(doc.imageUrl, doc.imageWidth, [400, 600, 900, 1200]);
            img.alt = doc.imageAlt || '';
            img.width = doc.imageWidth;
            img.height = doc.imageHeight;
          }
        }
      })
      .catch(function (e) {
        if (body) S.loadFailed(body, 'page');
        if (window.console) console.error('Could not load ' + id + ':', e);
      });
  }

  /* --- Exhibitions ------------------------------------------------------- */

  function renderExhibitions() {
    var into = document.querySelector('[data-exhibitions]');
    if (!into) return;

    var groq = '*[_type=="exhibition" && draft != true]|order(startDate desc)' +
      '{title,venue,location,startDate,endDate,url,note}';

    S.query(groq)
      .then(function (rows) {
        into.textContent = '';
        if (!rows || !rows.length) {
          S.emptyState(into, 'There are no exhibitions listed at the moment. Please check back soon.');
          return;
        }

        // Today at midnight, so a show ending today still counts as on.
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var upcoming = [];
        var past = [];
        rows.forEach(function (row) {
          var ends = new Date(row.endDate || row.startDate);
          (isNaN(ends) || ends >= today ? upcoming : past).push(row);
        });
        // Soonest first among those still to come; most recent first for the rest.
        upcoming.reverse();

        if (upcoming.length) section('Current and upcoming', upcoming);
        if (past.length) section('Past exhibitions', past);

        function section(title, items) {
          var h = document.createElement('h2');
          h.className = 'listing-heading';
          h.textContent = title;
          into.appendChild(h);

          var ul = document.createElement('ul');
          ul.className = 'listing';
          items.forEach(function (row) { ul.appendChild(exhibitionItem(row)); });
          into.appendChild(ul);
        }
      })
      .catch(function (e) {
        into.textContent = '';
        S.loadFailed(into, 'exhibitions');
        if (window.console) console.error('Could not load exhibitions:', e);
      });
  }

  function exhibitionItem(row) {
    var li = document.createElement('li');
    li.className = 'listing__item';

    var when = document.createElement('p');
    when.className = 'listing__date';
    when.textContent = S.formatRange(row.startDate, row.endDate);
    li.appendChild(when);

    var body = document.createElement('div');

    var h = document.createElement('h3');
    h.className = 'listing__title';
    if (row.url) {
      var a = document.createElement('a');
      a.className = 'link';
      a.href = row.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = row.title;
      h.appendChild(a);
    } else {
      h.textContent = row.title;
    }
    body.appendChild(h);

    var where = [row.venue, row.location].filter(Boolean).join(', ');
    if (where) {
      var p = document.createElement('p');
      p.className = 'listing__meta';
      p.textContent = where;
      body.appendChild(p);
    }

    if (row.note) {
      var note = document.createElement('p');
      note.className = 'listing__note';
      note.textContent = row.note;
      body.appendChild(note);
    }

    li.appendChild(body);
    return li;
  }

  /* --- Courses ----------------------------------------------------------- */

  function renderCourses() {
    var into = document.querySelector('[data-courses]');
    if (!into) return;

    var groq = '*[_type=="course" && draft != true]|order(startDate asc)' +
      '{title,startDate,endDate,location,price,description,bookingUrl,soldOut}';

    S.query(groq)
      .then(function (rows) {
        into.textContent = '';

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        // A course that has already run is no use to anyone reading the page.
        var open = (rows || []).filter(function (r) {
          var ends = new Date(r.endDate || r.startDate);
          return isNaN(ends) || ends >= today;
        });

        if (!open.length) {
          S.emptyState(into, 'There are no courses scheduled at the moment. Please check back soon.');
          return;
        }

        var ul = document.createElement('ul');
        ul.className = 'listing';
        open.forEach(function (row) { ul.appendChild(courseItem(row)); });
        into.appendChild(ul);
      })
      .catch(function (e) {
        into.textContent = '';
        S.loadFailed(into, 'courses');
        if (window.console) console.error('Could not load courses:', e);
      });
  }

  function courseItem(row) {
    var li = document.createElement('li');
    li.className = 'listing__item';

    var when = document.createElement('p');
    when.className = 'listing__date';
    when.textContent = S.formatRange(row.startDate, row.endDate);
    li.appendChild(when);

    var body = document.createElement('div');

    var h = document.createElement('h3');
    h.className = 'listing__title';
    h.textContent = row.title;
    body.appendChild(h);

    var meta = [row.location, row.price].filter(Boolean).join(' · ');
    if (meta) {
      var p = document.createElement('p');
      p.className = 'listing__meta';
      p.textContent = meta;
      body.appendChild(p);
    }

    if (row.description && row.description.length) {
      var prose = document.createElement('div');
      prose.className = 'listing__note';
      S.renderRichText(row.description, prose);
      body.appendChild(prose);
    }

    if (row.soldOut) {
      var full = document.createElement('p');
      full.className = 'listing__flag';
      full.textContent = 'Fully booked';
      body.appendChild(full);
    } else if (row.bookingUrl) {
      var book = document.createElement('p');
      book.style.marginTop = 'var(--space-2)';
      var a = document.createElement('a');
      a.className = 'link-arrow';
      a.href = row.bookingUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = window.SamRuddBookLabel || 'Book a place';
      book.appendChild(a);
      body.appendChild(book);
    }

    li.appendChild(body);
    return li;
  }

  /* --- Contact ----------------------------------------------------------- */

  function renderContact() {
    var groq = '*[_id=="contactDetails"][0]{eyebrow,heading,lede,email,location,instagramUrl,galleryNote}';

    S.query(groq)
      .then(function (doc) {
        if (!doc) return;
        applyHeader(doc);
        S.setText('[data-contact-location]', doc.location);
        S.setText('[data-contact-note]', doc.galleryNote);

        if (doc.email) {
          document.querySelectorAll('[data-contact-email]').forEach(function (a) {
            a.href = 'mailto:' + doc.email;
            // The footer link says "Email directly"; only the address itself
            // should be rewritten.
            if (a.dataset.contactEmail === 'text') a.textContent = doc.email;
          });
          // The enquiry form falls back to the visitor's email app.
          if (window.SamRuddContact) window.SamRuddContact.setEmail(doc.email);
        }

        var ig = document.querySelector('[data-contact-instagram]');
        if (ig && doc.instagramUrl) ig.href = doc.instagramUrl;
      })
      .catch(function (e) {
        if (window.console) console.error('Could not load contact details:', e);
      });
  }

  /* --- Home page sections ------------------------------------------------ */

  function renderHomeSections() {
    var groq = '*[_id=="siteSettings"][0]{featuredEyebrow,featuredHeading,featuredIntro,' +
      'aboutEyebrow,aboutHeading,aboutLede,aboutBody,' +
      '"aboutImage":aboutImage->{alt,title,"url":photo.asset->url,' +
      '"width":photo.asset->metadata.dimensions.width,' +
      '"height":photo.asset->metadata.dimensions.height}}';

    S.query(groq)
      .then(function (s) {
        if (!s) return;
        S.setText('[data-featured-eyebrow]', s.featuredEyebrow);
        S.setText('[data-featured-heading]', s.featuredHeading);
        S.setText('[data-featured-intro]', s.featuredIntro);
        S.setText('[data-about-eyebrow]', s.aboutEyebrow);
        S.setText('[data-about-heading]', s.aboutHeading);
        S.setText('[data-about-lede]', s.aboutLede);
        S.setText('[data-about-body]', s.aboutBody);

        var img = document.querySelector('[data-about-image] img');
        if (img && s.aboutImage && s.aboutImage.url) {
          img.src = S.imageUrl(s.aboutImage.url, 600);
          img.srcset = S.srcset(s.aboutImage.url, s.aboutImage.width, [400, 600, 900]);
          img.alt = s.aboutImage.alt || s.aboutImage.title || '';
          img.width = s.aboutImage.width;
          img.height = s.aboutImage.height;
        }
      })
      .catch(function (e) {
        if (window.console) console.error('Could not load the home page sections:', e);
      });
  }

  /* --- Footer and button wording, on every page --------------------------- */

  /* Maps the data-label on an element to the field holding its wording. The
     words stay in the HTML as well, so a slow or failed request leaves real
     buttons rather than empty ones. */
  var LABEL_FIELDS = {
    viewGallery: 'labelViewGallery',
    moreAbout: 'labelMoreAbout',
    contact: 'labelContact',
    emailDirect: 'labelEmailDirect',
    showMore: 'labelShowMore',
    sendEnquiry: 'labelSendEnquiry',
    goToGallery: 'labelGoToGallery',
    bookPlace: 'labelBookPlace'
  };

  function renderFooter() {
    var fields = Object.keys(LABEL_FIELDS).map(function (k) { return LABEL_FIELDS[k]; });
    S.query('*[_id=="siteSettings"][0]{footerHeading,footerNote,footerTagline,' +
            fields.join(',') + '}')
      .then(function (s) {
        if (!s) return;
        S.setText('[data-footer-heading]', s.footerHeading);
        S.setText('[data-footer-note]', s.footerNote);
        S.setText('[data-footer-tagline]', s.footerTagline);

        // One field can drive several elements: "Contact Sam" is in every footer.
        Object.keys(LABEL_FIELDS).forEach(function (key) {
          var value = s[LABEL_FIELDS[key]];
          if (!value) return;
          document.querySelectorAll('[data-label="' + key + '"]').forEach(function (el) {
            el.textContent = value;
          });
        });

        // The gallery's show-more button rewrites its own text as it pages, so
        // it needs to know the chosen wording rather than the built-in default.
        if (s.labelShowMore) window.SamRuddShowMoreLabel = s.labelShowMore;
        if (s.labelBookPlace) window.SamRuddBookLabel = s.labelBookPlace;
      })
      .catch(function () { /* the HTML already says something sensible */ });
  }

  var routes = {
    home: renderHomeSections,
    about: function () { renderProsePage('page-about'); },
    studio: function () { renderProsePage('page-studio'); },
    paintings: function () { renderHeaderOnly('page-paintings'); },
    exhibitions: function () { renderHeaderOnly('page-exhibitions'); renderExhibitions(); },
    courses: function () { renderHeaderOnly('page-courses'); renderCourses(); },
    contact: renderContact
  };

  function drawEverything() {
    if (routes[page]) routes[page]();
    renderFooter();
  }

  drawEverything();

  // In the preview, redraw whenever Sam changes anything.
  if (S.onContentChange) S.onContentChange(drawEverything);
})();
