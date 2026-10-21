// Más plantillas animadas: ejercicios de entrenamiento y acciones a balón parado (fútbol 11, adultos).
// Coordenadas en metros. Medio campo: x=0 es la línea central y x=52.5 la línea de fondo, portería en (52.5, 34).
// Espacio 40×30 para los ejercicios en espacio reducido.
import { ballAt, coneAt, item, line, player, type Pt, type Token } from '../model'
import { animate, press, type Template } from '../anim'
import { t } from '../i18n'

// Conos en las cuatro esquinas de un rectángulo.
const corners = (x1: number, y1: number, x2: number, y2: number): Token[] =>
  [[x1, y1], [x2, y1], [x2, y2], [x1, y2]].map(([x, y]) => coneAt(x, y))

const GRID = () => corners(0, 0, 40, 30)

// ---------- Ejercicios ----------

const rondoTransicion: Template = {
  id: 'ej2-rondo-transicion', group: 'Ejercicios', animated: true, name: t('Rondo 5 contra 2 con transición'),
  build: () => {
    const c = {
      a1: player('home', '1', 13, 7), a2: player('home', '2', 20.6, 12.5), a3: player('home', '3', 17.7, 21.5), a4: player('home', '4', 8.3, 21.5), a5: player('home', '5', 5.4, 12.5),
      d1: player('away', '', 12, 12), d2: player('away', '', 15, 17),
      b: ballAt(13.6, 7.7),
    }
    return animate('grid', c, [
      { note: t('Rondo 5 contra 2 dentro del cuadrado. Si los defensores roban, tienen que salir conduciendo por la puerta de conos de la derecha.'), draw: [line('pass', [[13.6, 7.7], [19.9, 12.9]])] },
      { note: t('Pase al 2. Un defensor sale a presionarle y el otro se queda en medio para tapar los pases.'), move: { b: [19.9, 12.9], d1: [17.2, 11.6], d2: [15, 16.2] }, draw: [line('pass', [[19.9, 12.9], [15.8, 15.9]])] },
      { note: t('¡El defensor corta el pase! Es la transición: ahora él quiere salir por la puerta y los atacantes más cercanos presionan al momento.'), move: { b: [15.8, 15.9], d2: [15.1, 16.6] }, draw: [line('dribble', [[15.1, 16.6], [20, 16.6], [24, 16.5]]), press([[20.6, 12.5], [24.4, 13.9]]), press([[17.7, 21.5], [22.6, 19.1]])] },
      { note: t('El 2 y el 3 cierran al que conduce. Su compañero se ofrece, pero tiene que alejarse mucho.'), move: { d2: [24, 16.5], b: [24.9, 16.6], a2: [24.4, 13.9], a3: [22.6, 19.1], d1: [25, 9.5] }, draw: [press([[22.6, 19.1], [24.6, 18.8]])] },
      { note: t('El 3 roba antes de que el rival cruce la puerta. Si el rival la cruza, gana un punto y se cambian los papeles.'), move: { a3: [24.6, 18.8], b: [24.5, 17.9] } },
    ], [...corners(3, 5, 23, 25), coneAt(34, 12.5), coneAt(34, 18.5)])
  },
}

const posicionOrientacion: Template = {
  id: 'ej2-posicion-orientacion', group: 'Ejercicios', animated: true, name: t('Juego de posición 4 + 3 comodines contra 4: cambio de orientación'),
  build: () => {
    const c = {
      h1: player('home', '1', 7, 7), h2: player('home', '2', 31, 6), h3: player('home', '3', 7, 23), h4: player('home', '4', 32, 23),
      cT: player('neutral', 'C', 20, 1.2), cB: player('neutral', 'C', 20, 28.8), cM: player('neutral', 'C', 19, 15),
      r1: player('away', '', 12, 9), r2: player('away', '', 14, 19), r3: player('away', '', 22, 10), r4: player('away', '', 25, 20),
      b: ballAt(7.6, 7.8),
    }
    return animate('grid', c, [
      { note: t('4 contra 4 y 3 comodines (C) que siempre juegan con el equipo que tiene el balón. Los rivales se juntan cerca del balón.'), draw: [line('pass', [[7.6, 7.8], [7.6, 22.1]])] },
      { note: t('Pase al 3. Los rivales corren hacia ese lado para encerrarle contra la línea.'), move: { b: [7.6, 22.1], r1: [10, 15.5], r2: [11, 24.5], r3: [15, 11], r4: [19, 21.5] }, draw: [line('pass', [[7.6, 22.1], [17.6, 16.2]])] },
      { note: t('El 3 no se complica: pase al comodín del centro, que recibe de cara. Todos los rivales están en un lado y el otro está vacío.'), move: { b: [17.6, 16.2], cM: [18.4, 15.8], r3: [16.5, 12.6] }, draw: [line('pass', [[17.6, 16.2], [31.2, 21.7]])] },
      { note: t('Cambio de orientación: el 4 recibe solo en el lado contrario, con tiempo y espacio. Eso vale un punto.'), move: { b: [31.2, 21.7], h4: [32, 22.2], r4: [23, 21], r3: [20, 12], r2: [13, 22], r1: [13, 14] }, draw: [line('dribble', [[32, 22.2], [34.5, 18], [36, 14]])] },
      { note: t('Los rivales tienen que cruzar todo el espacio para llegar. Si el balón cambia de lado rápido, siempre llegan tarde.'), move: { h4: [36, 14], b: [36.6, 13.3], r4: [29, 19], r3: [25, 13] } },
    ], GRID())
  },
}

const dosContraUno: Template = {
  id: 'ej2-2c1-1c1', group: 'Ejercicios', animated: true, name: t('2 contra 1 + 1 contra 1 y finalización'),
  build: () => {
    const c = {
      a: player('home', '7', 8, 28), bb: player('home', '9', 8, 40),
      d1: player('away', '', 20, 34), d2: player('away', '', 36, 34), gk: player('away', '1', 51.8, 34),
      b: ballAt(8.9, 28.4),
    }
    return animate('half', c, [
      { note: t('Zona 1 (entre conos): 2 contra 1. Después, 1 contra 1 con el portero. Cada defensor solo puede defender en su zona.'), draw: [line('dribble', [[8, 28], [12, 29], [16, 30]]), line('run', [[8, 40], [13, 41.5], [18, 42]])] },
      { note: t('El 7 conduce directo hacia el defensor para fijarle. Si el defensor sale a por él, el 9 queda libre.'), move: { a: [16, 30], b: [16.9, 30.4], bb: [18, 42], d1: [19.5, 32.5] }, draw: [line('pass', [[16.9, 30.4], [22.3, 40.9]]), line('run', [[18, 42], [23.1, 41.3]])] },
      { note: t('El 9 recibe y cruza la línea de conos: 2 contra 1 superado. Ahora empieza el 1 contra 1.'), move: { b: [22.3, 40.9], bb: [23.1, 41.3], d1: [21, 36], a: [24, 30] }, draw: [line('dribble', [[23.1, 41.3], [27, 40.5], [30.5, 39.5]]), press([[36, 34], [35, 36.2]])] },
      { note: t('Sale el segundo defensor. El 9 le encara: amaga hacia dentro y sale por fuera.'), move: { bb: [30.5, 39.5], b: [31.4, 39.3], d2: [35, 36.2] }, draw: [line('dribble', [[30.5, 39.5], [34, 41.5], [38.5, 42.5]])] },
      { note: t('Defensor superado. El portero cierra su palo y el 9 tira cruzado, al otro palo.'), move: { bb: [38.5, 42.5], b: [39.3, 42.1], d2: [36.5, 39], gk: [51.7, 36] }, draw: [line('pass', [[39.3, 42.1], [52.3, 31]])] },
      { note: t('Gol. Se cambian los papeles y sale la siguiente pareja.'), move: { b: [52.2, 31] } },
    ], [...corners(6, 18, 28, 50)])
  },
}

const paredRuptura: Template = {
  id: 'ej2-pared-ruptura', group: 'Ejercicios', animated: true, name: t('Pared y desmarque de ruptura con tiro'),
  build: () => {
    const c = {
      a: player('home', '8', 22, 34), bb: player('home', '10', 34, 27), cc: player('home', '9', 31, 42),
      gk: player('away', '1', 51.8, 34),
      b: ballAt(22.9, 33.6),
    }
    return animate('half', c, [
      { note: t('Los maniquíes hacen de defensa. El 10 se acerca al balón (apoyo) para hacer la pared con el 8.'), draw: [line('run', [[34, 27], [32, 30]]), line('pass', [[22.9, 33.6], [31.2, 30.4]])] },
      { note: t('Pase al 10. Justo después, el 8 arranca para recibir la devolución por detrás de los maniquíes.'), move: { bb: [32, 30], b: [31.2, 30.4] }, draw: [line('pass', [[31.2, 30.4], [42.1, 31.3]]), line('run', [[22, 34], [41.3, 31.6]])] },
      { note: t('Pared hecha: el 8 está detrás de la defensa. A la vez, el 9 hace un desmarque de ruptura en diagonal, a la espalda.'), move: { a: [41.3, 31.6], b: [42.1, 31.3] }, draw: [line('run', [[31, 42], [46.3, 41.1]]), line('pass', [[42.1, 31.3], [45.6, 40.5]])] },
      { note: t('El 9 recibe solo delante del portero y tira cruzado.'), move: { cc: [46.3, 41.1], b: [45.6, 40.5], gk: [51.4, 37] }, draw: [line('pass', [[45.6, 40.5], [52.3, 31]])] },
      { note: t('Gol. Se repite cambiando los papeles: el que tira pasa a hacer de apoyo.'), move: { b: [52.2, 31] } },
    ], [item('mannequin', 37, 26), item('mannequin', 37, 36), item('mannequin', 37, 44), coneAt(20, 34)])
  },
}

const centrosOleadas: Template = {
  id: 'ej2-centros-oleadas', group: 'Ejercicios', animated: true, name: t('Centros y remate en oleadas (3 contra 2)'),
  build: () => {
    const c = {
      w: player('home', '7', 30, 8), s1: player('home', '9', 36, 28), s2: player('home', '10', 34, 40), w2: player('home', '11', 28, 62),
      d1: player('away', '', 42, 30), d2: player('away', '', 42, 38), gk: player('away', '1', 51.8, 34),
      b: ballAt(30.9, 8.4),
    }
    return animate('half', c, [
      { note: t('Oleadas de 3 contra 2: un extremo y dos delanteros contra dos defensores y el portero. Cuando acaba una oleada, sale la del otro lado.'), draw: [line('dribble', [[30, 8], [37, 6.5], [44, 6]])] },
      { note: t('El extremo llega cerca de la línea de fondo. Los delanteros esperan fuera del área para atacar el centro en carrera.'), move: { w: [44, 6], b: [44.9, 6.5] }, draw: [line('run', [[36, 28], [46, 28.5]]), line('run', [[34, 40], [47.5, 42.5]]), line('pass', [[44.9, 6.5], [47.3, 41.7]])] },
      { note: t('El 9 arrastra a su defensor al primer palo y deja libre el segundo palo. Allí llega el 10 y remata.'), move: { s1: [46, 28.5], d1: [47.5, 30.8], s2: [47.5, 42.5], d2: [45.5, 35.5], b: [47.3, 41.7], gk: [51, 31.5] }, draw: [line('pass', [[47.3, 41.7], [52.3, 37]])] },
      { note: t('Gol. Ahora sale el 11 desde la otra banda con la siguiente oleada.'), move: { b: [52.2, 37] } },
    ], [coneAt(28, 4), coneAt(28, 12), coneAt(26, 58), coneAt(26, 66)])
  },
}

const circuitoY: Template = {
  id: 'ej2-circuito-y', group: 'Ejercicios', animated: true, name: t('Circuito de pases en Y: apoyo y ruptura'),
  build: () => {
    const c = {
      a: player('home', 'A', 5, 15), bb: player('home', 'B', 20, 15), cc: player('home', 'C', 31, 8), dd: player('home', 'D', 31, 22),
      b: ballAt(5.9, 15.2),
    }
    return animate('grid', c, [
      { note: t('Circuito en forma de Y. B sale hacia el balón (apoyo) para recibir. Moverse antes de recibir da tiempo y espacio.'), draw: [line('run', [[20, 15], [16, 15]]), line('pass', [[5.9, 15.2], [15.1, 15.2]])] },
      { note: t('B recibe y la devuelve de primeras a A, que ha avanzado unos metros.'), move: { bb: [16, 15], b: [15.1, 15.2] }, draw: [line('pass', [[15.1, 15.2], [9.9, 15.6]]), line('run', [[5, 15], [9, 15.4]])] },
      { note: t('A juega en diagonal hacia C, que también se acerca para recibir.'), move: { a: [9, 15.4], b: [9.9, 15.6] }, draw: [line('pass', [[9.9, 15.6], [28.3, 9.1]]), line('run', [[31, 8], [29.1, 8.6]])] },
      { note: t('Mientras el balón va a C, B se gira y hace un desmarque de ruptura hacia la portería.'), move: { cc: [29.1, 8.6], b: [28.3, 9.1] }, draw: [line('run', [[16, 15], [32.3, 16]]), line('pass', [[28.3, 9.1], [33.1, 15.6]])] },
      { note: t('C mete el pase al espacio y B llega en carrera, sin frenar.'), move: { bb: [32.3, 16], b: [33.1, 15.6] }, draw: [line('pass', [[33.1, 15.6], [39.3, 15]])] },
      { note: t('Tiro a la miniportería. Rotación: A pasa a B, B a C y C vuelve a la fila. La siguiente vez se juega por el lado de D.'), move: { b: [39.3, 15] } },
    ], [coneAt(3, 15), coneAt(17, 17), coneAt(31, 5.5), coneAt(31, 24.5), item('minigoal', 39.4, 15, 90)])
  },
}

const contra4c3: Template = {
  id: 'ej2-contra-4c3', group: 'Ejercicios', animated: true, name: t('Contraataque 4 contra 3 tras robo'),
  build: () => {
    const c = {
      r8: player('home', '8', 6, 34), w11: player('home', '11', 6, 12), w7: player('home', '7', 6, 56), s9: player('home', '9', 12, 26),
      d1: player('away', '', 28, 26), d2: player('away', '', 28, 40), d3: player('away', '', 30, 52), gk: player('away', '1', 51.8, 34),
      b: ballAt(6.9, 34.4),
    }
    return animate('half', c, [
      { note: t('Acabamos de robar cerca de la línea del medio. Somos 4 contra 3 defensores que corren hacia atrás: hay que atacar rápido.'), draw: [line('dribble', [[6, 34], [18, 34]]), line('run', [[6, 12], [22, 13]]), line('run', [[6, 56], [22, 55]]), line('run', [[12, 26], [26, 30]])] },
      { note: t('El 8 conduce por el centro. Los defensores se cierran hacia dentro y dejan libre al 11 por fuera.'), move: { r8: [18, 34], b: [18.9, 34.4], w11: [22, 13], w7: [22, 55], s9: [26, 30], d1: [31, 27], d2: [31, 38], d3: [32, 50] }, draw: [line('pass', [[18.9, 34.4], [30.9, 15.6]]), line('run', [[22, 13], [30, 15.2]])] },
      { note: t('El 11 recibe solo por fuera. Su defensor tiene que salir a por él y deja un hueco en el centro.'), move: { b: [30.9, 15.6], w11: [30, 15.2], d1: [35, 22], s9: [34, 29.5], r8: [27, 35], d2: [37, 34.5], w7: [32, 52.5], d3: [37, 46.5] }, draw: [line('dribble', [[30, 15.2], [38, 19]]), line('run', [[34, 29.5], [43.4, 31]]), line('run', [[27, 35], [36, 37]])] },
      { note: t('El 11 conduce hacia dentro y atrae al defensor. El 9 ataca el hueco entre los centrales.'), move: { w11: [38, 19], b: [38.9, 19.4], d1: [40, 17.5], s9: [43.4, 31], d2: [41, 36.5], r8: [36, 37], w7: [42, 46], d3: [44, 42] }, draw: [line('pass', [[38.9, 19.4], [44.2, 30.6]])] },
      { note: t('El 9 recibe entre los centrales, solo delante del portero.'), move: { b: [44.2, 30.6], d2: [44, 35.5] }, draw: [line('pass', [[44.2, 30.6], [52.3, 31]])] },
      { note: t('Gol. En un contraataque hay que llegar a portería en pocos pases, antes de que el rival se recupere.'), move: { b: [52.2, 31] } },
    ])
  },
}

const carriles7c7: Template = {
  id: 'ej2-carriles-7c7', group: 'Ejercicios', animated: true, name: t('Posesión 7 contra 7 por carriles'),
  build: () => {
    const c = {
      h2: player('home', '2', 10, 7), h4: player('home', '4', 12, 20), h8: player('home', '8', 24, 24), h6: player('home', '6', 14, 34),
      h10: player('home', '10', 30, 36), h3: player('home', '3', 20, 47), h7: player('home', '7', 28, 61),
      r1: player('away', '', 16, 11), r2: player('away', '', 17, 22), r3: player('away', '', 26, 18), r4: player('away', '', 20, 31),
      r5: player('away', '', 30, 29), r6: player('away', '', 26, 42), r7: player('away', '', 36, 46),
      b: ballAt(12.3, 20.85),
    }
    const lanes = [13.6, 27.2, 40.8, 54.4].flatMap((y) => [1, 17.5, 35, 51.5].map((x) => coneAt(x, y)))
    return animate('half', c, [
      { note: t('7 contra 7 con el campo dividido en 5 carriles (marcados con conos). Regla: nunca más de 2 jugadores del mismo equipo en un carril.'), draw: [line('pass', [[12.3, 20.85], [14.5, 33.2]])] },
      { note: t('Pase al 6, en el carril central. Los rivales se juntan hacia el balón.'), move: { b: [14.5, 33.2], r4: [18.5, 32], r2: [15.5, 25], r6: [23, 40], r5: [26, 31], r7: [32, 46], r1: [14, 14], r3: [22, 19] }, draw: [line('pass', [[14.5, 33.2], [19.6, 46.2]])] },
      { note: t('Pase al 3. Casi todos los rivales están cerca del balón y el carril de la otra banda queda vacío.'), move: { b: [19.6, 46.2], r6: [22.5, 43.5], r7: [30, 50], r4: [18, 36], r5: [24, 36] }, draw: [line('pass', [[19.6, 46.2], [27.4, 60.4]])] },
      { note: t('El 7 recibe solo en el carril de la banda. Como no hay más de 2 por carril, el equipo siempre está abierto y es fácil cambiar el juego.'), move: { b: [27.4, 60.4], r7: [33, 55], r6: [24, 49] }, draw: [line('dribble', [[28, 61], [34, 60.5], [40, 60]]), line('run', [[30, 36], [40, 44]])] },
      { note: t('El 7 avanza conduciendo y el 10 entra en el carril de al lado para ayudarle. Allí solo hay 2 de los nuestros, así que se cumple la regla.'), move: { h7: [40, 60], b: [40.9, 60.3], h10: [40, 44], r7: [37.5, 55] } },
    ], lanes)
  },
}

const presion5c5: Template = {
  id: 'ej2-presion-5c5', group: 'Ejercicios', animated: true, name: t('Presión tras pérdida 5 contra 5 + 2 comodines'),
  build: () => {
    const c = {
      h1: player('home', '1', 10, 8), h2: player('home', '2', 12, 22), h3: player('home', '3', 20, 13), h4: player('home', '4', 27, 8), h5: player('home', '5', 29, 21),
      a1: player('away', '', 6, 15), a2: player('away', '', 15, 17), a3: player('away', '', 25, 16), a4: player('away', '', 24, 11), a5: player('away', '', 34, 16),
      c1: player('neutral', 'C', 20, 0.9), c2: player('neutral', 'C', 20, 29.1),
      b: ballAt(20.9, 13.4),
    }
    return animate('grid', c, [
      { note: t('5 contra 5 con 2 comodines (C) en las bandas, que juegan con el equipo que tiene el balón. Nuestro 3 intenta un pase al 5.'), draw: [line('pass', [[20.9, 13.4], [24.6, 17.05]])] },
      { note: t('Un rival corta el pase: ¡pérdida! Condición de esta tarea: 5 segundos para recuperar.'), move: { b: [24.6, 17.05], a3: [25.4, 17.7] }, draw: [press([[20, 13], [23.6, 15.8]]), press([[29, 21], [27.4, 19.8]]), line('run', [[12, 22], [18, 24.5]]), line('run', [[27, 8], [27.5, 10.8]])] },
      { note: t('El 3, el más cercano, presiona al que tiene el balón y le cierra el pase hacia delante. El 5 le cierra la salida por dentro y cubre si lo superan. El 2 y el 4 tapan el pase a su compañero y al comodín.'), move: { h3: [23.6, 15.8], h5: [27.4, 19.8], h2: [18, 24.5], h4: [27.5, 10.8], a2: [17, 20] }, draw: [press([[27.4, 19.8], [26.6, 19]])] },
      { note: t('Robo en menos de 5 segundos. Ahora hay que atacar rápido, antes de que el rival se ordene.'), move: { b: [26.6, 18.95] }, draw: [line('pass', [[26.6, 18.95], [34.1, 10.3]]), line('run', [[27.5, 10.8], [33.3, 10]])] },
      { note: t('El 4 recibe libre cerca de la miniportería.'), move: { b: [34.1, 10.3], h4: [33.3, 10], a5: [35.5, 16.5] }, draw: [line('pass', [[34.1, 10.3], [39.3, 14.3]])] },
      { note: t('Gol. Un gol justo después de robar vale doble.'), move: { b: [39.3, 14.3] } },
    ], [item('minigoal', 0.6, 15, -90), item('minigoal', 39.4, 15, 90), ...GRID()])
  },
}

// ---------- Acciones a balón parado ----------

const cornerCorto: Template = {
  id: 'abp2-corner-corto', group: 'ABP', animated: true, name: t('Córner corto: 2 contra 1 y centro'),
  build: () => {
    const c = {
      t: player('home', '10', 52.2, 0.6), s: player('home', '8', 44, 12), a1: player('home', '5', 40, 28), a2: player('home', '9', 39, 36), a3: player('home', '4', 41, 44), e: player('home', '6', 31, 34),
      gk: player('away', '1', 51.8, 34), np: player('away', '', 51, 29.5), r1: player('away', '', 46, 14.5),
      m1: player('away', '', 43, 29), m2: player('away', '', 42.5, 37.5), m3: player('away', '', 44, 44.5),
      b: ballAt(51.2, 1.4),
    }
    return animate('half', c, [
      { note: t('Córner corto: el 8 se acerca al que saca para jugar 2 contra 1 contra el defensor que sale. Así cambiamos el ángulo del centro.'), draw: [line('run', [[44, 12], [47.5, 4.5]]), line('pass', [[51.2, 1.4], [46.8, 4.9]])] },
      { note: t('El 8 recibe y un defensor sale a por él: ahora son 2 contra 1.'), move: { s: [47.5, 4.5], b: [46.8, 4.9], r1: [46.5, 9] }, draw: [line('run', [[52.2, 0.6], [50.5, 7.2]]), line('pass', [[46.8, 4.9], [49.8, 7.4]]), press([[46.5, 9], [46.8, 7]])] },
      { note: t('El 8 la devuelve al 10, que ya ha entrado en el campo. El defensor se ha quedado con el 8 y el 10 tiene tiempo para centrar.'), move: { t: [50.5, 7.2], b: [49.8, 7.4], r1: [46.8, 7] }, draw: [line('run', [[39, 36], [45, 35.3]]), line('run', [[40, 28], [46.5, 28.5]]), line('pass', [[49.8, 7.4], [45.2, 34.4]])] },
      { note: t('Centro desde más cerca de la portería, hacia el punto de penalti. El 9 llega en carrera y gana la posición a su marcador.'), move: { b: [45.2, 34.4], a2: [45, 35.3], m2: [45.5, 38], a1: [46.5, 28.5], m1: [47.5, 31], gk: [51.5, 32.5] }, draw: [line('pass', [[45.2, 34.4], [52.3, 36.8]])] },
      { note: t('Remate y gol. El 6 se queda en la frontal por si hay rechace.'), move: { b: [52.2, 36.8] } },
    ])
  },
}

const cornerPeinada: Template = {
  id: 'abp2-corner-peinada', group: 'ABP', animated: true, name: t('Córner al primer palo con peinada'),
  build: () => {
    const c = {
      t: player('home', '10', 52.2, 0.6), p: player('home', '4', 42, 24), a: player('home', '9', 40, 38), bb: player('home', '5', 39, 31), e: player('home', '6', 32, 34), v: player('home', '3', 22, 24),
      gk: player('away', '1', 51.8, 34), np: player('away', '', 51, 27.8), z1: player('away', '', 45.5, 31), z2: player('away', '', 45.5, 36.5),
      m1: player('away', '', 43.5, 22.5), m2: player('away', '', 42, 40.2), m3: player('away', '', 41.5, 32.8),
      b: ballAt(51.2, 1.4),
    }
    return animate('half', c, [
      { note: t('Córner al primer palo. El 4 ataca el primer palo para peinar el balón (desviarlo con la cabeza) hacia el segundo palo.'), draw: [line('run', [[42, 24], [48, 27.2]]), line('run', [[40, 38], [48.5, 39.6]]), line('run', [[39, 31], [44, 33.6]]), line('pass', [[51.2, 1.4], [47.9, 26.4]])] },
      { note: t('El 4 se adelanta a su marcador y toca el balón hacia atrás. El 5 entra al centro para despistar y el 9 va al segundo palo.'), move: { p: [48, 27.2], b: [47.9, 26.4], m1: [46.5, 24.5], bb: [44, 33.6], m3: [42, 35.5], a: [48.5, 39.6], m2: [46, 41.2], gk: [51.6, 31] }, draw: [line('pass', [[47.9, 26.4], [48.6, 38.8]])] },
      { note: t('El balón cruza el área por detrás de los defensores. El 9 llega solo al segundo palo.'), move: { b: [48.6, 38.8] }, draw: [line('pass', [[48.6, 38.8], [52.3, 35.8]])] },
      { note: t('Remate y gol. El 6 espera el rechace en la frontal y el 3 vigila la contra.'), move: { b: [52.2, 35.8] } },
    ])
  },
}

const faltaLateralZona: Template = {
  id: 'abp2-falta-lateral-zona', group: 'ABP', animated: true, name: t('Falta lateral en contra: defensa en zona'),
  build: () => {
    const c = {
      gk: player('home', '1', 51.5, 34), w: player('home', '7', 42.7, 17.8),
      l3: player('home', '3', 41, 22.5), l4: player('home', '4', 41, 27), l5: player('home', '5', 41, 31.5), l6: player('home', '6', 41, 36), l2: player('home', '2', 41, 40.5),
      m8: player('home', '8', 33, 30), f9: player('home', '9', 24, 40),
      t: player('away', '', 37.2, 9.3), a1: player('away', '', 37, 26.5), a2: player('away', '', 36.5, 31.5), a3: player('away', '', 37, 36.5), a4: player('away', '', 36.5, 41.5),
      b: ballAt(38, 10),
    }
    return animate('half', c, [
      { note: t('Vista defensiva: aquí el rival ataca hacia la portería de la derecha y nosotros la defendemos. Barrera de 1 y una línea de 5 que defiende zonas, no personas.'), draw: [line('run', [[37, 26.5], [41.5, 26]]), line('run', [[36.5, 31.5], [42, 33]]), line('run', [[37, 36.5], [41.5, 35.8]]), line('run', [[36.5, 41.5], [42, 40.5]]), line('pass', [[38, 10], [44.2, 32.3]])] },
      { note: t('Al golpear, toda la línea retrocede unos pasos a la vez y después ataca el balón hacia delante. El 5 llega antes porque lo ve venir de frente.'), move: { l3: [45, 23], l4: [45, 27.5], l5: [45, 32], l6: [45, 36.5], l2: [45, 41], a1: [41.5, 26], a2: [42, 33], a3: [41.5, 35.8], a4: [42, 40.5], gk: [51, 33.5], b: [44.2, 32.3] }, draw: [line('pass', [[44.2, 32.3], [33.9, 21.4]]), line('run', [[33, 30], [34.6, 22.2]])] },
      { note: t('Despeje lejos y hacia fuera. El 8, que esperaba en la frontal para los rechaces, recoge el balón.'), move: { b: [33.9, 21.4], m8: [34.6, 22.2] }, draw: [line('dribble', [[34.6, 22.2], [24, 19]]), line('run', [[24, 40], [14, 34]])] },
      { note: t('Salimos rápido al contraataque: el rival tenía mucha gente en el área y está desordenado.'), move: { m8: [24, 19], b: [23.1, 18.7], f9: [14, 34] } },
    ])
  },
}

const bandaEnsayada: Template = {
  id: 'abp2-banda-ensayada', group: 'ABP', animated: true, name: t('Saque de banda ensayado para salir de la presión'),
  build: () => {
    const c = {
      th: player('home', '2', 30, 68.8), p7: player('home', '7', 38, 60), p8: player('home', '8', 20, 63), p6: player('home', '6', 31, 54), p4: player('home', '4', 18, 48), p5: player('home', '5', 10, 40),
      r1: player('away', '', 39.5, 57.8), r2: player('away', '', 20.5, 60.4), r3: player('away', '', 33, 52), r4: player('away', '', 44, 62), r5: player('away', '', 26, 50),
      b: ballAt(30, 67.6),
    }
    return animate('full', c, [
      { note: t('Saque de banda en nuestro campo y el rival presiona. Jugada ensayada: el 7 se acerca y el 2, después de sacar, entra en el campo para recibir.'), draw: [line('run', [[38, 60], [34, 63.5]]), line('pass', [[30, 67.6], [33.3, 63]])] },
      { note: t('Saque al 7. Su marcador le sigue y se pega a él.'), move: { p7: [34, 63.5], b: [33.3, 63], r1: [36, 61.5] }, draw: [line('run', [[30, 68.8], [30, 65.2]]), line('pass', [[33.3, 63], [30.8, 64.7]])] },
      { note: t('El 7 la devuelve de primeras al 2, que está libre: casi nunca se marca al que saca.'), move: { th: [30, 65.2], b: [30.8, 64.7], r1: [33.5, 61], r3: [34, 57] }, draw: [line('pass', [[30.8, 64.7], [19.2, 50.6]]), line('run', [[18, 48], [18.4, 50]])] },
      { note: t('Pase hacia dentro al 4, que recibe de cara y con espacio. La presión rival se ha quedado junto a la banda.'), move: { p4: [18.4, 50], b: [19.2, 50.6] }, draw: [line('dribble', [[18.4, 50], [24, 45], [29, 41]])] },
      { note: t('Salida limpia: en 3 pases hemos pasado de estar encerrados en la banda a jugar por dentro.'), move: { p4: [29, 41], b: [29.9, 40.6], r5: [27.5, 46] } },
    ])
  },
}

const penaltiRechace: Template = {
  id: 'abp2-penalti-rechace', group: 'ABP', animated: true, name: t('Penalti y rechace: colocación en el borde del área'),
  build: () => {
    const c = {
      t: player('home', '10', 39.8, 33.2), h4: player('home', '4', 35.8, 26.2), h9: player('home', '9', 35.8, 41.8), h8: player('home', '8', 32.2, 34), h3: player('home', '3', 22, 28), h2: player('home', '2', 22, 40),
      gk: player('away', '1', 52.3, 34), r1: player('away', '', 35.8, 23.4), r2: player('away', '', 35.8, 44.6), r3: player('away', '', 32.5, 30.5), r4: player('away', '', 24, 34),
      b: ballAt(41.5, 34),
    }
    const run = (a: Pt, z: Pt) => line('run', [a, z])
    return animate('half', c, [
      { note: t('Penalti a favor. Todos fuera del área y fuera del semicírculo. Nos ponemos en el borde del área, mirando a portería, listos para entrar en cuanto se golpee.'), draw: [line('pass', [[41.5, 34], [51.4, 31.6]]), run([35.8, 26.2], [43.5, 29]), run([35.8, 41.8], [44, 37]), run([32.2, 34], [40, 32.8])] },
      { note: t('El portero para el tiro, pero el balón queda suelto. Como entramos justo al golpear, llegamos antes que los rivales.'), move: { b: [51.4, 31.6], gk: [52.2, 32.2], h4: [43.5, 29], h9: [44, 37], h8: [40, 32.8], t: [43, 33.4], r1: [42, 26.4], r2: [42.5, 40], r3: [38.5, 30] }, draw: [line('pass', [[51.4, 31.6], [44.9, 30]]), run([43.5, 29], [44, 30.4])] },
      { note: t('El 4 llega primero al rechace y remata al lado contrario de donde está el portero.'), move: { b: [44.9, 30], h4: [44, 30.4], r1: [42.5, 27.8] }, draw: [line('pass', [[44.9, 30], [52.3, 36.6]])] },
      { note: t('Gol. Detrás, el 2 y el 3 se quedan vigilando por si el rival sale al contraataque.'), move: { b: [52.2, 36.6] } },
    ])
  },
}

// Idea de Jesús Cortinas: conducción en zigzag entre picas, pase al 10, salto de valla sin balón y remate de primera.
const zigzagValla: Template = {
  id: 'ej2-zigzag-valla-remate', group: 'Ejercicios', animated: true, name: t('Conducción en zigzag, pase, valla y remate'),
  build: () => {
    const W: Pt[] = [[12, 17.6], [16, 22.4], [20, 17.6], [24, 22.4], [27.5, 20]]
    const ahead = ([x, y]: Pt, dy = 0): Pt => [x + 0.9, y + dy]
    const c = {
      a: player('home', '8', 8, 20), m: player('home', '10', 30, 29.5), gk: player('away', '1', 51.8, 34),
      b: ballAt(8.9, 20.3),
    }
    return animate('half', c, [
      { note: t('El 8 sale conduciendo en zigzag entre las picas: balón pegado al pie, tocando con el interior y el exterior.'), draw: [line('dribble', [[8, 20], ...W])] },
      { note: t('Primera pica por la izquierda. Toques cortos y el cuerpo bajo para cambiar de dirección.'), move: { a: W[0], b: ahead(W[0], 0.4) }, draw: [line('dribble', W)] },
      { note: t('Segunda pica por la derecha. La mirada alterna entre el balón y lo que hay delante.'), move: { a: W[1], b: ahead(W[1], -0.4) }, draw: [line('dribble', W.slice(1))] },
      { note: t('Tercera pica. Cuanto más rápido, más cortos los toques.'), move: { a: W[2], b: ahead(W[2], 0.4) }, draw: [line('dribble', W.slice(2))] },
      { note: t('Última pica: sale de la conducción orientado hacia la valla.'), move: { a: W[3], b: ahead(W[3], -0.4) }, draw: [line('dribble', W.slice(3))] },
      { note: t('Antes de llegar a la valla levanta la cabeza y pasa al 10.'), move: { a: W[4], b: ahead(W[4]) }, draw: [line('pass', [[28.4, 20], [30.8, 28.8]])] },
      { note: t('Ya sin balón, el 8 salta la valla y acelera hacia el área.'), move: { b: [30.8, 28.8] }, draw: [line('run', [[27.5, 20], [31, 20], [35, 20.5]])] },
      { note: t('El 10 mete el pase al espacio, por delante del 8, para que llegue lanzado.'), move: { a: [35, 20.5] }, draw: [line('pass', [[30.8, 28.8], [41.6, 26.6]]), line('run', [[35, 20.5], [40.7, 26]])] },
      { note: t('El 8 remata de primera, sin controlar, buscando el palo largo.'), move: { a: [40.7, 26], b: [41.6, 26.6], gk: [51.6, 32.6] }, draw: [line('shot', [[41.6, 26.6], [52.3, 37.2]])] },
      { note: t('Gol. Vuelve trotando y sale el siguiente. Cambia de pierna en cada serie.'), move: { b: [52.3, 37.2] } },
    ], [coneAt(8, 17), item('pole', 12, 20), item('pole', 16, 20), item('pole', 20, 20), item('pole', 24, 20), item('hurdle', 31, 20, 90)])
  },
}

export const EJERCICIOS: Template[] = [
  rondoTransicion, posicionOrientacion, dosContraUno, paredRuptura, centrosOleadas, circuitoY, contra4c3, carriles7c7, presion5c5,
  cornerCorto, cornerPeinada, faltaLateralZona, bandaEnsayada, penaltiRechace, zigzagValla,
]
