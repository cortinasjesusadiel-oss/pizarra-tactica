// Biblioteca de jugadas de la web: una página por jugada con la animación, el objetivo,
// los movimientos paso a paso, una variante y el botón que abre esa jugada en la pizarra.
//   node scripts/biblioteca.mjs   → escribe public/web/biblioteca/*.html
// Los textos se editan aquí y se vuelve a ejecutar. Los vídeos (img/biblioteca/<id>.mp4) son
// exportaciones reales de la app sin el cierre, a 1280 px.
// En el código fuente la pizarra está en "../../" (igual que en en/); scripts/site.mjs lo pasa a "../pizarra/".
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SITIO = 'https://tacticalpro.app'
const DIR = 'public/web/biblioteca'

// id = id de la plantilla en la app (src/contenido); slug = dirección de la página.
const JUGADAS = [
  {
    id: 't3-salida-presion-alta',
    slug: 'salida-de-balon-ante-presion-alta',
    titulo: 'Salida de balón ante presión alta',
    sub: '4-3-3 contra 4-4-2 · campo completo · 6 pasos',
    tema: 'Salida de balón',
    pregunta: 'El rival presiona arriba con dos delanteros sobre tus centrales. ¿Cómo sales jugando sin rifar el balón?',
    resumen: 'Superar la primera presión con tres pases: el 6 atrae, el 8 recibe de cara y el 11 ataca el espacio.',
    objetivo: [
      'Salir jugando desde el arquero cuando el rival presiona en 4-4-2, sin recurrir al pelotazo.',
      'La idea clave es el <b>tercer hombre</b>: el 6 baja, atrae a su marcador y la toca de primeras para el 8, que recibe libre y de frente. Con tres pases la presión queda atrás.',
    ],
    pasos: [
      'Saque de meta. El rival presiona alto en 4-4-2: sus dos delanteros vigilan a nuestros centrales y sus extremos saltan sobre los laterales.',
      'El arquero juega con el central 4. Un delantero rival sale a presionarle y el otro tapa el pase al otro central.',
      'El 6 baja a dar apoyo y recibe. Su marcador (el 8 rival) le persigue y deja un hueco a su espalda. Nuestro 8 se mete en ese hueco.',
      'Tercer hombre: el 6, de cara, toca de primeras para el 8, que recibe libre y de frente.',
      'El 8 conduce hacia delante. El 9 baja para arrastrar a un central y el 11 ataca la espalda del lateral rival.',
      'Pase al espacio para el 11, que llega lanzado. Presión superada con tres pases y ataque con ventaja.',
    ],
    variante: {
      titulo: 'Si el rival cierra el pase por dentro',
      texto: 'Si el 8 rival no persigue al 6 y se queda tapando el centro, el pase al 8 no existe. Entonces la ventaja está fuera: el central conduce unos metros para atraer al extremo rival y suelta al lateral, que recibe libre por fuera. Puedes probarlo en la pizarra moviendo al 8 rival y añadiendo un paso.',
    },
  },
  {
    id: 'blq-alto',
    slug: 'bloque-alto-presionar-en-campo-rival',
    titulo: 'Bloque alto: presionar en campo rival',
    sub: '4-4-2 contra 4-3-3 · campo completo · 5 pasos',
    tema: 'Presión',
    pregunta: '¿Quieres robar cerca del arco rival? La presión alta solo funciona si todo el equipo salta a la vez.',
    resumen: 'Empujar la salida rival hacia la banda con saltos coordinados y la defensa adelantada.',
    objetivo: [
      'Recuperar el balón lo más cerca posible del arco rival, presionando su salida en su propio campo.',
      'No se trata de correr más, sino de <b>saltar en el momento justo y todos juntos</b>: cada pase del rival es la señal para que un jugador presione y los demás se acerquen al balón.',
    ],
    pasos: [
      'Presionamos en campo rival con la defensa adelantada cerca del centro del campo. Queremos robar cerca de su arco.',
      'Pase al lateral: el extremo salta a presionarle y el delantero tapa el pase de vuelta al central. Todo el equipo se acerca al balón.',
      'El lateral devuelve al central: el delantero de ese lado le presiona en curva para empujarle hacia la banda.',
      'Cambio al otro central: salta el otro delantero. Los mediocentros vigilan a los interiores rivales.',
      'Lateral presionado contra la banda. El riesgo es el espacio a la espalda de la defensa: por eso el arquero juega adelantado y la presión tiene que ser de todos a la vez.',
    ],
    variante: {
      titulo: 'Si tu equipo no llega tan arriba',
      texto: 'Retrasa el bloque unos metros y empieza a presionar desde el medio campo (bloque medio). Robarás más lejos del arco rival, pero dejas menos espacio a tu espalda. En la app tienes la plantilla «Bloque medio» para comparar las dos alturas.',
      enlace: { id: 'blq-medio', texto: 'Abrir «Bloque medio»' },
    },
  },
  {
    id: 't2-apoyo-ruptura',
    slug: 'desmarque-de-apoyo-y-de-ruptura',
    titulo: 'Desmarque de apoyo y de ruptura',
    sub: 'Ataque · medio campo · 6 pasos',
    tema: 'Ataque',
    pregunta: 'Tu 9 está pegado a los centrales y no recibe. ¿Qué pasa si viene hacia el balón?',
    resumen: 'Uno viene (apoyo) y otro va (ruptura): así se desordena una línea defensiva.',
    objetivo: [
      'Crear un hueco en la defensa rival con dos movimientos coordinados: el 9 viene hacia el balón y arrastra a un central; el extremo ataca el espacio que deja.',
      'El 9 <b>no necesita girarse</b>: recibe de espaldas y juega de cara con un compañero. El pase que hace daño llega después.',
    ],
    pasos: [
      'El 9 está junto a los centrales rivales y así no puede recibir. Pero si viene hacia el balón, arrastra a un defensa.',
      'Desmarque de apoyo: el 9 viene hacia el balón. Su central le sigue para no dejarle girar y abre un hueco detrás.',
      'Pase al 9, que recibe de espaldas con el central encima. No intenta girar: juega de cara con un compañero.',
      'El 9 descarga para el 8, que recibe de cara. Mientras, el extremo (11) empieza su carrera hacia dentro, a la espalda de la defensa.',
      'Desmarque de ruptura: pase al espacio y el 11 llega solo dentro del área.',
      'Gol. Uno viene (apoyo) y otro va (ruptura).',
    ],
    variante: {
      titulo: 'Cambiar los papeles',
      texto: 'Ahora el extremo viene a recibir al pie y el 9 ataca el espacio entre central y lateral. Recuerda que quien hace la ruptura tiene que estar en posición legal en el momento del pase (Regla 11): la carrera empieza a la altura del último defensor, no por delante.',
    },
  },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const abrir = (id) => `../../?jugada=${id}&amp;lang=es`

const cabeza = ({ titulo, desc, url, imagen, tipo = 'article' }) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="manifest" href="../../manifest.webmanifest">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0f1712">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${imagen}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="${tipo}">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/png" href="../../favicon-32.png">
<link rel="apple-touch-icon" href="../../apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../web.css">
</head>
<body>

<a class="skip" href="#principal">Saltar al contenido</a>

<nav>
  <div class="wrap">
    <a class="brand" href="../"><img src="../img/simbolo.webp" alt=""><span>Tactical<span class="g">Pro</span></span></a>
    <div class="links" id="menu">
      <a href="../#aprende">Aprende</a>
      <a href="../#planifica">Planifica</a>
      <a href="../#entrena">Entrena</a>
      <a href="./" aria-current="page">Biblioteca</a>
      <a href="../#preguntas">Preguntas</a>
      <a class="nav-guide" href="../guia.html">Cómo usar TacticalPro</a>
    </div>
    <div class="nav-end">
      <a class="btn pri" href="../../?lang=es">Abrir TacticalPro</a>
      <button class="burger" type="button" aria-controls="menu" aria-expanded="false" aria-label="Abrir el menú" data-open="Abrir el menú" data-close="Cerrar el menú"><span></span><span></span><span></span></button>
    </div>
  </div>
</nav>
`

const pie = `
<footer>
  <div class="wrap">
    <span>© 2026 TacticalPro · <a href="../privacidad.html">Privacidad</a> · <a href="../#opinion">Danos tu opinión</a> · <a href="../#soporte">Soporte</a></span>
    <span>Creado por Jesús Cortinas · Scout &amp; Analyst</span>
  </div>
</footer>

<script src="../web.js"></script>

<!-- Cloudflare Web Analytics: recuento anónimo de visitas, sin cookies -->
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "841b96ca0ecd4e20977d7bf1f53b0285"}'></script>
</body>
</html>
`

const tarjeta = (j) => `    <a class="lcard" href="${j.slug}.html">
      <img src="../img/biblioteca/${j.id}.webp" alt="" loading="lazy" width="1280" height="720">
      <span class="ltema">${esc(j.tema)}</span>
      <h3>${esc(j.titulo)}</h3>
      <p>${esc(j.resumen)}</p>
    </a>`

function pagina(j) {
  const url = `${SITIO}/biblioteca/${j.slug}.html`
  const otras = JUGADAS.filter((x) => x !== j)
  return cabeza({
    titulo: `${j.titulo} · Jugada animada gratis · TacticalPro`,
    desc: `${j.pregunta} Mira la jugada animada paso a paso y ábrela gratis en la pizarra táctica TacticalPro para adaptarla a tu equipo.`,
    url,
    imagen: `${SITIO}/img/biblioteca/${j.id}.webp`,
  }) + `
<main id="principal" class="lib">
<header class="ghero">
  <div class="wrap">
    <p class="lmiga"><a href="./">Biblioteca de jugadas</a> · ${esc(j.tema)}</p>
    <h1>${esc(j.titulo)}</h1>
    <p class="lead">${esc(j.pregunta)}</p>
    <p class="lsub">${esc(j.sub)}</p>
  </div>
</header>

<section class="lplay">
  <div class="wrap">
    <video class="lvideo" src="../img/biblioteca/${j.id}.mp4" poster="../img/biblioteca/${j.id}.webp" autoplay muted loop playsinline preload="metadata" width="1280" height="720" aria-label="Animación de la jugada: ${esc(j.titulo)}"></video>
    <div class="lcta">
      <a class="btn pri" href="${abrir(j.id)}">Abrir esta jugada en TacticalPro</a>
      <p>Se abre una copia que puedes mover y cambiar. Tus jugadas guardadas no se tocan. Gratis y sin registro.</p>
    </div>
  </div>
</section>

<section class="gpart">
  <div class="wrap lcols">
    <div class="gsec">
      <h2>Objetivo</h2>
${j.objetivo.map((p) => `      <p>${p}</p>`).join('\n')}
    </div>
    <div class="gsec">
      <h2>Paso a paso</h2>
      <ol class="lpasos">
${j.pasos.map((p) => `        <li>${esc(p)}</li>`).join('\n')}
      </ol>
    </div>
    <div class="gsec lvar">
      <h2>Variante</h2>
      <h3>${esc(j.variante.titulo)}</h3>
      <p>${esc(j.variante.texto)}</p>
${j.variante.enlace ? `      <a class="btn sec small" href="${abrir(j.variante.enlace.id)}">${esc(j.variante.enlace.texto)}</a>\n` : ''}      <p class="lnota">Es una propuesta para adaptar a tu equipo, no una receta: el espacio, el nivel y el rival cambian la solución.</p>
    </div>
  </div>
</section>

<section class="gpart lmas">
  <div class="wrap">
    <h2>Más jugadas</h2>
    <div class="lgrid">
${otras.map(tarjeta).join('\n')}
    </div>
  </div>
</section>
</main>
` + pie
}

function indice() {
  return cabeza({
    titulo: 'Biblioteca de jugadas animadas · TacticalPro',
    desc: 'Jugadas de fútbol 11 animadas paso a paso: salida de balón, presión y ataque. Míralas, entiende el objetivo y ábrelas gratis en la pizarra táctica TacticalPro.',
    url: `${SITIO}/biblioteca/`,
    imagen: `${SITIO}/img/biblioteca/${JUGADAS[0].id}.webp`,
    tipo: 'website',
  }) + `
<main id="principal" class="lib">
<header class="ghero">
  <div class="wrap">
    <div class="lema">Aprende · Planifica · Entrena</div>
    <h1>Biblioteca de <span class="g">jugadas</span></h1>
    <p class="lead">Jugadas de fútbol 11 animadas paso a paso. Cada una explica su objetivo, cómo se mueve el equipo y una variante. Ábrela en TacticalPro y adáptala a tu equipo, gratis y sin registro.</p>
  </div>
</header>

<section class="gpart">
  <div class="wrap">
    <div class="lgrid">
${JUGADAS.map(tarjeta).join('\n')}
    </div>
    <p class="lnota">Iremos añadiendo jugadas nuevas. En la app ya tienes más de 70 plantillas en «Biblioteca ▾ › Plantillas».</p>
  </div>
</section>
</main>
` + pie
}

mkdirSync(DIR, { recursive: true })
writeFileSync(join(DIR, 'index.html'), indice())
for (const j of JUGADAS) writeFileSync(join(DIR, `${j.slug}.html`), pagina(j))
console.log(`biblioteca: ${JUGADAS.length} jugadas`)
