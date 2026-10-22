import { t } from './i18n'
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
    name: t('Presión tras pérdida'),
    goal: t('Recuperar el balón en menos de 5 segundos cerca de donde se perdió.'),
    day: t('MD-3 · día de más intensidad'),
    blocks: [
      { title: t('Activación con material'), minutes: 12, template: 'anim-circuito', tips: t('Ritmo suave al principio, más rápido en la segunda vuelta.') },
      { title: t('Rondo 4 contra 2'), minutes: 12, template: 'anim-rondo', tips: t('Quien pierde el balón presiona 5 segundos antes de cambiar.') },
      { title: t('6 contra 6 con presión de 5 segundos'), minutes: 20, template: 'anim-presion', tips: t('4 series de 4 minutos con 1 minuto de pausa. Punto por recuperar en 5 segundos.') },
      { title: t('Presión alta al saque de portería'), minutes: 15, template: 'anim-pressing', tips: t('Ensayar a quién salta el 9 y quién tapa cada pase.') },
      { title: t('Partido 8 contra 8'), minutes: 12, tips: t('Un gol tras robo en campo rival vale doble.') },
    ],
  },
  {
    id: 'ses-salida',
    name: t('Salida de balón'),
    goal: t('Sacar el balón jugado desde el portero y superar la primera presión.'),
    day: t('MD-4'),
    blocks: [
      { title: t('Activación con material'), minutes: 10, template: 'anim-circuito', tips: t('Añadir pases cortos entre estaciones.') },
      { title: t('Tercer hombre'), minutes: 15, template: 'anim-tercer', tips: t('Rotar posiciones A, B y C cada 2 minutos.') },
      { title: t('Salida 4 + portero contra 3'), minutes: 20, template: 'anim-salida', tips: t('Centrales muy abiertos y laterales altos. Si el rival recupera, ataca 6 segundos.') },
      { title: t('Posesión con comodines'), minutes: 15, template: 'ej-posesion', tips: t('8 pases seguidos valen un punto.') },
      { title: t('Partido con salida obligatoria'), minutes: 15, tips: t('Todos los saques de portería en corto.') },
    ],
  },
  {
    id: 'ses-bandas',
    name: t('Ataque por bandas y finalización'),
    goal: t('Llegar a línea de fondo con superioridad y rematar con varios jugadores en el área.'),
    day: t('MD-3'),
    blocks: [
      { title: t('Rondo 4 contra 2'), minutes: 10, template: 'anim-rondo', tips: t('Máximo dos toques.') },
      { title: t('Lateral por fuera y centro'), minutes: 20, template: 'anim-centro', tips: t('Alternar las dos bandas. Siempre tres rematadores: primer palo, segundo palo y frontal.') },
      { title: t('Contraataque 3 contra 2'), minutes: 15, template: 'anim-contra', tips: t('Terminar en menos de 10 segundos.') },
      { title: t('Partido con zonas de banda libres'), minutes: 15, tips: t('En las bandas no se puede defender: obliga a buscar el centro.') },
    ],
  },
  {
    id: 'ses-transiciones',
    name: t('Transiciones'),
    goal: t('Reaccionar rápido al ganar y al perder el balón.'),
    day: t('MD-3'),
    blocks: [
      { title: t('Activación con material'), minutes: 10, template: 'anim-circuito', tips: t('Al pitido, sprint de 10 metros.') },
      { title: t('6 contra 6 con presión de 5 segundos'), minutes: 18, template: 'anim-presion', tips: t('Transición defensiva: presionar al perder.') },
      { title: t('Contraataque 3 contra 2'), minutes: 18, template: 'anim-contra', tips: t('Transición ofensiva: atacar rápido al robar.') },
      { title: t('Partido 9 contra 9'), minutes: 15, tips: t('Gol en los 10 segundos siguientes a un robo vale doble.') },
    ],
  },
  {
    id: 'ses-abp-of',
    name: t('ABP a favor'),
    goal: t('Ensayar las jugadas a balón parado ofensivas del próximo partido.'),
    day: t('MD-1 · sesión corta y de baja carga'),
    blocks: [
      { title: t('Activación ligera'), minutes: 10, template: 'anim-rondo', tips: t('Rondo sin presión intensa.') },
      { title: t('Córner a favor: 3 carreras y rechace'), minutes: 15, template: 'anim-corner', tips: t('Repetir desde las dos esquinas.') },
      { title: t('Falta lateral'), minutes: 10, template: 'anim-lateral', tips: t('Arrancar las carreras justo en el golpeo.') },
      { title: t('Falta frontal con amago'), minutes: 10, template: 'anim-falta-frontal', tips: t('Probar los dos lanzadores.') },
      { title: t('Saque de banda largo'), minutes: 8, template: 'anim-banda', tips: t('Solo si tenemos un lanzador de saque largo.') },
    ],
  },
  {
    id: 'ses-abp-def',
    name: t('ABP en contra'),
    goal: t('Defender córners y faltas sin conceder remates limpios y salir a la contra.'),
    day: t('MD-2'),
    blocks: [
      { title: t('Activación'), minutes: 10, template: 'anim-circuito', tips: t('Incluir saltos de cabeza.') },
      { title: t('Córner en contra: defensa mixta'), minutes: 20, template: 'anim-corner-contra', tips: t('Cada marcador sabe a quién marca antes del saque.') },
      { title: t('Defender la falta lateral'), minutes: 15, template: 'anim-lateral', tips: t('Mirado desde el rival: no dejar que corran a la espalda.') },
      { title: t('Partido con ABP'), minutes: 15, tips: t('Cada falta y córner se ejecuta como en el partido.') },
    ],
  },
  {
    id: 'ses-bloque-medio',
    name: t('Bloque medio y basculación'),
    goal: t('Defender juntos en el centro del campo, deslizarse hacia el balón y saber cuándo replegar.'),
    day: t('MD-4'),
    blocks: [
      { title: t('Rondo 4 contra 2'), minutes: 10, template: 'anim-rondo', tips: t('Los dos defensores trabajan juntos: uno presiona y el otro tapa.') },
      { title: t('Bloque medio: basculación'), minutes: 15, template: 'blq-medio', tips: t('Primero andando y sin rival; luego con un rival moviendo el balón con la mano.') },
      { title: t('Del bloque alto al bajo'), minutes: 15, template: 'blq-repliegue', tips: t('El entrenador grita "arriba" o "atrás" y todo el bloque se mueve a la vez.') },
      { title: t('Transición ataque-defensa'), minutes: 15, template: 'tr-ataque-defensa', tips: t('5 segundos de presión; si no se recupera, repliegue al bloque medio.') },
      { title: t('Partido 10 contra 10'), minutes: 15, tips: t('Punto extra si el bloque recupera sin que el rival pase del centro del campo.') },
    ],
  },
  {
    id: 'ses-presion-alta',
    name: t('Presión alta a la salida rival'),
    goal: t('Robar el balón cerca de la portería rival cuando saca desde el portero.'),
    day: t('MD-3 · día de más intensidad'),
    blocks: [
      { title: t('Activación con material'), minutes: 10, template: 'anim-circuito', tips: t('Incluir cambios de dirección y arrancadas cortas.') },
      { title: t('Bloque alto: saltos de presión'), minutes: 15, template: 'blq-alto', tips: t('Ensayar la señal: pase al central o al lateral = todos saltan.') },
      { title: t('Presión al saque del portero'), minutes: 20, template: 'pa-salida-portero', tips: t('11 contra 11 en medio campo. El rival saca siempre en corto; robo y gol en 10 segundos vale doble.') },
      { title: t('Transición defensa-ataque'), minutes: 12, template: 'tr-defensa-ataque', tips: t('Primer pase siempre hacia delante si es posible.') },
      { title: t('Partido 9 contra 9'), minutes: 12, tips: t('Los saques de portería del rival son en corto obligatorio.') },
    ],
  },
  {
    id: 'ses-espacios',
    name: t('Generar espacios en ataque'),
    goal: t('Mover al rival para encontrar al compañero libre: arrastres, fijar y soltar, cambios de orientación.'),
    day: t('MD-3'),
    blocks: [
      { title: t('Tercer hombre'), minutes: 12, template: 'anim-tercer', tips: t('Rotar posiciones cada 2 minutos.') },
      { title: t('Fijar y soltar 2 contra 1'), minutes: 15, template: 'esp-fijar-soltar', tips: t('Conducir directo al defensor; soltar solo cuando él se comprometa.') },
      { title: t('Arrastre del 9'), minutes: 15, template: 'esp-arrastre', tips: t('El extremo arranca justo cuando el central persigue al 9.') },
      { title: t('Cargar un lado y cambiar'), minutes: 15, template: 'esp-cambio-orientacion', tips: t('Gol tras cambio de orientación vale doble.') },
      { title: t('Partido con zonas'), minutes: 12, tips: t('Activar las zonas en la pizarra para explicar carriles y amplitud.') },
    ],
  },
  {
    id: 'ses-pretemp-1',
    name: t('Pretemporada · semana 1'),
    goal: t('Volver a tocar balón y preparar el cuerpo con carga moderada, sin picos.'),
    day: t('Pretemporada · semana 1'),
    blocks: [
      { title: t('Calentamiento preventivo'), minutes: 15, tips: t('Estilo FIFA 11+: carrera suave, fuerza, equilibrio y saltos. Sin prisa, cuidando la técnica.') },
      { title: t('Rondo 4 contra 2'), minutes: 10, template: 'anim-rondo', tips: t('2 series de 4 minutos, máximo dos toques. Intensidad media: solo para volver a sentir el balón.') },
      { title: t('Posesión con comodines'), minutes: 15, template: 'ej-posesion', tips: t('3 series de 4 minutos con 1 minuto de pausa. Espacio amplio (unos 40 × 30 m) para que corran más y choquen poco.') },
      { title: t('Fuerza preventiva'), minutes: 15, tips: t('Nórdicos 2 × 4, Copenhague 2 × 5 por lado, sentadilla con peso corporal 2 × 10. RPE objetivo 5-6.') },
      { title: t('Juego reducido 7 contra 7'), minutes: 15, tips: t('3 series de 4 minutos con 1 minuto de pausa. Sin presión alta todavía; porterías normales.') },
      { title: t('Vuelta a la calma'), minutes: 5, tips: t('Trote suave y movilidad. Apuntar el RPE de cada jugador.') },
    ],
  },
  {
    id: 'ses-pretemp-3',
    name: t('Pretemporada · semana 3'),
    goal: t('Subir la intensidad y meter ideas del modelo de juego en tareas grandes.'),
    day: t('Pretemporada · semana 3'),
    blocks: [
      { title: t('Activación con material'), minutes: 12, template: 'anim-circuito', tips: t('Segunda vuelta a ritmo alto, con arrancadas cortas.') },
      { title: t('Rondo 4 contra 2'), minutes: 8, template: 'anim-rondo', tips: t('Máximo dos toques; quien pierde presiona 5 segundos.') },
      { title: t('Sprints'), minutes: 8, tips: t('4-5 sprints de 30-40 metros con 90 segundos de pausa. Buscar velocidad máxima, no cansancio.') },
      { title: t('6 contra 6 con presión de 5 segundos'), minutes: 20, template: 'anim-presion', tips: t('4 series de 4 minutos con 2 minutos de pausa. Punto por recuperar en 5 segundos.') },
      { title: t('Salida de balón contra presión'), minutes: 15, template: 'anim-salida', tips: t('Introducir la salida del modelo. Si el rival recupera, ataca en 6 segundos.') },
      { title: t('Partido 11 contra 11'), minutes: 20, tips: t('2 partes de 10 minutos. Pedir las dos ideas trabajadas en la semana; el resto, libre.') },
    ],
  },
  {
    id: 'ses-md4-fuerza',
    name: t('Fuerza y duelos'),
    goal: t('Trabajar la fuerza aplicada al juego con mucho duelo en espacio reducido.'),
    day: t('MD-4 · día de fuerza'),
    blocks: [
      { title: t('Calentamiento preventivo'), minutes: 12, tips: t('Incluir saltos y aterrizajes. Termina con 3 aceleraciones de 10 metros.') },
      { title: t('Fuerza en el campo'), minutes: 15, tips: t('Nórdicos 2 × 5, Copenhague 2 × 6 por lado, zancadas 2 × 8 por pierna. Lejos del partido, por eso hoy.') },
      { title: t('Duelos 1 contra 1 a portería'), minutes: 12, tips: t('Series de 15-20 segundos con 45 segundos de pausa. El defensor gana un punto si recupera y conduce hasta la línea.') },
      { title: t('Rondo 4 contra 2'), minutes: 8, template: 'anim-rondo', tips: t('Espacio pequeño (10 × 10 m) para forzar duelos y presión intensa.') },
      { title: t('Juego 4 contra 4 + 2 comodines'), minutes: 18, template: 'ej-posesion', tips: t('4 series de 3 minutos con 1 minuto y medio de pausa. Espacio 30 × 25 m. Entrenador mete balón nuevo al instante.') },
      { title: t('Partido 8 contra 8'), minutes: 12, tips: t('Campo medio. Duelo ganado que acaba en gol vale doble.') },
    ],
  },
  {
    id: 'ses-md2-velocidad',
    name: t('Velocidad y balón parado'),
    goal: t('Exponer a velocidad máxima y repasar el balón parado con poca carga.'),
    day: t('MD-2 · velocidad, volumen bajo'),
    blocks: [
      { title: t('Activación con material'), minutes: 12, template: 'anim-circuito', tips: t('Técnica de carrera y cambios de dirección suaves.') },
      { title: t('Sprints a velocidad máxima'), minutes: 10, tips: t('4-6 sprints de 20-30 metros con recuperación completa (más de 1 minuto). Salidas variadas: de pie, de espaldas, tras pase.') },
      { title: t('Rondo 4 contra 2'), minutes: 8, template: 'anim-rondo', tips: t('Rápido y corto: series de 1 minuto.') },
      { title: t('Córner a favor'), minutes: 12, template: 'anim-corner', tips: t('Cada jugada 3 veces desde cada lado. Primero andando, luego a ritmo de partido.') },
      { title: t('Córner en contra'), minutes: 12, template: 'anim-corner-contra', tips: t('Repasar quién marca a quién y las zonas fijas. Salida a la contra tras cada despeje.') },
      { title: t('Contraataque 3 contra 2'), minutes: 10, template: 'anim-contra', tips: t('Pocas repeticiones a máxima velocidad, terminar en menos de 10 segundos.') },
    ],
  },
  {
    id: 'ses-md1-activacion',
    name: t('Activación prepartido'),
    goal: t('Llegar fresco al partido: poco volumen, velocidad de reacción y repaso de lo clave.'),
    day: t('MD-1 · sesión corta'),
    blocks: [
      { title: t('Activación con balón'), minutes: 10, template: 'anim-circuito', tips: t('Ritmo suave; terminar con 3 arrancadas cortas de 5-10 metros.') },
      { title: t('Rondo 4 contra 2'), minutes: 10, template: 'anim-rondo', tips: t('Ambiente alegre, sin presión intensa. Uno o dos toques.') },
      { title: t('Tercer hombre'), minutes: 10, template: 'anim-tercer', tips: t('Ritmo alto pero series cortas de 1 minuto.') },
      { title: t('Salida de balón del partido'), minutes: 10, template: 'anim-salida', tips: t('Solo repasar posiciones contra la presión que esperamos del rival. Sin oposición real.') },
      { title: t('Falta frontal y lateral'), minutes: 12, template: 'anim-falta-frontal', tips: t('Dos o tres jugadas que usaremos mañana. Los lanzadores, pocos golpeos.') },
      { title: t('Juego de reacción'), minutes: 8, tips: t('Parejas: al estímulo del entrenador, sprint de 5 metros. 6-8 repeticiones con descanso completo.') },
    ],
  },
  {
    id: 'ses-mdp1-recuperacion',
    name: t('Recuperación (titulares)'),
    goal: t('Recuperar tras el partido a quienes jugaron más de 60 minutos.'),
    day: t('MD+1 · titulares'),
    blocks: [
      { title: t('Vídeo breve del partido'), minutes: 10, tips: t('Tres clips buenos y tres a mejorar. Nada de broncas.') },
      { title: t('Carrera o bici suave'), minutes: 15, tips: t('Ritmo cómodo, se puede hablar. RPE 2-3.') },
      { title: t('Movilidad y estiramientos'), minutes: 15, tips: t('Cadera, isquios, aductores y tobillos. Sin rebotes.') },
      { title: t('Rondo suave'), minutes: 10, template: 'anim-rondo', tips: t('Sin presión: los defensores solo interceptan. Que sea divertido.') },
      { title: t('Revisión individual'), minutes: 10, tips: t('Preguntar a cada uno cómo se siente (del 1 al 10) y anotar molestias para el fisio.') },
    ],
  },
  {
    id: 'ses-compensatorio',
    name: t('Compensatorio (suplentes)'),
    goal: t('Dar a quienes jugaron poco la carga que no tuvieron en el partido.'),
    day: t('MD+1 · suplentes'),
    blocks: [
      { title: t('Calentamiento preventivo'), minutes: 12, tips: t('Completo, con aceleraciones al final.') },
      { title: t('Rondo 4 contra 2'), minutes: 8, template: 'anim-rondo', tips: t('Intenso, máximo dos toques.') },
      { title: t('Juego 4 contra 4 + 2 comodines'), minutes: 20, template: 'ej-posesion', tips: t('4 series de 4 minutos con 1 minuto de pausa. Alta intensidad, RPE 7-8.') },
      { title: t('Sprints'), minutes: 8, tips: t('4-5 sprints de 30-40 metros a máxima velocidad con pausa completa.') },
      { title: t('Finalización tras centro'), minutes: 15, template: 'anim-centro', tips: t('Series rápidas por las dos bandas; tres rematadores por centro.') },
      { title: t('Fuerza preventiva'), minutes: 10, tips: t('Nórdicos 2 × 5 y Copenhague 2 × 6 por lado.') },
    ],
  },
  {
    id: 'ses-ataque-bloque-bajo',
    name: t('Atacar un bloque bajo'),
    goal: t('Mover a un rival encerrado hasta encontrar el hueco, sin exponerse a la contra.'),
    day: t('MD-3'),
    blocks: [
      { title: t('Rondo 4 contra 2'), minutes: 10, template: 'anim-rondo', tips: t('Máximo dos toques; punto cada 10 pases.') },
      { title: t('Cómo defiende el bloque bajo'), minutes: 8, template: 'blq-bajo', tips: t('Mostrar en la pizarra dónde quedan los huecos: entre líneas, carril interior y frontal.') },
      { title: t('Fijar y soltar 2 contra 1'), minutes: 12, template: 'esp-fijar-soltar', tips: t('Conducir hasta que el defensor se comprometa. Series de 6 repeticiones por pareja.') },
      { title: t('Cargar un lado y cambiar'), minutes: 15, template: 'esp-cambio-orientacion', tips: t('Ataque 8 contra 6 + portero. Gol tras cambio de orientación vale doble.') },
      { title: t('Centro y pase atrás'), minutes: 12, template: 'anim-centro', tips: t('Alternar centro al segundo palo y pase raso atrás al punto de penalti. Siempre un jugador en la frontal.') },
      { title: t('Partido 10 contra 10 con bloque bajo'), minutes: 18, template: 'tr-ataque-defensa', tips: t('Un equipo defiende en su campo. El que ataca debe dejar 3 jugadores de vigilancia; si le marcan a la contra, el gol vale doble.') },
    ],
  },
  {
    id: 'ses-defensa-centros',
    name: t('Defender centros'),
    goal: t('Impedir el centro cuando se pueda y, si llega, defender el área sin remates limpios.'),
    day: t('MD-4'),
    blocks: [
      { title: t('Activación con saltos'), minutes: 10, template: 'anim-circuito', tips: t('Incluir saltos de cabeza con impulso de una y dos piernas.') },
      { title: t('Cerrar la banda'), minutes: 12, template: 'blq-bajo', tips: t('El lateral sale al jugador de banda y el extremo ayuda. Punto para la defensa si el centro no sale.') },
      { title: t('Defender el centro en el área'), minutes: 18, template: 'anim-centro', tips: t('Ataque 4 contra 3 + portero. Cubrir primer palo, punto de penalti y segundo palo; un jugador para el rechace. Series de 6 centros.') },
      { title: t('Córner en contra'), minutes: 12, template: 'anim-corner-contra', tips: t('Combinar zonas fijas y marcas. Salir todos hacia fuera tras el despeje.') },
      { title: t('Partido con bandas libres'), minutes: 18, tips: t('En las bandas solo puede entrar el atacante: obliga a defender muchos centros. Gol de cabeza vale doble.') },
    ],
  },
  {
    id: 'ses-contraataque',
    name: t('Contraataque'),
    goal: t('Robar en bloque medio y atacar rápido el espacio antes de que el rival se ordene.'),
    day: t('MD-3'),
    blocks: [
      { title: t('Activación con material'), minutes: 10, template: 'anim-circuito', tips: t('Al pitido, sprint de 10 metros hacia delante.') },
      { title: t('Robar en bloque medio'), minutes: 15, template: 'blq-medio', tips: t('Señal de robo: pase lateral o control malo. Tras robar, primer pase hacia delante.') },
      { title: t('Transición defensa-ataque'), minutes: 15, template: 'tr-defensa-ataque', tips: t('Series de 6 transiciones. Máximo 4 pases para terminar; tiro en menos de 10 segundos.') },
      { title: t('Contraataque 3 contra 2'), minutes: 15, template: 'anim-contra', tips: t('El conductor fija por el centro y los dos de fuera atacan la espalda. Rotar roles en cada serie.') },
      { title: t('Partido 10 contra 10'), minutes: 18, tips: t('Gol en los 10 segundos siguientes a un robo vale triple.') },
    ],
  },
  {
    id: 'ses-juego-posicion',
    name: t('Juego de posición y rondos'),
    goal: t('Ocupar bien el espacio con balón y encontrar al jugador libre entre líneas.'),
    day: t('MD-3'),
    blocks: [
      { title: t('Rondo 4 contra 2'), minutes: 12, template: 'anim-rondo', tips: t('3 series de 3 minutos. Punto si el pase pasa entre los dos defensores.') },
      { title: t('Tercer hombre'), minutes: 12, template: 'anim-tercer', tips: t('Pase a C solo de primeras. Rotar cada 2 minutos.') },
      { title: t('Posesión con comodines'), minutes: 18, template: 'ej-posesion', tips: t('4 series de 3 minutos. Punto por pase al comodín de dentro que se gira.') },
      { title: t('Cambio de orientación'), minutes: 15, template: 'esp-cambio-orientacion', tips: t('Atraer en un lado y cambiar al jugador libre. Gol tras cambio vale doble.') },
      { title: t('Partido con zonas'), minutes: 18, tips: t('No más de dos jugadores en la misma franja vertical. Falta de colocación = balón para el rival.') },
    ],
  },
  {
    id: 'ses-porteros',
    name: t('Sesión de porteros'),
    goal: t('Trabajar las acciones clave del portero con calidad y descansos suficientes.'),
    day: t('MD-3 · trabajo específico'),
    blocks: [
      { title: t('Activación específica'), minutes: 12, tips: t('Movilidad, desplazamientos laterales y blocajes suaves a mano.') },
      { title: t('Blocajes y caídas'), minutes: 12, tips: t('3 series de 6-8 balones por lado con 1 minuto de pausa. Primero raso, luego media altura.') },
      { title: t('Uno contra uno'), minutes: 10, tips: t('Delantero sale desde 25 metros. El portero aguanta de pie lo más posible. 2 series de 5.') },
      { title: t('Salidas a centros'), minutes: 12, template: 'anim-centro', tips: t('Centros desde las dos bandas con un rematador. Avisar "¡mía!" o "¡fuera!" en cada balón.') },
      { title: t('Juego de pies y salida'), minutes: 12, template: 'pa-salida-portero', tips: t('Pases en corto a los centrales y en largo al lateral. Con un presionador que sale al recibir.') },
      { title: t('Integración con el grupo'), minutes: 12, tips: t('Finalización del equipo: el portero ordena la defensa y busca la salida rápida tras cada parada.') },
    ],
  },
  {
    id: 'ses-basculacion',
    name: t('Defender en bloque: bascular juntos'),
    goal: t('Que el equipo se mueva junto hacia el balón y no deje huecos por dentro.'),
    day: t('MD-4'),
    blocks: [
      { title: t('Rondo 4 contra 2'), minutes: 10, template: 'anim-rondo', tips: t('Los defensores del rondo trabajan juntos: uno presiona y el otro tapa el pase por dentro.') },
      { title: t('Línea de 4 contra 6'), minutes: 15, template: 't3-ej-basculacion-4', tips: t('Primero andando, luego a ritmo de partido. El entrenador corrige parando el juego con una palmada.') },
      { title: t('Basculación del 4-4-2'), minutes: 20, template: 't3-basculacion-442', tips: t('Juntar las dos líneas: 8 defensores contra 8 atacantes en medio campo. Punto si roban por dentro.') },
      { title: t('Bloque bajo con 5 atrás'), minutes: 15, template: 't3-bloque-bajo-541', tips: t('Si juegas con línea de 4, ensaya solo la ayuda del extremo al lateral.') },
      { title: t('Partido 9 contra 9'), minutes: 15, tips: t('Gol en contra tras pase por dentro de un bloque abierto: el entrenador lo para y lo explica.') },
    ],
  },
  {
    id: 'ses-desdoblamientos',
    name: t('Ataque por banda: duelos y desdoblamientos'),
    goal: t('Ganar la banda con 1 contra 1 o 2 contra 1 y llegar al área con dos rematadores.'),
    day: t('MD-3'),
    blocks: [
      { title: t('Activación con material'), minutes: 10, template: 'anim-circuito', tips: t('Terminar cada vuelta con un centro.') },
      { title: t('1 contra 1 en banda y centro'), minutes: 15, template: 't3-ej-1c1-banda-centro', tips: t('Series cortas: 4-5 duelos por jugador con descanso de 1 minuto.') },
      { title: t('Desdoblamiento del lateral'), minutes: 20, template: 't3-desdoblamiento', tips: t('Empezar sin defensa, añadir el lateral rival y luego un central dentro.') },
      { title: t('Córner con pase atrás'), minutes: 10, template: 't3-corner-frontal', tips: t('Ensayar la señal del lanzador para que el 10 sepa cuándo llegar.') },
      { title: t('Partido con bandas libres'), minutes: 15, tips: t('Gol tras centro vale doble.') },
    ],
  },
  {
    id: 'ses-duelos-defensivos',
    name: t('Duelos defensivos y vigilancias'),
    goal: t('Defender bien el 1 contra 1 y no quedar desprotegidos al perder el balón.'),
    day: t('MD-4'),
    blocks: [
      { title: t('Defender un 1 contra 1'), minutes: 15, template: 't3-ej-defensa-1c1', tips: t('Corregir la postura: de lado, rodillas flexionadas, sin tirarse.') },
      { title: t('Vigilancias en ataque'), minutes: 20, template: 't3-vigilancias', tips: t('Atacan 7 contra 6 y dos rivales esperan arriba. Si roban, contraatacan contra nuestros 3 de atrás.') },
      { title: t('Falta frontal en contra'), minutes: 10, template: 't3-falta-frontal-contra', tips: t('El portero dice cuántos van en la barrera y quién la coloca.') },
      { title: t('Partido 10 contra 10'), minutes: 15, tips: t('Cuando un equipo ataca, siempre tiene que haber 3 jugadores por detrás del balón.') },
    ],
  },
  {
    id: 'ses-juego-directo',
    name: t('Juego directo y presión a una salida de 3'),
    goal: t('Saber saltar una presión alta en largo y presionar a un rival que sale con 3 centrales.'),
    day: t('MD-3'),
    blocks: [
      { title: t('Rondo 5 contra 2 con transición'), minutes: 12, template: 'ej2-rondo-transicion', tips: t('Quien pierde el balón presiona al instante.') },
      { title: t('Balón largo y segunda jugada'), minutes: 20, template: 't3-balon-largo-segunda', tips: t('Puntos por ganar el segundo balón. El 8 y el 10 tienen que estar a menos de 10 metros del 9 antes del pase.') },
      { title: t('Presión a una salida de 3'), minutes: 20, template: 't3-presion-salida-3', tips: t('El equipo que sale juega con 3 centrales y portero. Robo en campo rival vale un punto.') },
      { title: t('Partido 11 contra 11'), minutes: 15, tips: t('Un equipo sale siempre con 3 atrás y el otro con 4; a mitad se cambia.') },
    ],
  },
]
