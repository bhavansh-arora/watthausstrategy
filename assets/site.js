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
          inner.style.transitionDelay = (wordIndex++ * 0.035) + 's';
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
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    headingEls.forEach(function(el){ headIO.observe(el); });
  } else {
    headingEls.forEach(function(el){ el.classList.add('is-in'); });
  }
  if (reducedMotion) headingEls.forEach(function(el){ el.classList.add('is-in'); });

  if (hasGsap){
    html.classList.add('js-anim');
    gsap.utils.toArray('.reveal').forEach(function(el, i){
      gsap.to(el, { opacity: 1, y: 0, duration: .8, ease: 'power3.out', delay: (i % 3) * 0.05,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    ['.faq-item'].forEach(function(sel){
      var els = gsap.utils.toArray(sel).filter(function(el){ return !el.classList.contains('reveal'); });
      if (els.length) ScrollTrigger.batch(els, { start: 'top 90%',
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
