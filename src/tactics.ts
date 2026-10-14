// Jugadas tácticas de equipo completo: bloques defensivos, presión alta, transiciones y cómo generar espacios.
// Campo completo: nuestro equipo (amarillo) ataca hacia la derecha y defiende la portería de x=0.
import { ballAt, line, player, type Pt, type Token } from './model'
import { animate, press, type Step, type Template } from './anim'

type Shape = Record<string, Pt>

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

const HOME: Record<string, string> = { h1: '1', h3: '3', h5: '5', h4: '4', h2: '2', h11: '11', h8: '8', h6: '6', h7: '7', h10: '10', h9: '9' }

// Nuestro 4-4-2 sin balón. `d`, `m` y `a` son la altura (x) de la defensa, el medio y la delantera; `cy` el centro del bloque a lo ancho.
function h442(d: number, m: number, a: number, cy: number): Shape {
  const y = (o: number) => clamp(cy + o, 2.5, 65.5)
  return {
    h1: [Math.min(25, Math.max(3, d - 18)), 34 + (cy - 34) * 0.3],
    h3: [d, y(-17)], h5: [d, y(-6)], h4: [d, y(6)], h2: [d, y(17)],
    h11: [m, y(-16)], h8: [m, y(-5)], h6: [m, y(5)], h7: [m, y(16)],
    h10: [a, y(-6)], h9: [a, y(6)],
  }
}

// Rival en 4-3-3 sacando el balón (ataca hacia la izquierda). `gx` es la altura de sus centrales.
const r433 = (gx: number): Shape => ({
  g: [Math.min(101, gx + 14), 34], c1: [gx, 24], c2: [gx, 44], f1: [gx - 12, 6], f2: [gx - 12, 62], p: [gx - 10, 34],
  i1: [gx - 22, 22], i2: [gx - 22, 46], w1: [gx - 36, 9], w2: [gx - 36, 59], n: [gx - 38, 34],
})

function cast(home: Shape, away: Shape, ball: Pt): Record<string, Token> {
  const c: Record<string, Token> = {}
  for (const [k, [x, y]] of Object.entries(home)) c[k] = player('home', HOME[k] ?? k, x, y)
  for (const [k, [x, y]] of Object.entries(away)) c[k] = player('away', k === 'g' ? '1' : '', x, y)
  c.b = ballAt(...ball)
  return c
}

// Balón a los pies de un jugador, un poco adelantado hacia donde mira.
const at = ([x, y]: Pt, dir: 1 | -1 = -1): Pt => [x + 0.9 * dir, y + 0.5]

// ---------- Bloques ----------

type BlockCfg = { d: number; m: number; a: number; gx: number; press?: boolean; up?: number[] }

function blockSteps(cfg: BlockCfg, notes: string[]): { c: Record<string, Token>; steps: Step[] } {
  const R = r433(cfg.gx)
  const seq = ['c1', 'f1', 'c1', 'c2', 'f2']
  const frames = seq.map((k, i) => {
    const away: Shape = { ...R }
    if (k[0] === 'f') away[k] = [R[k][0] - 4, R[k][1]]
    const hp = away[k]
    const ball = at(hp)
    const up = cfg.up?.[i] ?? 0
    const home = h442(cfg.d + up, cfg.m + up, cfg.a + up, 34 + (hp[1] - 34) * 0.5)
    if (cfg.press) {
      const top = hp[1] < 34, s = top ? 1 : -1
      if (k[0] === 'c') home[top ? 'h10' : 'h9'] = [hp[0] - 3.5, hp[1] + 3 * s]
      else {
        const cb = away[top ? 'c1' : 'c2']
        home[top ? 'h11' : 'h7'] = [hp[0] - 3, hp[1] + 3 * s]
        home[top ? 'h10' : 'h9'] = [(cb[0] + hp[0]) / 2 - 1, (cb[1] + hp[1]) / 2 + s]
      }
    }
    return { home, away, ball }
  })
  const c = cast(frames[0].home, frames[0].away, frames[0].ball)
  const steps: Step[] = frames.map((f, i) => ({
    note: notes[i],
    move: i ? { ...f.home, ...f.away, b: f.ball } : undefined,
    draw: frames[i + 1] ? [line('pass', [f.ball, frames[i + 1].ball])] : undefined,
  }))
  return { c, steps }
}

const block = (id: string, name: string, cfg: BlockCfg, notes: string[]): Template => ({
  id, group: 'Bloques', animated: true, name,
  build: () => {
    const { c, steps } = blockSteps(cfg, notes)
    // Franja que marca la zona que ocupa el bloque (de la defensa a la delantera).
    const zone = { ...line('zone', [[cfg.d - 2, 0.5], [cfg.a + 2, 67.5]]), color: '#ffffff' }
    return { ...animate('full', c, steps), drawings: [zone] }
  },
})

const bloqueBajo = block('blq-bajo', 'Bloque bajo: defender cerca del área', { d: 13, m: 24, a: 38, gx: 56 }, [
  'Bloque bajo: el equipo defiende cerca de su área con las líneas muy juntas. Dejamos el balón al rival lejos de nuestra portería y cerramos el centro.',
  'Pase al lateral: todo el bloque se desliza hacia esa banda (basculación). El lado contrario queda libre, pero está lejos del balón.',
  'Vuelve al central y el bloque vuelve al centro. Nadie sale solo a presionar: si uno salta, deja un hueco detrás.',
  'Cambio al otro central: bascular otra vez. Los delanteros tapan el pase al pivote para que el rival no juegue por dentro.',
  'Balón en la otra banda. Unos 25 m entre la defensa y la delantera: no hay espacio entre líneas. Útil contra rivales mejores o para cuidar un resultado; el riesgo es defender muy cerca de la portería.',
])

const bloqueMedio = block('blq-medio', 'Bloque medio: esperar en el centro del campo', { d: 30, m: 42, a: 55, gx: 80, up: [0, -2, 3, 2, -2] }, [
  'Bloque medio: los delanteros esperan cerca del centro del campo. Dejamos que los centrales rivales tengan el balón, pero no que avancen por dentro.',
  'Pase al lateral: el bloque bascula hacia esa banda y retrocede un poco. El extremo se acerca al lateral rival sin lanzarse.',
  'El balón vuelve atrás: el bloque sube unos metros, todos juntos. Los delanteros tapan al pivote con su cuerpo (sombra).',
  'Cambio al otro central: bascular hacia el otro lado manteniendo las distancias entre todos.',
  'Balón en la otra banda. Es el bloque más usado: equilibrio entre recuperar el balón y no dejar espacio a la espalda (unos 30 m de largo).',
])

const bloqueAlto = block('blq-alto', 'Bloque alto: presionar en campo rival', { d: 48, m: 62, a: 78, gx: 92, press: true }, [
  'Bloque alto: presionamos en campo rival con la defensa adelantada cerca del centro del campo. Queremos robar cerca de su portería.',
  'Pase al lateral: el extremo salta a presionarle y el delantero tapa el pase de vuelta al central. Todo el equipo se acerca al balón.',
  'Devuelve al central: el delantero de ese lado le presiona en curva para empujarle hacia la banda.',
  'Cambio al otro central: salta el otro delantero. Los mediocentros vigilan a los interiores rivales.',
  'Lateral presionado contra la banda. Riesgo: hay mucho espacio a la espalda de la defensa, por eso el portero juega adelantado y la presión tiene que ser de todos a la vez.',
])

const repliegue: Template = {
  id: 'blq-repliegue', group: 'Bloques', animated: true, name: 'Del bloque alto al bajo: replegar juntos',
  build: () => {
    const s0 = { home: h442(48, 62, 78, 29), away: r433(92), ball: at(r433(92).c1) }
    const a1 = r433(80), a2 = r433(62), a3 = r433(62)
    const s1 = { home: h442(30, 42, 55, 28), away: { ...a1, n: [36, 40] as Pt }, ball: at(a1.i1) }
    const s2 = { home: h442(13, 24, 38, 19.5), away: { ...a2, f1: [42, 6] as Pt, n: [16, 44] as Pt }, ball: at(a2.w1) }
    const s3 = { home: h442(24, 36, 50, 39), away: { ...a3, n: [28, 39] as Pt, p: [55, 29] as Pt }, ball: at(a3.c2) }
    const all = [s0, s1, s2, s3]
    const notes = [
      'Empezamos en bloque alto, presionando la salida del rival.',
      'El rival supera la presión con un pase a su interior. Ya no se puede presionar arriba: todos corren hacia atrás a la vez y forman un bloque medio.',
      'El rival avanza por la banda. El bloque se hunde hasta el área (bloque bajo) y bascula hacia el balón. Lo importante es replegar juntos, sin dejar huecos entre líneas.',
      'El rival pasa hacia atrás: es la señal para salir. Todo el bloque sube a la vez y gana metros. Si sube solo uno, se rompe el equipo.',
    ]
    const c = cast(s0.home, s0.away, s0.ball)
    return animate('full', c, all.map((f, i) => ({
      note: notes[i],
      move: i ? { ...f.home, ...f.away, b: f.ball } : undefined,
      draw: all[i + 1] ? [line('pass', [f.ball, all[i + 1].ball])] : undefined,
    })))
  },
}

// ---------- Presión alta a la salida del portero ----------

const presionSalida: Template = {
  id: 'pa-salida-portero', group: 'Presión alta', animated: true, name: 'Presión alta 4-4-2 al saque del portero: trampa en banda',
  build: () => {
    const c = cast(
      { h1: [40, 34], h3: [58, 10], h5: [58, 28], h4: [58, 40], h2: [58, 58], h11: [74, 14], h8: [72, 26], h6: [72, 42], h7: [74, 54], h10: [84, 28], h9: [84, 40] },
      { g: [101, 34], c1: [93, 20], c2: [93, 48], f1: [82, 5], f2: [82, 63], p: [87, 34], i1: [76, 24], i2: [76, 44], w1: [64, 7], w2: [64, 61], n: [62, 34] },
      [100.1, 34.5],
    )
    return animate('full', c, [
      { note: 'Saque del portero rival. Nuestros delanteros se colocan entre los centrales y el pivote: dejamos que el portero pase al central, porque así la presión empieza hacia un lado.', draw: [line('pass', [[100.1, 34.5], [92.2, 47.6]])] },
      { note: 'Pase al central: señal para saltar. El 9 presiona en curva, desde dentro, para que no pueda devolver al portero ni pasar al pivote. El 10 tapa al pivote.', move: { b: [92.2, 47.6], h9: [89, 43], h10: [87, 33], h7: [78, 56], h6: [73, 42], h8: [74, 30], h11: [72, 20], h3: [58, 16], h5: [58, 30], h4: [58, 42], h2: [60, 57], h1: [42, 38] }, draw: [press([[89, 43], [91, 46]]), line('pass', [[92.2, 47.6], [81.2, 62.6]])] },
      { note: 'Al central solo le queda el pase al lateral, pegado a la banda. La banda es nuestra trampa: la línea de cal funciona como un defensor más.', move: { b: [81.2, 62.6], h9: [90.5, 52], h7: [79, 58.5], h6: [75.5, 47], h10: [86, 38], h2: [62, 57.5], h4: [60, 48], p: [87, 38] }, draw: [press([[79, 58.5], [80.4, 61.2]])] },
      { note: 'Lateral encerrado: el 7 le presiona de frente, el 9 tapa el pase atrás, el 6 marca al interior y el 2 al extremo. Tiene que arriesgar un pase.', move: { h7: [80.4, 61.2], i2: [78.5, 46.5], w2: [65.5, 60.5] }, draw: [line('pass', [[81.2, 62.6], [77, 49.4]])] },
      { note: 'El 6 se anticipa y roba el pase. Robo a unos 30 m de la portería rival.', move: { b: [77, 49.4], h6: [76.2, 49.6] }, draw: [line('pass', [[77, 49.4], [90, 44]]), line('run', [[90.5, 52], [90, 45]])] },
      { note: 'Pase rápido al 9, que remata. Robar arriba es el camino más corto hacia el gol.', move: { b: [90, 44], h9: [89.6, 44.8] }, draw: [line('pass', [[90, 44], [104.7, 36]])] },
      { note: 'Gol. La presión funciona si todos saltan a la vez cuando llega la señal (aquí, el pase al central).', move: { b: [104.7, 36], g: [103.5, 35] } },
    ])
  },
}

// ---------- Transiciones ----------

const transAD: Template = {
  id: 'tr-ataque-defensa', group: 'Transiciones', animated: true, name: 'Transición ataque-defensa: presión tras pérdida y repliegue',
  build: () => {
    const c = cast(
      { h1: [22, 34], h3: [62, 8], h5: [45, 24], h4: [45, 46], h2: [60, 58], h6: [56, 34], h8: [72, 22], h11: [84, 8], h7: [82, 56], h10: [86, 30], h9: [89, 36] },
      { g: [102, 34], d1: [92, 14], d2: [93, 27], d3: [93, 41], d4: [92, 54], m1: [81, 25], m2: [84, 36], m3: [82, 48], w1: [76, 10], w2: [74, 60], n: [64, 34] },
      [72.9, 22.4],
    )
    const block = h442(30, 42, 55, 45)
    return animate('full', c, [
      { note: 'Atacamos en campo rival. El 8 intenta un pase al 10 entre líneas.', draw: [line('pass', [[72.9, 22.4], [85, 29.6]])] },
      { note: 'Pérdida: un rival corta el pase. Empiezan los 5 segundos de presión tras pérdida.', move: { b: [79.6, 26.4], m1: [80.4, 26.9] }, draw: [press([[72, 22], [77.6, 25.2]]), press([[86, 30], [82.6, 28.4]]), press([[56, 34], [76, 30.5]])] },
      { note: 'Contrapresión: los tres más cercanos (8, 10 y 6) rodean al que robó. El resto se junta para tapar los pases cortos. La defensa sube para no dejar espacio entre líneas.', move: { h8: [78, 25.2], h10: [82.6, 28.6], h6: [76, 30.5], h11: [80, 15], h3: [66, 14], h9: [86, 36], h7: [74, 48], h5: [50, 26], h4: [50, 42], h2: [60, 54] }, draw: [line('pass', [[79.6, 26.4], [72, 59.5]])] },
      { note: 'El rival escapa con un cambio de orientación. Pasados los 5 segundos sin recuperar, toca replegar: todos corren hacia nuestra portería por el camino más corto.', move: { b: [72, 59.5], w2: [72.6, 60.2], m1: [80, 33] }, draw: [line('run', [[76, 30.5], [52, 36], block.h6]), line('run', [[78, 25.2], [56, 30], block.h8]), line('run', [[66, 14], [48, 22], block.h3])] },
      { note: 'Repliegue a bloque medio: el equipo se junta detrás del balón e inclinado hacia su banda. Ya estamos ordenados otra vez.', move: { ...block, b: [63.1, 56.3], w2: [64, 56], m1: [70, 30], m2: [74, 34], m3: [70, 46], n: [52, 34], d1: [84, 16], d2: [86, 28], d3: [86, 40], d4: [84, 52], w1: [62, 10] }, draw: [press([block.h7, [60.5, 57]])] },
      { note: 'Ahora el 7 sale a presionar al extremo con el 2 cubriendo detrás. Regla: si la presión tras pérdida no funciona en 5 segundos, se repliega.', move: { h7: [61, 57], h2: [34, 58], h6: [42, 46] } },
    ])
  },
}

const transDA: Template = {
  id: 'tr-defensa-ataque', group: 'Transiciones', animated: true, name: 'Transición defensa-ataque: robo en bloque bajo y contraataque',
  build: () => {
    const c = cast(
      h442(14, 26, 40, 30),
      { g: [88, 34], c1: [60, 22], c2: [60, 46], f1: [44, 6], f2: [44, 62], p: [50, 34], i1: [34, 26], i2: [36, 44], w1: [22, 8], w2: [22, 60], n: [18, 34] },
      [33.1, 26.4],
    )
    return animate('full', c, [
      { note: 'Defendemos en bloque bajo. El rival, con mucha gente arriba, intenta un pase a su 9 entre nuestras líneas.', draw: [line('pass', [[33.1, 26.4], [18.9, 33.6]])] },
      { note: 'Robo: el 6 corta el pase. El rival está adelantado y desordenado: es el mejor momento para atacar.', move: { b: [25.2, 31.2], h6: [24.4, 31.6] }, draw: [line('pass', [[25.2, 31.2], [38.6, 24.6]]), line('run', [[40, 36], [52, 38], [64, 41]]), line('run', [[26, 14], [38, 11], [50, 12]]), line('run', [[26, 46], [38, 52], [50, 55]])] },
      { note: 'Primer pase hacia delante, al 10. El 9 y los extremos ya corren hacia la portería rival: en la transición, la primera mirada es hacia delante.', move: { b: [38.6, 24.6], h10: [39.5, 24.2], h9: [50, 38], h11: [40, 11], h7: [40, 54], i1: [30, 28], p: [44, 32], c1: [56, 26], c2: [56, 42] }, draw: [line('pass', [[39.5, 24.2], [66, 41]]), line('run', [[50, 38], [65.5, 41.4]])] },
      { note: 'Pase al espacio a la espalda de los centrales: el 9 llega antes porque ya venía corriendo.', move: { b: [66, 41], h9: [65.5, 41.4], h11: [58, 14], h7: [58, 54], h10: [50, 30], c1: [62, 30], c2: [62, 44], f2: [54, 56] }, draw: [line('dribble', [[65.5, 41.4], [74, 40], [82, 38]]), line('run', [[58, 14], [72, 20], [85, 27]])] },
      { note: 'El 9 conduce hacia la portería y el 11 le acompaña por dentro: 2 contra 1 con el central.', move: { h9: [82, 38], b: [82.9, 38.3], h11: [85, 27], c1: [80, 33], c2: [76, 44], g: [100, 35], h10: [66, 32] }, draw: [line('pass', [[82.9, 38.3], [89.6, 28.8]])] },
      { note: 'El central sale a por el 9, que pasa al 11, libre.', move: { b: [89.6, 28.8], h11: [89.2, 28.2], c1: [85, 34.5] }, draw: [line('pass', [[89.6, 28.8], [104.7, 32]])] },
      { note: 'Gol. Del robo al gol en pocos pases y en unos 10 segundos, antes de que el rival se reorganice.', move: { b: [104.7, 32], g: [103, 33] } },
    ])
  },
}

// ---------- Generar espacios ----------

const arrastre: Template = {
  id: 'esp-arrastre', group: 'Generar espacios', animated: true, name: 'Arrastre del 9: abrir hueco a la espalda',
  build: () => {
    const c: Record<string, Token> = {
      h8: player('home', '8', 24, 30), h6: player('home', '6', 18, 38), h3: player('home', '3', 28, 8), h10: player('home', '10', 34, 40), h9: player('home', '9', 44, 34), h11: player('home', '11', 40, 6), h7: player('home', '7', 40, 62),
      g: player('away', '1', 51.5, 34), d1: player('away', '', 42, 14), d2: player('away', '', 42, 28), d3: player('away', '', 42, 40), d4: player('away', '', 42, 54), m1: player('away', '', 33, 22), m2: player('away', '', 31, 34), m3: player('away', '', 33, 46),
      b: ballAt(24.9, 30.4),
    }
    return animate('half', c, [
      { note: 'El 9 está a la altura de los centrales. La defensa rival está ordenada y no hay espacio a su espalda.', draw: [line('run', [[44, 34], [40, 33], [36.5, 31.5]])] },
      { note: 'El 9 baja a recibir y su central le persigue para no dejarle girarse. Se abre un hueco en la defensa.', move: { h9: [36.5, 31.5], d2: [38.6, 30.6], d1: [42, 17], d3: [42, 38] }, draw: [line('run', [[40, 6], [43, 14], [46, 22]]), line('pass', [[24.9, 30.4], [46.5, 23]])] },
      { note: 'El 11 ataca ese hueco en diagonal y el 8 pone el balón al espacio.', move: { b: [46.5, 23], h11: [46, 22.4], d1: [44, 19] }, draw: [line('pass', [[46.5, 23], [52.3, 31.5]])] },
      { note: 'El 11 llega antes que el defensor y remata. Moverse para arrastrar a un rival también es ayudar al equipo, aunque no toques el balón.', move: { b: [52.3, 31.5], g: [51.8, 32.5] } },
    ])
  },
}

const fijar: Template = {
  id: 'esp-fijar-soltar', group: 'Generar espacios', animated: true, name: 'Fijar y soltar: 2 contra 1 en banda',
  build: () => {
    const c: Record<string, Token> = {
      h3: player('home', '3', 22, 12), h11: player('home', '11', 34, 3), h9: player('home', '9', 38, 32),
      g: player('away', '1', 51.5, 34), f: player('away', '', 37, 9), d1: player('away', '', 43, 24), d2: player('away', '', 43, 36),
      b: ballAt(22.9, 12.4),
    }
    return animate('half', c, [
      { note: '2 contra 1 en banda: el 3 tiene el balón, el 11 está abierto y hay un solo defensor para los dos.', draw: [line('dribble', [[22, 12], [26, 11.5], [31, 11]])] },
      { note: 'Fijar: el 3 conduce directo hacia el defensor. Si el defensor no sale, el 3 sigue hasta el área.', move: { h3: [31, 11], b: [31.9, 11.2], f: [35.5, 9.5], h11: [37, 3] }, draw: [line('pass', [[31.9, 11.2], [40.6, 4]]), line('run', [[37, 3], [40.2, 3.5]])] },
      { note: 'Soltar: cuando el defensor sale a por el 3, pase al 11, que queda solo.', move: { b: [40.6, 4], h11: [40.2, 3.5], f: [33.5, 10.5] }, draw: [line('dribble', [[40.2, 3.5], [44, 5], [48, 8]]), line('run', [[38, 32], [43, 31], [46.8, 30.3]])] },
      { note: 'El 11 conduce hasta el área y busca al 9, que ataca el punto de penalti.', move: { h11: [48, 8], b: [48.6, 8.6], h9: [46.8, 30.3], d1: [45.5, 25], f: [40, 9] }, draw: [line('pass', [[48.6, 8.6], [46.8, 31]])] },
      { note: 'Pase atrás y remate. Fijar es atraer a un rival hacia ti para que un compañero quede libre.', move: { b: [46.8, 31] }, draw: [line('pass', [[46.8, 31], [52.3, 35.5]])] },
      { note: 'Gol.', move: { b: [52.3, 35.5], g: [51.8, 34.5] } },
    ])
  },
}

const cambio: Template = {
  id: 'esp-cambio-orientacion', group: 'Generar espacios', animated: true, name: 'Cargar un lado y cambiar de orientación',
  build: () => {
    const c: Record<string, Token> = {
      h1: player('home', '1', 30, 34), h5: player('home', '5', 46, 24), h4: player('home', '4', 46, 44), h3: player('home', '3', 60, 6), h6: player('home', '6', 56, 26), h8: player('home', '8', 66, 18),
      h11: player('home', '11', 76, 8), h10: player('home', '10', 74, 26), h9: player('home', '9', 84, 30), h7: player('home', '7', 80, 60), h2: player('home', '2', 62, 60),
      g: player('away', '1', 102, 32), d1: player('away', '', 88, 12), d2: player('away', '', 90, 22), d3: player('away', '', 90, 32), d4: player('away', '', 88, 42),
      m1: player('away', '', 78, 10), m2: player('away', '', 78, 18), m3: player('away', '', 79, 27), m4: player('away', '', 78, 36), f1: player('away', '', 69, 24), f2: player('away', '', 66, 32),
      b: ballAt(66.9, 18.4),
    }
    return animate('full', c, [
      { note: 'Juntamos a mucha gente en la banda izquierda. El rival se inclina hacia ese lado para defenderla.', draw: [line('pass', [[66.9, 18.4], [73.6, 26.4]])] },
      { note: 'Más pases cortos en esa zona y el rival se junta todavía más. Mira cuánto espacio hay ahora en la otra banda.', move: { b: [73.6, 26.4], m1: [78, 12], m2: [77, 20], m3: [78, 28], m4: [79, 37], d1: [88, 14], d2: [90, 23], d3: [90, 32], d4: [89, 40], f1: [69, 25], f2: [67, 32] }, draw: [line('pass', [[73.6, 26.4], [80, 59.4]])] },
      { note: 'Cambio de orientación: pase largo al 7, que recibe solo en la banda contraria.', move: { b: [80, 59.4], h7: [80.4, 60.1], d4: [90, 45], m4: [81, 43] }, draw: [line('dribble', [[80.4, 60.1], [86, 57], [92, 52]]), line('run', [[62, 60], [74, 63], [88, 62]])] },
      { note: 'El 7 tiene espacio para encarar o centrar, con el 2 doblando por fuera. El rival llega tarde a esta banda.', move: { h7: [92, 52], b: [92.8, 52.2], h2: [88, 62], d4: [94, 46], m4: [86, 48], h9: [94, 38.5], d3: [96, 31] }, draw: [line('pass', [[92.8, 52.2], [98, 38.6]]), line('run', [[94, 38.5], [97.4, 38]])] },
      { note: 'Centro al 9. Atraer al rival hacia un lado sirve para atacar el otro.', move: { b: [98, 38.6], h9: [97.4, 38], g: [103, 35] }, draw: [line('pass', [[98, 38.6], [104.7, 32.5]])] },
      { note: 'Gol.', move: { b: [104.7, 32.5] } },
    ])
  },
}

export const TACTICS: Template[] = [bloqueBajo, bloqueMedio, bloqueAlto, repliegue, presionSalida, transAD, transDA, arrastre, fijar, cambio]
