export const tableMessages = {
  en: {
    seatName: 'Player {number}',
    setup: {
      eyebrow: 'In person',
      title: 'Set up the table',
      hint: 'One phone for the whole table. Nothing leaves this device.',
      seats: 'Seats',
      seatsHint: 'In the order the phone goes around the table. Names are optional.',
      players: 'Players',
      fewer: 'Fewer players',
      more: 'More players',
      namePlaceholder: 'Player {number}',
      nameLabel: 'Name for seat {number}',
      errors: { 'name-invalid': 'Names are 1 to 20 characters', 'name-taken': 'That name is already at the table' },
      unmet: { 'deck-mismatch': 'The deck needs one card per player', 'no-wolves': 'The deck needs at least one Werewolf' },
      deal: 'Deal the roles',
      cancel: 'Cancel',
      saved: {
        title: 'A table game is saved',
        body: 'Starting over discards it.',
        resume: 'Resume it',
        startOver: 'Start over'
      }
    },
    deal: {
      progress: 'Seat {number} of {total}',
      passTo: 'Pass the phone to {name}',
      passHint: 'Only {name} should look at the screen now.',
      iAm: 'I’m {name}',
      seen: 'I’ve seen it',
      handBack: 'Give the phone back to the narrator',
      handBackHint: 'Everyone has a role. Narrator, press and hold to open the logbook.',
      open: 'Hold to open the logbook'
    },
    logbook: {
      phaseRound: '{phase} {round}',
      undo: 'Undo',
      stage: 'Table screen',
      next: 'Next: {phase}',
      players: 'Players',
      playersHint: 'Tap a player to see their card',
      alive: 'Alive',
      dead: 'Dead',
      kill: 'Kill',
      revive: 'Revive',
      killLabel: 'Mark {name} dead',
      reviveLabel: 'Bring {name} back',
      addTime: '+{seconds}s',
      timeUp: 'Time’s up',
      errors: {
        'nothing-to-undo': 'Nothing to undo yet',
        generic: 'That didn’t work. Check the step and try again.'
      },
      win: { keepPlaying: 'Keep playing', endGame: 'End the game' },
      confirm: {
        title: 'Some steps are not logged',
        body: 'Still waiting on: {steps}. End the night anyway?',
        yes: 'Go to dawn',
        no: 'Back to the night'
      }
    },
    night: {
      title: 'Wake-up script',
      hint: 'Tap shoulders by name, one step at a time.',
      powers: { hunt: 'Werewolves', seer: 'Seer', drunk: 'Drunk', protect: 'Doctor', potions: 'Witch' },
      wake: 'Wake {names}',
      drunkNote: '{name} believes they are the Seer',
      logged: 'Logged',
      pending: 'To log',
      pretend: 'Pretend',
      pretendHint: 'Call the role anyway and wait, so nobody can tell they are gone.',
      pretendStart: 'Pretend for {seconds}s',
      pretendLeft: '{seconds}s…',
      huntAsk: 'Who do the wolves pick?',
      inspectAsk: 'Who does {name} point at?',
      protectAsk: 'Who does {name} protect?',
      showResult: 'Show the result',
      resultFor: 'You looked at {name}',
      isWolf: 'Werewolf',
      notWolf: 'Not a Werewolf',
      close: 'Close',
      victim: 'The wolves are coming for… {name}',
      noVictim: 'The wolves haven’t picked anyone yet',
      heal: 'Heal',
      poison: 'Poison',
      nothing: 'Nothing tonight',
      poisonAsk: 'Who gets the poison?',
      spent: 'used',
      pastVisions: 'Past visions',
      vision: 'Night {round} · {name}: {result}',
      drunkVision: 'Drunk’s vision'
    },
    day: {
      title: 'Discussion',
      hint: 'Let the table talk. Advance when they are ready to vote.'
    },
    vote: {
      title: 'Hands up',
      hint: 'Two steps: pick who is on trial, then tap everyone raising a hand against them.',
      accused: 'Who is on trial?',
      accusedHint: 'Tap one player. The number shows the votes they already have.',
      voters: 'Who votes against {name}?',
      votersHint: 'Tap each player with a hand up. Tap again to take it back.',
      pickFirst: 'Pick who is on trial first, then count the hands here.',
      elsewhere: 'now on {name}',
      tally: 'Tally',
      none: 'No votes yet',
      votes: 'no votes | 1 vote | {count} votes'
    },
    revenge: {
      title: '{name} takes aim',
      ask: 'Who does the Hunter shoot?',
      skip: 'Skip the shot'
    },
    consult: {
      title: '{name}’s card',
      thinks: 'Thinks they are the Seer',
      close: 'Close'
    },
    stage: {
      back: 'Hold to return to the logbook'
    },
    over: {
      eyebrow: 'Game over',
      twist: '{name} was the {role} all along',
      twistBody: 'Their card said {seen}.',
      playAgain: 'Play again',
      playAgainHint: 'Same names, new cards',
      backToSetup: 'Back to setup',
      leave: 'Leave'
    }
  },
  es: {
    seatName: 'Jugador {number}',
    setup: {
      eyebrow: 'En persona',
      title: 'Arma la mesa',
      hint: 'Un solo teléfono para toda la mesa. Nada sale de este dispositivo.',
      seats: 'Puestos',
      seatsHint: 'En el orden en que el teléfono da la vuelta a la mesa. Los nombres son opcionales.',
      players: 'Jugadores',
      fewer: 'Menos jugadores',
      more: 'Más jugadores',
      namePlaceholder: 'Jugador {number}',
      nameLabel: 'Nombre del puesto {number}',
      errors: { 'name-invalid': 'Los nombres tienen de 1 a 20 caracteres', 'name-taken': 'Ese nombre ya está en la mesa' },
      unmet: { 'deck-mismatch': 'El mazo necesita una carta por jugador', 'no-wolves': 'El mazo necesita al menos un Lobo' },
      deal: 'Repartir los roles',
      cancel: 'Cancelar',
      saved: {
        title: 'Hay una partida en persona guardada',
        body: 'Empezar de nuevo la descarta.',
        resume: 'Retomarla',
        startOver: 'Empezar de nuevo'
      }
    },
    deal: {
      progress: 'Puesto {number} de {total}',
      passTo: 'Pásale el teléfono a {name}',
      passHint: 'Solo {name} debe mirar la pantalla ahora.',
      iAm: 'Soy {name}',
      seen: 'Ya lo vi',
      handBack: 'Devuélvele el teléfono al narrador',
      handBackHint: 'Todos tienen rol. Narrador, mantén presionado para abrir la bitácora.',
      open: 'Mantén presionado para abrir la bitácora'
    },
    logbook: {
      phaseRound: '{phase} {round}',
      undo: 'Deshacer',
      stage: 'Pantalla de mesa',
      next: 'Siguiente: {phase}',
      players: 'Jugadores',
      playersHint: 'Toca a un jugador para ver su carta',
      alive: 'Vivo',
      dead: 'Muerto',
      kill: 'Matar',
      revive: 'Revivir',
      killLabel: 'Marcar a {name} como muerto',
      reviveLabel: 'Revivir a {name}',
      addTime: '+{seconds}s',
      timeUp: 'Se acabó el tiempo',
      errors: {
        'nothing-to-undo': 'Todavía no hay nada que deshacer',
        generic: 'Eso no funcionó. Revisa el paso e inténtalo otra vez.'
      },
      win: { keepPlaying: 'Seguir jugando', endGame: 'Terminar la partida' },
      confirm: {
        title: 'Faltan pasos por anotar',
        body: 'Todavía falta: {steps}. ¿Terminar la noche igual?',
        yes: 'Ir al amanecer',
        no: 'Volver a la noche'
      }
    },
    night: {
      title: 'Guion para despertar',
      hint: 'Toca hombros por nombre, un paso a la vez.',
      powers: { hunt: 'Lobos', seer: 'Vidente', drunk: 'Borracho', protect: 'Doctor', potions: 'Bruja' },
      wake: 'Despierta a {names}',
      drunkNote: '{name} cree que es la Vidente',
      logged: 'Anotado',
      pending: 'Por anotar',
      pretend: 'Fingir',
      pretendHint: 'Llama al rol igual y espera, para que nadie sepa que ya no está.',
      pretendStart: 'Fingir {seconds}s',
      pretendLeft: '{seconds}s…',
      huntAsk: '¿A quién eligen los lobos?',
      inspectAsk: '¿A quién señala {name}?',
      protectAsk: '¿A quién protege {name}?',
      showResult: 'Mostrar el resultado',
      resultFor: 'Miraste a {name}',
      isWolf: 'Lobo',
      notWolf: 'No es lobo',
      close: 'Cerrar',
      victim: 'Los lobos vienen por… {name}',
      noVictim: 'Los lobos todavía no eligen a nadie',
      heal: 'Curar',
      poison: 'Envenenar',
      nothing: 'Nada esta noche',
      poisonAsk: '¿Quién recibe el veneno?',
      spent: 'usada',
      pastVisions: 'Visiones pasadas',
      vision: 'Noche {round} · {name}: {result}',
      drunkVision: 'Visión del Borracho'
    },
    day: {
      title: 'Discusión',
      hint: 'Deja que la mesa hable. Avanza cuando estén listos para votar.'
    },
    vote: {
      title: 'Manos arriba',
      hint: 'Dos pasos: elige a quién se juzga y luego toca a cada quien que levante la mano contra esa persona.',
      accused: '¿A quién se juzga?',
      accusedHint: 'Toca a un jugador. El número muestra los votos que ya tiene.',
      voters: '¿Quién vota contra {name}?',
      votersHint: 'Toca a cada quien con la mano arriba. Toca otra vez para quitar el voto.',
      pickFirst: 'Primero elige a quién se juzga y luego cuenta las manos aquí.',
      elsewhere: 'ahora contra {name}',
      tally: 'Conteo',
      none: 'Todavía no hay votos',
      votes: 'sin votos | 1 voto | {count} votos'
    },
    revenge: {
      title: '{name} apunta',
      ask: '¿A quién le dispara el Cazador?',
      skip: 'Saltar el disparo'
    },
    consult: {
      title: 'La carta de {name}',
      thinks: 'Cree que es la Vidente',
      close: 'Cerrar'
    },
    stage: {
      back: 'Mantén presionado para volver a la bitácora'
    },
    over: {
      eyebrow: 'Fin del juego',
      twist: '{name} era el {role} todo el tiempo',
      twistBody: 'Su carta decía {seen}.',
      playAgain: 'Jugar otra vez',
      playAgainHint: 'Mismos nombres, cartas nuevas',
      backToSetup: 'Volver a armar la mesa',
      leave: 'Salir'
    }
  }
}
