import { t } from './i18n'
// Consejos prácticos de táctica, entrenamiento, gestión y análisis para fútbol 11 adulto.
export interface Tip { title: string; text: string; source?: string }
export interface TipGroup { id: string; name: string; tips: Tip[] }

export const TIPS: TipGroup[] = [
  {
    id: 'sistemas',
    name: t('Elegir el sistema'),
    tips: [
      {
        title: t('Primero los jugadores, luego el dibujo'),
        text: t('El sistema se elige según los futbolistas que tienes, no al revés. Si tus mejores jugadores son mediapuntas, busca un dibujo que los meta en el campo aunque no sea tu favorito.'),
        source: t('Carlo Ancelotti (adaptó su Milan al talento de Pirlo, Seedorf y Rui Costa)'),
      },
      {
        title: t('4-3-3: control y amplitud'),
        text: t('Encaja si tienes extremos rápidos y un mediocentro que sepa girar y distribuir. Los tres centrocampistas forman triángulos fáciles para tener el balón y presionar arriba.'),
      },
      {
        title: t('4-2-3-1: atacar sin perder el centro'),
        text: t('Para un equipo ofensivo, el 4-2-3-1 permite sumar hombres al ataque sin descuidar el centro gracias al doble pivote. Necesitas un mediapunta creativo y dos pivotes que se repartan salir y cubrir.'),
      },
      {
        title: t('4-4-2: orden y sencillez'),
        text: t('Dos líneas de cuatro muy juntas son fáciles de entender y de mantener, ideal si quieres defender bien y salir a la contra. Su punto débil es quedar en inferioridad en el medio contra tres centrocampistas.'),
        source: t('Arrigo Sacchi / Diego Simeone'),
      },
      {
        title: t('3-5-2 / 5-3-2: un sistema, dos caras'),
        text: t('Con balón, los carrileros dan amplitud y se ataca con cinco; sin balón, bajan y se defiende con cinco atrás. Exige carrileros con mucho recorrido y centrales cómodos defendiendo en espacios abiertos.'),
      },
      {
        title: t('3-4-3: presión y amplitud máxima'),
        text: t('Pone mucha gente arriba para presionar y ocupa todo el ancho, pero deja espacio a la espalda de los carrileros. Úsalo si tus centrales son rápidos y quieres dominar el partido.'),
      },
      {
        title: t('4-1-4-1: un ancla y bloque compacto'),
        text: t('Un mediocentro defensivo protege a los centrales y los cuatro medios cierran el ancho. Funciona bien para defender en bloque medio y pasar a 4-3-3 cuando tienes el balón.'),
      },
      {
        title: t('Busca superioridad en el medio'),
        text: t('Cuenta cuántos centrocampistas tiene el rival y procura tener uno más, o compensar con un central que conduce o un delantero que baja. Quien gana el centro suele controlar el partido.'),
      },
      {
        title: t('Cómo contrarrestar sistemas'),
        text: t('Contra un 4-4-2, mete un hombre entre líneas o un tercer medio. Contra tres centrales, presiona con tres arriba; contra carrileros, ataca la espalda con tus extremos.'),
      },
      {
        title: t('Un dibujo con balón y otro sin balón'),
        text: t('Muchos equipos no atacan y defienden con la misma forma: un 4-3-3 puede atacar en 3-2-5 y defender en 4-4-2. Define las dos estructuras y quién se mueve para pasar de una a otra.'),
      },
      {
        title: t('Decide cómo sales desde atrás'),
        text: t('Puedes salir con dos centrales y el pivote delante, con el pivote metido entre centrales o con un lateral que se queda atrás. Elige según cuántos jugadores te presionen arriba: busca tener uno más que ellos.'),
      },
      {
        title: t('Ten un plan B ensayado'),
        text: t('Prepara un segundo sistema para cuando el partido lo pida, por ejemplo pasar a tres centrales o meter un segundo delantero. Si no se ha entrenado, el cambio en el partido crea más dudas que soluciones.'),
      },
    ],
  },
  {
    id: 'ataque',
    name: t('Ideas para atacar'),
    tips: [
      {
        title: t('Amplitud y profundidad'),
        text: t('Haz el campo grande con balón: un jugador pegado a cada banda y alguien amenazando la espalda de la defensa. Así el rival se estira y aparecen huecos por dentro.'),
        source: t('Rinus Michels / Johan Cruyff'),
      },
      {
        title: t('Ocupa bien los espacios'),
        text: t('Busca distintas alturas y carriles para ofrecer opciones de pase. Evita alinearte con compañeros cuando eso permita al rival cerrar varias opciones a la vez. La movilidad y los apoyos pueden abrir líneas de pase, según la presión y la posición de compañeros y rivales.'),
        source: t('Pep Guardiola (juego de posición)'),
      },
      {
        title: t('El tercer hombre'),
        text: t('Si A no puede pasar directo a C, pasa a B, que de primeras se la deja a C ya de cara. Es la forma más sencilla de superar líneas de presión.'),
        source: t('Johan Cruyff'),
      },
      {
        title: t('Ataca los carriles interiores'),
        text: t('El espacio entre el lateral y el central rival (el carril interior o half-space) es el más peligroso: desde ahí puedes pasar, centrar o tirar. Coloca a tus jugadores más creativos recibiendo ahí.'),
      },
      {
        title: t('Sobrecarga un lado, termina en el otro'),
        text: t('Junta muchos jugadores en una banda para atraer al rival y luego cambia rápido de orientación al lado débil. El jugador que espera solo en el lado contrario suele quedar uno contra uno.'),
      },
      {
        title: t('Fija antes de pasar'),
        text: t('Conduce hacia un rival hasta que te salga, y entonces suelta el pase. Si pasas antes de fijar, es más difícil que el defensor se comprometa y que se libere un compañero.'),
      },
      {
        title: t('Defensa de vigilancia'),
        text: t('Mientras atacas, conviene dejar jugadores colocados para frenar la contra, a menudo dos o tres (por ejemplo, dos centrales y un pivote). Cuántos depende de los delanteros rivales, del marcador y del riesgo que quieras asumir. Atacar bien también es estar preparado para perder el balón.'),
      },
      {
        title: t('Pasa rápido en los últimos metros'),
        text: t('Construye con calma atrás, pero acelera cerca del área: uno o dos toques y desmarques de ruptura. La defensa rival tiene menos tiempo para reorganizarse.'),
      },
      {
        title: t('Paciencia contra un bloque bajo'),
        text: t('Contra un rival encerrado, circula rápido de lado a lado para moverlo y espera el hueco. Llega desde segunda línea y ten gente en la frontal para tiros y rechaces.'),
      },
      {
        title: t('El pase atrás desde la línea de fondo'),
        text: t('Un centro raso hacia atrás, al punto de penalti o la frontal del área pequeña, es de las ocasiones más claras. La defensa corre hacia su portería y el rematador llega de cara.'),
      },
      {
        title: t('Si uno viene, otro va'),
        text: t('Combina desmarques de apoyo y de ruptura: cuando un jugador baja a recibir, otro ataca el espacio que deja. Si todos vienen al balón, la defensa no tiene que correr hacia atrás.'),
      },
    ],
  },
  {
    id: 'defensa',
    name: t('Ideas para defender'),
    tips: [
      {
        title: t('Elige la altura del bloque'),
        text: t('Bloque alto si quieres robar cerca de su portería; bloque medio para cerrar el centro; bloque bajo si el rival es superior o vas ganando. Lo importante es que todo el equipo sepa a qué altura defiende.'),
      },
      {
        title: t('Equipo corto y junto'),
        text: t('Mantén poca distancia entre la defensa y el delantero (unos 30-35 metros como referencia) y entre las líneas. Un equipo junto obliga al rival a jugar por fuera y deja pocos pases entre líneas.'),
        source: t('Arrigo Sacchi (Milan)'),
      },
      {
        title: t('Presiona con señales'),
        text: t('No se presiona siempre: se salta a la presión ante señales claras. Por ejemplo, un pase hacia atrás, un control malo, un jugador de espaldas o un balón que va a la banda.'),
      },
      {
        title: t('Regla de los cinco segundos'),
        text: t('Al perder el balón, los más cercanos presionan fuerte durante unos segundos para recuperarlo antes de que el rival se organice. Si no se recupera, el equipo se repliega y se ordena.'),
        source: t('Pep Guardiola (Barcelona 2008-12)'),
      },
      {
        title: t('La contrapresión como creador de juego'),
        text: t('Robar justo después de perder te deja con el rival desordenado y cerca de su portería. Por eso muchos entrenadores la consideran la mejor forma de generar ocasiones.'),
        source: t('Jürgen Klopp'),
      },
      {
        title: t('Orienta la presión hacia fuera'),
        text: t('Cierra el pase interior con tu posición y empuja al rival hacia la banda. La línea de cal hace de defensor extra y es más fácil robar ahí.'),
      },
      {
        title: t('Defender centros'),
        text: t('Primero, impedir el centro: el lateral o el extremo salen al jugador de banda. Dentro del área, cubre primer palo, punto de penalti y segundo palo, y que alguien vigile el rechace en la frontal.'),
      },
      {
        title: t('Defender es tarea de todos'),
        text: t('El delantero es el primer defensor y marca hacia dónde se presiona. Si uno no cumple, se rompe todo el bloque.'),
      },
      {
        title: t('Coberturas y permutas'),
        text: t('Cuando un compañero sale a presionar, el de al lado se cierra para cubrirle la espalda. Si le superan, el que cubre sale al balón y el superado ocupa su sitio.'),
      },
      {
        title: t('En inferioridad, retrasa'),
        text: t('En un 2 contra 1 o 3 contra 2, el defensor no se lanza al suelo: frena, tapa el pase más peligroso y gana tiempo para que lleguen ayudas. Un segundo de retraso vale más que una entrada fallada.'),
      },
      {
        title: t('Una sola voz para la línea'),
        text: t('Un jugador (normalmente un central) ordena subir o bajar la defensa. Se sube cuando el balón va hacia atrás o el poseedor está presionado y no puede jugar largo; se baja cuando tiene tiempo para mirar.'),
      },
    ],
  },
  {
    id: 'abp',
    name: t('Balón parado'),
    tips: [
      {
        title: t('Una fuente de goles cada vez mayor'),
        text: t('En la Premier League 2025/26 se marcaban unos 0,8 goles por partido a balón parado (sin penaltis), frente a 0,5 en 2020/21. Es casi un tercio de los goles sin penalti: merece tiempo de entrenamiento.'),
        source: t('Datos de la Premier League 2025/26 publicados en prensa'),
      },
      {
        title: t('Zonal, al hombre o mixta'),
        text: t('En zonal cada jugador defiende un espacio y ataca el balón que llega ahí; al hombre, cada uno sigue a un rival. La mixta combina ambas: zonas clave cubiertas (primer palo, área pequeña) y marcas a los mejores rematadores.'),
      },
      {
        title: t('Pocas jugadas, bien ensayadas'),
        text: t('Mejor tres o cuatro jugadas de córner y falta que los jugadores se sepan de memoria que diez a medias. Usa una señal sencilla (gesto o número) para cantar cada jugada.'),
      },
      {
        title: t('Bloqueos y desmarques'),
        text: t('Muchas jugadas de córner buscan liberar al mejor rematador con un bloqueo o un cruce de carreras. Ensaya el tiempo de la carrera con el del centro.'),
      },
      {
        title: t('Especialistas'),
        text: t('Ten claro quién lanza cada tipo de balón (cerrado, abierto, falta directa) y quiénes son tus mejores rematadores. Si es posible, que un miembro del cuerpo técnico se encargue solo del balón parado.'),
      },
      {
        title: t('No olvides el rechace y la contra'),
        text: t('En córner a favor coloca a alguien en la frontal para el rechace y deja jugadores atrás para frenar la contra. En contra, ten un jugador preparado para salir rápido.'),
      },
      {
        title: t('Saques de banda largos y rápidos'),
        text: t('Un saque de banda largo al área funciona como un córner, y un saque rápido pilla al rival desordenado. Son acciones que se repiten muchas veces por partido.'),
      },
      {
        title: t('Estudia el balón parado del rival'),
        text: t('Revisa sus últimos córners y faltas: quién lanza, a qué zona va el balón y quién remata. Los equipos suelen repetir las mismas dos o tres jugadas.'),
      },
      {
        title: t('Defiende el saque de banda largo como un córner'),
        text: t('Marca a sus rematadores, pon a un jugador delante del primer receptor y otro detrás para la prolongación. Es el mismo peligro que un córner y se olvida a menudo.'),
      },
      {
        title: t('Penaltis decididos antes del partido'),
        text: t('Ten claro el lanzador y dos suplentes antes de salir al campo. Para una tanda, el orden se decide en el banquillo con los jugadores que se ofrecen, no en el círculo central.'),
      },
    ],
  },
  {
    id: 'entrenar',
    name: t('Cómo entrenar mejor'),
    tips: [
      {
        title: t('Entrena lo táctico con lo físico'),
        text: t('En la periodización táctica no se separan físico, táctica y técnica: todo se trabaja jugando, según tu modelo de juego. Cada tarea debe parecerse a algo que pasa en el partido.'),
        source: t('Vítor Frade (periodización táctica)'),
      },
      {
        title: t('Organiza la semana desde el partido'),
        text: t('Cuenta los días hacia el partido (MD): MD-4 tareas de fuerza y duelos en espacios reducidos, MD-3 resistencia en espacios grandes, MD-2 velocidad y reacción, MD-1 activación corta y balón parado. Tras el partido, recuperación.'),
        source: t('Vítor Frade (periodización táctica)'),
      },
      {
        title: t('Juegos reducidos'),
        text: t('Partidos de 4 contra 4 a 8 contra 8 dan muchos toques, muchas decisiones e intensidad. Cuanto más pequeño el campo, más duelos; cuanto más grande, más carrera.'),
      },
      {
        title: t('Usa reglas para provocar conductas'),
        text: t('Cambia las reglas para que salga lo que quieres: gol doble tras robo en campo rival, toques limitados o porterías en las bandas para obligar a abrir. El jugador aprende sin que se lo expliques mil veces.'),
      },
      {
        title: t('Rondos cada día'),
        text: t('El rondo trabaja pase, control, perfil y presión tras pérdida en pocos minutos. Es una forma rápida de entrar en calor con balón.'),
        source: t('Johan Cruyff'),
      },
      {
        title: t('Entrena como juegas'),
        text: t('Si quieres presionar alto el domingo, presiona alto en los entrenamientos con la misma intensidad. Lo que no se entrena no aparece en el partido.'),
      },
      {
        title: t('Controla la carga'),
        text: t('Alterna días duros y suaves y baja el volumen cerca del partido. Preguntar a los jugadores cómo se sienten (del 1 al 10) ya es una forma útil de medir fatiga.'),
      },
      {
        title: t('Vídeo corto para corregir'),
        text: t('Enseña dos o tres clips del partido o del entrenamiento antes de una tarea relacionada. Ver el error y corregirlo en el campo justo después se fija mejor.'),
      },
      {
        title: t('Explica poco y juega mucho'),
        text: t('Explica cada tarea en menos de un minuto y corrige en las pausas entre series. Mucho tiempo parado baja la intensidad y la atención.'),
      },
      {
        title: t('Series y descansos según el objetivo'),
        text: t('Para trabajar resistencia en juego reducido, usa series de 3-4 minutos con 2 minutos de pausa. Para máxima intensidad o velocidad, series cortas (menos de 1 minuto) con descanso completo.'),
      },
      {
        title: t('Monta el campo antes'),
        text: t('Ten conos, petos y porterías colocados antes de que lleguen los jugadores, y encadena tareas en el mismo espacio. Así no pierdes diez minutos de sesión montando material.'),
      },
    ],
  },
  {
    id: 'motivar',
    name: t('Gestionar y motivar al grupo'),
    tips: [
      {
        title: t('Conoce a cada persona'),
        text: t('Cada jugador necesita un trato distinto: a unos les motiva la exigencia y a otros la confianza. Interésate también por su vida fuera del campo.'),
        source: t('Sir Alex Ferguson'),
      },
      {
        title: t('Roles claros'),
        text: t('Explica a cada uno qué esperas de él con y sin balón, y también fuera del campo. Un jugador que sabe su papel rinde más y se queja menos.'),
      },
      {
        title: t('Charlas cortas y con una idea'),
        text: t('En el vestuario, mejor pocos mensajes, por ejemplo dos o tres. Con muchas instrucciones a la vez, es fácil que los jugadores se queden con pocas o con ninguna.'),
      },
      {
        title: t('Corrige la acción, no a la persona'),
        text: t('Critica lo que pasó en el juego y explica qué hacer la próxima vez. Mejor en privado cuando es algo personal, y en público cuando es para todos.'),
      },
      {
        title: t('Apóyate en los líderes'),
        text: t('Identifica a los jugadores que el grupo escucha y hazlos parte de las decisiones. Transmiten tus ideas dentro del vestuario mejor que tú.'),
      },
      {
        title: t('Da autonomía'),
        text: t('Pide opiniones y deja que los jugadores resuelvan problemas en el campo. Si entienden el porqué de una idea, la aplican mejor que si solo obedecen.'),
      },
      {
        title: t('Cuida a los suplentes'),
        text: t('Habla con los que juegan menos, explícales el motivo y dales objetivos concretos. Un banquillo motivado es el que gana partidos en los últimos minutos.'),
      },
      {
        title: t('Celebra el esfuerzo'),
        text: t('Reconoce en público las acciones que no salen en el marcador: una presión, una ayuda defensiva, una carrera de vuelta. Lo que se premia se repite.'),
      },
      {
        title: t('Calma en los malos momentos'),
        text: t('Tras una derrota, analiza en frío al día siguiente en vez de gritar en caliente. Un entrenador tranquilo transmite seguridad al grupo.'),
        source: t('Carlo Ancelotti'),
      },
      {
        title: t('Pocas normas, iguales para todos'),
        text: t('Acordad con el grupo pocas normas claras (puntualidad, respeto, compromiso) y aplícalas igual al titular indiscutible que al último suplente. Si haces excepciones, pierdes autoridad.'),
      },
      {
        title: t('Da tú las malas noticias'),
        text: t('Si un jugador no va convocado o pierde el puesto, que lo sepa por ti y en persona antes de ver la lista. Explícale el motivo y qué tiene que mejorar.'),
      },
    ],
  },
  {
    id: 'analisis',
    name: t('Consejos para el analista'),
    tips: [
      {
        title: t('Qué mirar del rival'),
        text: t('Mira su sistema con y sin balón, cómo sale desde atrás, dónde presiona, quiénes son sus jugadores clave y cómo defiende y ataca a balón parado. Con eso ya tienes el 80 % del informe.'),
      },
      {
        title: t('Busca patrones, no jugadas sueltas'),
        text: t('Una acción aislada no dice mucho: busca lo que se repite en varios partidos. Bielsa llegó a revisar todos los partidos de la temporada de un rival; tú empieza con los dos o tres más recientes.'),
        source: t('Marcelo Bielsa'),
      },
      {
        title: t('Clips cortos'),
        text: t('Cada clip de 5 a 15 segundos y una idea por clip. Para los jugadores, una sesión de vídeo de más de 10-15 minutos pierde atención.'),
      },
      {
        title: t('xG explicado fácil'),
        text: t('Los goles esperados (xG) dan a cada tiro una probabilidad de ser gol según su posición y tipo. Si generas más xG que el rival, estás creando mejores ocasiones aunque el resultado no lo refleje.'),
      },
      {
        title: t('PPDA explicado fácil'),
        text: t('PPDA son los pases que deja dar el rival en su zona antes de que hagas una acción defensiva (entrada, intercepción, falta). Cuanto más bajo, más presiona tu equipo; cuanto más alto, más espera atrás.'),
        source: t('Definición de la Premier League'),
      },
      {
        title: t('Field tilt explicado fácil'),
        text: t('Es el porcentaje de pases en el último tercio que da cada equipo. Indica quién juega más cerca de la portería contraria, que es más útil que la posesión total.'),
      },
      {
        title: t('Los datos necesitan contexto'),
        text: t('Un número sin vídeo puede engañar: un equipo con mucha posesión puede tener PPDA bajo sin presionar mucho. Usa los datos para saber dónde mirar y el vídeo para entender por qué.'),
      },
      {
        title: t('Presenta para el jugador'),
        text: t('Al jugador dale poco y concreto: qué hace su par, cómo ganarle y dos o tres imágenes. Los detalles largos son para el cuerpo técnico.'),
      },
      {
        title: t('Usa una misma estructura en tus informes'),
        text: t('Organiza cada informe igual: ataque, defensa, transiciones, balón parado y jugadores clave. Ahorras tiempo y el cuerpo técnico sabe dónde buscar cada cosa.'),
      },
      {
        title: t('Etiqueta mientras ves'),
        text: t('En la primera visualización apunta minuto y tipo de acción (pérdida, robo, ocasión, ABP). Luego cortar los clips es mucho más rápido.'),
      },
      {
        title: t('Analiza también a tu equipo'),
        text: t('Tras cada partido, compara lo que pasó con el plan: tres cosas que salieron bien y tres a mejorar, cada una con su clip. Así el análisis conecta con el entrenamiento de la semana.'),
      },
      {
        title: t('Cuidado con pocos partidos'),
        text: t('Las métricas como el xG varían mucho de un partido a otro. Fíate más de la tendencia en 8-10 partidos que de un solo dato.'),
      },
    ],
  },
  {
    id: 'posiciones',
    name: t('Roles de cada posición'),
    tips: [
      {
        title: t('Portero'),
        text: t('Con balón, es el primer pasador: da salida en corto o en largo según la presión. Sin balón, protege la portería, controla el área en los centros y ordena a la defensa con la voz.'),
      },
      {
        title: t('Central'),
        text: t('Con balón, abre el campo, conduce para fijar al delantero rival y busca pases que superen líneas. Sin balón, defiende el área y la espalda de la defensa, gana duelos aéreos y cubre al compañero.'),
      },
      {
        title: t('Lateral'),
        text: t('Con balón, da amplitud o se mete por dentro según el modelo, y dobla al extremo. Sin balón, cierra su banda, impide centros y se cierra hacia el central cuando el balón está en el otro lado.'),
      },
      {
        title: t('Carrilero'),
        text: t('En una defensa de tres, ocupa toda la banda: es el extremo cuando atacas y el lateral cuando defiendes. Necesita mucho recorrido y saber cuándo subir y cuándo quedarse para formar línea de cinco.'),
      },
      {
        title: t('Pivote (mediocentro)'),
        text: t('Con balón, suele ofrecerse por delante de los centrales para recibir y, si la presión le deja girar, cambiar la orientación del juego. Sin balón, protege la zona delante de la defensa, corta pases interiores y equilibra al equipo.'),
      },
      {
        title: t('Interior'),
        text: t('Con balón, recibe entre líneas o en el carril interior y llega al área desde segunda línea. Sin balón, salta a presionar al pivote o al central rival y vuelve a cerrar por dentro.'),
      },
      {
        title: t('Mediapunta'),
        text: t('Con balón, se mueve entre la defensa y el centro del campo rival para recibir de cara y dar el último pase o tirar. Sin balón, vigila al pivote rival y es el primer apoyo del delantero en la presión.'),
      },
      {
        title: t('Extremo'),
        text: t('Con balón, fija al lateral pegado a la banda, encara en uno contra uno y ataca el segundo palo en los centros. Sin balón, cierra el pase al lateral rival y ayuda a su lateral cuando le doblan.'),
      },
      {
        title: t('Delantero centro'),
        text: t('Con balón, fija a los centrales, ataca la espalda de la defensa, descarga de espaldas y remata en el área. Sin balón, es el primer defensor: orienta la presión hacia una banda y tapa el pase al pivote.'),
      },
      {
        title: t('Falso 9'),
        text: t('Delantero que baja al centro del campo para recibir y crear superioridad por dentro. Funciona si los centrales rivales dudan en seguirle y si extremos o interiores atacan el espacio que deja.'),
        source: t('Popularizado por el Barcelona de Guardiola con Messi'),
      },
    ],
  },
  {
    id: 'partido',
    name: t('Estrategia de partido'),
    tips: [
      {
        title: t('Un plan según el rival'),
        text: t('Elige una o dos ideas para el partido: dónde está su punto débil y cómo frenar su arma principal. Cuantas más ideas añades, más cuesta que el equipo las recuerde cuando avanza el partido.'),
      },
      {
        title: t('Revisa el plan a los 20 minutos'),
        text: t('En los primeros 15-20 minutos comprueba si el rival juega como esperabas. Si no, corrige pronto con un ajuste concreto (cambiar quién presiona a quién, bajar el bloque) y no esperes al descanso.'),
      },
      {
        title: t('El descanso: dos o tres mensajes'),
        text: t('Deja un par de minutos para que los jugadores se calmen e hidraten. Luego da dos o tres correcciones claras, a ser posible con un dato o una imagen, y termina con una idea positiva.'),
      },
      {
        title: t('Gestionar una ventaja'),
        text: t('Ir ganando no significa encerrarse en el área: un bloque medio y compacto concede menos que uno muy hundido. Con balón, juega seguro, usa las bandas lejos de tu portería y busca faltas y córners para pasar tiempo en campo rival.'),
      },
      {
        title: t('Remontar sin descontrolarse'),
        text: t('Si vas perdiendo, ajusta el riesgo según el tiempo restante, la diferencia en el marcador y cómo está defendiendo el rival. Puedes adelantar posiciones, aumentar la presencia en zona de remate o modificar la organización del equipo. Coordina esos cambios y decide cómo proteger una posible pérdida según la amenaza de contraataque.'),
      },
      {
        title: t('Cambios planificados'),
        text: t('Prepara antes del partido los cambios probables según el marcador. En las competiciones que usan cinco cambios, se hacen en un máximo de tres ventanas más el descanso; mira el reglamento de tu liga.'),
        source: t('IFAB, Regla 3'),
      },
      {
        title: t('Los últimos 15 minutos'),
        text: t('Ganando: defiende el balón parado con todos, lleva el balón a la esquina y cambia para cortar el ritmo. Perdiendo: balón directo al área, más rematadores y el portero puede subir en el último córner.'),
      },
      {
        title: t('Jugar con 10'),
        text: t('Lo más habitual es quitar un atacante y mantener dos líneas de cuatro (4-4-1). Con balón, tenlo más tiempo para descansar y sal a la contra con pocos jugadores.'),
      },
      {
        title: t('Jugar contra 10'),
        text: t('Haz correr al rival con cambios de orientación y ataca la zona donde falta el jugador expulsado. Ten paciencia: se cansa en la segunda mitad.'),
      },
      {
        title: t('Viento y estado del campo'),
        text: t('Con viento a favor, balones largos y tiros lejanos; en contra, juego raso y corto. En campo pequeño o en mal estado, juego más directo y gente para la segunda jugada; en campo grande, aprovecha la amplitud.'),
      },
    ],
  },
  {
    id: 'fisico',
    name: t('Preparación física y carga'),
    tips: [
      {
        title: t('RPE de sesión: medir la carga sin GPS'),
        text: t('Unos 30 minutos después de entrenar, cada jugador puntúa el esfuerzo del 0 al 10. Multiplica esa nota por los minutos de la sesión y tendrás la carga (por ejemplo, 7 × 80 = 560 unidades).'),
        source: t('Método RPE de sesión de Carl Foster'),
      },
      {
        title: t('El microciclo semanal'),
        text: t('Con un partido por semana, la carga alta va en MD-4 y MD-3, baja en MD-2 y es mínima en MD-1. El MD+1 es para recuperar y el MD+2 suele ser descanso.'),
      },
      {
        title: t('Evita los picos de carga'),
        text: t('Las subidas bruscas respecto a lo que el jugador hace normalmente se asocian a más lesiones: vuelta de vacaciones, de una lesión o una semana de muchos partidos. Sube la carga poco a poco y vigila a quien entrena menos.'),
      },
      {
        title: t('Nórdicos para los isquios'),
        text: t('Los programas que incluyen el ejercicio nórdico han reducido las lesiones de isquiotibiales hasta casi la mitad. Empieza con 2 series de 5 repeticiones dos veces por semana y sube poco a poco; lejos del partido (MD-4 o MD-3).'),
        source: t('Van Dyk y colaboradores (2019), revisión en British Journal of Sports Medicine'),
      },
      {
        title: t('Copenhague para los aductores'),
        text: t('El ejercicio de aductor de Copenhague, hecho de forma regular durante la temporada, redujo los problemas de ingle en futbolistas. Bastan 2-3 series cortas por lado, una o dos veces por semana.'),
        source: t('Harøy y colaboradores (2019), British Journal of Sports Medicine'),
      },
      {
        title: t('Calentamiento preventivo'),
        text: t('Un calentamiento de unos 20 minutos con carrera, fuerza, equilibrio y saltos, como el FIFA 11+, reduce las lesiones si se hace al menos dos veces por semana. Conviene mantenerlo durante toda la temporada, no solo en pretemporada.'),
        source: t('Programa FIFA 11+'),
      },
      {
        title: t('Sprinta cada semana'),
        text: t('Los jugadores deben llegar cerca de su velocidad máxima (más del 90 %) una o dos veces por semana, por ejemplo con sprints de 30-40 metros en MD-3 o MD-2. Quien no sprinta en los entrenamientos llega peor preparado al sprint del partido.'),
        source: t('Malone y colaboradores (2017), en fútbol gaélico'),
      },
      {
        title: t('Recuperar es parte del entrenamiento'),
        text: t('Lo que más ayuda es dormir bien (7-9 horas), comer hidratos y proteína en las horas después del partido y beber suficiente. Los masajes o el agua fría ayudan menos que dormir.'),
      },
      {
        title: t('Compensa a los suplentes'),
        text: t('Quien juega poco o nada el partido acumula menos carga que los titulares. Dale una sesión compensatoria en MD+1 o MD+2 con juego reducido intenso y sprints para que no pierda forma.'),
      },
    ],
  },
  {
    id: 'mental',
    name: t('Cabeza y competición'),
    tips: [
      {
        title: t('Rutinas antes del partido'),
        text: t('Mantener una secuencia parecida (horario, calentamiento, charla) suele bajar los nervios porque el jugador sabe qué va a pasar. En los partidos importantes, evita cambios de rutina que no sean necesarios.'),
      },
      {
        title: t('Primera acción sencilla'),
        text: t('Pide a cada jugador que su primera acción sea fácil: un pase corto, un duelo ganado, un despeje limpio. Ayuda a entrar en el partido sin miedo a fallar.'),
      },
      {
        title: t('Después de un error, siguiente acción'),
        text: t('Enseña una pequeña rutina para reiniciar tras un fallo (un gesto, una palabra, una respiración) y volver a centrarse en la siguiente jugada. Lamentarse dos segundos de más suele costar otra acción.'),
      },
      {
        title: t('Céntrate en lo que depende de ti'),
        text: t('Bajo presión, pon objetivos de tarea y no de resultado: ganar duelos, presionar al perder, ofrecerse para recibir. Son cosas que el jugador controla, a diferencia del resultado.'),
      },
      {
        title: t('Momentos de máxima concentración'),
        text: t('Avisa de los momentos en los que más se despistan los equipos: los primeros y últimos minutos de cada parte y justo después de marcar o recibir un gol. En esos minutos, más orden y menos riesgo.'),
      },
      {
        title: t('Líderes por línea'),
        text: t('Además del capitán, ten un líder en cada línea: el portero o un central atrás, el pivote en el medio y el delantero arriba. Cada uno ordena a los de su alrededor.'),
      },
      {
        title: t('Palabras cortas en el campo'),
        text: t('Pactad pocas palabras para comunicar rápido: "solo", "hombre", "gira", "arriba", "mía". Una palabra a tiempo vale más que una explicación tarde.'),
      },
      {
        title: t('Con el árbitro, solo habla el capitán'),
        text: t('Protestar gasta energía, distrae y trae tarjetas. Acordad que solo el capitán se dirige al árbitro, con calma.'),
      },
      {
        title: t('Respira antes de la acción'),
        text: t('Antes de un penalti, una falta o un saque importante, dos o tres respiraciones lentas ayudan a bajar pulsaciones y a ejecutar con calma.'),
      },
    ],
  },
  {
    id: 'portero',
    name: t('El portero moderno'),
    tips: [
      {
        title: t('El primer atacante'),
        text: t('El portero actual inicia el juego: necesita jugar bien con los dos pies, en corto y en largo. Entrena con él la salida de balón igual que con los centrales.'),
      },
      {
        title: t('Portero líbero'),
        text: t('Si tu equipo defiende con la línea alta, el portero se adelanta para cortar los balones a la espalda de los centrales. Su posición cambia según dónde esté el balón.'),
      },
      {
        title: t('Colocación respecto al balón'),
        text: t('Se coloca en la línea imaginaria entre el balón y el centro de la portería, y a la distancia justa para cubrir el ángulo sin que le puedan vaselinear. Pequeños ajustes en cada pase rival.'),
      },
      {
        title: t('Centros: decide pronto y grita'),
        text: t('Ante un centro, decide rápido si sale o se queda, y avisa con una palabra clara ("¡mía!" o "¡fuera!"). Salir a medias es peor que no salir.'),
      },
      {
        title: t('Uno contra uno'),
        text: t('Acércate para reducir el ángulo cuando el delantero lleva el balón lejos del pie, y aguanta de pie lo más posible. Tirarse antes de tiempo le deja el regate o la vaselina fácil.'),
      },
      {
        title: t('Distribución rápida tras parar'),
        text: t('Después de atrapar un balón, mira primero si hay un compañero libre para salir rápido a la contra. Muchas ocasiones nacen de un saque con la mano en los primeros segundos.'),
      },
      {
        title: t('La voz de la defensa'),
        text: t('Desde atrás ve todo el campo: debe ordenar marcas, la barrera y la línea en el balón parado. Un portero callado deja sola a su defensa.'),
      },
      {
        title: t('Calidad antes que cantidad'),
        text: t('Sus acciones son explosivas: trabaja en series cortas de 6-8 acciones con descanso entre series. Cien tiradas seguidas cansan y empeoran la técnica.'),
      },
      {
        title: t('Penaltis: la regla y el estudio'),
        text: t('En el momento del golpeo, el portero debe tener al menos parte de un pie sobre la línea o a su altura. Estudia en vídeo hacia dónde suelen tirar los lanzadores rivales.'),
        source: t('IFAB, Regla 14'),
      },
    ],
  },
]
