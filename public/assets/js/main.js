/* Paige Thompson Portfolio: interactions and motion. No dependencies. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;

  /* ---------- Split headings into masked characters ---------- */
  function splitText(el) {
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    let ci = 0;
    const build = (node) => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const parts = child.textContent.split(/(\s+)/);
          parts.forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            // hyphenated words may wrap after the hyphen
            part.split(/(?<=-)/).forEach((piece) => {
              const word = document.createElement('span');
              word.className = 'split-word';
              for (const ch of piece) {
                const c = document.createElement('span');
                c.className = 'split-char';
                c.textContent = ch;
                c.style.setProperty('--ci', ci++);
                word.appendChild(c);
              }
              frag.appendChild(word);
            });
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const clone = child.cloneNode(false);
          clone.appendChild(build(child));
          frag.appendChild(clone);
        }
      });
      return frag;
    };
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.appendChild(build(el));
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = label;
    el.replaceChildren(sr, visual);
    el.classList.add('is-split');
  }
  $$('[data-split]').forEach(splitText);

  /* ---------- Stagger children ---------- */
  $$('[data-stagger]').forEach((group) => {
    $$(':scope > [data-reveal], :scope > * > [data-reveal]', group).forEach((el, i) => {
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', String(i * 90));
    });
  });

  /* ---------- Reveal on scroll ---------- */
  const revealTargets = $$('[data-reveal], [data-split]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Count-up stats ---------- */
  const countEls = $$('[data-count]');
  const formatNum = (n, decimals) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  function runCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const dur = 1500;
    const start = performance.now();
    const tick = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      const eased = 1 - Math.pow(2, -10 * t);
      el.textContent = formatNum(t === 1 ? target : target * eased, decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCount(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    countEls.forEach((el) => { el.textContent = formatNum(0, parseInt(el.dataset.decimals || '0', 10)); cio.observe(el); });
  }

  /* ---------- Marquee ---------- */
  $$('[data-marquee]').forEach((marquee) => {
    const track = $('.marquee__track', marquee);
    const originals = Array.from(track.children);
    originals.forEach((li) => {
      const clone = li.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      $$('img', clone).forEach((img) => { img.alt = ''; });
      track.appendChild(clone);
    });
    const setSpeed = () => {
      const half = track.scrollWidth / 2;
      marquee.style.setProperty('--marquee-dur', `${Math.max(30, half / 45)}s`);
    };
    window.addEventListener('load', setSpeed, { once: true });
    window.addEventListener('resize', setSpeed);
    setSpeed();
  });

  /* ---------- Header, progress and scroll-linked motion ---------- */
  const header = $('[data-header]');
  const progress = $('.progress span');
  const darkZones = $$('[data-header-theme="dark"]');
  const expanders = $$('[data-expand]');
  const wire = $('[data-wire]');
  const timeline = $('[data-timeline]');
  let lastY = window.scrollY;
  let ticking = false;
  let pointer = { x: 0, y: 0 };

  function onFrame() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    if (progress) progress.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

    // header state
    if (header) {
      const probe = 32;
      const overDark = darkZones.some((z) => {
        const r = z.getBoundingClientRect();
        return r.top <= probe && r.bottom >= probe;
      });
      header.classList.toggle('on-dark', overDark);
      header.classList.toggle('is-scrolled', y > 24 && !overDark);
      const navOpen = header.classList.contains('nav-open');
      const delta = y - lastY;
      if (!navOpen && y > 700 && delta > 6) header.classList.add('is-hidden');
      else if (delta < -4 || y < 700) header.classList.remove('is-hidden');
    }
    lastY = y;

    if (reduceMotion.matches) return;

    // project heroes: image grows from an inset frame to full bleed
    expanders.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = clamp((vh - r.top) / (vh * 0.85), 0, 1);
      el.style.setProperty('--p', p.toFixed(4));
    });

    // hero wireframe parallax (scroll + pointer)
    if (wire && y < vh * 1.2) {
      const tx = pointer.x * -18;
      const ty = y * 0.22 + pointer.y * -12;
      wire.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
    }

    // timeline progress line
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((vh * 0.62 - r.top) / r.height, 0, 1);
      timeline.style.setProperty('--line-p', p.toFixed(4));
    }
  }
  const requestFrame = () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } };
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  onFrame();

  const hero = $('.hero');
  if (hero && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
      requestFrame();
    });
    hero.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; requestFrame(); });
  }

  /* ---------- Project index: preview follows the cursor ---------- */
  const index = $('[data-index]');
  const preview = $('[data-index-preview]');
  if (index && preview && window.matchMedia('(hover: hover)').matches) {
    const pImg = $('img', preview);
    let target = { x: 0, y: 0 };
    let pos = { x: 0, y: 0 };
    let raf = null;
    const follow = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      preview.style.transform = `translate3d(${(pos.x + 28).toFixed(1)}px, ${(pos.y - 180).toFixed(1)}px, 0)`;
      raf = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5 ? requestAnimationFrame(follow) : null;
    };
    $$('a[data-preview]', index).forEach((a) => {
      a.addEventListener('pointerenter', (e) => {
        pImg.src = a.dataset.preview;
        if (!preview.classList.contains('is-visible')) {
          pos = { x: e.clientX, y: e.clientY };
          target = { x: e.clientX, y: e.clientY };
          preview.style.transform = `translate3d(${pos.x + 28}px, ${pos.y - 180}px, 0)`;
        }
        preview.classList.add('is-visible');
      });
    });
    index.addEventListener('pointermove', (e) => {
      target = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(follow);
    });
    index.addEventListener('pointerleave', () => preview.classList.remove('is-visible'));
    window.addEventListener('scroll', () => preview.classList.remove('is-visible'), { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  const toggle = $('.nav-toggle');
  const setNav = (open) => {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    $('.nav-toggle__label', toggle).textContent = open ? 'Close' : 'Menu';
    root.style.overflow = open ? 'hidden' : '';
    if (open) header.classList.remove('is-hidden');
  };
  if (toggle) {
    toggle.addEventListener('click', () => setNav(!header.classList.contains('nav-open')));
    $$('.site-nav a').forEach((a) => a.addEventListener('click', () => setNav(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('nav-open')) { setNav(false); toggle.focus(); } });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches) setNav(false); });
  }

  /* ---------- Active nav link ---------- */
  const navLinks = $$('.site-nav a[href^="#"]');
  const linkFor = (id) => navLinks.find((a) => a.getAttribute('href') === `#${id}`);
  const sectionMap = [
    ['about', 'about'], ['experience', 'experience'], ['drawings', 'drawings'],
    ['projects', 'projects'], ['parking-lot', 'projects'], ['eunoia', 'projects'], ['urban-backyard', 'projects'], ['kiinomaage-aki', 'projects'],
    ['graphic-design', 'graphic-design'], ['reports', 'reports'], ['contact', 'contact'],
  ];
  if ('IntersectionObserver' in window) {
    const nio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const pair = sectionMap.find(([id]) => id === entry.target.id);
        navLinks.forEach((a) => a.classList.remove('is-active'));
        const link = pair && linkFor(pair[1]);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sectionMap.forEach(([id]) => { const s = document.getElementById(id); if (s) nio.observe(s); });
    const top = document.getElementById('top');
    if (top) new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) navLinks.forEach((a) => a.classList.remove('is-active'));
    }, { rootMargin: '-45% 0px -50% 0px' }).observe(top);
  }

  /* ---------- Lightbox ---------- */
  const lb = $('[data-lightbox]');
  if (lb && typeof lb.showModal === 'function') {
    const img = $('[data-lb-img]', lb);
    const cap = $('[data-lb-cap]', lb);
    const count = $('[data-lb-count]', lb);
    const stage = $('[data-lb-stage]', lb);
    const prevBtn = $('[data-lb-prev]', lb);
    const nextBtn = $('[data-lb-next]', lb);
    const zoomBtn = $('[data-lb-zoom]', lb);
    let items = [];
    let index = 0;
    let opener = null;

    const setZoom = (on) => {
      lb.classList.toggle('is-zoomed', on);
      zoomBtn.setAttribute('aria-pressed', String(on));
      zoomBtn.textContent = on ? '−' : '+';
      zoomBtn.setAttribute('aria-label', on ? 'Fit image to screen' : 'Zoom to full size');
      if (on) requestAnimationFrame(() => {
        stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
        stage.scrollTop = 0;
      });
    };
    const show = (i) => {
      index = (i + items.length) % items.length;
      const item = items[index];
      setZoom(false);
      img.style.animation = 'none';
      void img.offsetWidth; // restart the entrance animation
      img.style.animation = '';
      img.src = item.dataset.full;
      const inner = $('img', item);
      img.alt = inner ? inner.alt : '';
      cap.textContent = item.dataset.caption || img.alt;
      count.textContent = items.length > 1 ? `${index + 1} / ${items.length}` : '';
      prevBtn.hidden = nextBtn.hidden = items.length < 2;
    };
    const open = (trigger) => {
      opener = trigger;
      const group = trigger.dataset.group;
      items = group ? $$(`.zoomable[data-group="${group}"]`) : [trigger];
      lb.showModal();
      root.style.overflow = 'hidden';
      show(items.indexOf(trigger));
      $('[data-lb-close]', lb).focus();
    };
    const close = () => { if (lb.open) lb.close(); };
    lb.addEventListener('close', () => {
      root.style.overflow = '';
      setZoom(false);
      if (opener) opener.focus({ preventScroll: true });
    });

    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('.zoomable');
      if (!trigger || trigger.closest('.rail.was-dragged')) return;
      e.preventDefault();
      open(trigger);
    });
    prevBtn.addEventListener('click', () => show(index - 1));
    nextBtn.addEventListener('click', () => show(index + 1));
    zoomBtn.addEventListener('click', () => setZoom(!lb.classList.contains('is-zoomed')));
    $('[data-lb-close]', lb).addEventListener('click', close);
    img.addEventListener('click', () => setZoom(!lb.classList.contains('is-zoomed')));
    stage.addEventListener('click', (e) => { if (e.target === stage) close(); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' && items.length > 1) show(index + 1);
      if (e.key === 'ArrowLeft' && items.length > 1) show(index - 1);
    });

    // drag to pan when zoomed
    let pan = null;
    stage.addEventListener('pointerdown', (e) => {
      if (!lb.classList.contains('is-zoomed') || e.pointerType !== 'mouse') return;
      pan = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop, moved: false };
    });
    window.addEventListener('pointermove', (e) => {
      if (!pan) return;
      const dx = e.clientX - pan.x; const dy = e.clientY - pan.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) pan.moved = true;
      stage.scrollLeft = pan.l - dx; stage.scrollTop = pan.t - dy;
    });
    window.addEventListener('pointerup', () => {
      if (pan && pan.moved) {
        const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        img.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => img.removeEventListener('click', swallow, { capture: true }), 0);
      }
      pan = null;
    });
  }

  /* ---------- Report rail ---------- */
  const rail = $('[data-rail]');
  if (rail) {
    const prev = $('[data-rail-prev]');
    const next = $('[data-rail-next]');
    const step = () => rail.clientWidth * 0.75;
    const update = () => {
      prev.disabled = rail.scrollLeft < 8;
      next.disabled = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8;
    };
    prev.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: reduceMotion.matches ? 'auto' : 'smooth' }));
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    let drag = null;
    rail.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, l: rail.scrollLeft, moved: false };
      rail.classList.remove('was-dragged');
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; rail.classList.add('is-dragging'); }
      if (drag.moved) rail.scrollLeft = drag.l - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      if (drag.moved) {
        rail.classList.add('was-dragged');
        setTimeout(() => rail.classList.remove('was-dragged'), 50);
      }
      rail.classList.remove('is-dragging');
      drag = null;
    });
    rail.addEventListener('keydown', (e) => {
      if (e.target !== rail) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });
  }

  /* ---------- Copy email + toast ---------- */
  const toast = $('[data-toast]');
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Email copied');
      } catch {
        const input = document.createElement('input');
        input.value = text; document.body.appendChild(input); input.select();
        const ok = document.execCommand && document.execCommand('copy');
        input.remove();
        showToast(ok ? 'Email copied' : text);
      }
    });
  });

  /* ---------- Footer year ---------- */
  const yearEl = $('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
