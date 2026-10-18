const en = {
  phases: { night: 'Night', dawn: 'Dawn', day: 'Day', vote: 'Vote', execution: 'Execution' },
  phaseSub: {
    night: 'Night {round} · The village sleeps',
    dawn: 'Day {round} · Dawn breaks',
    day: 'Day {round} · Discuss',
    vote: 'Day {round} · Vote',
    execution: 'Day {round} · Execution'
  },
  reveal: {
    eyebrow: 'The night begins',
    title: 'Your secret role',
    wolfTitle: 'You’re a wolf. Awoo.',
    hintBack: 'Make sure nobody’s peeking at your screen. Then tap the card.',
    hintFace: 'Keep it to yourself. Act natural.',
    flip: 'Reveal your role',
    tapToFlip: 'Tap to flip',
    peekHint: 'Forgot? Press and hold the card icon during the game to peek. It hides again when you let go.',
    gotIt: 'Got it',
    pack: 'Your pack',
    packOnly: 'only wolves see this',
    packHint: 'Keep the pack secret. The village can’t know.',
    you: '{name} (you)'
  },
  table: {
    peek: 'Hold to peek at your role',
    you: 'You',
    alive: '{alive} of {total} alive'
  },
  dashboard: {
    game: 'Game',
    lobby: 'Lobby',
    stepperLabel: 'Phase',
    nightRound: 'Night {round}',
    addTime: '+{seconds}s',
    addTimeLabel: 'Add {seconds} seconds',
    next: 'Next: {phase}',
    players: 'Players',
    onlyYouSeeRoles: 'Only you see roles',
    alive: 'Alive',
    dead: 'Dead',
    kill: 'Kill',
    revive: 'Revive',
    killLabel: 'Kill {name}',
    reviveLabel: 'Revive {name}',
    keepPlaying: 'Keep playing',
    endGame: 'End game'
  },
  win: {
    village: 'Village wins!',
    wolves: 'Wolves win!',
    solo: 'The Fool wins!',
    villageHint: 'Every wolf is gone. End the game and reveal all roles?',
    wolvesHint: 'The wolves have taken over. End the game and reveal all roles?',
    soloHint: 'A solo player won. End the game and reveal all roles?'
  },
  over: {
    eyebrow: 'Game over',
    roles: 'Everyone’s true role'
  },
  lost: {
    seatLostTitle: 'Your seat is gone',
    seatLostBody: 'This device has no seat in {code}. Join again with the code.',
    joinAgain: 'Join {code}',
    unreachableTitle: 'Lost in the fog',
    unreachableBody: 'We can’t reach the village. Your seat is saved — come back any time.',
    tryAgain: 'Try again',
    closedTitle: 'The village emptied',
    closedBody: 'The narrator closed the room. Start a new one or join another village.'
  },
  errors: {
    'match-not-found': 'There is no game in this village yet.',
    'session-invalid': 'Your seat is gone. Join again with the code.',
    'not-narrator': 'Only the narrator can do that.',
    'member-not-found': 'That player is not in this game.',
    'timer-not-running': 'This phase has no timer to extend.',
    'no-winner-yet': 'No team has won yet.',
    'match-over': 'The game is over.',
    unreachable: 'We can’t reach the village. Check your connection.'
  }
}

const es: typeof en = {
  phases: { night: 'Noche', dawn: 'Amanecer', day: 'Día', vote: 'Votación', execution: 'Ejecución' },
  phaseSub: {
    night: 'Noche {round} · La aldea duerme',
    dawn: 'Día {round} · Amanece',
    day: 'Día {round} · Debate',
    vote: 'Día {round} · Votación',
    execution: 'Día {round} · Ejecución'
  },
  reveal: {
    eyebrow: 'Empieza la noche',
    title: 'Tu rol secreto',
    wolfTitle: 'Eres un lobo. Auuu.',
    hintBack: 'Asegúrate de que nadie mire tu pantalla. Luego toca la carta.',
    hintFace: 'Guárdalo para ti. Actúa natural.',
    flip: 'Revelar tu rol',
    tapToFlip: 'Toca para voltear',
    peekHint: '¿Se te olvidó? Mantén presionado el icono de carta durante el juego para espiar. Se oculta al soltar.',
    gotIt: 'Entendido',
    pack: 'Tu manada',
    packOnly: 'solo los lobos ven esto',
    packHint: 'Guarda el secreto de la manada. La aldea no puede saberlo.',
    you: '{name} (tú)'
  },
  table: {
    peek: 'Mantén para ver tu rol',
    you: 'Tú',
    alive: '{alive} de {total} con vida'
  },
  dashboard: {
    game: 'Juego',
    lobby: 'Sala',
    stepperLabel: 'Fase',
    nightRound: 'Noche {round}',
    addTime: '+{seconds}s',
    addTimeLabel: 'Añadir {seconds} segundos',
    next: 'Siguiente: {phase}',
    players: 'Jugadores',
    onlyYouSeeRoles: 'Solo tú ves los roles',
    alive: 'Vivo',
    dead: 'Muerto',
    kill: 'Matar',
    revive: 'Revivir',
    killLabel: 'Matar a {name}',
    reviveLabel: 'Revivir a {name}',
    keepPlaying: 'Seguir jugando',
    endGame: 'Terminar juego'
  },
  win: {
    village: '¡Gana la aldea!',
    wolves: '¡Ganan los lobos!',
    solo: '¡Gana el Bufón!',
    villageHint: 'No queda ningún lobo. ¿Terminar el juego y revelar todos los roles?',
    wolvesHint: 'Los lobos tomaron la aldea. ¿Terminar el juego y revelar todos los roles?',
    soloHint: 'Ganó un jugador solitario. ¿Terminar el juego y revelar todos los roles?'
  },
  over: {
    eyebrow: 'Fin del juego',
    roles: 'El verdadero rol de cada quien'
  },
  lost: {
    seatLostTitle: 'Tu puesto ya no está',
    seatLostBody: 'Este dispositivo no tiene puesto en {code}. Únete de nuevo con el código.',
    joinAgain: 'Unirse a {code}',
    unreachableTitle: 'Perdidos en la niebla',
    unreachableBody: 'No logramos llegar a la aldea. Tu puesto sigue guardado, vuelve cuando quieras.',
    tryAgain: 'Intentar de nuevo',
    closedTitle: 'La aldea quedó vacía',
    closedBody: 'El narrador cerró la sala. Crea una nueva o únete a otra aldea.'
  },
  errors: {
    'match-not-found': 'Todavía no hay un juego en esta aldea.',
    'session-invalid': 'Tu puesto ya no está. Únete de nuevo con el código.',
    'not-narrator': 'Solo el narrador puede hacer eso.',
    'member-not-found': 'Ese jugador no está en este juego.',
    'timer-not-running': 'Esta fase no tiene un temporizador que ampliar.',
    'no-winner-yet': 'Todavía no ha ganado ningún equipo.',
    'match-over': 'El juego terminó.',
    unreachable: 'No logramos llegar a la aldea. Revisa tu conexión.'
  }
}

export const matchMessages = { en, es }
