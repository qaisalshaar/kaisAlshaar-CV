(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  // ---------- Current year ----------
  var year = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll('.js-year'), function (el) {
    el.textContent = year;
  });

  // ---------- See CV: book overlay ----------
  var seeBtn = $('seeCvBtn');
  var overlay = $('cvOverlay');
  var book = $('cvBook');
  var cover = $('cvCover');
  var closeBtn = $('cvClose');
  var timers = [];
  var lastFocus = null;

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function openCv() {
    if (!overlay || !overlay.hidden) return;
    clearTimers();
    lastFocus = document.activeElement;
    book.classList.remove('open');
    cover.classList.remove('turn', 'done');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    timers.push(setTimeout(function () {
      book.classList.add('open');
      cover.classList.add('turn');
    }, 700));
    timers.push(setTimeout(function () {
      cover.classList.add('done');
    }, 1900));
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  var zoomBox = $('cvZoom');
  var zoomImg = $('cvZoomImg');
  var zoomBtns = $('cvZoomBtns');
  var hint = $('cvHint');
  var pageSrc = { 1: 'assets/cv/page-1.jpg', 2: 'assets/cv/page-2.jpg' };

  function zoomTo(n) {
    clearTimers();
    book.classList.add('open', 'zoomed');
    cover.classList.add('turn', 'done');
    zoomImg.src = pageSrc[n];
    zoomImg.alt = 'CV page ' + n;
    zoomBox.hidden = false;
    zoomBox.scrollTop = 0;
    zoomBtns.hidden = false;
    if (hint) hint.hidden = true;
    Array.prototype.forEach.call(zoomBtns.querySelectorAll('[data-zoom]'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-zoom') === String(n));
    });
  }

  function unzoom() {
    if (!zoomBox || zoomBox.hidden) return false;
    book.classList.remove('zoomed');
    zoomBox.hidden = true;
    zoomBtns.hidden = true;
    if (hint) hint.hidden = false;
    return true;
  }

  if (overlay) {
    overlay.addEventListener('click', function (e) {
      var z = e.target.closest('[data-zoom]');
      if (z) { zoomTo(Number(z.getAttribute('data-zoom'))); return; }
      if (e.target.closest('[data-unzoom]') || e.target.closest('#cvZoom')) unzoom();
    });
  }

  function closeCv() {
    if (!overlay || overlay.hidden) return;
    unzoom();
    clearTimers();
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  if (seeBtn && overlay) {
    // Open on hover (desktop) like the original "See CV", and on click/tap everywhere
    seeBtn.addEventListener('mouseenter', function () {
      if (window.matchMedia && window.matchMedia('(hover: hover)').matches) openCv();
    });
    seeBtn.addEventListener('click', openCv);
    if (closeBtn) closeBtn.addEventListener('click', closeCv);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCv();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !unzoom()) closeCv();
    });
  }

  // ---------- Contact form (Formspree) ----------
  var form = $('contactForm');
  if (form) {
    var submit = $('contactSubmit');
    var label = $('contactLabel');
    var errorBox = $('contactError');
    var sentBox = $('contactSent');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function showError(msg) {
      sentBox.hidden = true;
      errorBox.textContent = msg;
      errorBox.hidden = false;
    }

    form.addEventListener('input', function () {
      errorBox.hidden = true;
      sentBox.hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();

      if (!name || !email || !message) return showError('Please fill in your name, email and message.');
      if (!emailRe.test(email)) return showError('Please enter a valid email address.');

      submit.disabled = true;
      label.textContent = 'Sending…';
      errorBox.hidden = true;

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          sentBox.hidden = false;
        } else {
          return res.json().then(function (data) {
            var msg = (data && data.errors && data.errors.map(function (x) { return x.message; }).join(', ')) ||
              'Sorry, the message could not be sent. Please email me directly.';
            showError(msg);
          }, function () {
            showError('Sorry, the message could not be sent. Please email me directly.');
          });
        }
      }).catch(function () {
        showError('No connection. Please check your internet and try again, or email me directly.');
      }).then(function () {
        submit.disabled = false;
        label.textContent = 'Send message';
      });
    });
  }

  // ---------- Highlight the current section in the side menu ----------
  var links = Array.prototype.slice.call(document.querySelectorAll('.side-nav a[href^="#"]'));
  var activeStyle = { background: '#E0F2FE', color: '#0C4A6E', fontWeight: '700' };
  var idleStyle = { background: 'transparent', color: '#374151', fontWeight: '600' };

  function setActive(id) {
    links.forEach(function (a) {
      var st = a.getAttribute('href') === '#' + id ? activeStyle : idleStyle;
      a.style.background = st.background;
      a.style.color = st.color;
      a.style.fontWeight = st.fontWeight;
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && links.length) {
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive(en.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (sec) { io.observe(sec); });
  }
})();
