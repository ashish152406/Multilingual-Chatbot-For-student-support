// script.js - slider + small interactions for the replica page
(() => {
  const $ = (s, ctx=document) => ctx.querySelector(s);
  const $$ = (s, ctx=document) => Array.from((ctx||document).querySelectorAll(s));

  // year
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Hero slider basic
  const slider = document.querySelector('.hero-slider');
  if(slider){
    const slidesWrap = slider.querySelector('.slides');
    const slides = slider.querySelectorAll('.slide');
    const prev = slider.querySelector('.slide-nav.prev');
    const next = slider.querySelector('.slide-nav.next');
    let idx = 0;
    const total = slides.length;

    function go(i){
      idx = (i + total) % total;
      slidesWrap.style.transform = `translateX(-${idx * 100}%)`;
      slides.forEach((s, j) => s.classList.toggle('active', j === idx));
    }

    prev.addEventListener('click', () => go(idx - 1));
    next.addEventListener('click', () => go(idx + 1));

    // auto-advance
    let timer = setInterval(() => go(idx + 1), 6000);
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', () => timer = setInterval(() => go(idx + 1), 6000));
    // init
    go(0);
  }

  // simple keyboard focus improvements
  document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft') {
      const prev = document.querySelector('.slide-nav.prev');
      if(prev) prev.click();
    } else if(e.key === 'ArrowRight') {
      const next = document.querySelector('.slide-nav.next');
      if(next) next.click();
    }
  });

  // accessible skip links: not present in UI, but ensure tab order is good
  // nothing else required for demo

})();
// === Campus Sahayak Embed Logic ===
const csLauncher = document.getElementById("cs-launcher");
const csOverlay = document.getElementById("cs-overlay");
const csCloseBtn = document.getElementById("cs-close-btn");

if (csLauncher && csOverlay && csCloseBtn) {
  csLauncher.addEventListener("click", () => {
    csOverlay.style.display = "flex";
  });

  csCloseBtn.addEventListener("click", () => {
    csOverlay.style.display = "none";
  });

  // Optional: close when user clicks outside chatbot box
  csOverlay.addEventListener("click", (e) => {
    if (e.target === csOverlay) {
      csOverlay.style.display = "none";
    }
  });
}
