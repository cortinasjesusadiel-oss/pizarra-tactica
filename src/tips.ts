// Consejos prácticos de táctica, entrenamiento, gestión y análisis para fútbol 11 adulto.
export interface Tip { title: string; text: string; source?: string }
export interface TipGroup { id: string; name: string; tips: Tip[] }

export const TIPS: TipGroup[] = [
  {
    id: 'sistemas',
    name: 'Elegir el sistema',
    tips: [
      {
        title: 'Primero los jugadores, luego el dibujo',
        text: 'El sistema se elige según los futbolistas que tienes, no al revés. Si tus mejores jugadores son mediapuntas, busca un dibujo que los meta en el campo aunque no sea tu favorito.',
        source: 'Carlo Ancelotti (adaptó su Milan al talento de Pirlo, Seedorf y Rui Costa)',
      },
      {
        title: '4-3-3: control y amplitud',
        text: 'Encaja si tienes extremos rápidos y un mediocentro que sepa girar y distribuir. Los tres centrocampistas forman triángulos fáciles para tener el balón y presionar arriba.',
      },
      {
        title: '4-2-3-1: atacar sin perder el centro',
        text: 'Para un equipo ofensivo, el 4-2-3-1 permite sumar hombres al ataque sin descuidar el centro gracias al doble pivote. Necesitas un mediapunta creativo y dos pivotes que se repartan salir y cubrir.',
      },
      {
        title: '4-4-2: orden y sencillez',
        text: 'Dos líneas de cuatro muy juntas son fáciles de entender y de mantener, ideal si quieres defender bien y salir a la contra. Su punto débil es quedar en inferioridad en el medio contra tres centrocampistas.',
        source: 'Arrigo Sacchi / Diego Simeone',
      },
      {
        title: '3-5-2 / 5-3-2: un sistema, dos caras',
        text: 'Con balón, los carrileros dan amplitud y se ataca con cinco; sin balón, bajan y se defiende con cinco atrás. Exige carrileros con mucho recorrido y centrales cómodos defendiendo en espacios abiertos.',
      },
      {
        title: '3-4-3: presión y amplitud máxima',
        text: 'Pone mucha gente arriba para presionar y ocupa todo el ancho, pero deja espacio a la espalda de los carrileros. Úsalo si tus centrales son rápidos y quieres dominar el partido.',
      },
      {
        title: '4-1-4-1: un ancla y bloque compacto',
        text: 'Un mediocentro defensivo protege a los centrales y los cuatro medios cierran el ancho. Funciona bien para defender en bloque medio y pasar a 4-3-3 cuando tienes el balón.',
      },
      {
        title: 'Busca superioridad en el medio',
        text: 'Cuenta cuántos centrocampistas tiene el rival y procura tener uno más, o compensar con un central que conduce o un delantero que baja. Quien gana el centro suele controlar el partido.',
      },
      {
        title: 'Cómo contrarrestar sistemas',
        text: 'Contra un 4-4-2, mete un hombre entre líneas o un tercer medio. Contra tres centrales, presiona con tres arriba; contra carrileros, ataca la espalda con tus extremos.',
      },
    ],
  },
  {
    id: 'ataque',
    name: 'Ideas para atacar',
    tips: [
      {
        title: 'Amplitud y profundidad',
        text: 'Haz el campo grande con balón: un jugador pegado a cada banda y alguien amenazando la espalda de la defensa. Así el rival se estira y aparecen huecos por dentro.',
        source: 'Rinus Michels / Johan Cruyff',
      },
      {
        title: 'Ocupa bien los espacios',
        text: 'No más de dos jugadores en la misma línea vertical ni más de tres en la misma horizontal. Si todos están en distintas alturas y carriles, siempre hay una línea de pase.',
        source: 'Pep Guardiola (juego de posición)',
      },
      {
        title: 'El tercer hombre',
        text: 'Si A no puede pasar directo a C, pasa a B, que de primeras se la deja a C ya de cara. Es la forma más sencilla de superar líneas de presión.',
        source: 'Johan Cruyff',
      },
      {
        title: 'Ataca los carriles interiores',
        text: 'El espacio entre el lateral y el central rival (el carril interior o half-space) es el más peligroso: desde ahí puedes pasar, centrar o tirar. Coloca a tus jugadores más creativos recibiendo ahí.',
      },
      {
        title: 'Sobrecarga un lado, termina en el otro',
        text: 'Junta muchos jugadores en una banda para atraer al rival y luego cambia rápido de orientación al lado débil. El jugador que espera solo en el lado contrario suele quedar uno contra uno.',
      },
      {
        title: 'Fija antes de pasar',
        text: 'Conduce hacia un rival hasta que te salga, y entonces suelta el pase. Si pasas antes de fijar, el defensor no se compromete y no se libera ningún compañero.',
      },
      {
        title: 'Defensa de vigilancia',
        text: 'Mientras atacas, deja siempre dos o tres jugadores colocados para frenar la contra (por ejemplo, dos centrales y un pivote). Atacar bien también es estar preparado para perder el balón.',
      },
      {
        title: 'Pasa rápido en los últimos metros',
        text: 'Construye con calma atrás, pero acelera cerca del área: uno o dos toques y desmarques de ruptura. La defensa rival tiene menos tiempo para reorganizarse.',
      },
    ],
  },
  {
    id: 'defensa',
    name: 'Ideas para defender',
    tips: [
      {
        title: 'Elige la altura del bloque',
        text: 'Bloque alto si quieres robar cerca de su portería; bloque medio para cerrar el centro; bloque bajo si el rival es superior o vas ganando. Lo importante es que todo el equipo sepa a qué altura defiende.',
      },
      {
        title: 'Equipo corto y junto',
        text: 'Mantén poca distancia entre la defensa y el delantero (unos 30-35 metros como referencia) y entre las líneas. Un equipo junto obliga al rival a jugar por fuera y deja pocos pases entre líneas.',
        source: 'Arrigo Sacchi (Milan)',
      },
      {
        title: 'Presiona con señales',
        text: 'No se presiona siempre: se salta a la presión ante señales claras. Por ejemplo, un pase hacia atrás, un control malo, un jugador de espaldas o un balón que va a la banda.',
      },
      {
        title: 'Regla de los cinco segundos',
        text: 'Al perder el balón, los más cercanos presionan fuerte durante unos segundos para recuperarlo antes de que el rival se organice. Si no se recupera, el equipo se repliega y se ordena.',
        source: 'Pep Guardiola (Barcelona 2008-12)',
      },
      {
        title: 'La contrapresión como creador de juego',
        text: 'Robar justo después de perder te deja con el rival desordenado y cerca de su portería. Por eso muchos entrenadores la consideran la mejor forma de generar ocasiones.',
        source: 'Jürgen Klopp',
      },
      {
        title: 'Orienta la presión hacia fuera',
        text: 'Cierra el pase interior con tu posición y empuja al rival hacia la banda. La línea de cal hace de defensor extra y es más fácil robar ahí.',
      },
      {
        title: 'Defender centros',
        text: 'Primero, impedir el centro: el lateral o el extremo salen al jugador de banda. Dentro del área, cubre primer palo, punto de penalti y segundo palo, y que alguien vigile el rechace en la frontal.',
      },
      {
        title: 'Defender es tarea de todos',
        text: 'El delantero es el primer defensor y marca hacia dónde se presiona. Si uno no cumple, se rompe todo el bloque.',
      },
    ],
  },
  {
    id: 'abp',
    name: 'Balón parado',
    tips: [
      {
        title: 'Una fuente de goles cada vez mayor',
        text: 'En la Premier League 2025/26 se marcaban unos 0,8 goles por partido a balón parado (sin penaltis), frente a 0,5 en 2020/21. Es casi un tercio de los goles sin penalti: merece tiempo de entrenamiento.',
        source: 'Datos de la Premier League 2025/26 publicados en prensa',
      },
      {
        title: 'Zonal, al hombre o mixta',
        text: 'En zonal cada jugador defiende un espacio y ataca el balón que llega ahí; al hombre, cada uno sigue a un rival. La mixta combina ambas: zonas clave cubiertas (primer palo, área pequeña) y marcas a los mejores rematadores.',
      },
      {
        title: 'Pocas jugadas, bien ensayadas',
        text: 'Mejor tres o cuatro jugadas de córner y falta que los jugadores se sepan de memoria que diez a medias. Usa una señal sencilla (gesto o número) para cantar cada jugada.',
      },
      {
        title: 'Bloqueos y desmarques',
        text: 'Muchas jugadas de córner buscan liberar al mejor rematador con un bloqueo o un cruce de carreras. Ensaya el tiempo de la carrera con el del centro.',
      },
      {
        title: 'Especialistas',
        text: 'Ten claro quién lanza cada tipo de balón (cerrado, abierto, falta directa) y quiénes son tus mejores rematadores. Si es posible, que un miembro del cuerpo técnico se encargue solo del balón parado.',
      },
      {
        title: 'No olvides el rechace y la contra',
        text: 'En córner a favor coloca a alguien en la frontal para el rechace y deja jugadores atrás para frenar la contra. En contra, ten un jugador preparado para salir rápido.',
      },
      {
        title: 'Saques de banda largos y rápidos',
        text: 'Un saque de banda largo al área funciona como un córner, y un saque rápido pilla al rival desordenado. Son acciones que se repiten muchas veces por partido.',
      },
    ],
  },
  {
    id: 'entrenar',
    name: 'Cómo entrenar mejor',
    tips: [
      {
        title: 'Entrena lo táctico con lo físico',
        text: 'En la periodización táctica no se separan físico, táctica y técnica: todo se trabaja jugando, según tu modelo de juego. Cada tarea debe parecerse a algo que pasa en el partido.',
        source: 'Vítor Frade (periodización táctica)',
      },
      {
        title: 'Organiza la semana desde el partido',
        text: 'Cuenta los días hacia el partido (MD): MD-4 tareas de fuerza y duelos en espacios reducidos, MD-3 resistencia en espacios grandes, MD-2 velocidad y reacción, MD-1 activación corta y balón parado. Tras el partido, recuperación.',
        source: 'Vítor Frade (periodización táctica)',
      },
      {
        title: 'Juegos reducidos',
        text: 'Partidos de 4 contra 4 a 8 contra 8 dan muchos toques, muchas decisiones e intensidad. Cuanto más pequeño el campo, más duelos; cuanto más grande, más carrera.',
      },
      {
        title: 'Usa reglas para provocar conductas',
        text: 'Cambia las reglas para que salga lo que quieres: gol doble tras robo en campo rival, toques limitados o porterías en las bandas para obligar a abrir. El jugador aprende sin que se lo expliques mil veces.',
      },
      {
        title: 'Rondos cada día',
        text: 'El rondo trabaja pase, control, perfil y presión tras pérdida en pocos minutos. Es una forma rápida de entrar en calor con balón.',
        source: 'Johan Cruyff',
      },
      {
        title: 'Entrena como juegas',
        text: 'Si quieres presionar alto el domingo, presiona alto en los entrenamientos con la misma intensidad. Lo que no se entrena no aparece en el partido.',
      },
      {
        title: 'Controla la carga',
        text: 'Alterna días duros y suaves y baja el volumen cerca del partido. Preguntar a los jugadores cómo se sienten (del 1 al 10) ya es una forma útil de medir fatiga.',
      },
      {
        title: 'Vídeo corto para corregir',
        text: 'Enseña dos o tres clips del partido o del entrenamiento antes de una tarea relacionada. Ver el error y corregirlo en el campo justo después se fija mejor.',
      },
    ],
  },
  {
    id: 'motivar',
    name: 'Gestionar y motivar al grupo',
    tips: [
      {
        title: 'Conoce a cada persona',
        text: 'Cada jugador necesita un trato distinto: a unos les motiva la exigencia y a otros la confianza. Interésate también por su vida fuera del campo.',
        source: 'Sir Alex Ferguson',
      },
      {
        title: 'Roles claros',
        text: 'Explica a cada uno qué esperas de él con y sin balón, y también fuera del campo. Un jugador que sabe su papel rinde más y se queja menos.',
      },
      {
        title: 'Charlas cortas y con una idea',
        text: 'En el vestuario, dos o tres mensajes como mucho. Si das diez instrucciones, no se recuerda ninguna.',
      },
      {
        title: 'Corrige la acción, no a la persona',
        text: 'Critica lo que pasó en el juego y explica qué hacer la próxima vez. Mejor en privado cuando es algo personal, y en público cuando es para todos.',
      },
      {
        title: 'Apóyate en los líderes',
        text: 'Identifica a los jugadores que el grupo escucha y hazlos parte de las decisiones. Transmiten tus ideas dentro del vestuario mejor que tú.',
      },
      {
        title: 'Da autonomía',
        text: 'Pide opiniones y deja que los jugadores resuelvan problemas en el campo. Si entienden el porqué de una idea, la aplican mejor que si solo obedecen.',
      },
      {
        title: 'Cuida a los suplentes',
        text: 'Habla con los que juegan menos, explícales el motivo y dales objetivos concretos. Un banquillo motivado es el que gana partidos en los últimos minutos.',
      },
      {
        title: 'Celebra el esfuerzo',
        text: 'Reconoce en público las acciones que no salen en el marcador: una presión, una ayuda defensiva, una carrera de vuelta. Lo que se premia se repite.',
      },
      {
        title: 'Calma en los malos momentos',
        text: 'Tras una derrota, analiza en frío al día siguiente en vez de gritar en caliente. Un entrenador tranquilo transmite seguridad al grupo.',
        source: 'Carlo Ancelotti',
      },
    ],
  },
  {
    id: 'analisis',
    name: 'Consejos para el analista',
    tips: [
      {
        title: 'Qué mirar del rival',
        text: 'Mira su sistema con y sin balón, cómo sale desde atrás, dónde presiona, quiénes son sus jugadores clave y cómo defiende y ataca a balón parado. Con eso ya tienes el 80 % del informe.',
      },
      {
        title: 'Busca patrones, no jugadas sueltas',
        text: 'Una acción aislada no dice mucho: busca lo que se repite en varios partidos. Bielsa llegó a revisar todos los partidos de la temporada de un rival; tú empieza con los dos o tres más recientes.',
        source: 'Marcelo Bielsa',
      },
      {
        title: 'Clips cortos',
        text: 'Cada clip de 5 a 15 segundos y una idea por clip. Para los jugadores, una sesión de vídeo de más de 10-15 minutos pierde atención.',
      },
      {
        title: 'xG explicado fácil',
        text: 'Los goles esperados (xG) dan a cada tiro una probabilidad de ser gol según su posición y tipo. Si generas más xG que el rival, estás creando mejores ocasiones aunque el resultado no lo refleje.',
      },
      {
        title: 'PPDA explicado fácil',
        text: 'PPDA son los pases que deja dar el rival en su zona antes de que hagas una acción defensiva (entrada, intercepción, falta). Cuanto más bajo, más presiona tu equipo; cuanto más alto, más espera atrás.',
        source: 'Definición de la Premier League',
      },
      {
        title: 'Field tilt explicado fácil',
        text: 'Es el porcentaje de pases en el último tercio que da cada equipo. Indica quién juega más cerca de la portería contraria, que es más útil que la posesión total.',
      },
      {
        title: 'Los datos necesitan contexto',
        text: 'Un número sin vídeo puede engañar: un equipo con mucha posesión puede tener PPDA bajo sin presionar mucho. Usa los datos para saber dónde mirar y el vídeo para entender por qué.',
      },
      {
        title: 'Presenta para el jugador',
        text: 'Al jugador dale poco y concreto: qué hace su par, cómo ganarle y dos o tres imágenes. Los detalles largos son para el cuerpo técnico.',
      },
    ],
  },
]
