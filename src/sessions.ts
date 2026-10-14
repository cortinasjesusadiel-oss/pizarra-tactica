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
]
