// Guía de uso: «Crea tu primera jugada» (5 pasos) y un manual por funciones. Se ve en «Ayuda».
// Generado desde el contenido de la guía (también usado en la web: guia.html y en/guide.html). Las imágenes están en public/guia/<idioma>/.
import { t } from './i18n'

export interface GuideItem { term?: string; text: string }
export interface GuideSection { id: string; title: string; intro?: string; img?: string; items: GuideItem[] }

export const GUIDE_STEPS: GuideSection[] = [
  {
    id: 'p1',
    title: t('Crea la jugada y elige el campo'),
    img: 'paso-1',
    items: [
      { text: t('Pulsa «+ Nueva» arriba a la izquierda. El campo se queda vacío.') },
      { text: t('Elige el campo: «Campo» (entero), «Medio» (medio campo) o «40×30» (un espacio para ejercicios).') },
      { term: t('Ejemplo'), text: t('para una salida de balón o un contraataque, elige «Campo».') },
      { term: t('En el móvil'), text: t('si sujetas el móvil en vertical, pulsa «▯ Vertical» abajo a la derecha y el campo se verá más grande.') },
      { text: t('Si vacías el campo sin querer, pulsa ↶ y vuelve lo que tenías.') },
    ],
  },
  {
    id: 'p2',
    title: t('Añade y mueve jugadores y balón'),
    img: 'paso-2',
    items: [
      { text: t('Pulsa «+ Local» una vez por cada jugador de tu equipo y «+ Rival» por cada rival. Cada uno sale en el centro con el dorsal siguiente.') },
      { text: t('Pulsa «+ Balón» para poner el balón.') },
      { text: t('Con la herramienta «Mover» (abajo), arrastra cada ficha a su sitio. Pon el balón junto al jugador que lo tiene.') },
      { text: t('Toca un jugador para cambiar su dorsal, escribir su nombre o eliminarlo.') },
      { term: t('Ejemplo'), text: t('tres locales y dos rivales para un 3 contra 2.') },
      { term: t('En el móvil'), text: t('arrastra con el dedo. Si una ficha es pequeña, toca cerca de ella: la app coge la más cercana.') },
      { term: t('En el ordenador'), text: t('arrastra con el ratón. La tecla Supr elimina la ficha elegida.') },
    ],
  },
  {
    id: 'p3',
    title: t('Dibuja pases y carreras'),
    img: 'paso-3',
    items: [
      { text: t('Elige «Pase» en la barra de abajo y dibuja desde el balón hasta el compañero. Sale una línea recta.') },
      { text: t('Elige «Carrera» y dibuja desde un jugador hasta donde quieres que vaya. Puede ser curva.') },
      { text: t('Para el que avanza con el balón usa «Conducción», y para salir a por un rival, «Presión».') },
      { term: t('Ejemplo'), text: t('el 4 pasa al 8 y el 9 corre al espacio.') },
      { term: t('En el móvil'), text: t('el dedo dibuja solo cuando tienes una herramienta de dibujo elegida. Para mover fichas, vuelve a «Mover».') },
      { term: t('Con S Pen'), text: t('no hace falta cambiar de herramienta: tocar una ficha la mueve y tocar el césped dibuja.') },
      { text: t('Si un trazo sale mal, pulsa ↶ o usa «Borrar» y toca el trazo.') },
    ],
  },
  {
    id: 'p4',
    title: t('Añade pasos para animarla'),
    img: 'paso-4',
    items: [
      { text: t('Pulsa «+ Paso» en la barra de animación. Cada jugador va al final de su carrera y el balón al final del pase.') },
      { text: t('En el paso nuevo, dibuja lo que pasa después y vuelve a pulsar «+ Paso». Repite hasta terminar la jugada.') },
      { text: t('También puedes arrastrar las fichas a mano en cada paso. La sombra muestra dónde estaban antes.') },
      { text: t('Escribe en «Explica este paso» lo que tus jugadores deben entender. Sale en el proyector y en el vídeo.') },
      { term: t('Ejemplo'), text: t('paso 1: «El 4 juega con el 8». Paso 2: «El 8 filtra al 9 en carrera».') },
      { text: t('La «Flecha» es solo un dibujo para explicar: no mueve a nadie al añadir un paso.') },
    ],
  },
  {
    id: 'p5',
    title: t('Reproduce, guarda y exporta'),
    img: 'paso-5',
    items: [
      { text: t('Pulsa «▶ Reproducir» y la jugada se mueve sola. Los números te llevan a cada paso.') },
      { text: t('Para guardarla, pulsa «Jugadas», escribe un nombre y pulsa «Guardar la pizarra actual».') },
      { text: t('Para enviarla, pulsa «Exportar» y elige «Vídeo MP4» (o «Imagen PNG»). Cuando esté lista, pulsa «Compartir» o «Guardar».') },
      { term: t('En el móvil'), text: t('«Compartir» abre WhatsApp, Instagram y las demás apps.') },
      { term: t('En el ordenador'), text: t('«Guardar» deja el archivo en tus descargas. Para el vídeo usa Chrome o Edge actualizados.') },
    ],
  },
]

export const GUIDE_MANUAL: GuideSection[] = [
  {
    id: 'botones',
    title: t('Qué hace cada botón'),
    intro: t('Arriba están los botones para crear y abrir contenido. Abajo, la animación, las herramientas y los ajustes.'),
    img: 'guia-pantalla',
    items: [
      { term: t('+ Nueva'), text: t('deja el campo vacío. Se puede deshacer con ↶.') },
      { term: t('Campo, Medio y 40×30'), text: t('cambian el tipo de campo.') },
      { term: t('Fundamentos, Plantillas, Sesiones y Consejos'), text: t('abren el contenido que trae la app.') },
      { term: t('Fichas'), text: t('cambia la forma de las fichas, si se ve el número o el nombre y los colores de cada equipo.') },
      { term: t('Zonas'), text: t('divide el campo en carriles y alturas para explicar dónde pasa cada cosa.') },
      { term: t('+ Local, + Rival, + Balón y + Material'), text: t('añaden jugadores, el balón, conos, picas, vallas, porterías y más. «Girar 45°» orienta el material.') },
      { term: t('↶ y ↷'), text: t('deshacen y rehacen el último cambio. En el ordenador también Ctrl+Z y Ctrl+Y.') },
      { term: t('Jugadas, Proyectar y Exportar'), text: t('guardan tus jugadas, las muestran a pantalla completa y las sacan en imagen o vídeo.') },
      { text: t('Lo que haces se guarda solo en tu dispositivo. Al volver a abrir la app sigue tu última pizarra.') },
    ],
  },
  {
    id: 'herramientas',
    title: t('Herramientas de dibujo'),
    intro: t('Están en la barra de abajo. Elige una y dibuja sobre el campo. Los colores de al lado cambian el color del trazo.'),
    img: 'guia-herramientas',
    items: [
      { term: t('Mover'), text: t('arrastra fichas y letreros. Es la herramienta normal.') },
      { term: t('Pase'), text: t('línea recta del balón. Al añadir un paso, el balón va al final.') },
      { term: t('Pase aéreo'), text: t('el balón va por arriba. Se curva hacia el lado al que dibujes; si lo haces recto, va recto.') },
      { term: t('Carrera'), text: t('un jugador se desplaza sin balón. Al añadir un paso, el jugador va al final.') },
      { term: t('Conducción'), text: t('un jugador avanza con el balón. Al añadir un paso, va al final con el balón.') },
      { term: t('Presión'), text: t('un jugador sale a presionar a un rival. También lo mueve.') },
      { term: t('Tiro'), text: t('disparo a portería. Mueve el balón.') },
      { term: t('Flecha'), text: t('una indicación para explicar. Es solo un dibujo: no mueve a nadie.') },
      { term: t('Línea'), text: t('recta para marcar una línea defensiva o una distancia.') },
      { term: t('Flecha punteada y Línea punteada'), text: t('trazos de puntos para señalar una idea, una referencia o una distancia. Son solo dibujos: no mueven a nadie.') },
      { term: t('Texto'), text: t('toca el campo, escribe un mensaje y elige color y tamaño. Arrástralo para moverlo y tócalo para editarlo.') },
      { term: t('Zona, Foco y Libre'), text: t('Zona marca un espacio, Foco ilumina un jugador o una zona clave y Libre es un trazo a mano.') },
      { term: t('Borrar'), text: t('toca un trazo o una ficha para quitarlo. «Borrar trazos» quita todos los dibujos de la pizarra o del paso.') },
      { term: t('Con S Pen'), text: t('si tocas una ficha, la mueves; si tocas el césped, dibujas con la última herramienta elegida. Mantén el botón lateral para borrar. Cuando la app ve el lápiz, el dedo solo mueve fichas, así puedes apoyar la mano.') },
    ],
  },
  {
    id: 'animacion',
    title: t('Animación y ritmo'),
    intro: t('La barra de animación aparece encima de las herramientas.'),
    items: [
      { term: t('▶ Reproducir'), text: t('mueve la jugada de principio a fin. Las flechas ‹ › y los números van paso a paso.') },
      { term: t('+ Paso y Quitar paso'), text: t('añaden un paso después del que tienes abierto o quitan ese paso.') },
      { term: t('Cada paso y Velocidad'), text: t('eligen cuánto dura cada paso (3, 5, 8 o 10 segundos) y si el movimiento es lento, normal o rápido. Vale para reproducir y para el vídeo.') },
      { term: t('Ejemplo'), text: t('para explicar en la charla, 8 segundos y velocidad Lenta; para WhatsApp, 5 segundos y Normal; para un vídeo corto, 3 segundos y Rápida.') },
    ],
  },
  {
    id: 'contenido',
    title: t('Plantillas y sesiones'),
    intro: t('No hace falta empezar de cero: la app trae mucho contenido listo para usar.'),
    img: 'guia-plantillas',
    items: [
      { term: t('Plantillas'), text: t('alineaciones, ejercicios, situaciones de juego y balón parado. Toca una y se abre en el campo. Las marcadas con ▶ se reproducen solas.') },
      { term: t('Sesiones'), text: t('entrenamientos completos de fútbol 11 con sus bloques y minutos. MD-3 significa 3 días antes del partido. Toca un bloque con ▶ para abrir su ejercicio.') },
      { term: t('Fundamentos y Consejos'), text: t('lo esencial de la táctica explicado desde cero, con un diccionario, e ideas prácticas para entrenar y gestionar el grupo.') },
      { term: t('Ejemplo'), text: t('abre una plantilla de córner, cambia los dorsales por los de tu equipo y guárdala en «Jugadas» como tuya.') },
    ],
  },
  {
    id: 'identidad',
    title: t('Tu nombre y tu escudo'),
    intro: t('Pulsa «Mi identidad» abajo a la derecha para poner tu nombre, tu equipo y tu escudo en tus pizarras, imágenes y vídeos.'),
    items: [
      { text: t('Pulsa «+ Nuevo perfil» y rellena lo que quieras: nombre, cargo, club y escudo. Ningún dato es obligatorio.') },
      { text: t('El escudo queda mejor en PNG con fondo transparente. Puedes tener varios perfiles, por ejemplo uno por equipo.') },
      { text: t('En «Qué se ve» eliges qué sale abajo a la derecha, pequeño y fuera del campo.') },
      { term: t('Mensaje final'), text: t('al terminar el vídeo puede salir una pantalla con tu frase, tu escudo y tu nombre.') },
    ],
  },
  {
    id: 'exportar',
    title: t('Exportar vídeo e imagen'),
    intro: t('En «Exportar» sacas tu pizarra para enviarla por WhatsApp o subirla a redes.'),
    img: 'guia-exportar',
    items: [
      { term: t('Imagen PNG'), text: t('una foto de la pizarra tal como está.') },
      { term: t('Vídeo MP4'), text: t('la jugada animada con sus textos. Necesita una jugada con pasos.') },
      { term: t('Vista previa'), text: t('mira el vídeo antes de crearlo y prueba las opciones.') },
      { term: t('Opciones del vídeo'), text: t('«Letra grande» para verlo en el móvil, «Campo a todo el ancho» y el cierre con el logo de TacticalPro, que puedes quitar.') },
      { term: t('Varias a la vez'), text: t('marca varias jugadas y se exportan juntas: las animadas en vídeo y las demás en imagen.') },
      { term: t('En el móvil'), text: t('al terminar, «Compartir» lo envía por WhatsApp u otra app.') },
      { term: t('En el ordenador'), text: t('«Guardar» lo deja en tus descargas. Si el navegador no puede crear vídeo, usa Chrome o Edge actualizados.') },
    ],
  },
  {
    id: 'proyectar',
    title: t('Usar el proyector'),
    intro: t('«Proyectar» pone la pizarra a pantalla completa, sin botones, para enseñarla en una tele o un proyector.'),
    img: 'guia-proyectar',
    items: [
      { term: t('En el móvil'), text: t('toca el lado derecho de la pantalla para avanzar un paso y el izquierdo para volver.') },
      { term: t('En el ordenador'), text: t('usa las flechas del teclado o un mando de presentaciones. La barra espaciadora reproduce la jugada.') },
      { text: t('Para salir, pulsa «Salir» o la tecla Esc.') },
      { term: t('Ejemplo'), text: t('conecta el portátil a la tele del vestuario, abre tu jugada y pulsa «Proyectar».') },
    ],
  },
  {
    id: 'instalar',
    title: t('Instalar la app y copias de seguridad'),
    intro: t('TacticalPro se instala desde el navegador y funciona sin internet.'),
    items: [
      { term: t('Android'), text: t('en Chrome, toca el menú ⋮ y elige «Instalar aplicación» o «Añadir a pantalla de inicio».') },
      { term: t('iPhone y iPad'), text: t('en Safari, toca Compartir y luego «Añadir a pantalla de inicio».') },
      { term: t('En el ordenador'), text: t('en Chrome o Edge, pulsa el icono de instalar en la barra de direcciones.') },
      { term: t('Copia de seguridad'), text: t('tus jugadas viven en este dispositivo. En «Jugadas», «Exportar copia de seguridad» crea un archivo con todas ellas y tu identidad. En otro móvil u ordenador, «Importar copia de seguridad» lo recupera sin duplicar nada.') },
      { term: t('Idioma'), text: t('el selector de abajo a la derecha cambia la app entre español e inglés.') },
    ],
  },
]
