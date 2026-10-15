// Fundamentos: lo que hay que entender para leer un partido. Pensado para que cualquiera,
// sepa o no de fútbol, se sienta cómodo con la app desde el primer día.
import { ballAt, line, player, type Board, type Pt, type Token } from './model'
import { animate, press, type Template } from './anim'
import { t } from './i18n'

export interface Lesson {
  id: string
  title: string
  summary: string
  points: string[]
  // Plantillas que lo muestran en la pizarra (la primera se abre con "Ver en la pizarra").
  templates?: string[]
  zones?: boolean
}

// ---------- Plantillas de apoyo ----------

const fases: Template = {
  id: 'fun-fases', group: 'Fundamentos', animated: true, name: t('Las 4 fases del juego'),
  build: () => {
    const c: Record<string, Token> = {
      g: player('home', '1', 10, 34), d1: player('home', '4', 40, 20), d2: player('home', '5', 40, 48), m1: player('home', '8', 58, 26), m2: player('home', '6', 62, 44), a1: player('home', '9', 80, 14), a2: player('home', '10', 84, 40),
      G: player('away', '1', 102, 34), e1: player('away', '', 90, 24), e2: player('away', '', 90, 44), n1: player('away', '', 74, 22), n2: player('away', '', 76, 46), f1: player('away', '', 64, 32), f2: player('away', '', 66, 52),
      b: ballAt(58.9, 26.4),
    }
    return animate('full', c, [
      { note: t('Fase 1. Ataque organizado: tenemos el balón y el rival está colocado. Ocupamos el campo a lo ancho y a lo largo para encontrar un hueco.'), draw: [line('pass', [[58.9, 26.4], [75.6, 35.6]])] },
      { note: t('Fase 2. Transición defensiva: un rival corta el pase y perdemos el balón. Los más cercanos presionan al momento y el resto corre a cerrar huecos.'), move: { b: [75.6, 35.6], n2: [76.4, 36.6] }, draw: [press([[62, 44], [73.4, 38.2]]), press([[84, 40], [78.6, 38]]), line('run', [[40, 20], [32, 24], [28, 26]]), line('run', [[40, 48], [32, 44], [28, 42]])] },
      { note: t('Fase 3. Defensa organizada: el rival supera la presión. Nos juntamos en bloque detrás del balón y cerramos el centro.'), move: { b: [59.1, 22.4], n1: [60, 22], n2: [68, 40], f1: [49, 33], f2: [50, 47], e1: [80, 26], e2: [80, 42], G: [100, 34], g: [8, 34], d1: [28, 26], d2: [28, 42], m1: [40, 24], m2: [40, 40], a1: [55, 28], a2: [55, 42] }, draw: [line('pass', [[59.1, 22.4], [45.6, 26.4]])] },
      { note: t('Fase 4. Transición ofensiva: el 8 corta el pase y robamos. Primer pase hacia delante para atacar antes de que el rival se ordene.'), move: { b: [45.6, 26.4], m1: [44.8, 26.9], f1: [49, 32.5] }, draw: [line('pass', [[45.6, 26.4], [70, 31]]), line('run', [[55, 28], [62, 30], [69.4, 31.6]]), line('run', [[55, 42], [64, 43], [72, 44]])] },
      { note: t('El 9 recibe lanzado y el 10 le acompaña: contraataque con el rival corriendo hacia atrás.'), move: { b: [70, 31], a1: [69.4, 31.6], a2: [72, 44], n1: [62, 25], n2: [64, 38], e1: [84, 28], e2: [84, 40] }, draw: [line('dribble', [[69.4, 31.6], [75, 32], [80, 32]]), line('run', [[72, 44], [80, 45], [86, 46]])] },
      { note: t('Pase al 10, solo. Las 4 fases se repiten todo el partido: atacar, perder, defender y recuperar. El balón parado (córners, faltas) es un momento aparte.'), move: { a1: [80, 32], b: [80.9, 32.4], a2: [86, 46], e2: [88, 40], e1: [86, 30] }, draw: [line('pass', [[80.9, 32.4], [85.6, 45.4]])] },
      { note: t('Fin de la jugada. Al ver un partido, pregúntate siempre en qué fase está cada equipo.'), move: { b: [85.6, 45.4] } },
    ])
  },
}

const POS: [string, number, number][] = [
  [t('POR'), 4, 34], [t('LI'), 22, 9], [t('DFC'), 18, 26], [t('DFC'), 18, 42], [t('LD'), 22, 59],
  [t('MCD'), 30, 34], [t('MC'), 40, 24], [t('MC'), 40, 44], [t('EI'), 54, 9], [t('DC'), 58, 34], [t('ED'), 54, 59],
]

const posiciones: Template = {
  id: 'fun-posiciones', group: 'Fundamentos', name: t('Nombres de las posiciones (4-3-3)'),
  build: (): Board => ({ pitch: 'full', tokens: POS.map(([n, x, y]) => player('home', n, x, y)), drawings: [] }),
}

const carriles: Template = {
  id: 'fun-carriles', group: 'Fundamentos', name: t('Carriles y zonas del campo'),
  build: (): Board => {
    const half = (x0: number, x1: number, y0: number, y1: number, color: string) => ({ ...line('zone', [[x0, y0], [x1, y1]] as Pt[]), color })
    return {
      pitch: 'full',
      tokens: [
        player('home', '3', 40, 6), player('home', '8', 58, 19), player('home', '9', 70, 34), player('home', '10', 58, 49), player('home', '2', 40, 62),
      ],
      // Los dos "intervalos" o medios espacios, la zona más valiosa para recibir entre líneas.
      drawings: [half(52.5, 88.5, 13.84, 24.84, '#ffd23f'), half(52.5, 88.5, 43.16, 54.16, '#ffd23f')],
    }
  },
}

export const FUND_TEMPLATES: Template[] = [fases, carriles, posiciones]

// ---------- Lecciones ----------

export const LESSONS: Lesson[] = [
  {
    id: 'fases', title: t('Las 4 fases del juego'),
    summary: t('Todo lo que pasa en un partido cabe en cuatro momentos, más el balón parado.'),
    points: [
      t('Ataque organizado: tienes el balón y el rival está colocado. Toca ser paciente y mover al rival hasta encontrar un hueco.'),
      t('Transición defensiva (ataque → defensa): acabas de perder el balón. O presionas al momento para recuperarlo (unos 5 segundos) o corres a colocarte.'),
      t('Defensa organizada: el rival tiene el balón y tu equipo está colocado en bloque. Toca cerrar espacios y elegir cuándo presionar.'),
      t('Transición ofensiva (defensa → ataque): acabas de robar. El rival está desordenado: es el mejor momento para atacar rápido.'),
      t('Balón parado (ABP): córners, faltas, saques de banda, penaltis. Un momento aparte que se entrena y se ensaya.'),
    ],
    templates: ['fun-fases', 'tr-ataque-defensa', 'tr-defensa-ataque'],
  },
  {
    id: 'carriles', title: t('Carriles y zonas del campo'),
    summary: t('Dividir el campo en franjas ayuda a explicar dónde está cada jugador y dónde hay espacio.'),
    points: [
      t('A lo largo, el campo se divide en 5 carriles: 2 bandas, 2 interiores (también llamados intervalos o medios espacios) y el carril central. Las líneas de las áreas marcan esas franjas.'),
      t('Los carriles interiores son la zona más valiosa para recibir: desde ahí se ve la portería y se puede pasar a la banda o al centro.'),
      t('A lo ancho se habla de tercios: defensivo (cerca de tu portería), medio y ofensivo (cerca de la portería rival).'),
      t('Regla clásica de juego de posición: no más de 2 jugadores en el mismo carril, y no dos en la misma línea del mismo carril.'),
      t('Pulsa “Zonas” arriba para ver los carriles en cualquier pizarra.'),
    ],
    templates: ['fun-carriles'],
    zones: true,
  },
  {
    id: 'posiciones', title: t('Posiciones y dorsales'),
    summary: t('Cada posición tiene un nombre corto. Así se leen en las alineaciones.'),
    points: [
      t('POR: portero. DFC: defensa central. LI / LD: lateral izquierdo / derecho. En defensa de 5 aparecen los carrileros, laterales que suben toda la banda.'),
      t('MCD: mediocentro defensivo o pivote, el que protege a la defensa. MC: mediocentro o interior. MP: mediapunta, juega detrás del delantero.'),
      t('EI / ED: extremo izquierdo / derecho, abiertos en la banda. DC: delantero centro (el 9). Falso 9: delantero que baja a recibir al centro del campo.'),
      t('Dorsales tradicionales: 1 portero, 2 y 3 laterales, 4, 5 y 6 centrales o pivote, 8 interior, 10 mediapunta, 7 y 11 extremos, 9 delantero.'),
      t('Izquierda y derecha se cuentan siempre mirando hacia la portería rival.'),
    ],
    templates: ['fun-posiciones'],
  },
  {
    id: 'sistemas', title: t('Sistemas y alineaciones'),
    summary: t('Los números del sistema son los jugadores de cada línea, de atrás hacia delante, sin contar al portero.'),
    points: [
      t('4-3-3 = 4 defensas, 3 centrocampistas y 3 delanteros. Siempre suman 10, porque el portero no se cuenta.'),
      t('El sistema cambia según tenga o no el balón: un 4-3-3 suele defender como 4-5-1 y atacar como 3-2-5 o 2-3-5.'),
      t('Más jugadores en el centro del campo (4-3-3, 4-2-3-1, 3-5-2) ayuda a tener el balón. Dos líneas de cuatro (4-4-2) son más sencillas para defender.'),
      t('Con 3 centrales (3-5-2, 3-4-3, 5-3-2) los carrileros dan la amplitud. Sin balón, el equipo defiende con 5 atrás.'),
      t('Para analizar al rival, mira dónde le sobra gente y dónde le falta: ahí está la superioridad y el espacio.'),
    ],
    templates: ['sys-4-3-3-4-4-2', 'sys-4-2-3-1-4-3-3', 'sys-3-5-2-4-2-3-1', 'sys-4-4-2-4-4-2', 'sys-4-1-4-1-4-3-3', 'sys-3-4-3-4-4-2', 'sys-5-3-2-4-3-3'],
  },
  {
    id: 'bloques', title: t('Bloque alto, medio y bajo'),
    summary: t('El bloque es la altura a la que defiende el equipo cuando el rival tiene el balón.'),
    points: [
      t('Bloque alto: se presiona en campo rival, con la defensa cerca del centro del campo. Se roba cerca de la portería contraria, pero queda mucho espacio a la espalda.'),
      t('Bloque medio: el equipo espera cerca del centro del campo. Equilibrio entre recuperar y no dejar espacio detrás.'),
      t('Bloque bajo: el equipo defiende cerca de su área. Protege la portería, pero el balón se roba lejos de la portería rival.'),
      t('En cualquier bloque las líneas tienen que estar juntas (unos 30–35 m entre el defensa más atrasado y el delantero) y bascular hacia el lado del balón.'),
    ],
    templates: ['blq-alto', 'blq-medio', 'blq-bajo', 'blq-repliegue'],
  },
  {
    id: 'principios-of', title: t('Principios para atacar'),
    summary: t('Ideas que usan casi todos los equipos para atacar bien, sea cual sea su sistema.'),
    points: [
      t('Amplitud: jugadores pegados a las bandas para estirar al rival a lo ancho.'),
      t('Profundidad: alguien que amenaza la espalda de la defensa para que no pueda adelantarse.'),
      t('Apoyo: el que tiene el balón siempre necesita compañeros cerca para pasarla.'),
      t('Movilidad: desmarques de apoyo (vengo a recibir) y de ruptura (me voy a la espalda) para crear espacios.'),
      t('Superioridad: buscar zonas donde hay más compañeros que rivales (2 contra 1, 3 contra 2).'),
    ],
    templates: ['esp-fijar-soltar', 'esp-arrastre', 'esp-cambio-orientacion', 'anim-tercer'],
  },
  {
    id: 'principios-def', title: t('Principios para defender'),
    summary: t('Cómo se defiende en equipo para que el rival no encuentre espacios.'),
    points: [
      t('Presión: un jugador sale al que tiene el balón para que no pueda pensar ni girarse.'),
      t('Cobertura: un compañero se coloca detrás del que presiona por si le superan.'),
      t('Basculación: todo el bloque se desliza hacia el lado del balón.'),
      t('Repliegue: correr hacia la propia portería para colocarse cuando el rival ha superado la presión.'),
      t('Temporizar: frenar al rival sin lanzarse, ganando tiempo hasta que lleguen las ayudas.'),
    ],
    templates: ['blq-medio', 'pa-salida-portero', 'anim-presion'],
  },
]

export const GLOSSARY: [string, string][] = [
  [t('Basculación'), t('El bloque se desliza hacia el lado donde está el balón.')],
  [t('Bloque'), t('La forma y la altura del equipo cuando defiende.')],
  [t('Cambio de orientación'), t('Pase largo de un lado al otro del campo para atacar donde hay espacio.')],
  [t('Carril'), t('Cada una de las 5 franjas a lo largo del campo.')],
  [t('Contrapresión'), t('Presionar justo después de perder el balón para recuperarlo rápido.')],
  [t('Desmarque de apoyo'), t('Moverse hacia el balón para ofrecer un pase corto.')],
  [t('Desmarque de ruptura'), t('Correr a la espalda de la defensa para recibir en profundidad.')],
  [t('Entre líneas'), t('Espacio entre la defensa y el centro del campo del rival.')],
  [t('Fijar'), t('Atraer a un rival hacia ti para que un compañero quede libre.')],
  [t('Intervalo'), t('Hueco entre dos defensores rivales, sobre todo entre central y lateral.')],
  [t('Línea de pase'), t('El camino libre por el que puede ir un pase.')],
  [t('Pivote'), t('El mediocentro que juega delante de la defensa.')],
  [t('Repliegue'), t('Volver corriendo hacia la propia portería para colocarse.')],
  [t('Sombra (de pase)'), t('Taparle un pase al rival poniéndote entre el balón y su compañero.')],
  [t('Superioridad'), t('Tener más jugadores que el rival en una zona.')],
  [t('Tercer hombre'), t('Combinación en la que el balón llega a un jugador libre a través de otro.')],
  [t('Transición'), t('Los segundos justo después de ganar o perder el balón.')],
]
