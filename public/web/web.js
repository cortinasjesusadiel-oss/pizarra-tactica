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
