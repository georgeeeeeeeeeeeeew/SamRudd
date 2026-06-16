// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const siteNav = document.querySelector('.site-nav');
hamburger.addEventListener('click', () => siteNav.classList.toggle('open'));

const navLinks = document.querySelectorAll('[data-section]');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.section;
    if (!target) return;

    pages.forEach(p => p.classList.remove('visible'));
    document.getElementById(target).classList.add('visible');
    siteNav.classList.remove('open');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-link[data-section="${target}"]`);
    if (activeNav) activeNav.classList.add('active');

    window.scrollTo(0, 0);
  });
});

// Gallery filter
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    galleryItems.forEach(item => {
      item.classList.toggle('hidden', filter !== 'all' && item.dataset.cat !== filter);
    });
  });
});
