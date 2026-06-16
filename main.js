const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = link.dataset.section;
    if (!target) return;

    pages.forEach(p => p.classList.remove('visible'));
    document.getElementById(target).classList.add('visible');

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    window.scrollTo(0, 0);
  });
});
