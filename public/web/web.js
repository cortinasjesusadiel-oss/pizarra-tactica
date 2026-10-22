// Vídeos de la demostración: se cargan solo al acercarse a ellos y se reproducen en silencio mientras se ven.
// Con "reducir movimiento" activado no arrancan solos: se reproducen con el botón.
(function () {
  var vids = document.querySelectorAll('.player video[data-lazy]')
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches
  var load = function (v) {
    if (v.dataset.loaded) return
    v.dataset.loaded = '1'
    v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.getAttribute('data-src') })
    v.preload = 'metadata'
    v.load()
  }
  if (!('IntersectionObserver' in window)) { vids.forEach(load); return }
  var near = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { load(e.target); near.unobserve(e.target) } })
  }, { rootMargin: '400px 0px' })
  var seen = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target
      if (e.isIntersecting && !calm && !v.dataset.user) { load(v); var p = v.play(); if (p && p.catch) p.catch(function () {}) }
      else if (!e.isIntersecting && !v.paused) { v.dataset.auto = '1'; v.pause() }
    })
  }, { threshold: 0.5 })
  vids.forEach(function (v) {
    near.observe(v); seen.observe(v)
    // Si el visitante la pausa, no se vuelve a reproducir sola.
    v.addEventListener('pause', function () { if (v.dataset.auto) delete v.dataset.auto; else if (document.visibilityState === 'visible' && !v.ended) v.dataset.user = '1' })
    v.addEventListener('play', function () { delete v.dataset.user })
  })
})()

// Menú del móvil: se abre con el botón, se cierra al elegir una sección, con Escape o tocando fuera.
;(function () {
  var b = document.querySelector('.burger'), m = document.getElementById('menu')
  if (!b || !m) return
  var set = function (open) { m.classList.toggle('open', open); b.setAttribute('aria-expanded', open); b.setAttribute('aria-label', open ? b.dataset.close : b.dataset.open) }
  b.addEventListener('click', function () { var o = !m.classList.contains('open'); set(o); if (o) { var a = m.querySelector('a'); if (a) a.focus() } })
  m.addEventListener('click', function (e) { if (e.target.closest('a')) set(false) })
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && m.classList.contains('open')) { set(false); b.focus() } })
  document.addEventListener('click', function (e) { if (m.classList.contains('open') && !m.contains(e.target) && !b.contains(e.target)) set(false) })
})()
// «Cómo instalarla» abre directamente esa pregunta.
;(function () {
  var open = function () { var d = location.hash && document.querySelector('details' + location.hash); if (d) d.open = true }
  addEventListener('hashchange', open); open()
})()
// Vídeos: solo uno a la vez y botón para verlo a pantalla completa.
;(function () {
  var vids = [].slice.call(document.querySelectorAll('.player video'))
  vids.forEach(function (v) {
    v.addEventListener('play', function () { vids.forEach(function (o) { if (o !== v && !o.paused) { o.dataset.auto = '1'; o.pause() } }) })
    var z = v.parentNode.querySelector('.zoom')
    if (!z) return
    z.addEventListener('click', function () {
      if (v.querySelector('source[data-src]') && !v.dataset.loaded) { v.querySelectorAll('source[data-src]').forEach(function (s) { s.src = s.getAttribute('data-src') }); v.dataset.loaded = '1'; v.load() }
      var p = v.play(); if (p && p.catch) p.catch(function () {})
      if (v.requestFullscreen) v.requestFullscreen().catch(function () {})
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen()
    })
  })
})()
// Selector ES / EN: guarda la elección (la misma que usa la pizarra, así se abre en ese idioma) y mantiene la sección.
;(function () {
  document.querySelectorAll('.lang a[hreflang]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      try { localStorage.setItem('pizarra.idioma', a.hreflang) } catch (x) {}
      if (location.hash) { e.preventDefault(); location.href = a.href.split('#')[0] + location.hash }
    })
  })
})()

// Opiniones y «Me gusta»: se guardan en el servidor de TacticalPro (Google Apps Script, cuenta tacticalproapp).
// Mientras PUBLICO sea false, la sección solo aparece con ?prueba en la dirección, para comprobarla antes de abrirla.
;(function () {
  var API = 'https://script.google.com/macros/s/AKfycbz2COB4DUZGAoX12fiDzCvtl_-sNGQ1ieY6gXODGEKOmVnAT8DE_JZ-Utv9fBVrverUEA/exec'
  var PUBLICO = true
  var sec = document.getElementById('opinion')
  if (!sec) return
  var q = location.search
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { var m = /[?&]api=([^&]+)/.exec(q); if (m) API = decodeURIComponent(m[1]) }
  if (!API || !(PUBLICO || /[?&]prueba\b/.test(q))) return
  sec.hidden = false
  // En modo prueba, el cambio de idioma conserva ?prueba y la sección.
  if (!PUBLICO) document.querySelectorAll('.lang a[hreflang]').forEach(function (a) { a.href = a.getAttribute('href').split(/[?#]/)[0] + q + '#opinion' })
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v) } catch (e) { return null } }
  var post = function (d) { return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(d) }).then(function (r) { return r.json() }) }
  var fmt = function (n) { return Number(n).toLocaleString(document.documentElement.lang || 'es') }

  // Contador «Me gusta»: el navegador recuerda que ya lo diste y el servidor frena pulsaciones repetidas.
  var like = sec.querySelector('.like'), num = like.querySelector('.like-n'), txt = like.querySelector('.like-t')
  var id = store('tp.id'); if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()); store('tp.id', id) }
  var marcar = function () { like.setAttribute('aria-pressed', 'true'); txt.textContent = like.dataset.liked }
  if (store('tp.megusta')) marcar()
  fetch(API + (API.indexOf('?') < 0 ? '?' : '&') + 'accion=likes').then(function (r) { return r.json() }).then(function (d) { if (d && d.ok) num.textContent = fmt(d.likes) }).catch(function () {})
  var ocupado = false
  like.addEventListener('click', function () {
    if (ocupado || like.getAttribute('aria-pressed') === 'true') return
    ocupado = true; marcar(); store('tp.megusta', '1')
    like.classList.add('pop'); setTimeout(function () { like.classList.remove('pop') }, 180)
    post({ accion: 'like', id: id }).then(function (d) { if (d && typeof d.likes === 'number') num.textContent = fmt(d.likes) }).catch(function () {}).then(function () { ocupado = false })
  })

  // Formulario de opiniones.
  var f = sec.querySelector('.op-form'), st = f.querySelector('.status'), btn = f.querySelector('button[type=submit]')
  var extra = f.querySelector('.extra'), el = function (n) { return f.elements[n] }
  el('probador').addEventListener('change', function () { extra.hidden = !this.checked; if (!this.checked) { el('android').checked = false; el('correoPlay').value = '' } })
  var msg = function (t, cls) { st.textContent = t || ''; st.className = 'status' + (cls ? ' ' + cls : '') }
  var mail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  var limpiar = function (e) { if (e.target.getAttribute) e.target.removeAttribute('aria-invalid'); if (st.classList.contains('bad')) msg('') }
  f.addEventListener('input', limpiar); f.addEventListener('change', limpiar)
  f.addEventListener('submit', function (e) {
    e.preventDefault()
    var D = f.dataset, fallo = null
    var mal = function (campo, texto) { if (!fallo) { fallo = campo; msg(texto, 'bad') } if (campo.setAttribute) campo.setAttribute('aria-invalid', 'true') }
    ;[].forEach.call(f.querySelectorAll('[aria-invalid]'), function (x) { x.removeAttribute('aria-invalid') })
    var probado = (f.querySelector('input[name=probado]:checked') || {}).value
    var correo = el('correo').value.trim()
    if (correo && !mail.test(correo)) mal(el('correo'), D.badEmail)
    if (el('opinion').value.trim().length < 3) mal(el('opinion'), D.badOp)
    if (el('probador').checked) {
      if (!el('android').checked) mal(el('android'), D.badAndroid)
      if (!mail.test(el('correoPlay').value.trim())) mal(el('correoPlay'), D.badPlay)
    }
    if (el('novedades').checked && !correo) mal(el('correo'), D.badNews)
    if (fallo) { fallo.focus(); return }
    btn.disabled = true; msg(D.sending)
    post({
      accion: 'opinion', correo: correo, probado: probado || '', funcion: el('funcion').value, opinion: el('opinion').value.trim(),
      probador: el('probador').checked, android: el('android').checked, correoPlay: el('correoPlay').value.trim(),
      novedades: el('novedades').checked, idioma: D.lang, web: el('web').value
    }).then(function (d) {
      if (d && d.ok) { f.reset(); extra.hidden = true; msg(D.ok, 'ok') }
      else msg(d && d.error === 'espera' ? D.wait : D.err, 'bad')
    }).catch(function () { msg(D.err, 'bad') }).then(function () { btn.disabled = false })
  })
})()
