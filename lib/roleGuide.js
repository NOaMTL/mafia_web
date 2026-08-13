// Données du guide — miroir de role_guide.dart (Flutter).

export const ROLE_GUIDE = [
  {
    key: 'VILLAGER', name: 'Villageois', team: 'VILLAGE', emoji: '🏘️', color: '#9e9e9e',
    description:
      'Citoyen ordinaire sans pouvoir particulier. Sa force : l\'observation, la déduction et le vote. ' +
      'Les Villageois gagnent quand tous les Mafiosi sont éliminés.',
    nightAction: null,
    tip: 'Observe les votes des autres : la Mafia évite de voter contre les siens.',
  },
  {
    key: 'MAFIA', name: 'Mafioso', team: 'MAFIA', emoji: '🔪', color: '#c0392b',
    description:
      'Membre du crime organisé. Chaque nuit, la Mafia choisit ensemble une victime à éliminer. ' +
      'Le jour, les Mafiosi se fondent dans la masse. Ils gagnent quand ils égalent le nombre de Villageois.',
    nightAction: 'Choisir une victime (vote commun avec les complices).',
    tip: 'Ne défends pas trop tes complices en public — c\'est le piège classique.',
  },
  {
    key: 'DETECTIVE', name: 'Détective', team: 'VILLAGE', emoji: '🔍', color: '#3498db',
    description:
      'Enquêteur du Village. Chaque nuit, il choisit un joueur et découvre son camp. ' +
      'Une information redoutable — à condition de survivre pour l\'exploiter.',
    nightAction: 'Enquêter sur un joueur : son camp est révélé en privé.',
    tip: 'Révéler ses résultats trop tôt fait de toi la cible n°1 de la Mafia.',
  },
  {
    key: 'DOCTOR', name: 'Médecin', team: 'VILLAGE', emoji: '⚕️', color: '#2ecc71',
    description:
      'Chaque nuit, le Médecin protège un joueur. Si la Mafia attaque ce joueur, l\'attaque échoue. ' +
      'Il peut se protéger lui-même.',
    nightAction: 'Protéger un joueur de l\'attaque de la Mafia.',
    tip: 'Protège les joueurs qui parlent trop — ce sont les cibles favorites.',
  },
  {
    key: 'MEDIUM', name: 'Médium', team: 'VILLAGE', emoji: '🔮', color: '#9b59b6',
    description:
      'Le Médium communique avec les morts. Il peut recevoir des informations des joueurs éliminés — ' +
      'qui connaissent souvent l\'identité de leur assassin.',
    nightAction: 'Recevoir un message d\'un joueur éliminé.',
    tip: 'Les morts savent des choses : recoupe leurs infos avec les votes.',
  },
  {
    key: 'VIGILANTE', name: 'Vigilante', team: 'VILLAGE', emoji: '⚖️', color: '#e67e22',
    description:
      'Justicier solitaire. Il peut éliminer un joueur la nuit, de sa propre initiative. ' +
      'Mais tuer un innocent sert la Mafia. Il gagne avec le Village.',
    nightAction: 'Éliminer un joueur (à utiliser avec discernement).',
    tip: 'Ne tire que si tu es sûr. Un Villageois mort par ta faute = cadeau à la Mafia.',
  },
];

export const PHASE_GUIDE = [
  { name: 'Révélation des rôles', emoji: '🎭',
    description: 'Chaque joueur découvre secrètement son rôle. Les Mafiosi voient leurs complices.' },
  { name: 'Nuit', emoji: '🌙',
    description: 'Les rôles à pouvoir agissent en secret : la Mafia tue, le Médecin protège, le Détective enquête.' },
  { name: 'Gazette du matin', emoji: '📰',
    description: 'Le village découvre le résultat de la nuit : victime (rôle révélé) ou nuit calme.' },
  { name: 'Discussion', emoji: '💬',
    description: 'Le moment clé : accusations, défenses, bluffs. Analyse qui accuse qui.' },
  { name: 'Vote', emoji: '🗳️',
    description: 'Chaque joueur vote pour envoyer un suspect au procès. Égalité = personne n\'est accusé.' },
  { name: 'Procès & Jugement', emoji: '⚖️',
    description: 'L\'accusé se défend, puis le village vote : coupable ou innocent.' },
  { name: 'Sentence', emoji: '🔨',
    description: 'Si coupable : élimination, rôle révélé, testament lu. Puis la nuit retombe.' },
];
