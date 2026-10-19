(function(){
  "use strict";
  var html = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reducedMotion;
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') gsap.registerPlugin(ScrollTrigger);
  if (hasGsap) html.classList.add('has-gsap');

  var REGION_KEY = 'watthaus_region';
  function saveRegion(v){ try { localStorage.setItem(REGION_KEY, v); } catch (e) {} }
  function readRegion(){ try { return localStorage.getItem(REGION_KEY); } catch (e) { return null; } }

  var overlay = document.getElementById('overlayMenu');

  /* ---------- mobile overlay menu ---------- */
  try {
    var toggle = document.getElementById('menuToggle');
    var closeBtn = document.getElementById('overlayClose');
    if (toggle && closeBtn && overlay){
      function openMenu(){ overlay.classList.add('open'); toggle.setAttribute('aria-expanded','true'); }
      function closeMenu(){ overlay.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); }
      toggle.addEventListener('click', openMenu);
      closeBtn.addEventListener('click', closeMenu);
      overlay.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMenu(); });
    }
  } catch (e) {}

  /* ---------- same-page anchor smooth scroll ---------- */
  try {
    document.querySelectorAll('a[href^="#"]').forEach(function(a){
      a.addEventListener('click', function(e){
        var id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  } catch (e) {}

  /* ---------- current-page nav highlighting ---------- */
  try {
    var currentFile = (location.pathname.split('/').pop() || 'index.html');
    if (!currentFile) currentFile = 'index.html';
    document.querySelectorAll('.nav-links a[href], .overlay-list a[href]').forEach(function(a){
      var href = a.getAttribute('href');
      if (href === currentFile || (currentFile === 'index.html' && href === './')){
        a.classList.add('is-current');
        a.setAttribute('aria-current', 'page');
      }
    });
  } catch (e) {}

  /* ---------- page transition curtain ---------- */
  var goTo = function(href){ window.location.href = href; };
  try {
    var ptx = document.getElementById('ptx');
    if (ptx && !reducedMotion){
      var ptxPanel = ptx.querySelector('.ptx-panel');
      var LEAVE_MS = 560, HOLD_MS = 150, ENTER_MS = 700;

      /* reveal: flash the mark while still fully covered, then the curtain recedes off the top */
      setTimeout(function(){ ptx.classList.add('is-marked'); }, 70);
      setTimeout(function(){
        ptx.classList.remove('is-marked');
        ptxPanel.style.transformOrigin = 'top';
        ptxPanel.style.transition = 'transform ' + ENTER_MS + 'ms cubic-bezier(.76,0,.24,1)';
        requestAnimationFrame(function(){ ptxPanel.style.transform = 'scaleY(0)'; });
      }, 420);

      var leaving = false;
      goTo = function(href){
        if (leaving) return;
        leaving = true;
        ptxPanel.style.transformOrigin = 'top';
        ptxPanel.style.transition = 'transform ' + LEAVE_MS + 'ms cubic-bezier(.76,0,.24,1)';
        ptxPanel.style.transform = 'scaleY(1)';
        setTimeout(function(){ ptx.classList.add('is-marked'); }, Math.round(LEAVE_MS * 0.55));
        setTimeout(function(){ window.location.href = href; }, LEAVE_MS + HOLD_MS);
      };

      document.querySelectorAll('a[href]').forEach(function(a){
        var href = a.getAttribute('href');
        if (!href || !/\.html(#.*)?$/.test(href)) return;
        if (a.target === '_blank') return;
        a.addEventListener('click', function(e){
          if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          goTo(href);
        });
      });
    } else if (ptx){
      ptx.style.display = 'none';
    }
  } catch (e) {}

  /* ---------- header hide/show on scroll + mobile cta bar ---------- */
  try {
    var navEl = document.getElementById('siteNav');
    var lastY = window.scrollY, navTicking = false;
    var mobileCtaBar = document.getElementById('mobileCtaBar');
    var closingEl = document.querySelector('.closing');
    var heroOrHeaderEl = document.querySelector('.hero, .page-header');
    function onScroll(){
      var y = window.scrollY;
      if (navEl){
        var hide = y > 420 && y > lastY + 4 && !(overlay && overlay.classList.contains('open'));
        if (hide) navEl.classList.add('is-hidden');
        else if (y < lastY - 4 || y < 420) navEl.classList.remove('is-hidden');
      }
      if (mobileCtaBar){
        var refH = heroOrHeaderEl ? heroOrHeaderEl.offsetHeight : 300;
        var pastHero = y > refH * 0.6;
        var reachedClosing = closingEl && (y + window.innerHeight) > (closingEl.offsetTop + 60);
        mobileCtaBar.classList.toggle('is-visible', pastHero && !reachedClosing);
      }
      lastY = y; navTicking = false;
    }
    window.addEventListener('scroll', function(){ if (!navTicking){ requestAnimationFrame(onScroll); navTicking = true; } }, { passive: true });
    onScroll();
  } catch (e) {}

  /* ---------- word-mask heading split + reveal ---------- */
  try {
  var wordIndex = 0;
  function splitWords(node){
    Array.prototype.slice.call(node.childNodes).forEach(function(child){
      if (child.nodeType === 3){
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function(part){
          if (!part) return;
          if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'word';
          var inner = document.createElement('span'); inner.textContent = part;
          inner.style.transitionDelay = (wordIndex++ * 0.05) + 's';
          w.appendChild(inner); frag.appendChild(w);
        });
        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === 1){
        splitWords(child);
      }
    });
  }
  var headingEls = Array.prototype.slice.call(document.querySelectorAll('[data-lines]'));
  headingEls.forEach(function(el){
    wordIndex = 0;
    var parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(function(p){ return '<span class="line">' + p.trim() + '</span>'; }).join('');
    el.querySelectorAll('.line').forEach(splitWords);
    el.classList.add('lines');
  });
  if ('IntersectionObserver' in window){
    var headIO = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('is-in'); headIO.unobserve(en.target); } });
    }, { rootMargin: '0px 0px 15% 0px', threshold: 0.01 });
    headingEls.forEach(function(el){ headIO.observe(el); });
  } else {
    headingEls.forEach(function(el){ el.classList.add('is-in'); });
  }
  if (reducedMotion) headingEls.forEach(function(el){ el.classList.add('is-in'); });

  if (hasGsap){
    html.classList.add('js-anim');
    gsap.utils.toArray('.reveal').forEach(function(el, i){
      gsap.to(el, { opacity: 1, y: 0, duration: .6, ease: 'power3.out', delay: (i % 3) * 0.04,
        scrollTrigger: { trigger: el, start: 'top 97%', once: true } });
    });
    ['.faq-item'].forEach(function(sel){
      var els = gsap.utils.toArray(sel).filter(function(el){ return !el.classList.contains('reveal'); });
      if (els.length) ScrollTrigger.batch(els, { start: 'top 97%',
        onEnter: function(batch){ gsap.to(batch, { opacity: 1, y: 0, duration: .7, stagger: .08, ease: 'power3.out', overwrite: true }); } });
    });
  }
  } catch (e) {}

  /* ---------- velocity-aware ticker + keyword band ---------- */
  try { (function(){
    var tracks = [document.getElementById('tickerTrack'), document.getElementById('keywordTrack')].filter(Boolean);
    if (!tracks.length) return;
    /* Guarantee each half has enough repeated content to never gap, on any monitor width. */
    tracks.forEach(function(track){
      var spans = Array.prototype.slice.call(track.children);
      var target = Math.max(window.innerWidth, 2400) * 1.3;
      spans.forEach(function(span){
        var baseHTML = span.innerHTML;
        var guard = 0;
        while (span.scrollWidth < target && guard < 12){ span.innerHTML += baseHTML; guard++; }
      });
    });
    var scrollY = window.scrollY, velocity = 0, direction = 1;
    var positions = tracks.map(function(){ return 0; });
    (function sampleVelocity(){
      var y = window.scrollY, d = y - scrollY;
      velocity += (d - velocity) * 0.2;
      if (Math.abs(d) > 0.5) direction = d > 0 ? 1 : -1;
      scrollY = y;
      requestAnimationFrame(sampleVelocity);
    })();
    if (reducedMotion) return;
    (function loop(){
      tracks.forEach(function(track, i){
        var speed = (i === 0 ? 0.35 : 0.45) + Math.min(Math.abs(velocity) * 0.25, 14);
        positions[i] -= speed * direction;
        var half = track.scrollWidth / 2;
        if (half > 0){ if (positions[i] <= -half) positions[i] += half; if (positions[i] > 0) positions[i] -= half; }
        track.style.transform = 'translate3d(' + positions[i].toFixed(2) + 'px,0,0)';
      });
      requestAnimationFrame(loop);
    })();
  })(); } catch (e) {}

  /* ---------- partner logo marquee: draggable, with a coverflow-style center scale ---------- */
  try {
    Array.prototype.slice.call(document.querySelectorAll('.pm-track')).forEach(function(track){
      var wrap = track.closest('.partners-marquee');
      if (!wrap) return;

      var sets = Array.prototype.slice.call(track.children);
      var target = Math.max(window.innerWidth, 2400) * 1.3;
      sets.forEach(function(set){
        var baseHTML = set.innerHTML;
        var guard = 0;
        while (set.scrollWidth < target && guard < 12){ set.innerHTML += baseHTML; guard++; }
      });

      var pos = 0, dragging = false, dragStartX = 0, dragStartPos = 0;
      var dragVelocity = 0, lastDragX = 0, lastDragT = 0;
      var baseSpeed = 0.45;

      function wrapPos(){
        var half = track.scrollWidth / 2;
        if (half > 0){ if (pos <= -half) pos += half; if (pos > 0) pos -= half; }
      }

      track.classList.add('is-draggable');
      track.addEventListener('dragstart', function(e){ e.preventDefault(); });
      track.addEventListener('pointerdown', function(e){
        dragging = true;
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
        dragStartX = e.clientX; dragStartPos = pos; lastDragX = e.clientX; lastDragT = performance.now();
        dragVelocity = 0;
        track.classList.add('is-dragging');
      });
      track.addEventListener('pointermove', function(e){
        if (!dragging) return;
        pos = dragStartPos + (e.clientX - dragStartX);
        wrapPos();
        var now = performance.now(), dt = now - lastDragT;
        if (dt > 8){ dragVelocity = (e.clientX - lastDragX) / dt; lastDragX = e.clientX; lastDragT = now; }
      });
      function endDrag(){
        if (!dragging) return;
        dragging = false;
        track.classList.remove('is-dragging');
      }
      track.addEventListener('pointerup', endDrag);
      track.addEventListener('pointercancel', endDrag);
      track.addEventListener('pointerleave', endDrag);

      if (reducedMotion){ return; }

      (function loop(){
        if (dragging){
          // live-drag already set pos directly above
        } else if (Math.abs(dragVelocity) > 0.02){
          pos += dragVelocity * 16;
          dragVelocity *= 0.94;
          wrapPos();
        } else {
          pos -= baseSpeed;
          wrapPos();
        }
        track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px,0,0)';

        var logos = track.querySelectorAll('.pm-logo');
        var wrapRect = wrap.getBoundingClientRect();
        var centerX = wrapRect.left + wrapRect.width / 2;
        var rects = [];
        for (var i = 0; i < logos.length; i++) rects.push(logos[i].getBoundingClientRect());
        for (var j = 0; j < logos.length; j++){
          var r = rects[j];
          var dist = Math.abs((r.left + r.width / 2) - centerX);
          var norm = Math.min(1, dist / (wrapRect.width / 2 + 80));
          var scale = 1.1 - norm * 0.24;
          logos[j].style.transform = 'scale(' + scale.toFixed(3) + ')';
        }
        requestAnimationFrame(loop);
      })();
    });
  } catch (e) {}

  /* ---------- hero / page-header / closing parallax ---------- */
  try {
  if (hasGsap){
    document.querySelectorAll('.hero-bg img, .closing-bg img').forEach(function(img){
      gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: img.closest('header, section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    document.querySelectorAll('.feature-card img, .services-preview img, .sg-card img').forEach(function(img){
      gsap.fromTo(img, { yPercent: -5, scale: 1.08 }, { yPercent: 5, scale: 1.08, ease: 'none',
        scrollTrigger: { trigger: img.closest('.feature-card, .services-preview, .sg-card'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }
  } catch (e) {}

  /* ---------- clip-path image reveal on scroll ---------- */
  try {
  if (hasGsap){
    document.querySelectorAll('.feature-card, .services-preview, .sg-card').forEach(function(card){
      var img = card.querySelector('img');
      if (!img) return;
      gsap.fromTo(img, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 85%', once: true } });
    });
  }
  } catch (e) {}

  /* ---------- hero cursor-parallax depth ---------- */
  try {
  if (hasGsap && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    var heroInner = document.querySelector('.hero-inner');
    var heroEl = document.querySelector('.hero');
    if (heroInner && heroEl){
      var qx = gsap.quickTo(heroInner, 'x', { duration: .7, ease: 'power3.out' });
      var qy = gsap.quickTo(heroInner, 'y', { duration: .7, ease: 'power3.out' });
      heroEl.addEventListener('mousemove', function(e){
        var r = heroEl.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        qx(px * 16);
        qy(py * 10);
      });
      heroEl.addEventListener('mouseleave', function(){ qx(0); qy(0); });
    }
  }
  } catch (e) {}

  /* ---------- touch-device card activation (no real :hover on touch, so mirror it via scroll position) ---------- */
  try {
    if (window.matchMedia('(hover: none)').matches && 'IntersectionObserver' in window){
      var touchCards = document.querySelectorAll('.feature-card, .sg-card');
      if (touchCards.length){
        var activeIO = new IntersectionObserver(function(entries){
          entries.forEach(function(en){ en.target.classList.toggle('is-active', en.isIntersecting); });
        }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
        touchCards.forEach(function(card){ activeIO.observe(card); });
      }
    }
  } catch (e) {}

  /* ---------- scroll progress indicator ---------- */
  try {
    var navForProgress = document.getElementById('siteNav');
    if (navForProgress){
      var progressBar = document.createElement('div');
      progressBar.className = 'scroll-progress';
      navForProgress.appendChild(progressBar);
      var updateProgress = function(){
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
        progressBar.style.width = pct + '%';
      };
      var progressTicking = false;
      window.addEventListener('scroll', function(){ if (!progressTicking){ requestAnimationFrame(function(){ updateProgress(); progressTicking = false; }); progressTicking = true; } }, { passive: true });
      window.addEventListener('resize', updateProgress);
      updateProgress();
    }
  } catch (e) {}

  /* ---------- custom cursor (desktop, fine pointer) ---------- */
  try {
    if (!reducedMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
      html.classList.add('has-cursor');
      var cxDot = document.createElement('div'); cxDot.className = 'cx-dot';
      var cxRing = document.createElement('div'); cxRing.className = 'cx-ring';
      document.body.appendChild(cxDot); document.body.appendChild(cxRing);
      var mx = 0, my = 0, rx = 0, ry = 0, shown = false;
      document.addEventListener('mousemove', function(e){
        mx = e.clientX; my = e.clientY;
        if (!shown){ shown = true; rx = mx; ry = my; }
        cxDot.classList.add('is-visible'); cxRing.classList.add('is-visible');
        cxDot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      });
      document.addEventListener('mouseenter', function(){ cxDot.classList.add('is-visible'); cxRing.classList.add('is-visible'); });
      window.addEventListener('pageshow', function(){ shown = false; cxDot.classList.remove('is-visible'); cxRing.classList.remove('is-visible'); });
      (function cxLoop(){
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        cxRing.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
        requestAnimationFrame(cxLoop);
      })();
      var hoverSel = 'a, button, .btn, input, select, textarea, [role="button"], .faq-q, .spotlight-arrow';
      document.addEventListener('mouseover', function(e){
        if (e.target.closest && e.target.closest(hoverSel)){ cxRing.classList.add('is-active'); cxDot.classList.add('is-active'); }
      });
      document.addEventListener('mouseout', function(e){
        if (e.target.closest && e.target.closest(hoverSel)){ cxRing.classList.remove('is-active'); cxDot.classList.remove('is-active'); }
      });
      document.addEventListener('mouseleave', function(){ shown = false; cxDot.classList.remove('is-visible'); cxRing.classList.remove('is-visible'); });
    }
  } catch (e) {}

  /* ---------- stacking process cards (desktop) ---------- */
  try {
  if (hasGsap && window.innerWidth >= 900){
    var stackCards = gsap.utils.toArray('[data-stack] .stack-card');
    stackCards.forEach(function(card, i){
      var next = stackCards[i + 1];
      if (!next) return;
      var endPx = 'top ' + (96 + (i + 1) * 16) + 'px';
      gsap.to(card, { scale: 0.96, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: endPx, scrub: true } });
    });
  }
  } catch (e) {}

  /* ---------- footer wordmark rise ---------- */
  try {
  if (hasGsap){
    var wm = document.getElementById('footWordmark');
    if (wm){
      wm.innerHTML = wm.textContent.split('').map(function(ch){ return ch === ' ' ? ' ' : '<span class="fw-char">' + ch + '</span>'; }).join('');
      gsap.from(wm.querySelectorAll('.fw-char'), { yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.035,
        scrollTrigger: { trigger: wm, start: 'top 95%' } });
    }
  }
  } catch (e) {}

  /* ---------- spotlight carousel ---------- */
  try { (function(){
    var root = document.getElementById('spotlight');
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll('.spotlight-slide'));
    var segs = Array.prototype.slice.call(root.querySelectorAll('.seg'));
    var prevBtn = document.getElementById('spotPrev');
    var nextBtn = document.getElementById('spotNext');
    if (!slides.length || !prevBtn || !nextBtn) return;
    var idx = 0, timer = null;
    function render(){
      slides.forEach(function(s, i){ s.classList.toggle('is-active', i === idx); });
      segs.forEach(function(s, i){ s.classList.toggle('is-active', i === idx); s.classList.toggle('is-done', i < idx); });
    }
    function go(i){ idx = (i + slides.length) % slides.length; render(); restart(); }
    function restart(){
      if (timer) clearTimeout(timer);
      if (reducedMotion) return;
      timer = setTimeout(function(){ go(idx + 1); }, 5000);
    }
    prevBtn.addEventListener('click', function(){ go(idx - 1); });
    nextBtn.addEventListener('click', function(){ go(idx + 1); });
    render(); restart();
  })(); } catch (e) {}

  /* ---------- FAQ accordion ---------- */
  try {
    document.querySelectorAll('.faq-item').forEach(function(item){
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      var inner = item.querySelector('.faq-a-inner');
      if (!q || !a || !inner) return;
      q.addEventListener('click', function(){
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function(other){
          if (other !== item){ other.classList.remove('open'); var oa = other.querySelector('.faq-a'); if (oa) oa.style.maxHeight = null; }
        });
        if (isOpen){ item.classList.remove('open'); a.style.maxHeight = null; }
        else { item.classList.add('open'); a.style.maxHeight = inner.offsetHeight + 'px'; }
      });
    });
  } catch (e) {}

  /* ---------- package tabs (Grid Tie / Hybrid + Battery) ---------- */
  try {
    var pkgTabs = Array.prototype.slice.call(document.querySelectorAll('.pkg-tab'));
    if (pkgTabs.length){
      var pkgPanels = Array.prototype.slice.call(document.querySelectorAll('[data-pkg-panel]'));
      pkgTabs.forEach(function(tab){
        tab.addEventListener('click', function(){
          var target = tab.getAttribute('data-pkg-tab');
          pkgTabs.forEach(function(t){ t.classList.toggle('is-active', t === tab); t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
          pkgPanels.forEach(function(p){ p.hidden = p.getAttribute('data-pkg-panel') !== target; });
        });
      });
    }
  } catch (e) {}

  /* ---------- hero quick form -> save region + go to estimate page ---------- */
  try {
    var heroForm = document.getElementById('heroForm');
    var heroRegionEl = document.getElementById('heroRegion');
    if (heroForm && heroRegionEl){
      heroForm.addEventListener('submit', function(e){
        e.preventDefault();
        saveRegion(heroRegionEl.value);
        goTo('estimate.html');
      });
    }
  } catch (e) {}

  /* ---------- quick live savings calculator (home) ---------- */
  try {
    var qcBill = document.getElementById('qcBill');
    if (qcBill){
      var qcBillReadout = document.getElementById('qcBillReadout');
      var qcSize = document.getElementById('qcSize');
      var qcSavings = document.getElementById('qcSavings');
      var qcPayback = document.getElementById('qcPayback');
      var QC_SUN_HOURS = 4.0, QC_ORIENTATION = 0.93, QC_PRICE_PER_KWH = 0.31, QC_DERATE = 0.80, QC_OFFSET = 0.55;
      function qcCalc(){
        var bill = parseFloat(qcBill.value);
        qcBillReadout.textContent = '$' + bill;
        var annualUsage = (bill * 12) / QC_PRICE_PER_KWH;
        var targetOffset = annualUsage * QC_OFFSET;
        var sizeKw = targetOffset / (QC_SUN_HOURS * 365 * QC_ORIENTATION * QC_DERATE);
        sizeKw = Math.max(2, Math.min(15, Math.round(sizeKw * 2) / 2));
        var annualGen = sizeKw * QC_SUN_HOURS * 365 * QC_ORIENTATION * QC_DERATE;
        var annualSavings = annualGen * QC_PRICE_PER_KWH * 0.9;
        var costPerKw = sizeKw <= 4 ? 2500 : (sizeKw <= 8 ? 2250 : 2100);
        var installedCost = sizeKw * costPerKw;
        var paybackYears = installedCost / annualSavings;
        qcSize.textContent = sizeKw.toFixed(1) + ' kW';
        qcSavings.textContent = '$' + Math.round(annualSavings).toLocaleString('en-NZ') + '/yr';
        qcPayback.textContent = paybackYears.toFixed(1) + ' yrs';
      }
      qcBill.addEventListener('input', qcCalc);
      qcCalc();
    }
  } catch (e) {}

  /* ---------- guides email signup (demo capture, no backend) ---------- */
  try {
    var guidesForm = document.getElementById('guidesForm');
    if (guidesForm){
      guidesForm.addEventListener('submit', function(e){
        e.preventDefault();
        var btn = guidesForm.querySelector('button[type=submit] span');
        if (!btn) return;
        var original = btn.textContent;
        btn.textContent = "You're on the list ✓";
        guidesForm.querySelector('input[type=email]').disabled = true;
        setTimeout(function(){ btn.textContent = original; guidesForm.querySelector('input[type=email]').disabled = false; guidesForm.reset(); }, 2600);
      });
    }
  } catch (e) {}

  /* ---------- footer quick form -> save region + go to estimate page ---------- */
  try {
    var footCtaBtn = document.getElementById('footCta');
    var footRegionEl = document.getElementById('footRegion');
    if (footCtaBtn){
      footCtaBtn.addEventListener('click', function(){
        if (footRegionEl) saveRegion(footRegionEl.value);
        goTo('estimate.html');
      });
    }
  } catch (e) {}

  /* ---------- wizard (estimate page) ---------- */
  try {
  var wizForm = document.getElementById('wizForm');
  var panes = Array.prototype.slice.call(document.querySelectorAll('.wiz-pane'));
  if (wizForm && panes.length){
  var indicators = Array.prototype.slice.call(document.querySelectorAll('.wp-step'));
  var current = 0;
  function clampIndicator(i){ return Math.min(i, indicators.length - 1); }

  /* seed region from the hero/footer quick-pick, if the visitor came from one */
  var regionSel = document.getElementById('region');
  if (regionSel){
    var savedRegion = readRegion();
    if (savedRegion){
      var match = Array.prototype.slice.call(regionSel.options).some(function(opt){ return opt.value === savedRegion; });
      if (match) regionSel.value = savedRegion;
    }
  }

  function transitionPane(from, to){
    var fromEl = panes[from], toEl = panes[to];
    if (hasGsap && fromEl){
      var dir = to > from ? 1 : -1;
      gsap.to(fromEl, { opacity: 0, x: -20*dir, duration: .22, ease: 'power2.in', onComplete: function(){
        fromEl.classList.remove('active');
        toEl.classList.add('active');
        gsap.fromTo(toEl, { opacity: 0, x: 20*dir }, { opacity: 1, x: 0, duration: .32, ease: 'power2.out' });
      }});
    } else {
      panes.forEach(function(p){ p.classList.toggle('active', p === toEl); });
    }
  }

  function showPane(i){
    var prev = current;
    if (panes[i] !== panes[prev]) transitionPane(prev, i); else panes[i].classList.add('active');
    var ind = clampIndicator(i);
    indicators.forEach(function(el, idx){
      el.classList.remove('active','done');
      if (idx < ind) el.classList.add('done');
      if (idx === ind) el.classList.add('active');
    });
    current = i;
    var mobileLabel = document.getElementById('wizMobileLabel');
    if (mobileLabel && indicators[ind]){
      var stepText = indicators[ind].querySelector('span').textContent;
      mobileLabel.textContent = stepText.replace(/^(\d{2})\s+/, '$1 / 05 — ');
    }
    if (i === 5 && hasGsap){
      gsap.to('#ckCircle', { strokeDashoffset: 0, duration: .6, ease: 'power2.out', delay: .2 });
      gsap.to('#ckCheck', { strokeDashoffset: 0, duration: .4, ease: 'power2.out', delay: .75 });
    }
  }

  function validatePane0(){ var err0 = document.getElementById('err0'); if (err0) err0.textContent = ''; return true; }
  function validatePane4(){
    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var err = document.getElementById('err4');
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || !emailOk){ err.textContent = 'Add your name and a valid email to confirm.'; return false; }
    err.textContent = '';
    return true;
  }

  document.querySelectorAll('[data-next]').forEach(function(btn){
    btn.addEventListener('click', function(){
      if (current === 0 && !validatePane0()) return;
      if (current === 3) { calculate(); }
      showPane(current + 1);
    });
  });
  document.querySelectorAll('[data-prev]').forEach(function(btn){
    btn.addEventListener('click', function(){ showPane(current - 1); });
  });
  document.querySelectorAll('[data-restart]').forEach(function(btn){
    btn.addEventListener('click', function(){ showPane(0); });
  });

  var billEl = document.getElementById('bill');
  var billReadout = document.getElementById('billReadout');
  if (billEl && billReadout) billEl.addEventListener('input', function(){ billReadout.textContent = '$' + billEl.value; });

  var batteryEl = document.getElementById('battery');
  var batteryLabel = document.getElementById('batteryLabel');
  if (batteryEl && batteryLabel) batteryEl.addEventListener('change', function(){
    batteryLabel.textContent = batteryEl.checked ? 'Battery storage — higher self-use offset' : 'No battery — grid export only';
  });

  function fmtNZD(n){ return '$' + Math.round(n).toLocaleString('en-NZ'); }
  function animateNumber(el, to, fmt, decimals){
    if (!hasGsap){ el.textContent = fmt(to); return; }
    var from = parseFloat(el.dataset.raw || '0') || 0;
    var obj = { v: from };
    gsap.to(obj, { v: to, duration: .9, ease: 'power2.out', onUpdate: function(){ el.textContent = fmt(decimals ? Number(obj.v.toFixed(decimals)) : Math.round(obj.v)); } });
    el.dataset.raw = to;
  }

  /* ---------- 20-year grid-vs-solar cost chart ---------- */
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function fmtCompact(n){
    if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1000) return '$' + Math.round(n / 1000) + 'K';
    return '$' + Math.round(n);
  }
  function renderSavingsChart(bill, annualSavings, installedCost){
    var svg = document.getElementById('savingsChartSvg');
    var tooltip = document.getElementById('savingsTooltip');
    if (!svg || !tooltip) return;
    var W = 680, H = 300, ML = 54, MR = 16, MT = 16, MB = 32;
    var PW = W - ML - MR, PH = H - MT - MB;
    var GRID_COLOR = '#3987e5', SOLAR_COLOR = '#c98500';

    var INFLATION = 1.04, MAINT = 150;
    var annualBillFull = Math.max(1, bill * 12);
    var savingsRatio = Math.max(0, Math.min(0.95, annualSavings / annualBillFull));
    var years = [0], gridVals = [0], solarVals = [installedCost];
    var gridCum = 0, solarCum = installedCost;
    for (var y = 1; y <= 20; y++){
      var yearBill = annualBillFull * Math.pow(INFLATION, y - 1);
      gridCum += yearBill;
      solarCum += yearBill * (1 - savingsRatio) + MAINT;
      years.push(y); gridVals.push(gridCum); solarVals.push(solarCum);
    }
    var maxVal = Math.max(gridVals[gridVals.length - 1], solarVals[solarVals.length - 1]) * 1.08;

    function xAt(year){ return ML + (year / 20) * PW; }
    function yAt(val){ return MT + PH - (val / maxVal) * PH; }

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var steps = 4;
    for (var s = 0; s <= steps; s++){
      var val = (maxVal / steps) * s;
      var gy = yAt(val);
      var line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', ML); line.setAttribute('x2', W - MR);
      line.setAttribute('y1', gy); line.setAttribute('y2', gy);
      line.setAttribute('class', 'sc-grid');
      svg.appendChild(line);
      var lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', ML - 8); lbl.setAttribute('y', gy + 3);
      lbl.setAttribute('text-anchor', 'end');
      lbl.setAttribute('class', 'sc-axis-label');
      lbl.textContent = fmtCompact(val);
      svg.appendChild(lbl);
    }
    [0, 5, 10, 15, 20].forEach(function(yr){
      var lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', xAt(yr)); lbl.setAttribute('y', H - 10);
      lbl.setAttribute('text-anchor', yr === 0 ? 'start' : (yr === 20 ? 'end' : 'middle'));
      lbl.setAttribute('class', 'sc-axis-label');
      lbl.textContent = yr === 0 ? 'Now' : 'Yr ' + yr;
      svg.appendChild(lbl);
    });

    function buildPath(vals){
      return vals.map(function(v, i){ return (i === 0 ? 'M' : 'L') + xAt(years[i]).toFixed(1) + ',' + yAt(v).toFixed(1); }).join(' ');
    }
    var gridPath = document.createElementNS(SVG_NS, 'path');
    gridPath.setAttribute('d', buildPath(gridVals));
    gridPath.setAttribute('class', 'sc-line');
    gridPath.setAttribute('stroke', GRID_COLOR);
    svg.appendChild(gridPath);

    var solarPath = document.createElementNS(SVG_NS, 'path');
    solarPath.setAttribute('d', buildPath(solarVals));
    solarPath.setAttribute('class', 'sc-line');
    solarPath.setAttribute('stroke', SOLAR_COLOR);
    svg.appendChild(solarPath);

    function endMark(vals, color, dy){
      var lastX = xAt(20), lastY = yAt(vals[vals.length - 1]);
      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', lastX); dot.setAttribute('cy', lastY); dot.setAttribute('r', 4.5);
      dot.setAttribute('fill', color); dot.setAttribute('class', 'sc-dot');
      svg.appendChild(dot);
      var lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', Math.min(lastX, W - MR - 6)); lbl.setAttribute('y', lastY + dy);
      lbl.setAttribute('class', 'sc-end-label'); lbl.setAttribute('fill', 'var(--cream)');
      lbl.setAttribute('text-anchor', 'end');
      lbl.textContent = fmtCompact(vals[vals.length - 1]);
      svg.appendChild(lbl);
    }
    endMark(gridVals, GRID_COLOR, -10);
    endMark(solarVals, SOLAR_COLOR, 16);

    var hit = document.createElementNS(SVG_NS, 'rect');
    hit.setAttribute('x', ML); hit.setAttribute('y', MT); hit.setAttribute('width', PW); hit.setAttribute('height', PH);
    hit.setAttribute('class', 'sc-hit');
    svg.appendChild(hit);

    var crosshair = document.createElementNS(SVG_NS, 'line');
    crosshair.setAttribute('y1', MT); crosshair.setAttribute('y2', MT + PH);
    crosshair.setAttribute('x1', ML); crosshair.setAttribute('x2', ML);
    crosshair.setAttribute('class', 'sc-crosshair');
    crosshair.style.opacity = '0';
    svg.appendChild(crosshair);

    function showTip(evt){
      var rect = svg.getBoundingClientRect();
      var px = (evt.clientX - rect.left) / rect.width * W;
      var yearFrac = Math.max(0, Math.min(20, ((px - ML) / PW) * 20));
      var yearIdx = Math.round(yearFrac);
      var cx = xAt(yearIdx);
      crosshair.setAttribute('x1', cx); crosshair.setAttribute('x2', cx);
      crosshair.style.opacity = '1';
      tooltip.style.left = ((cx / W) * 100) + '%';
      tooltip.style.top = ((MT / H) * 100) + '%';
      tooltip.innerHTML = '';
      var yearRow = document.createElement('div');
      yearRow.className = 'sct-year';
      yearRow.textContent = yearIdx === 0 ? 'Right now' : 'Year ' + yearIdx;
      tooltip.appendChild(yearRow);
      [['Grid only', gridVals[yearIdx], GRID_COLOR], ['Solar + Watthaus', solarVals[yearIdx], SOLAR_COLOR]].forEach(function(row){
        var r = document.createElement('div'); r.className = 'sct-row';
        var key = document.createElement('span'); key.className = 'sct-key'; key.style.background = row[2];
        var name = document.createElement('span'); name.className = 'sct-name'; name.textContent = row[0];
        var v = document.createElement('span'); v.className = 'sct-value'; v.textContent = fmtCompact(row[1]);
        r.appendChild(key); r.appendChild(name); r.appendChild(v);
        tooltip.appendChild(r);
      });
      tooltip.classList.add('is-visible');
    }
    function hideTip(){ tooltip.classList.remove('is-visible'); crosshair.style.opacity = '0'; }
    hit.addEventListener('pointermove', showTip);
    hit.addEventListener('pointerleave', hideTip);
  }

  function calculate(){
    var sunHours = parseFloat(regionSel.value);
    var orientation = parseFloat(document.getElementById('orientation').value);
    var bill = parseFloat(billEl.value);
    var hasBattery = batteryEl.checked;

    var PRICE_PER_KWH = 0.31;
    var SYSTEM_DERATE = 0.80;
    var OFFSET_RATIO = hasBattery ? 0.80 : 0.55;

    var annualUsageKwh = (bill * 12) / PRICE_PER_KWH;
    var targetOffsetKwh = annualUsageKwh * OFFSET_RATIO;

    var systemSizeKw = targetOffsetKwh / (sunHours * 365 * orientation * SYSTEM_DERATE);
    systemSizeKw = Math.max(2, Math.min(15, Math.round(systemSizeKw * 2) / 2));

    var annualGenerationKwh = systemSizeKw * sunHours * 365 * orientation * SYSTEM_DERATE;
    var annualSavings = annualGenerationKwh * PRICE_PER_KWH * 0.9;

    var costPerKw = systemSizeKw <= 4 ? 2500 : (systemSizeKw <= 8 ? 2250 : 2100);
    var installedCost = systemSizeKw * costPerKw;

    var paybackYears = installedCost / annualSavings;
    var tenYearNet = (annualSavings * 10) - installedCost;
    var co2SavedKg = annualGenerationKwh * 0.09;

    animateNumber(document.getElementById('rSize'), systemSizeKw, function(v){ return v.toFixed(1) + ' kW'; }, 1);
    animateNumber(document.getElementById('rSavings'), annualSavings, function(v){ return fmtNZD(v) + '/yr'; }, 0);
    animateNumber(document.getElementById('rPayback'), paybackYears, function(v){ return v.toFixed(1) + ' yrs'; }, 1);
    animateNumber(document.getElementById('rTenYear'), tenYearNet, function(v){ return (v >= 0 ? '' : '-') + fmtNZD(Math.abs(v)); }, 0);
    document.getElementById('rCost').textContent = fmtNZD(installedCost);
    document.getElementById('rCo2').textContent = Math.round(co2SavedKg).toLocaleString('en-NZ') + ' kg';

    var circumference = 213.6;
    var ratio = systemSizeKw / 15;
    var ring = document.getElementById('gaugeRing');
    if (hasGsap) gsap.to(ring, { strokeDashoffset: circumference * (1-ratio), duration: 1, ease: 'power2.out' });
    else ring.setAttribute('stroke-dashoffset', circumference * (1-ratio));

    try { renderSavingsChart(bill, annualSavings, installedCost); } catch (e) {}
  }

  wizForm.addEventListener('submit', function(e){
    e.preventDefault();
    if (!validatePane4()) return;
    var name = document.getElementById('name').value.trim().split(' ')[0];
    document.getElementById('successName').textContent = name || 'there';
    showPane(5);
  });

  calculate();
  }
  } catch (e) {}

  /* ---------- copy-to-clipboard ---------- */
  try {
    document.querySelectorAll('.copy-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var text = btn.dataset.copy;
        var original = btn.textContent;
        function done(ok){ btn.textContent = ok ? 'Copied' : 'Select to copy'; setTimeout(function(){ btn.textContent = original; }, 1600); }
        try { navigator.clipboard.writeText(text).then(function(){ done(true); }).catch(function(){ done(false); }); }
        catch (e) { done(false); }
      });
    });
  } catch (e) {}
})();
