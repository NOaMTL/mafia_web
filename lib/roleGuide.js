const role = (key, name, team, emoji, color, description, nightAction = null, tip = '') =>
  ({ key, name, team, emoji, color, description, nightAction, tip });

// Noms canoniques du mod SC2 Mafia, avec libellés français pour l’interface.
export const ROLE_GUIDE = [
  role('CITIZEN', 'Citoyen', 'TOWN', '🏘️', '#8d8d8d', 'Rôle gouvernemental sans pouvoir nocturne. La discussion et le vote sont vos armes.', null, 'Observe les votes et conserve un testament clair.'),
  role('SHERIFF', 'Shérif', 'TOWN', '⭐', '#42a86b', 'Interroge une cible et apprend si elle paraît suspecte.', 'Vérifier si un joueur est suspect.', 'Le Parrain peut paraître innocent.'),
  role('INVESTIGATOR', 'Enquêteur', 'TOWN', '🔎', '#38a777', 'Examine une cible et découvre les crimes qui lui sont associés.', 'Rechercher les crimes d’un joueur.', 'Recoupe les crimes avec les visites et les témoignages.'),
  role('DETECTIVE', 'Détective', 'TOWN', '👣', '#4c91bd', 'Suit une cible et découvre qui elle a visité pendant la nuit.', 'Suivre la destination nocturne d’un joueur.', 'Une visite chez la victime peut devenir une preuve capitale.'),
  role('LOOKOUT', 'Guetteur', 'TOWN', '👁️', '#497ca5', 'Surveille une cible et découvre tous ses visiteurs.', 'Observer les visiteurs d’un joueur.', 'Surveille les rôles publics ou menacés.'),
  role('DOCTOR', 'Médecin', 'TOWN', '⚕️', '#219253', 'Protège une cible contre une attaque nocturne.', 'Soigner un joueur.', 'Anticipe la cible de la Mafia.'),
  role('BODYGUARD', 'Garde du corps', 'TOWN', '🛡️', '#3f9365', 'Intercepte l’attaque visant la personne protégée.', 'Garder un joueur au péril de sa vie.', 'Protège les rôles confirmés.'),
  role('ESCORT', 'Escorte', 'TOWN', '💃', '#d84a80', 'Bloque l’action nocturne d’une cible.', 'Distraire et bloquer un joueur.', 'Une nuit calme après ton blocage est un indice.'),
  role('BUS_DRIVER', 'Chauffeur de bus', 'TOWN', '🚌', '#4a9aa0', 'Échange les destinations de deux joueurs et redirige les actions.', 'Permuter deux joueurs.', 'Une permutation peut sauver ou condamner.'),
  role('VETERAN', 'Vétéran', 'TOWN', '🎖️', '#ba7b36', 'En alerte, abat tous les visiteurs de sa maison.', 'Déclencher une alerte limitée.', 'N’annonce pas une alerte au mauvais moment.'),
  role('VIGILANTE', 'Vigilante', 'TOWN', '🔫', '#cd7a1e', 'Dispose de tirs nocturnes limités pour éliminer un suspect.', 'Tirer sur un joueur.', 'Ne tire que sur une piste solide.'),
  role('MAYOR', 'Maire', 'TOWN', '🏛️', '#cf9f43', 'Peut révéler sa fonction afin de renforcer fortement son vote.', null, 'Révèle-toi lorsque ton influence change réellement le verdict.'),
  role('SPY', 'Espion', 'TOWN', '📡', '#4194a5', 'Intercepte des informations sur les actions de la Mafia.', null, 'Ne révèle pas trop vite ce que tu sais.'),

  role('GODFATHER', 'Parrain', 'MAFIA', '🎩', '#9c53c4', 'Chef de la Mafia : dirige le meurtre et peut paraître innocent au Shérif.', 'Choisir la victime de la famille.', 'Utilise ton faux résultat innocent pour gagner la confiance.'),
  role('MAFIOSO', 'Mafioso', 'MAFIA', '🔪', '#d84b3c', 'Exécute le meurtre de la Mafia lorsque la famille a choisi sa cible.', 'Participer au meurtre commun.', 'Coordonne-toi dans le canal Mafia.'),
  role('CONSIGLIERE', 'Consigliere', 'MAFIA', '🕵️', '#d84b3c', 'Enquêteur de la Mafia, capable de découvrir le rôle exact d’une cible.', 'Découvrir le rôle exact d’un joueur.', 'Trouve les rôles protecteurs et investigateurs.'),
  role('CONSORT', 'Consort', 'MAFIA', '🥀', '#b43f65', 'Version mafieuse de l’Escorte, bloque une action nocturne.', 'Bloquer l’action d’un joueur.', 'Neutralise les protecteurs avant le meurtre.'),
  role('BLACKMAILER', 'Maître chanteur', 'MAFIA', '🤐', '#bd3d35', 'Empêche une cible de parler pendant la journée suivante.', 'Faire chanter un joueur.', 'Fais taire les meneurs au moment critique.'),
  role('JANITOR', 'Janitor', 'MAFIA', '🧹', '#9d2925', 'Nettoie une victime et cache son rôle ainsi que son testament.', 'Nettoyer la cible du meurtre.', 'Coordonne toujours ton choix avec la famille.'),
  role('FRAMER', 'Framer', 'MAFIA', '🖋️', '#c35b35', 'Fabrique de fausses preuves pour rendre une cible suspecte.', 'Piéger un joueur pour les investigations.', 'Cadre un joueur crédible pour créer un faux coupable.'),
];

export const PHASE_GUIDE = [
  { name: 'Révélation des rôles', emoji: '🎭', description: 'Chaque joueur découvre secrètement son rôle. La Mafia reconnaît ses membres.' },
  { name: 'Nuit', emoji: '🌙', description: 'Les rôles à pouvoir choisissent leurs actions et leurs visites.' },
  { name: 'Gazette du matin', emoji: '📰', description: 'La ville découvre les morts, les rôles visibles et les testaments.' },
  { name: 'Discussion', emoji: '💬', description: 'Accusations, défenses, revendications de rôle et analyse des informations.' },
  { name: 'Vote', emoji: '🗳️', description: 'La ville désigne un suspect à envoyer au procès.' },
  { name: 'Procès & Jugement', emoji: '⚖️', description: 'L’accusé se défend avant le verdict coupable ou innocent.' },
  { name: 'Sentence', emoji: '🔨', description: 'Le verdict est exécuté puis la nuit suivante commence.' },
];

export const ROLE_DISTRIBUTIONS = {
  4: ['MAFIOSO', 'SHERIFF', 'DOCTOR', 'CITIZEN'],
  5: ['MAFIOSO', 'SHERIFF', 'DOCTOR', 'ESCORT', 'CITIZEN'],
  6: ['GODFATHER', 'MAFIOSO', 'SHERIFF', 'DOCTOR', 'ESCORT', 'CITIZEN'],
  7: ['GODFATHER', 'MAFIOSO', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'MAYOR', 'CITIZEN'],
  8: ['GODFATHER', 'JANITOR', 'SHERIFF', 'DOCTOR', 'ESCORT', 'LOOKOUT', 'CITIZEN', 'CITIZEN'],
  9: ['GODFATHER', 'MAFIOSO', 'FRAMER', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'BODYGUARD', 'CITIZEN', 'CITIZEN'],
  10: ['GODFATHER', 'BLACKMAILER', 'CONSIGLIERE', 'SHERIFF', 'DOCTOR', 'ESCORT', 'LOOKOUT', 'MAYOR', 'CITIZEN', 'CITIZEN'],
  11: ['GODFATHER', 'MAFIOSO', 'JANITOR', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'BODYGUARD', 'INVESTIGATOR', 'CITIZEN', 'CITIZEN'],
  12: ['GODFATHER', 'MAFIOSO', 'FRAMER', 'CONSORT', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'ESCORT', 'MAYOR', 'CITIZEN', 'CITIZEN'],
  13: ['GODFATHER', 'MAFIOSO', 'BLACKMAILER', 'JANITOR', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'BODYGUARD', 'INVESTIGATOR', 'VIGILANTE', 'CITIZEN', 'CITIZEN'],
  14: ['GODFATHER', 'MAFIOSO', 'FRAMER', 'CONSIGLIERE', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'BODYGUARD', 'ESCORT', 'MAYOR', 'INVESTIGATOR', 'CITIZEN', 'CITIZEN'],
  15: ['GODFATHER', 'MAFIOSO', 'BLACKMAILER', 'CONSORT', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'BODYGUARD', 'ESCORT', 'MAYOR', 'INVESTIGATOR', 'VIGILANTE', 'CITIZEN', 'CITIZEN'],
};
