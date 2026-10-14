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
]
