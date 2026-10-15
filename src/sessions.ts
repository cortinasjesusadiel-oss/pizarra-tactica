// Sesiones de entrenamiento sugeridas para fútbol 11 de adultos.
// "MD-3" significa 3 días antes del partido (MD = match day, día de partido).

export interface Block {
  title: string
  minutes: number
  template?: string
  tips: string
}

export interface Session {
  id: string
  name: string
  goal: string
  day: string
  blocks: Block[]
}

export const SESSIONS: Session[] = [
  {
    id: 'ses-presion',
    name: 'Presión tras pérdida',
    goal: 'Recuperar el balón en menos de 5 segundos cerca de donde se perdió.',
    day: 'MD-3 · día de más intensidad',
    blocks: [
      { title: 'Activación con material', minutes: 12, template: 'anim-circuito', tips: 'Ritmo suave al principio, más rápido en la segunda vuelta.' },
      { title: 'Rondo 4 contra 2', minutes: 12, template: 'anim-rondo', tips: 'Quien pierde el balón presiona 5 segundos antes de cambiar.' },
      { title: '6 contra 6 con presión de 5 segundos', minutes: 20, template: 'anim-presion', tips: '4 series de 4 minutos. Punto por recuperar en 5 segundos.' },
      { title: 'Presión alta al saque de portería', minutes: 15, template: 'anim-pressing', tips: 'Ensayar a quién salta el 9 y quién tapa cada pase.' },
      { title: 'Partido 8 contra 8', minutes: 12, tips: 'Un gol tras robo en campo rival vale doble.' },
    ],
  },
  {
    id: 'ses-salida',
    name: 'Salida de balón',
    goal: 'Sacar el balón jugado desde el portero y superar la primera presión.',
    day: 'MD-4',
    blocks: [
      { title: 'Activación con material', minutes: 10, template: 'anim-circuito', tips: 'Añadir pases cortos entre estaciones.' },
      { title: 'Tercer hombre', minutes: 15, template: 'anim-tercer', tips: 'Rotar posiciones A, B y C cada 2 minutos.' },
      { title: 'Salida 4 + portero contra 3', minutes: 20, template: 'anim-salida', tips: 'Centrales muy abiertos y laterales altos. Si el rival recupera, ataca 6 segundos.' },
      { title: 'Posesión con comodines', minutes: 15, template: 'ej-posesion', tips: '8 pases seguidos valen un punto.' },
      { title: 'Partido con salida obligatoria', minutes: 15, tips: 'Todos los saques de portería en corto.' },
    ],
  },
  {
    id: 'ses-bandas',
    name: 'Ataque por bandas y finalización',
    goal: 'Llegar a línea de fondo con superioridad y rematar con varios jugadores en el área.',
    day: 'MD-3',
    blocks: [
      { title: 'Rondo 4 contra 2', minutes: 10, template: 'anim-rondo', tips: 'Máximo dos toques.' },
      { title: 'Lateral por fuera y centro', minutes: 20, template: 'anim-centro', tips: 'Alternar las dos bandas. Siempre tres rematadores: primer palo, segundo palo y frontal.' },
      { title: 'Contraataque 3 contra 2', minutes: 15, template: 'anim-contra', tips: 'Terminar en menos de 10 segundos.' },
      { title: 'Partido con zonas de banda libres', minutes: 15, tips: 'En las bandas no se puede defender: obliga a buscar el centro.' },
    ],
  },
  {
    id: 'ses-transiciones',
    name: 'Transiciones',
    goal: 'Reaccionar rápido al ganar y al perder el balón.',
    day: 'MD-3',
    blocks: [
      { title: 'Activación con material', minutes: 10, template: 'anim-circuito', tips: 'Al pitido, sprint de 10 metros.' },
      { title: '6 contra 6 con presión de 5 segundos', minutes: 18, template: 'anim-presion', tips: 'Transición defensiva: presionar al perder.' },
      { title: 'Contraataque 3 contra 2', minutes: 18, template: 'anim-contra', tips: 'Transición ofensiva: atacar rápido al robar.' },
      { title: 'Partido 9 contra 9', minutes: 15, tips: 'Gol en los 10 segundos siguientes a un robo vale doble.' },
    ],
  },
  {
    id: 'ses-abp-of',
    name: 'ABP a favor',
    goal: 'Ensayar las jugadas a balón parado ofensivas del próximo partido.',
    day: 'MD-1 · sesión corta y de baja carga',
    blocks: [
      { title: 'Activación ligera', minutes: 10, template: 'anim-rondo', tips: 'Rondo sin presión intensa.' },
      { title: 'Córner a favor: bloqueo y 3 carreras', minutes: 15, template: 'anim-corner', tips: 'Repetir desde las dos esquinas.' },
      { title: 'Falta lateral', minutes: 10, template: 'anim-lateral', tips: 'Arrancar las carreras justo en el golpeo.' },
      { title: 'Falta frontal con amago', minutes: 10, template: 'anim-falta-frontal', tips: 'Probar los dos lanzadores.' },
      { title: 'Saque de banda largo', minutes: 8, template: 'anim-banda', tips: 'Solo si tenemos un lanzador de saque largo.' },
    ],
  },
  {
    id: 'ses-abp-def',
    name: 'ABP en contra',
    goal: 'Defender córners y faltas sin conceder remates limpios y salir a la contra.',
    day: 'MD-2',
    blocks: [
      { title: 'Activación', minutes: 10, template: 'anim-circuito', tips: 'Incluir saltos de cabeza.' },
      { title: 'Córner en contra: defensa mixta', minutes: 20, template: 'anim-corner-contra', tips: 'Cada marcador sabe a quién marca antes del saque.' },
      { title: 'Defender la falta lateral', minutes: 15, template: 'anim-lateral', tips: 'Mirado desde el rival: no dejar que corran a la espalda.' },
      { title: 'Partido con ABP', minutes: 15, tips: 'Cada falta y córner se ejecuta como en el partido.' },
    ],
  },
  {
    id: 'ses-bloque-medio',
    name: 'Bloque medio y basculación',
    goal: 'Defender juntos en el centro del campo, deslizarse hacia el balón y saber cuándo replegar.',
    day: 'MD-4',
    blocks: [
      { title: 'Rondo 4 contra 2', minutes: 10, template: 'anim-rondo', tips: 'Los dos defensores trabajan juntos: uno presiona y el otro tapa.' },
      { title: 'Bloque medio: basculación', minutes: 15, template: 'blq-medio', tips: 'Primero andando y sin rival; luego con un rival moviendo el balón con la mano.' },
      { title: 'Del bloque alto al bajo', minutes: 15, template: 'blq-repliegue', tips: 'El entrenador grita "arriba" o "atrás" y todo el bloque se mueve a la vez.' },
      { title: 'Transición ataque-defensa', minutes: 15, template: 'tr-ataque-defensa', tips: '5 segundos de presión; si no se recupera, repliegue al bloque medio.' },
      { title: 'Partido 10 contra 10', minutes: 15, tips: 'Punto extra si el bloque recupera sin que el rival pase del centro del campo.' },
    ],
  },
  {
    id: 'ses-presion-alta',
    name: 'Presión alta a la salida rival',
    goal: 'Robar el balón cerca de la portería rival cuando saca desde el portero.',
    day: 'MD-3 · día de más intensidad',
    blocks: [
      { title: 'Activación con material', minutes: 10, template: 'anim-circuito', tips: 'Incluir cambios de dirección y arrancadas cortas.' },
      { title: 'Bloque alto: saltos de presión', minutes: 15, template: 'blq-alto', tips: 'Ensayar la señal: pase al central o al lateral = todos saltan.' },
      { title: 'Presión al saque del portero', minutes: 20, template: 'pa-salida-portero', tips: '11 contra 11 en medio campo. El rival saca siempre en corto; robo y gol en 10 segundos vale doble.' },
      { title: 'Transición defensa-ataque', minutes: 12, template: 'tr-defensa-ataque', tips: 'Primer pase siempre hacia delante si es posible.' },
      { title: 'Partido 9 contra 9', minutes: 12, tips: 'Los saques de portería del rival son en corto obligatorio.' },
    ],
  },
  {
    id: 'ses-espacios',
    name: 'Generar espacios en ataque',
    goal: 'Mover al rival para encontrar al compañero libre: arrastres, fijar y soltar, cambios de orientación.',
    day: 'MD-3',
    blocks: [
      { title: 'Tercer hombre', minutes: 12, template: 'anim-tercer', tips: 'Rotar posiciones cada 2 minutos.' },
      { title: 'Fijar y soltar 2 contra 1', minutes: 15, template: 'esp-fijar-soltar', tips: 'Conducir directo al defensor; soltar solo cuando él se comprometa.' },
      { title: 'Arrastre del 9', minutes: 15, template: 'esp-arrastre', tips: 'El extremo arranca justo cuando el central persigue al 9.' },
      { title: 'Cargar un lado y cambiar', minutes: 15, template: 'esp-cambio-orientacion', tips: 'Gol tras cambio de orientación vale doble.' },
      { title: 'Partido con zonas', minutes: 12, tips: 'Activar las zonas en la pizarra para explicar carriles y amplitud.' },
    ],
  },
  {
    id: 'ses-pretemp-1',
    name: 'Pretemporada · semana 1',
    goal: 'Volver a tocar balón y preparar el cuerpo con carga moderada, sin picos.',
    day: 'Pretemporada · semana 1',
    blocks: [
      { title: 'Calentamiento preventivo', minutes: 15, tips: 'Estilo FIFA 11+: carrera suave, fuerza, equilibrio y saltos. Sin prisa, cuidando la técnica.' },
      { title: 'Rondo 4 contra 2', minutes: 10, template: 'anim-rondo', tips: '2 series de 4 minutos, máximo dos toques. Intensidad media: solo para volver a sentir el balón.' },
      { title: 'Posesión con comodines', minutes: 15, template: 'ej-posesion', tips: '3 series de 4 minutos con 1 minuto de pausa. Espacio amplio (unos 40 × 30 m) para que corran más y choquen poco.' },
      { title: 'Fuerza preventiva', minutes: 15, tips: 'Nórdicos 2 × 4, Copenhague 2 × 5 por lado, sentadilla con peso corporal 2 × 10. RPE objetivo 5-6.' },
      { title: 'Juego reducido 7 contra 7', minutes: 15, tips: '3 series de 4 minutos con 1 minuto de pausa. Sin presión alta todavía; porterías normales.' },
      { title: 'Vuelta a la calma', minutes: 5, tips: 'Trote suave y movilidad. Apuntar el RPE de cada jugador.' },
    ],
  },
  {
    id: 'ses-pretemp-3',
    name: 'Pretemporada · semana 3',
    goal: 'Subir la intensidad y meter ideas del modelo de juego en tareas grandes.',
    day: 'Pretemporada · semana 3',
    blocks: [
      { title: 'Activación con material', minutes: 12, template: 'anim-circuito', tips: 'Segunda vuelta a ritmo alto, con arrancadas cortas.' },
      { title: 'Rondo 4 contra 2', minutes: 8, template: 'anim-rondo', tips: 'Máximo dos toques; quien pierde presiona 5 segundos.' },
      { title: 'Sprints', minutes: 8, tips: '4-5 sprints de 30-40 metros con 90 segundos de pausa. Buscar velocidad máxima, no cansancio.' },
      { title: '6 contra 6 con presión de 5 segundos', minutes: 20, template: 'anim-presion', tips: '4 series de 4 minutos con 2 minutos de pausa. Punto por recuperar en 5 segundos.' },
      { title: 'Salida de balón contra presión', minutes: 15, template: 'anim-salida', tips: 'Introducir la salida del modelo. Si el rival recupera, ataca en 6 segundos.' },
      { title: 'Partido 11 contra 11', minutes: 20, tips: '2 partes de 10 minutos. Pedir las dos ideas trabajadas en la semana; el resto, libre.' },
    ],
  },
  {
    id: 'ses-md4-fuerza',
    name: 'Fuerza y duelos',
    goal: 'Trabajar la fuerza aplicada al juego con mucho duelo en espacio reducido.',
    day: 'MD-4 · día de fuerza',
    blocks: [
      { title: 'Calentamiento preventivo', minutes: 12, tips: 'Incluir saltos y aterrizajes. Termina con 3 aceleraciones de 10 metros.' },
      { title: 'Fuerza en el campo', minutes: 15, tips: 'Nórdicos 2 × 5, Copenhague 2 × 6 por lado, zancadas 2 × 8 por pierna. Lejos del partido, por eso hoy.' },
      { title: 'Duelos 1 contra 1 a portería', minutes: 12, tips: 'Series de 15-20 segundos con 45 segundos de pausa. El defensor gana un punto si recupera y conduce hasta la línea.' },
      { title: 'Rondo 4 contra 2', minutes: 8, template: 'anim-rondo', tips: 'Espacio pequeño (10 × 10 m) para forzar duelos y presión intensa.' },
      { title: 'Juego 4 contra 4 + 2 comodines', minutes: 18, template: 'ej-posesion', tips: '4 series de 3 minutos con 1 minuto y medio de pausa. Espacio 30 × 25 m. Entrenador mete balón nuevo al instante.' },
      { title: 'Partido 8 contra 8', minutes: 12, tips: 'Campo medio. Duelo ganado que acaba en gol vale doble.' },
    ],
  },
  {
    id: 'ses-md2-velocidad',
    name: 'Velocidad y balón parado',
    goal: 'Exponer a velocidad máxima y repasar el balón parado con poca carga.',
    day: 'MD-2 · velocidad, volumen bajo',
    blocks: [
      { title: 'Activación con material', minutes: 12, template: 'anim-circuito', tips: 'Técnica de carrera y cambios de dirección suaves.' },
      { title: 'Sprints a velocidad máxima', minutes: 10, tips: '4-6 sprints de 20-30 metros con recuperación completa (más de 1 minuto). Salidas variadas: de pie, de espaldas, tras pase.' },
      { title: 'Rondo 4 contra 2', minutes: 8, template: 'anim-rondo', tips: 'Rápido y corto: series de 1 minuto.' },
      { title: 'Córner a favor', minutes: 12, template: 'anim-corner', tips: 'Cada jugada 3 veces desde cada lado. Primero andando, luego a ritmo de partido.' },
      { title: 'Córner en contra', minutes: 12, template: 'anim-corner-contra', tips: 'Repasar quién marca a quién y las zonas fijas. Salida a la contra tras cada despeje.' },
      { title: 'Contraataque 3 contra 2', minutes: 10, template: 'anim-contra', tips: 'Pocas repeticiones a máxima velocidad, terminar en menos de 10 segundos.' },
    ],
  },
  {
    id: 'ses-md1-activacion',
    name: 'Activación prepartido',
    goal: 'Llegar fresco al partido: poco volumen, velocidad de reacción y repaso de lo clave.',
    day: 'MD-1 · sesión corta',
    blocks: [
      { title: 'Activación con balón', minutes: 10, template: 'anim-circuito', tips: 'Ritmo suave; terminar con 3 arrancadas cortas de 5-10 metros.' },
      { title: 'Rondo 4 contra 2', minutes: 10, template: 'anim-rondo', tips: 'Ambiente alegre, sin presión intensa. Uno o dos toques.' },
      { title: 'Tercer hombre', minutes: 10, template: 'anim-tercer', tips: 'Ritmo alto pero series cortas de 1 minuto.' },
      { title: 'Salida de balón del partido', minutes: 10, template: 'anim-salida', tips: 'Solo repasar posiciones contra la presión que esperamos del rival. Sin oposición real.' },
      { title: 'Falta frontal y lateral', minutes: 12, template: 'anim-falta-frontal', tips: 'Dos o tres jugadas que usaremos mañana. Los lanzadores, pocos golpeos.' },
      { title: 'Juego de reacción', minutes: 8, tips: 'Parejas: al estímulo del entrenador, sprint de 5 metros. 6-8 repeticiones con descanso completo.' },
    ],
  },
  {
    id: 'ses-mdp1-recuperacion',
    name: 'Recuperación (titulares)',
    goal: 'Recuperar tras el partido a quienes jugaron más de 60 minutos.',
    day: 'MD+1 · titulares',
    blocks: [
      { title: 'Vídeo breve del partido', minutes: 10, tips: 'Tres clips buenos y tres a mejorar. Nada de broncas.' },
      { title: 'Carrera o bici suave', minutes: 15, tips: 'Ritmo cómodo, se puede hablar. RPE 2-3.' },
      { title: 'Movilidad y estiramientos', minutes: 15, tips: 'Cadera, isquios, aductores y tobillos. Sin rebotes.' },
      { title: 'Rondo suave', minutes: 10, template: 'anim-rondo', tips: 'Sin presión: los defensores solo interceptan. Que sea divertido.' },
      { title: 'Revisión individual', minutes: 10, tips: 'Preguntar a cada uno cómo se siente (del 1 al 10) y anotar molestias para el fisio.' },
    ],
  },
  {
    id: 'ses-compensatorio',
    name: 'Compensatorio (suplentes)',
    goal: 'Dar a quienes jugaron poco la carga que no tuvieron en el partido.',
    day: 'MD+1 · suplentes',
    blocks: [
      { title: 'Calentamiento preventivo', minutes: 12, tips: 'Completo, con aceleraciones al final.' },
      { title: 'Rondo 4 contra 2', minutes: 8, template: 'anim-rondo', tips: 'Intenso, máximo dos toques.' },
      { title: 'Juego 4 contra 4 + 2 comodines', minutes: 20, template: 'ej-posesion', tips: '4 series de 4 minutos con 1 minuto de pausa. Alta intensidad, RPE 7-8.' },
      { title: 'Sprints', minutes: 8, tips: '4-5 sprints de 30-40 metros a máxima velocidad con pausa completa.' },
      { title: 'Finalización tras centro', minutes: 15, template: 'anim-centro', tips: 'Series rápidas por las dos bandas; tres rematadores por centro.' },
      { title: 'Fuerza preventiva', minutes: 10, tips: 'Nórdicos 2 × 5 y Copenhague 2 × 6 por lado.' },
    ],
  },
  {
    id: 'ses-ataque-bloque-bajo',
    name: 'Atacar un bloque bajo',
    goal: 'Mover a un rival encerrado hasta encontrar el hueco, sin exponerse a la contra.',
    day: 'MD-3',
    blocks: [
      { title: 'Rondo 4 contra 2', minutes: 10, template: 'anim-rondo', tips: 'Máximo dos toques; punto cada 10 pases.' },
      { title: 'Cómo defiende el bloque bajo', minutes: 8, template: 'blq-bajo', tips: 'Mostrar en la pizarra dónde quedan los huecos: entre líneas, carril interior y frontal.' },
      { title: 'Fijar y soltar 2 contra 1', minutes: 12, template: 'esp-fijar-soltar', tips: 'Conducir hasta que el defensor se comprometa. Series de 6 repeticiones por pareja.' },
      { title: 'Cargar un lado y cambiar', minutes: 15, template: 'esp-cambio-orientacion', tips: 'Ataque 8 contra 6 + portero. Gol tras cambio de orientación vale doble.' },
      { title: 'Centro y pase atrás', minutes: 12, template: 'anim-centro', tips: 'Alternar centro al segundo palo y pase raso atrás al punto de penalti. Siempre un jugador en la frontal.' },
      { title: 'Partido 10 contra 10 con bloque bajo', minutes: 18, template: 'tr-ataque-defensa', tips: 'Un equipo defiende en su campo. El que ataca debe dejar 3 jugadores de vigilancia; si le marcan a la contra, el gol vale doble.' },
    ],
  },
  {
    id: 'ses-defensa-centros',
    name: 'Defender centros',
    goal: 'Impedir el centro cuando se pueda y, si llega, defender el área sin remates limpios.',
    day: 'MD-4',
    blocks: [
      { title: 'Activación con saltos', minutes: 10, template: 'anim-circuito', tips: 'Incluir saltos de cabeza con impulso de una y dos piernas.' },
      { title: 'Cerrar la banda', minutes: 12, template: 'blq-bajo', tips: 'El lateral sale al jugador de banda y el extremo ayuda. Punto para la defensa si el centro no sale.' },
      { title: 'Defender el centro en el área', minutes: 18, template: 'anim-centro', tips: 'Ataque 4 contra 3 + portero. Cubrir primer palo, punto de penalti y segundo palo; un jugador para el rechace. Series de 6 centros.' },
      { title: 'Córner en contra', minutes: 12, template: 'anim-corner-contra', tips: 'Combinar zonas fijas y marcas. Salir todos hacia fuera tras el despeje.' },
      { title: 'Partido con bandas libres', minutes: 18, tips: 'En las bandas solo puede entrar el atacante: obliga a defender muchos centros. Gol de cabeza vale doble.' },
    ],
  },
  {
    id: 'ses-contraataque',
    name: 'Contraataque',
    goal: 'Robar en bloque medio y atacar rápido el espacio antes de que el rival se ordene.',
    day: 'MD-3',
    blocks: [
      { title: 'Activación con material', minutes: 10, template: 'anim-circuito', tips: 'Al pitido, sprint de 10 metros hacia delante.' },
      { title: 'Robar en bloque medio', minutes: 15, template: 'blq-medio', tips: 'Señal de robo: pase lateral o control malo. Tras robar, primer pase hacia delante.' },
      { title: 'Transición defensa-ataque', minutes: 15, template: 'tr-defensa-ataque', tips: 'Series de 6 transiciones. Máximo 4 pases para terminar; tiro en menos de 10 segundos.' },
      { title: 'Contraataque 3 contra 2', minutes: 15, template: 'anim-contra', tips: 'El conductor fija por el centro y los dos de fuera atacan la espalda. Rotar roles en cada serie.' },
      { title: 'Partido 10 contra 10', minutes: 18, tips: 'Gol en los 10 segundos siguientes a un robo vale triple.' },
    ],
  },
  {
    id: 'ses-juego-posicion',
    name: 'Juego de posición y rondos',
    goal: 'Ocupar bien el espacio con balón y encontrar al jugador libre entre líneas.',
    day: 'MD-3',
    blocks: [
      { title: 'Rondo 4 contra 2', minutes: 12, template: 'anim-rondo', tips: '3 series de 3 minutos. Punto si el pase pasa entre los dos defensores.' },
      { title: 'Tercer hombre', minutes: 12, template: 'anim-tercer', tips: 'Pase a C solo de primeras. Rotar cada 2 minutos.' },
      { title: 'Posesión con comodines', minutes: 18, template: 'ej-posesion', tips: '4 series de 3 minutos. Punto por pase al comodín de dentro que se gira.' },
      { title: 'Cambio de orientación', minutes: 15, template: 'esp-cambio-orientacion', tips: 'Atraer en un lado y cambiar al jugador libre. Gol tras cambio vale doble.' },
      { title: 'Partido con zonas', minutes: 18, tips: 'No más de dos jugadores en la misma franja vertical. Falta de colocación = balón para el rival.' },
    ],
  },
  {
    id: 'ses-porteros',
    name: 'Sesión de porteros',
    goal: 'Trabajar las acciones clave del portero con calidad y descansos suficientes.',
    day: 'MD-3 · trabajo específico',
    blocks: [
      { title: 'Activación específica', minutes: 12, tips: 'Movilidad, desplazamientos laterales y blocajes suaves a mano.' },
      { title: 'Blocajes y caídas', minutes: 12, tips: '3 series de 6-8 balones por lado con 1 minuto de pausa. Primero raso, luego media altura.' },
      { title: 'Uno contra uno', minutes: 10, tips: 'Delantero sale desde 25 metros. El portero aguanta de pie lo más posible. 2 series de 5.' },
      { title: 'Salidas a centros', minutes: 12, template: 'anim-centro', tips: 'Centros desde las dos bandas con un rematador. Avisar "¡mía!" o "¡fuera!" en cada balón.' },
      { title: 'Juego de pies y salida', minutes: 12, template: 'pa-salida-portero', tips: 'Pases en corto a los centrales y en largo al lateral. Con un presionador que sale al recibir.' },
      { title: 'Integración con el grupo', minutes: 12, tips: 'Finalización del equipo: el portero ordena la defensa y busca la salida rápida tras cada parada.' },
    ],
  },
  {
    id: 'ses-basculacion',
    name: 'Defender en bloque: bascular juntos',
    goal: 'Que el equipo se mueva junto hacia el balón y no deje huecos por dentro.',
    day: 'MD-4',
    blocks: [
      { title: 'Rondo 4 contra 2', minutes: 10, template: 'anim-rondo', tips: 'Los defensores del rondo trabajan juntos: uno presiona y el otro tapa el pase por dentro.' },
      { title: 'Línea de 4 contra 6', minutes: 15, template: 't3-ej-basculacion-4', tips: 'Primero andando, luego a ritmo de partido. El entrenador corrige parando el juego con una palmada.' },
      { title: 'Basculación del 4-4-2', minutes: 20, template: 't3-basculacion-442', tips: 'Juntar las dos líneas: 8 defensores contra 8 atacantes en medio campo. Punto si roban por dentro.' },
      { title: 'Bloque bajo con 5 atrás', minutes: 15, template: 't3-bloque-bajo-541', tips: 'Si juegas con línea de 4, ensaya solo la ayuda del extremo al lateral.' },
      { title: 'Partido 9 contra 9', minutes: 15, tips: 'Gol en contra tras pase por dentro de un bloque abierto: el entrenador lo para y lo explica.' },
    ],
  },
  {
    id: 'ses-desdoblamientos',
    name: 'Ataque por banda: duelos y desdoblamientos',
    goal: 'Ganar la banda con 1 contra 1 o 2 contra 1 y llegar al área con dos rematadores.',
    day: 'MD-3',
    blocks: [
      { title: 'Activación con material', minutes: 10, template: 'anim-circuito', tips: 'Terminar cada vuelta con un centro.' },
      { title: '1 contra 1 en banda y centro', minutes: 15, template: 't3-ej-1c1-banda-centro', tips: 'Series cortas: 4-5 duelos por jugador con descanso de 1 minuto.' },
      { title: 'Desdoblamiento del lateral', minutes: 20, template: 't3-desdoblamiento', tips: 'Empezar sin defensa, añadir el lateral rival y luego un central dentro.' },
      { title: 'Córner con pase atrás', minutes: 10, template: 't3-corner-frontal', tips: 'Ensayar la señal del lanzador para que el 10 sepa cuándo llegar.' },
      { title: 'Partido con bandas libres', minutes: 15, tips: 'Gol tras centro vale doble.' },
    ],
  },
  {
    id: 'ses-duelos-defensivos',
    name: 'Duelos defensivos y vigilancias',
    goal: 'Defender bien el 1 contra 1 y no quedar desprotegidos al perder el balón.',
    day: 'MD-4',
    blocks: [
      { title: 'Defender un 1 contra 1', minutes: 15, template: 't3-ej-defensa-1c1', tips: 'Corregir la postura: de lado, rodillas flexionadas, sin tirarse.' },
      { title: 'Vigilancias en ataque', minutes: 20, template: 't3-vigilancias', tips: 'Atacan 7 contra 6 y dos rivales esperan arriba. Si roban, contraatacan contra nuestros 3 de atrás.' },
      { title: 'Falta frontal en contra', minutes: 10, template: 't3-falta-frontal-contra', tips: 'El portero dice cuántos van en la barrera y quién la coloca.' },
      { title: 'Partido 10 contra 10', minutes: 15, tips: 'Cuando un equipo ataca, siempre tiene que haber 3 jugadores por detrás del balón.' },
    ],
  },
  {
    id: 'ses-juego-directo',
    name: 'Juego directo y presión a una salida de 3',
    goal: 'Saber saltar una presión alta en largo y presionar a un rival que sale con 3 centrales.',
    day: 'MD-3',
    blocks: [
      { title: 'Rondo 5 contra 2 con transición', minutes: 12, template: 'ej2-rondo-transicion', tips: 'Quien pierde el balón presiona al instante.' },
      { title: 'Balón largo y segunda jugada', minutes: 20, template: 't3-balon-largo-segunda', tips: 'Puntos por ganar el segundo balón. El 8 y el 10 tienen que estar a menos de 10 metros del 9 antes del pase.' },
      { title: 'Presión a una salida de 3', minutes: 20, template: 't3-presion-salida-3', tips: 'El equipo que sale juega con 3 centrales y portero. Robo en campo rival vale un punto.' },
      { title: 'Partido 11 contra 11', minutes: 15, tips: 'Un equipo sale siempre con 3 atrás y el otro con 4; a mitad se cambia.' },
    ],
  },
]
