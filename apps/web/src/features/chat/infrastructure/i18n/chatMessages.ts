const en = {
  channels: { village: 'Village', wolves: 'Wolves', ghosts: 'Ghosts' },
  narrator: 'Narrator',
  toEveryone: 'to everyone',
  lastWordsTag: 'Last words',
  empty: 'Nothing here yet.',
  bar: { open: 'Chat with the village', unread: '{count} unread' },
  sheet: { label: 'Chat', close: 'Close chat', tabs: 'Channels', messages: 'Messages' },
  composer: {
    village: 'Say something to the village…',
    wolves: 'Whisper to the pack…',
    ghosts: 'Haunt the afterlife…',
    label: 'Message {channel}',
    send: 'Send'
  },
  notes: {
    villageAsleep: 'The village sleeps — chat opens at dawn',
    denQuiet: 'The den is quiet — wolves talk at night',
    paused: 'Chat paused for last words',
    villageReadOnly: 'Village is read-only',
    denReadOnly: 'Only living wolves can talk here'
  },
  lastWords: {
    promptTitle: 'Your last words',
    promptHint: 'One message to the village. Make it count.',
    promptPlaceholder: 'Your last words…',
    promptLabel: 'Last words',
    spotlightTitle: 'Last words',
    hasTheFloor: '{name} has the floor',
    fame: '{seconds} seconds of fame',
    listen: 'Listen up — village chat resumes when the timer ends.',
    timer: 'Time left for last words'
  },
  monitor: {
    title: 'Chat monitor',
    tabs: 'Channels',
    all: 'All',
    asNarrator: 'As Narrator → All',
    placeholder: 'Post a message as the Narrator…',
    label: 'Narrator message'
  },
  errors: {
    'chat-not-open': 'Chat is not open yet.',
    'session-invalid': 'Your seat expired. Rejoin the game to chat.',
    'chat-closed': 'This chat is closed right now.',
    'chat-forbidden': 'You cannot write in this chat.',
    'message-invalid': 'Write between 1 and {max} characters.',
    unreachable: 'Could not reach the village. Try again.'
  }
}

const es: typeof en = {
  channels: { village: 'Aldea', wolves: 'Lobos', ghosts: 'Fantasmas' },
  narrator: 'Narrador',
  toEveryone: 'para todos',
  lastWordsTag: 'Últimas palabras',
  empty: 'Aún no hay nada.',
  bar: { open: 'Hablar con la aldea', unread: '{count} sin leer' },
  sheet: { label: 'Chat', close: 'Cerrar el chat', tabs: 'Canales', messages: 'Mensajes' },
  composer: {
    village: 'Dile algo a la aldea…',
    wolves: 'Susurra a la manada…',
    ghosts: 'Embruja el más allá…',
    label: 'Mensaje para {channel}',
    send: 'Enviar'
  },
  notes: {
    villageAsleep: 'La aldea duerme — el chat abre al amanecer',
    denQuiet: 'La guarida calla — los lobos hablan de noche',
    paused: 'Chat en pausa por las últimas palabras',
    villageReadOnly: 'La aldea es solo de lectura',
    denReadOnly: 'Solo los lobos vivos pueden hablar aquí'
  },
  lastWords: {
    promptTitle: 'Tus últimas palabras',
    promptHint: 'Un solo mensaje para la aldea. Que valga la pena.',
    promptPlaceholder: 'Tus últimas palabras…',
    promptLabel: 'Últimas palabras',
    spotlightTitle: 'Últimas palabras',
    hasTheFloor: '{name} tiene la palabra',
    fame: '{seconds} segundos de fama',
    listen: 'Atención — el chat de la aldea vuelve cuando acabe el tiempo.',
    timer: 'Tiempo restante de las últimas palabras'
  },
  monitor: {
    title: 'Monitor del chat',
    tabs: 'Canales',
    all: 'Todo',
    asNarrator: 'Como Narrador → Todos',
    placeholder: 'Publica un mensaje como Narrador…',
    label: 'Mensaje del narrador'
  },
  errors: {
    'chat-not-open': 'El chat aún no está abierto.',
    'session-invalid': 'Tu puesto expiró. Vuelve a entrar al juego para chatear.',
    'chat-closed': 'Este chat está cerrado por ahora.',
    'chat-forbidden': 'No puedes escribir en este chat.',
    'message-invalid': 'Escribe entre 1 y {max} caracteres.',
    unreachable: 'No se pudo llegar a la aldea. Inténtalo de nuevo.'
  }
}

export const chatMessages = { en, es }
