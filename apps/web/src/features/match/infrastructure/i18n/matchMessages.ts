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
  vote: {
    title: 'Tap a suspect',
    progress: '{voted} of {voters} voted',
    lock: 'Lock vote',
    lockOn: 'Lock vote on {name}',
    locked: 'Locked on {name}',
    clear: 'Clear my vote',
    hint: 'Nobody sees your pick until the narrator reveals the votes.'
  },
  verdict: {
    leaves: '{name} leaves the village',
    spoken: 'The village has spoken. Loudly.',
    was: '{name} was…',
    roleHidden: 'Their role stays a secret.',
    tie: 'It’s a tie!',
    noExecution: 'No execution today',
    tieHint: 'The village couldn’t agree, so the pitchforks go back in the shed.',
    nobody: 'Nobody voted',
    nobodyHint: 'Silence in the village. The pitchforks stay put.',
    votes: '{n} vote | {n} votes',
    anonymous: 'Votes are anonymous in this room.'
  },
  revenge: {
    everyoneSees: 'Everyone sees: The Hunter takes aim…',
    aims: 'The Hunter takes aim…',
    took: 'The Hunter took {name} down',
    held: 'The Hunter held their fire',
    youWere: 'You were the Hunter.',
    lastShot: 'You get one last shot.',
    dockTitle: 'Take someone down with you',
    choose: 'Choose your target',
    take: 'Take {name} down'
  },
  fool: {
    badge: 'Solo victory',
    wanted: '{name} wanted to be voted out. You all fell for it.',
    continues: 'The game continues — wolves and village still have a score to settle.',
    back: 'Back to the village'
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
    endGame: 'End game',
    votes: {
      title: 'Votes',
      progress: '{voted} of {voters} voted · {locked} locked',
      pending: 'Hasn’t voted',
      for: '→ {name}',
      lockedLabel: 'Locked'
    },
    verdict: {
      title: 'Verdict',
      executed: '{name} is executed',
      tie: 'Tie: nobody is executed',
      nobody: 'Nobody voted: nobody is executed',
      tallyLine: '{name}: {votes}',
      by: 'by {names}'
    },
    revenge: {
      title: 'Hunter’s revenge',
      pending: '{name} is taking aim. The game waits for the shot.',
      took: '{name} took {target} down',
      held: '{name} held their fire',
      skip: 'Skip the shot'
    }
  },
  night: {
    why: { self: 'you', dead: 'dead', wolf: 'wolf', 'last-night': 'last night' },
    hunt: {
      title: 'Choose tonight’s victim',
      withPack: 'with your pack',
      pickedBy: '{name} picked {target}',
      agrees: 'Pack agrees on {name}. You can still change until dawn.',
      split: 'Pack is split. Agree on one victim before dawn.',
      waiting: 'Pick a victim. Your pack sees your choice.'
    },
    inspect: {
      title: 'Who do you inspect?',
      vision: 'Your vision',
      onlyYou: 'Only you',
      says: 'The crystal ball says…',
      isWolf: '{name} is a Werewolf',
      isNotWolf: '{name} is not a Werewolf',
      past: 'Past visions',
      pastEntry: 'Night {round} · {name}',
      wolfTag: 'Werewolf',
      notWolfTag: 'not a Werewolf',
      hint: 'One peek per night. Choose carefully.',
      done: 'One peek per night. Use it wisely at dawn.'
    },
    protect: {
      title: 'Who do you protect tonight?',
      protected: '{name} is protected. Change anytime until dawn.',
      blocked: 'You protected {name} last night. The Doctor can’t pick the same player twice in a row.'
    },
    potions: {
      coming: 'The wolves are coming for…',
      nobody: 'The wolves haven’t chosen yet',
      heal: 'Heal',
      healReady: 'Save the wolves’ victim',
      healSpent: 'Already used',
      healNoVictim: 'No victim yet',
      healing: 'Healing {name}',
      poison: 'Poison…',
      poisonReady: '1 left · then pick a target',
      poisonSpent: 'Already used',
      poisoning: 'Poisoning {name}',
      poisonTitle: 'Who do you poison?',
      nothing: 'Do nothing tonight',
      chosenNothing: 'You chose to do nothing tonight. Change anytime until dawn.'
    },
    suspect: {
      title: 'Who do you suspect?',
      done: 'Done — the village sleeps…',
      doneHint: 'Night ends when the narrator calls dawn. Keep a straight face on the call.',
      suspecting: 'You suspect {name}',
      change: 'Change my pick'
    },
    line: {
      idle: 'Hasn’t acted yet',
      deciding: 'Deciding',
      picked: 'Picked {name}',
      inspected: 'Inspected {name} → {result}',
      drunkInspected: '“Inspected” {name} → told {result}',
      protecting: 'Protecting {name}',
      healAndPoison: 'Heal + poison {name}',
      heal: 'Heal',
      poison: 'Poison {name}',
      nothing: 'Does nothing tonight',
      suspects: 'Suspects {name} · decoy',
      wolf: 'Wolf',
      notWolf: 'Not a wolf'
    },
    preview: {
      title: 'What happens at dawn',
      waitingOn: 'Waiting on {names}',
      wolvesChose: 'Wolves chose {name}',
      wolvesUndecided: 'Wolves haven’t chosen',
      protected: 'Doctor protected {name}',
      unprotected: 'Nobody protected',
      healing: 'Witch heals',
      notHealing: 'Witch does not heal',
      poisoning: 'Witch poisons {name}',
      deaths: 'Nobody dies | {names} dies | {names} die'
    }
  },
  dawn: {
    died: '{name} didn’t wake up',
    wasThe: 'They were the…',
    nobody: 'Nobody died tonight!',
    nobodyHint: 'The village lets out one big sigh of relief. Somebody’s plan didn’t work…'
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
    roles: 'Who was who',
    soloAlso: 'The {role} also won',
    flavor: {
      village: 'Every wolf is gone. The arepas are safe again.',
      wolves: 'The pack has the village to itself. Nobody sleeps tonight.',
      solo: 'Nobody saw it coming. Except the Fool.'
    },
    twist: {
      eyebrow: 'Plot twist',
      title: 'You were the {role} all along',
      body: 'Your card said {seen}. It was lying. Sorry.'
    },
    story: 'What really happened',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    awards: 'Awards',
    playAgain: 'Play again',
    playAgainHint: 'Same room, same friends — back to the lobby',
    leave: 'Leave'
  },
  timeline: {
    night: 'Night {round}',
    day: 'Day {round}',
    noVictim: 'The wolves did not choose anyone.',
    hunt: 'The wolves targeted {name}.',
    doctorSaved: 'The Doctor saved {name}.',
    doctorProtected: 'The Doctor protected {name}.',
    witchHealed: 'The Witch healed {name}.',
    witchPoisoned: 'The Witch poisoned {name}.',
    visionWolf: 'The Seer inspected {name}: a Werewolf.',
    visionClear: 'The Seer inspected {name}: not a Werewolf.',
    drunkVisionWolf: 'The Drunk “inspected” {name} and was told: a Werewolf.',
    drunkVisionClear: 'The Drunk “inspected” {name} and was told: not a Werewolf.',
    noDeaths: 'Nobody died.',
    died: '{names} died. | {names} died.',
    noVotes: 'Nobody voted. Nobody was executed.',
    ballot: '{voters} voted for {name}.',
    tie: '{names} tied with {count} votes each. Nobody was executed.',
    executed: 'The village executed {name} with {count} vote. | The village executed {name} with {count} votes.',
    executedRole: '{name} was a {role}.',
    foolWon: '{name} was the Fool and got exactly what they wanted.',
    hunterShot: 'The Hunter {name} took {other} down.',
    hunterHeld: 'The Hunter {name} held their fire.',
    narratorKilled: 'The narrator took {name} out of the game.',
    narratorRevived: 'The narrator brought {name} back.'
  },
  awards: {
    title: {
      'most-suspicious': 'Most Suspicious',
      'worst-liar': 'Worst Liar',
      'betrayed-own-team': 'Betrayed Own Team',
      'silent-assassin': 'Silent Assassin',
      chatterbox: 'Chatterbox'
    },
    detail: {
      'most-suspicious': '{count} vote received | {count} votes received',
      'worst-liar': 'Wolf, caught on Day {count}',
      'betrayed-own-team': '{count} vote against villagers | {count} votes against villagers',
      'silent-assassin': 'A wolf nobody ever suspected',
      chatterbox: '{count} message | {count} messages'
    }
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
    'not-night': 'That can only be done at night.',
    'player-dead': 'The dead can’t act.',
    'not-your-action': 'That isn’t your night action.',
    'target-invalid': 'You can’t pick that player.',
    'already-inspected': 'You already peeked tonight.',
    'protected-last-night': 'You protected that player last night.',
    'potion-used': 'That potion is already used.',
    'not-vote': 'Voting is not open.',
    'vote-locked': 'Your vote is locked.',
    'revenge-pending': 'The Hunter’s shot is still pending.',
    'no-revenge': 'There is no shot for you to take.',
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
  vote: {
    title: 'Toca a un sospechoso',
    progress: '{voted} de {voters} votaron',
    lock: 'Fijar voto',
    lockOn: 'Fijar voto por {name}',
    locked: 'Voto fijado por {name}',
    clear: 'Quitar mi voto',
    hint: 'Nadie ve tu elección hasta que el narrador revele los votos.'
  },
  verdict: {
    leaves: '{name} deja la aldea',
    spoken: 'La aldea ha hablado. Y a gritos.',
    was: '{name} era…',
    roleHidden: 'Su rol sigue siendo un secreto.',
    tie: '¡Empate!',
    noExecution: 'Hoy no hay ejecución',
    tieHint: 'La aldea no logró ponerse de acuerdo, así que las horcas vuelven al cobertizo.',
    nobody: 'Nadie votó',
    nobodyHint: 'Silencio en la aldea. Las horcas se quedan quietas.',
    votes: '{n} voto | {n} votos',
    anonymous: 'Los votos son anónimos en esta sala.'
  },
  revenge: {
    everyoneSees: 'Todos ven: El Cazador apunta…',
    aims: 'El Cazador apunta…',
    took: 'El Cazador se llevó a {name}',
    held: 'El Cazador bajó el arma',
    youWere: 'Eras el Cazador.',
    lastShot: 'Tienes un último disparo.',
    dockTitle: 'Llévate a alguien contigo',
    choose: 'Elige tu objetivo',
    take: 'Llevarse a {name}'
  },
  fool: {
    badge: 'Victoria en solitario',
    wanted: '{name} quería que lo votaran. Todos cayeron.',
    continues: 'El juego continúa: lobos y aldea aún tienen cuentas pendientes.',
    back: 'Volver a la aldea'
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
    endGame: 'Terminar juego',
    votes: {
      title: 'Votos',
      progress: '{voted} de {voters} votaron · {locked} fijados',
      pending: 'Aún no vota',
      for: '→ {name}',
      lockedLabel: 'Fijado'
    },
    verdict: {
      title: 'Veredicto',
      executed: '{name} es ejecutado',
      tie: 'Empate: nadie es ejecutado',
      nobody: 'Nadie votó: nadie es ejecutado',
      tallyLine: '{name}: {votes}',
      by: 'por {names}'
    },
    revenge: {
      title: 'Venganza del Cazador',
      pending: '{name} está apuntando. El juego espera el disparo.',
      took: '{name} se llevó a {target}',
      held: '{name} bajó el arma',
      skip: 'Saltar el disparo'
    }
  },
  night: {
    why: { self: 'tú', dead: 'muerto', wolf: 'lobo', 'last-night': 'anoche' },
    hunt: {
      title: 'Elige a la víctima de esta noche',
      withPack: 'con tu manada',
      pickedBy: '{name} eligió a {target}',
      agrees: 'La manada coincide en {name}. Puedes cambiar hasta el amanecer.',
      split: 'La manada está dividida. Pónganse de acuerdo en una víctima antes del amanecer.',
      waiting: 'Elige una víctima. Tu manada ve tu elección.'
    },
    inspect: {
      title: '¿A quién inspeccionas?',
      vision: 'Tu visión',
      onlyYou: 'Solo tú',
      says: 'La bola de cristal dice…',
      isWolf: '{name} es un hombre lobo',
      isNotWolf: '{name} no es un hombre lobo',
      past: 'Visiones pasadas',
      pastEntry: 'Noche {round} · {name}',
      wolfTag: 'hombre lobo',
      notWolfTag: 'no es hombre lobo',
      hint: 'Un vistazo por noche. Elige con cuidado.',
      done: 'Un vistazo por noche. Úsalo con cabeza al amanecer.'
    },
    protect: {
      title: '¿A quién proteges esta noche?',
      protected: '{name} está protegido. Cambia cuando quieras hasta el amanecer.',
      blocked: 'Anoche protegiste a {name}. El Doctor no puede elegir al mismo jugador dos noches seguidas.'
    },
    potions: {
      coming: 'Los lobos van por…',
      nobody: 'Los lobos todavía no han elegido',
      heal: 'Curar',
      healReady: 'Salva a la víctima de los lobos',
      healSpent: 'Ya la usaste',
      healNoVictim: 'Aún no hay víctima',
      healing: 'Curando a {name}',
      poison: 'Envenenar…',
      poisonReady: 'Queda 1 · luego elige objetivo',
      poisonSpent: 'Ya la usaste',
      poisoning: 'Envenenando a {name}',
      poisonTitle: '¿A quién envenenas?',
      nothing: 'No hacer nada esta noche',
      chosenNothing: 'Elegiste no hacer nada esta noche. Cambia cuando quieras hasta el amanecer.'
    },
    suspect: {
      title: '¿De quién sospechas?',
      done: 'Listo — la aldea duerme…',
      doneHint: 'La noche termina cuando el narrador anuncia el amanecer. Pon cara de póker.',
      suspecting: 'Sospechas de {name}',
      change: 'Cambiar mi elección'
    },
    line: {
      idle: 'Aún no actúa',
      deciding: 'Decidiendo',
      picked: 'Eligió a {name}',
      inspected: 'Inspeccionó a {name} → {result}',
      drunkInspected: '“Inspeccionó” a {name} → le dijo {result}',
      protecting: 'Protege a {name}',
      healAndPoison: 'Cura + envenena a {name}',
      heal: 'Cura',
      poison: 'Envenena a {name}',
      nothing: 'No hace nada esta noche',
      suspects: 'Sospecha de {name} · señuelo',
      wolf: 'Lobo',
      notWolf: 'No es lobo'
    },
    preview: {
      title: 'Qué pasa al amanecer',
      waitingOn: 'Esperando a {names}',
      wolvesChose: 'Los lobos eligieron a {name}',
      wolvesUndecided: 'Los lobos no han elegido',
      protected: 'El Doctor protegió a {name}',
      unprotected: 'Nadie protegido',
      healing: 'La Bruja cura',
      notHealing: 'La Bruja no cura',
      poisoning: 'La Bruja envenena a {name}',
      deaths: 'Nadie muere | {names} muere | {names} mueren'
    }
  },
  dawn: {
    died: '{name} no despertó',
    wasThe: 'Era…',
    nobody: '¡Anoche no murió nadie!',
    nobodyHint: 'La aldea suelta un gran suspiro de alivio. El plan de alguien falló…'
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
    roles: 'Quién era quién',
    soloAlso: 'El {role} también ganó',
    flavor: {
      village: 'No queda ningún lobo. Las arepas están a salvo otra vez.',
      wolves: 'La manada tiene la aldea para ella sola. Esta noche nadie duerme.',
      solo: 'Nadie lo vio venir. Excepto el Bufón.'
    },
    twist: {
      eyebrow: 'Giro de la trama',
      title: 'Eras el {role} todo el tiempo',
      body: 'Tu carta decía {seen}. Mentía. Perdón.'
    },
    story: 'Lo que pasó de verdad',
    expandAll: 'Expandir todo',
    collapseAll: 'Contraer todo',
    awards: 'Premios',
    playAgain: 'Jugar de nuevo',
    playAgainHint: 'Misma sala, mismos amigos: de vuelta a la sala de espera',
    leave: 'Salir'
  },
  timeline: {
    night: 'Noche {round}',
    day: 'Día {round}',
    noVictim: 'Los lobos no eligieron a nadie.',
    hunt: 'Los lobos fueron por {name}.',
    doctorSaved: 'El Doctor salvó a {name}.',
    doctorProtected: 'El Doctor protegió a {name}.',
    witchHealed: 'La Bruja curó a {name}.',
    witchPoisoned: 'La Bruja envenenó a {name}.',
    visionWolf: 'La Vidente inspeccionó a {name}: hombre lobo.',
    visionClear: 'La Vidente inspeccionó a {name}: no es hombre lobo.',
    drunkVisionWolf: 'El Borracho “inspeccionó” a {name} y le dijeron: hombre lobo.',
    drunkVisionClear: 'El Borracho “inspeccionó” a {name} y le dijeron: no es hombre lobo.',
    noDeaths: 'No murió nadie.',
    died: 'Murió {names}. | Murieron {names}.',
    noVotes: 'Nadie votó. No se ejecutó a nadie.',
    ballot: '{voters} votó por {name}. | {voters} votaron por {name}.',
    tie: '{names} empataron con {count} votos cada uno. No se ejecutó a nadie.',
    executed: 'La aldea ejecutó a {name} con {count} voto. | La aldea ejecutó a {name} con {count} votos.',
    executedRole: '{name} era {role}.',
    foolWon: '{name} era el Bufón y consiguió justo lo que quería.',
    hunterShot: 'El Cazador {name} se llevó a {other}.',
    hunterHeld: 'El Cazador {name} bajó el arma.',
    narratorKilled: 'El narrador sacó a {name} del juego.',
    narratorRevived: 'El narrador devolvió a {name} al juego.'
  },
  awards: {
    title: {
      'most-suspicious': 'Más sospechoso',
      'worst-liar': 'Peor mentiroso',
      'betrayed-own-team': 'Traidor a su bando',
      'silent-assassin': 'Asesino silencioso',
      chatterbox: 'Cotorra'
    },
    detail: {
      'most-suspicious': '{count} voto recibido | {count} votos recibidos',
      'worst-liar': 'Lobo, descubierto el Día {count}',
      'betrayed-own-team': '{count} voto contra aldeanos | {count} votos contra aldeanos',
      'silent-assassin': 'Un lobo del que nadie sospechó',
      chatterbox: '{count} mensaje | {count} mensajes'
    }
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
    'not-night': 'Eso solo se puede hacer de noche.',
    'player-dead': 'Los muertos no pueden actuar.',
    'not-your-action': 'Esa no es tu acción nocturna.',
    'target-invalid': 'No puedes elegir a ese jugador.',
    'already-inspected': 'Ya espiaste esta noche.',
    'protected-last-night': 'Anoche protegiste a ese jugador.',
    'potion-used': 'Esa poción ya se usó.',
    'not-vote': 'La votación no está abierta.',
    'vote-locked': 'Tu voto ya está fijado.',
    'revenge-pending': 'El disparo del Cazador sigue pendiente.',
    'no-revenge': 'No hay ningún disparo para ti.',
    unreachable: 'No logramos llegar a la aldea. Revisa tu conexión.'
  }
}

export const matchMessages = { en, es }
