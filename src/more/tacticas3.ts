// Tercera tanda de plantillas animadas: bloques, presión, transiciones, espacios, sistemas, ABP y ejercicios.
// Mismo formato que tacticas.ts. Campo completo: nuestro equipo ataca hacia la derecha.
// Medio campo: x=0 es la línea central y la portería está en (52.5, 34). En la "vista defensiva"
// el rival ataca esa portería y nosotros la defendemos.
import { coneAt, type Pt, type Token } from '../model'
import type { Template } from '../anim'
import { T } from './tacticas'
import { t } from '../i18n'

const cones = (list: Pt[]): Token[] => list.map(([x, y]) => coneAt(x, y))

// ---------- Bloques ----------

const basculacion = T('t3-basculacion-442', 'Bloques', t('Bascular en bloque medio (4-4-2): todos hacia el balón'), 'full',
  { h1: [6, 34], h3: [30, 12], h5: [29, 27], h4: [29, 41], h2: [30, 56], h11: [41, 12], h8: [40, 28], h6: [40, 40], h7: [41, 56], h10: [52, 30], h9: [52, 40] },
  { g: [100, 34], c1: [70, 24], c2: [70, 44], p: [62, 34], l1: [58, 6], l2: [58, 60], i1: [47, 22], i2: [47, 46], w1: [38, 4], w2: [38, 64], n: [33, 34] },
  'c2', [
    { n: t('Defendemos en bloque medio con un 4-4-2. El central rival tiene el balón. Estamos centrados y juntos: unos 25 metros desde el último defensa hasta los delanteros.') },
    { n: t('Pase al lateral. Todo el bloque se desliza a la vez hacia ese lado: es la basculación. El 7 sale a presionar y el 9 tapa el pase de vuelta al central. El lateral del otro lado (3) se mete por dentro: lejos del balón no hace falta estar tan abierto.'), b: 'l2', m: { h3: [32, 24], h5: [30, 34], h4: [30, 45], h2: [33, 56], h11: [43, 26], h8: [42, 36], h6: [42, 46], h7: [52, 58], h10: [52, 40], h9: [55, 48] }, pr: ['h7', 'h9'], run: ['h3', 'h5', 'h4', 'h2', 'h11', 'h8', 'h6', 'h10'] },
    { n: t('El lateral busca al interior por dentro. Como estamos juntos, el 6 llega a tiempo y le presiona por detrás. El 8 cierra el pase hacia el centro.'), b: 'i2', m: { i2: [48.5, 53.5], h6: [45.5, 51], h8: [43, 42], h2: [34, 58] }, pr: ['h6'], run: ['h8', 'h2'] },
    { n: t('Robo: el 6 le quita el balón. Como todos estábamos cerca, tiene compañeros alrededor para salir.'), b: 'h6', s: true, m: { h6: [46.5, 51.5], i2: [49, 55] } },
    { n: t('Salimos rápido con el 10. La regla: el bloque se mueve junto hacia el balón, como si los 10 jugadores estuvieran atados con una cuerda. El lado contrario queda más libre, pero está lejos.'), b: 'h10', m: { h10: [56, 44] } },
  ])

const bloque541 = T('t3-bloque-bajo-541', 'Bloques', t('Bloque bajo 5-4-1: el carrilero sale y la línea se cierra'), 'full',
  { h1: [3, 34], h3: [17, 8], h5: [15, 22], h4: [14, 34], h6: [15, 46], h2: [17, 60], h11: [26, 14], h8: [25, 28], h10: [25, 40], h7: [26, 54], h9: [38, 34] },
  { g: [100, 34], c1: [52, 24], c2: [52, 44], m1: [35, 26], m2: [36, 42], lw: [22, 4], rw: [33, 63], n9: [20, 30], a10: [30, 47] },
  'm2', [
    { n: t('Defendemos cerca de nuestra área con 5 atrás, 4 medios y 1 delantero (5-4-1). Tres centrales en el medio y un carrilero en cada banda.') },
    { n: t('Pase al extremo. El carrilero (2) sale a por él: puede salir porque detrás quedan 4 defensas. El 7 baja a ayudarle y la línea se desliza hacia el balón.'), b: 'rw', m: { rw: [29, 62], h2: [24, 60], h7: [29, 56], h6: [17, 50], h4: [15, 40], h5: [15, 29], h3: [18, 16] }, pr: ['h2', 'h7'], run: ['h6', 'h4', 'h5', 'h3'] },
    { n: t('El extremo se va por fuera hacia la línea de fondo. El 2 le acompaña sin tirarse al suelo. Dentro, el 4 sigue al delantero que entra al área.'), m: { rw: [16, 63], h2: [17, 59.5], n9: [11, 40], h4: [10, 37], a10: [17, 46], h10: [21, 44], h7: [24, 57] }, run: ['h2', 'h4', 'h10', 'h7'] },
    { n: t('Centro al área. Dentro hay 4 defensas contra 2 atacantes: el 4 gana el balón de cabeza.'), b: 'h4', m: { h4: [9.5, 37] } },
    { n: t('Despeje hacia el 9, que aguanta el balón para que el equipo salga. Con 5 atrás el carrilero puede salir sin miedo, y en el área suele quedar un defensa de más.'), b: 'h9', m: { h9: [40, 40] } },
  ])

// ---------- Presión alta ----------

const presionTres = T('t3-presion-salida-3', 'Presión alta', t('Presionar una salida de 3 centrales: 3 contra 3 y a la banda'), 'full',
  { h1: [40, 34], h5: [58, 28], h4: [58, 40], h3: [68, 10], h2: [68, 58], h6: [70, 34], h8: [78, 28], h10: [78, 40], h11: [86, 20], h9: [88, 34], h7: [86, 48] },
  { g: [101, 34], c1: [94, 18], c2: [95, 34], c3: [94, 50], p1: [84, 28], p2: [84, 42], l1: [80, 5], l2: [80, 63], i1: [72, 22], i2: [72, 46], n: [62, 34] },
  'g', [
    { n: t('El rival sale con 3 centrales y su portero. Nuestros 3 de arriba se colocan delante de los 3 centrales: 3 contra 3. El 8 y el 10 vigilan a los dos medios.') },
    { n: t('Saque corto al central de la derecha. El 7 salta a por él tapando el pase hacia dentro y el 9 tapa la vuelta al portero.'), b: 'c3', m: { h7: [91, 47], h9: [96, 40] }, pr: ['h7', 'h9'] },
    { n: t('Solo le queda la banda. Pase al carrilero: el 2 sube a presionarle y todo el equipo se desliza hacia ese lado.'), b: 'l2', m: { l2: [82, 62], h2: [78, 60], h10: [81, 48.5], h8: [80, 34], h6: [74, 40], h4: [64, 44], h5: [64, 32], h3: [72, 16], h11: [90, 28] }, pr: ['h2', 'h10'], run: ['h8', 'h6', 'h4', 'h5', 'h3', 'h11'] },
    { n: t('El carrilero, encerrado contra la banda, busca un pase por dentro. El 6, que se había acercado, lo corta.'), b: 'h6', m: { h6: [75, 45], i2: [72, 49] } },
    { n: t('Robamos cerca del área rival. Pase rápido al 7, que ya está dentro.'), b: 'h7', m: { h7: [88, 45] } },
    { n: t('Gol. La clave contra 3 centrales: saltar con 3 y llevar al rival hacia la banda, donde la línea de cal es un defensor más.'), b: [104.7, 36], m: { g: [103, 35] } },
  ])

// ---------- Transiciones ----------

const vigilancias = T('t3-vigilancias', 'Transiciones', t('Vigilancias: tener cubiertos a sus delanteros antes de perder'), 'full',
  { h1: [30, 34], h5: [52, 24], h4: [52, 44], h6: [62, 34], h3: [78, 6], h2: [74, 62], h8: [84, 24], h10: [84, 44], h11: [92, 10], h9: [94, 34], h7: [92, 58] },
  { g: [103, 34], d1: [96, 14], d2: [97, 28], d3: [97, 40], d4: [96, 54], m1: [88, 16], m2: [88, 30], m3: [88, 40], m4: [88, 52], f1: [56, 30], f2: [57, 42] },
  'h10', [
    { n: t('Atacamos en campo rival. El rival deja dos delanteros arriba para salir al contraataque. Antes de perder el balón ya los tenemos vigilados: los dos centrales y el 6 se quedan atrás, 3 contra 2.') },
    { n: t('Pase al 7 en la banda, que intenta centrar. El lateral rival sale a por él.'), b: 'h7', m: { d4: [95, 57] }, pr: ['d4'] },
    { n: t('El lateral rival roba y quiere pegar en largo a sus delanteros. Empieza la transición.'), b: 'd4', s: true, m: { d4: [94, 57], h7: [90, 60] } },
    { n: t('Balón largo al delantero. Como nuestros centrales ya estaban cerca de él, el 4 llega antes y lo gana.'), b: 'h4', m: { h4: [55, 40], f2: [58.5, 43], h6: [60, 36], f1: [57, 31] }, run: ['h4', 'h6'] },
    { n: t('El 4 juega con el 6 y volvemos a atacar. Sin vigilancias, ese balón largo habría sido un contraataque de 2 contra 1 hacia nuestra portería.'), b: 'h6' },
  ])

// ---------- Generar espacios ----------

const desdoblamiento = T('t3-desdoblamiento', 'Generar espacios', t('Desdoblamiento: el lateral pasa por fuera del extremo'), 'half',
  { h6: [10, 36], h8: [22, 46], h2: [16, 60], h7: [30, 58], h10: [36, 26], h9: [42, 34] },
  { m3: [28, 42], m4: [28, 51], d4: [38, 56], d3: [42, 42], d2: [43, 30], g: [51.8, 34] },
  'h7', [
    { n: t('El extremo (7) tiene el balón en la banda con el lateral rival delante. Él solo tiene un 1 contra 1 difícil.') },
    { n: t('El lateral (2) sube corriendo por fuera, por detrás del extremo: es el desdoblamiento. Ahora es un 2 contra 1 en la banda.'), m: { h2: [30, 64], h7: [33, 57], d4: [38, 58] }, run: ['h2'] },
    { n: t('El 7 conduce hacia dentro y arrastra al lateral rival. El 2 sigue su carrera por fuera, a su espalda.'), m: { h7: [36, 52], d4: [39.5, 56], h2: [40, 64.5] }, run: ['h2'] },
    { n: t('Pase al 2, que recibe solo cerca de la línea de fondo. El 9 y el 10 atacan el área.'), b: 'h2', m: { h2: [45, 63], h9: [46, 37], d3: [45, 40], h10: [42, 26] }, run: ['h2', 'h9', 'h10'] },
    { n: t('Centro raso al punto de penalti y el 9 remata.'), b: 'h9', m: { g: [51.6, 36.5] } },
    { n: t('Gol. Si el lateral rival sigue al 2, el 7 tiene el camino libre por dentro. Si se queda con el 7, el 2 recibe solo.'), b: [52.3, 32.5] },
  ])

const balonLargo = T('t3-balon-largo-segunda', 'Generar espacios', t('Saltar la presión: balón largo al 9 y segunda jugada'), 'full',
  { h1: [3, 34], h5: [10, 24], h4: [10, 44], h3: [20, 6], h2: [20, 62], h6: [22, 40], h8: [34, 24], h10: [34, 44], h11: [48, 10], h7: [48, 58], h9: [52, 34] },
  { g: [102, 34], a9: [14, 30], a10: [14, 40], ap: [27, 40.5], aw1: [25, 10], aw2: [25, 58], am1: [38, 28], am2: [38, 42], d1: [55, 14], d2: [56, 30], d3: [56, 40], d4: [55, 54] },
  'h1', [
    { n: t('El rival nos presiona muy arriba, cada uno pegado a su par. Salir en corto es arriesgado: si perdemos aquí, estamos cerca de nuestra portería.') },
    { n: t('Antes del pase largo, el 8 y el 10 se acercan al 9. Van a pelear la segunda jugada: el balón que cae después del choque.'), m: { h8: [46, 27], h10: [46, 41], am1: [43, 29], am2: [43, 39] }, run: ['h8', 'h10'] },
    { n: t('Balón largo del portero al 9. El 9 pelea con el central y la peina hacia atrás.'), b: 'h9', m: { d2: [55, 31.5] }, pr: ['d2'] },
    { n: t('Segunda jugada: el balón cae y el 10 llega primero, de cara a la portería.'), b: 'h10', m: { h10: [48, 38], am2: [44, 41] } },
    { n: t('El 10 filtra el pase al 7, que ataca la espalda de la defensa.'), b: 'h7', m: { h7: [66, 56], d4: [62, 52] }, run: ['h7'] },
    { n: t('Con dos pases hemos saltado toda su presión. La clave del balón largo no es el pase, sino tener compañeros cerca del 9 para ganar el segundo balón.'), m: { h7: [80, 52], d4: [76, 48], h9: [74, 36], d3: [70, 40] }, run: ['h9'] },
  ])

// ---------- Sistemas ----------

const de433a451 = T('t3-433-a-451', 'Sistemas', t('Cómo defiende un 4-3-3: se cierra en 4-5-1'), 'full',
  { h1: [5, 34], h3: [24, 8], h5: [20, 26], h4: [20, 42], h2: [24, 60], h6: [32, 34], h8: [42, 24], h10: [42, 44], h11: [56, 10], h9: [58, 34], h7: [56, 58] },
  {},
  [72, 34], [
    { n: t('Pierde el balón un 4-3-3. Sin balón tiene un problema: solo 3 medios para tapar todo el ancho del campo, y las bandas quedan libres.') },
    { n: t('Los extremos (11 y 7) bajan hasta la línea de los medios. Ahora hay 5 en el centro del campo y el 9 se queda solo arriba: es un 4-5-1.'), m: { h11: [38, 10], h7: [38, 58], h9: [50, 34], h8: [37, 26], h10: [37, 42], h6: [31, 34] }, run: ['h11', 'h7', 'h9', 'h8', 'h10'] },
    { n: t('El bloque se junta: defensas y medios dejan unos 10 metros entre las dos líneas, para que el rival no pueda recibir entre ellas.'), m: { h3: [27, 10], h5: [26, 26], h4: [26, 42], h2: [27, 58], h1: [10, 34] }, run: ['h3', 'h5', 'h4', 'h2'] },
    { n: t('Si el rival lleva el balón a una banda, el extremo de ese lado sale a presionar y el lateral le cubre la espalda.'), m: { h7: [46, 60], h2: [32, 59] }, pr: ['h7'], run: ['h2'] },
    { n: t('Al recuperar el balón, los extremos y el 9 vuelven a subir: otra vez 4-3-3. Así, un mismo equipo defiende con 5 en el medio y ataca con 3 arriba.'), m: { h11: [56, 10], h7: [56, 58], h9: [60, 34], h8: [44, 24], h10: [44, 44], h3: [26, 8], h2: [26, 60] }, run: ['h11', 'h7', 'h9', 'h8', 'h10'] },
  ])

// ---------- ABP ----------

const cornerFrontal = T('t3-corner-frontal', 'ABP', t('Córner a favor: pase atrás al borde del área y disparo'), 'half',
  { h7: [52, 67], h4: [41, 28], h9: [41, 34], h5: [41, 40], h10: [30, 48], h8: [28, 30] },
  { g: [51.5, 34], z1: [51, 30], z2: [51, 38], k1: [44, 28], k2: [44, 34.5], k3: [44, 41] },
  'h7', [
    { n: t('Córner a favor. Tres rematadores en el área (4, 9 y 5), cada uno con su marcador. El 10 espera fuera del área, donde nadie le vigila.'), d: -1 },
    { n: t('Los rematadores corren hacia la portería y se llevan a sus marcadores. La zona del borde del área se queda vacía.'), d: -1, m: { h4: [45.5, 27], k1: [48, 25.8], h9: [46, 34], k2: [48.5, 35.5], h5: [45.5, 41], k3: [48, 42.5] }, run: ['h4', 'h9', 'h5'] },
    { n: t('Pase raso y atrás al 10, que llega corriendo al borde del área.'), b: 'h10', m: { h10: [37, 43] }, run: ['h10'] },
    { n: t('Gol de primeras. Los rematadores, delante del portero, le tapan la visión. El 8 se queda atrás por si hay que defender un contraataque.'), b: [52.3, 31.5], m: { g: [51.6, 32.6] } },
  ])

// Barrera de 4 en vista defensiva: a 9,15 m del balón, en la línea balón-portería.
const faltaContra = T('t3-falta-frontal-contra', 'ABP', t('Falta frontal en contra: barrera, portero y rechace'), 'half',
  { h1: [51.2, 31.8], h4: [39.1, 33.5], h5: [39.2, 34.7], h6: [39.3, 35.9], h8: [39.4, 37.1], h2: [44, 26], h3: [44, 43], h7: [33, 43], h9: [22, 20] },
  { t: [29, 36], t2: [30, 31.5], a3: [41, 29], a4: [41, 40] },
  't', [
    { n: t('Vista defensiva: el rival tiene una falta cerca de nuestra área. Barrera de 4 a 9,15 m del balón. La barrera tapa un lado de la portería y el portero se coloca en el otro.'), d: 1 },
    { n: t('Amago: el primer lanzador pasa por encima del balón y no chuta. La barrera aguanta quieta, sin saltar antes de tiempo.'), m: { t2: [31.5, 39.5] }, run: [['t2', [30.5, 36.5]]] },
    { n: t('Dispara el segundo lanzador. La barrera no se abre y el balón pega en ella.'), b: [38.4, 35.3], d: 1, m: { h1: [51.2, 33] } },
    { n: t('Rechace: el 7, que esperaba fuera de la barrera, llega primero.'), b: 'h7', d: -1, m: { h7: [35, 39] }, run: ['h7'] },
    { n: t('El 7 juega rápido con el 9 y salimos al contraataque: el rival tiene a mucha gente cerca de nuestra área.'), b: 'h9', d: -1, m: { h9: [16, 24] }, run: ['h9'] },
  ])

// ---------- Ejercicios ----------

const lineaCuatro = T('t3-ej-basculacion-4', 'Ejercicios', t('Línea de 4 contra 6: bascular y cerrar el centro'), 'half',
  { h1: [51.5, 34], h2: [40, 14], h4: [41, 28], h5: [41, 40], h3: [40, 54] },
  { a1: [26, 8], a2: [24, 22], a3: [22, 34], a4: [24, 46], a5: [26, 60], n: [33, 34] },
  'a3', [
    { n: t('Vista defensiva. 4 defensas contra 6 atacantes que se pasan el balón por fuera del área. Al principio los atacantes no pueden entrar: los defensas solo aprenden a moverse juntos según dónde está el balón.'), d: 1 },
    { n: t('Balón a una banda. El defensa de ese lado sale a presionar y los otros tres se desplazan hacia él, más juntos si el pasador puede jugar por dentro. La distancia y la altura de la línea se ajustan al balón, la presión sobre el pasador y las posiciones de compañeros y rivales. Ante una carrera a la espalda y un pasador con tiempo, valorar retroceder coordinadamente y dar cobertura, manteniendo conexiones entre defensores. Ante un cambio de orientación, bascular durante el recorrido del balón y reajustar las distancias.'), b: 'a1', d: 1, m: { h2: [31, 10], h4: [39, 20], h5: [40, 30], h3: [40, 41] }, pr: ['h2'], run: ['h4', 'h5', 'h3'] },
    { n: t('Pase atrás al centro. La línea vuelve a cerrarse en el medio y el que había salido regresa a su sitio.'), b: 'a3', d: 1, m: { h2: [40, 16], h4: [41, 28], h5: [41, 38], h3: [40, 50] }, run: ['h2', 'h4', 'h5', 'h3'] },
    { n: t('Cambio a la otra banda. Ahora presiona el 3 y los demás basculan hacia ese lado. La banda contraria queda libre, pero está lejos del balón.'), b: 'a5', d: 1, m: { h3: [32, 57], h5: [40, 48], h4: [40, 38], h2: [39, 28] }, pr: ['h3'], run: ['h5', 'h4', 'h2'] },
    { n: t('Progresión: ya se puede atacar. Si un atacante corre por el hueco entre dos defensas, el más cercano le sigue y los demás cierran.'), m: { n: [37, 43], h5: [41.5, 45.5] }, run: ['n'] },
  ], () => cones([[36, 0], [36, 68]]))

const unoContraUnoBanda = T('t3-ej-1c1-banda-centro', 'Ejercicios', t('1 contra 1 en banda y centro al área'), 'half',
  { h7: [24, 62], h9: [30, 34], h10: [26, 28] },
  { d: [34, 60], c1: [44, 34], g: [51.8, 34] },
  'h7', [
    { n: t('El 7 tiene que superar a su defensor en un 1 contra 1 por la banda. Dentro esperan el 9 y el 10 contra un central y el portero.') },
    { n: t('El 7 conduce hacia el defensor con velocidad, para obligarle a frenar y quedarse quieto.'), m: { h7: [30, 61], d: [35, 59.5] } },
    { n: t('Amago hacia dentro y salida por fuera: el defensor se va al lado equivocado.'), m: { h7: [37, 64], d: [34, 57.5] }, dv: [[33, 59.5]] },
    { n: t('El 7 llega cerca de la línea de fondo. El 9 ataca el primer palo y el 10 el segundo.'), m: { h7: [46, 63], h9: [46, 39.5], h10: [45, 28], c1: [47.5, 35], g: [51.5, 35.5] }, run: ['h9', 'h10'] },
    { n: t('Centro raso al primer palo: el 9 llega antes que el central y remata.'), b: 'h9' },
    { n: t('Gol. Se cambian los papeles y sale la siguiente pareja. Cuenta doble el gol que llega después de superar al defensor por fuera.'), b: [52.3, 32.5], m: { g: [51.7, 36] } },
  ], () => cones([[20, 54], [20, 68], [40, 54]]))

const defensaUnoContraUno = T('t3-ej-defensa-1c1', 'Ejercicios', t('Defender un 1 contra 1: frenar, perfilarse y llevar a la banda'), 'half',
  { h1: [51.5, 34], h2: [34, 36] },
  { a: [20, 40] },
  'a', [
    { n: t('Vista defensiva. El atacante conduce hacia nuestra portería y el defensa (2) sale a su encuentro.'), d: 1 },
    { n: t('El defensa se acerca rápido y frena al llegar, a unos 3 metros: pasos cortos y cuerpo bajo. Si llegas corriendo de frente, es más fácil que te regateen.'), d: 1, m: { a: [25, 40], h2: [28.5, 40.5] }, pr: ['h2'] },
    { n: t('Se coloca de lado (perfilado), tapando el camino hacia el centro. Así el atacante solo puede irse hacia la banda.'), d: 1, m: { a: [28, 45], h2: [30.5, 42] }, dv: [[27, 42.5]] },
    { n: t('El defensa le acompaña hacia fuera sin tirarse al suelo. Cuanto más cerca de la banda, menos ángulo de tiro tiene el atacante.'), d: 1, m: { a: [36, 56], h2: [37, 52] }, run: ['h2'] },
    { n: t('El atacante, encerrado, deja el balón un poco largo y el defensa mete el pie y roba. Se cambian los papeles. Robar vale 1 punto.'), b: 'h2', s: true, d: -1, m: { h2: [39, 57], a: [37, 60] } },
  ], () => cones([[16, 20], [16, 48]]))

// ---------- Salida de balón ante presión alta (es la jugada de la demostración de la web) ----------

const salidaPresion = T('t3-salida-presion-alta', 'Generar espacios', t('Salida de balón ante presión alta (4-3-3 contra 4-4-2)'), 'full',
  { h1: [5, 34], h4: [14, 25], h5: [14, 43], h3: [26, 7], h2: [26, 61], h6: [25, 34], h8: [38, 22], h10: [38, 46], h11: [56, 9], h7: [56, 59], h9: [62, 34] },
  { r9: [27, 28], r10: [27, 40], r7: [36, 11], r11: [36, 57], r8: [38, 27], r6: [38, 41], r2: [55, 13], r5: [57, 28], r4: [57, 40], r3: [55, 55], g: [100, 34] },
  'h1', [
    { n: t('Saque de portería. El rival presiona alto en 4-4-2: sus dos delanteros vigilan a nuestros centrales y sus extremos saltan a los laterales.') },
    { n: t('El portero juega con el central 4. Un delantero sale a presionarle y el otro tapa el pase al otro central.'), b: 'h4', m: { r9: [19, 26], r10: [22, 36] }, pr: ['r9', 'r10'] },
    { n: t('El 6 baja a dar apoyo y recibe. Su marcador (el 8 rival) le persigue y deja un hueco a su espalda. Nuestro 8 se mete en ese hueco.'), b: 'h6', m: { h6: [21, 31], r8: [24.5, 26.5], h8: [33, 21] }, run: ['h6', 'h8'], pr: ['r8'] },
    { n: t('Tercer hombre: el 6, de cara, toca de primeras para el 8, que recibe libre y de frente. La presión ya queda atrás.'), b: 'h8', m: { r6: [33, 33] }, pr: ['r6'] },
    { n: t('El 8 conduce hacia delante. El 9 baja para arrastrar a un central y el 11 ataca la espalda del lateral rival.'), m: { h8: [45, 22], h9: [55, 30], r5: [59, 29], h11: [68, 7], r2: [60, 10] }, run: ['h9', 'h11'] },
    { n: t('Pase al espacio para el 11, que llega lanzado. Hemos superado la presión con tres pases y atacamos con ventaja.'), b: 'h11', m: { h11: [76, 10], r2: [70, 12] }, run: ['h11'], pr: ['r2'] },
  ])

export const TACTICAS3: Template[] = [
  salidaPresion,
  basculacion, bloque541,
  presionTres,
  vigilancias,
  desdoblamiento, balonLargo,
  de433a451,
  cornerFrontal, faltaContra,
  lineaCuatro, unoContraUnoBanda, defensaUnoContraUno,
]
