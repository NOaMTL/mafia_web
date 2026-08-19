const role = (key, name, team, emoji, color, description, nightAction = null, tip = '') =>
  ({
    key,
    name,
    team,
    emoji,
    image: `/roles/${key.toLowerCase().replaceAll('_', '-')}.jpg`,
    color,
    description,
    nightAction,
    tip,
  });

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
  role('MEDIUM', 'Médium', 'TOWN', '🔮', '#9270c7', 'Entre en séance avec les morts pendant la nuit et transmet leurs indices.', null, 'Les morts peuvent savoir beaucoup de choses, mais ils peuvent aussi mentir.'),

  role('GODFATHER', 'Parrain', 'MAFIA', '🎩', '#9c53c4', 'Chef de la Mafia : dirige le meurtre et peut paraître innocent au Shérif.', 'Choisir la victime de la famille.', 'Utilise ton faux résultat innocent pour gagner la confiance.'),
  role('MAFIOSO', 'Mafioso', 'MAFIA', '🔪', '#d84b3c', 'Exécute le meurtre de la Mafia lorsque la famille a choisi sa cible.', 'Participer au meurtre commun.', 'Coordonne-toi dans le canal Mafia.'),
  role('CONSIGLIERE', 'Consigliere', 'MAFIA', '🕵️', '#d84b3c', 'Enquêteur de la Mafia, capable de découvrir le rôle exact d’une cible.', 'Découvrir le rôle exact d’un joueur.', 'Trouve les rôles protecteurs et investigateurs.'),
  role('CONSORT', 'Consort', 'MAFIA', '🥀', '#b43f65', 'Version mafieuse de l’Escorte, bloque une action nocturne.', 'Bloquer l’action d’un joueur.', 'Neutralise les protecteurs avant le meurtre.'),
  role('BLACKMAILER', 'Maître chanteur', 'MAFIA', '🤐', '#bd3d35', 'Empêche une cible de parler pendant la journée suivante.', 'Faire chanter un joueur.', 'Fais taire les meneurs au moment critique.'),
  role('JANITOR', 'Janitor', 'MAFIA', '🧹', '#9d2925', 'Nettoie une victime et cache son rôle ainsi que son testament.', 'Nettoyer la cible du meurtre.', 'Coordonne toujours ton choix avec la famille.'),
  role('FRAMER', 'Framer', 'MAFIA', '🖋️', '#c35b35', 'Fabrique de fausses preuves pour rendre une cible suspecte.', 'Piéger un joueur pour les investigations.', 'Cadre un joueur crédible pour créer un faux coupable.'),
];

export const PHASE_GUIDE = [
  { name: 'Révélation des rôles', emoji: '🎭', tone: 'night',
    description: 'Chaque joueur découvre secrètement son rôle. La Mafia reconnaît ses membres et dispose de son canal privé.',
    tip: 'Mémorisez votre rôle et préparez votre couverture : que direz-vous si l’on vous accuse ?' },
  { name: 'Nuit', emoji: '🌙', tone: 'night',
    description: 'Les rôles à pouvoir choisissent leurs actions : meurtres, protections, enquêtes, blocages, permutations. Tout se résout simultanément, par vagues de priorité (blocages → manipulations → permutations → protections → meurtres → enquêtes).',
    tip: 'Mettez votre testament à jour AVANT la fin de la nuit — c’est votre voix d’outre-tombe.' },
  { name: 'Gazette du matin', emoji: '📰', tone: 'day',
    description: 'La ville découvre les morts de la nuit, leurs rôles révélés et leurs testaments — sauf si le Janitor a nettoyé le corps.',
    tip: 'Lisez chaque testament : un Shérif mort peut encore faire pendre un mafieux.' },
  { name: 'Discussion', emoji: '💬', tone: 'day',
    description: 'Accusations, défenses, revendications de rôle, annonces de résultats d’enquête. C’est ici que la partie se gagne : la Mafia sème le doute, la ville recoupe.',
    tip: 'Notez qui accuse qui : les schémas de vote et de parole trahissent les alliances.' },
  { name: 'Vote', emoji: '🗳️', tone: 'day',
    description: 'La ville désigne un suspect à envoyer au procès. Les votes sont publics et nominatifs. En cas d’égalité, personne n’est jugé. Le vote d’un Maire révélé compte double.',
    tip: 'Un vote est une information : suivre aveuglément la foule fait le jeu de la Mafia.' },
  { name: 'Procès & Jugement', emoji: '⚖️', tone: 'day',
    description: 'L’accusé plaide sa cause, puis chacun vote COUPABLE, INNOCENT ou s’abstient. Un accusé qui revendique un rôle invérifiable est un classique — vrai comme faux.',
    tip: 'Si vous avez envoyé quelqu’un au procès, assumez votre verdict — les revirements se paient.' },
  { name: 'Sentence', emoji: '🔨', tone: 'day',
    description: 'Le condamné est exécuté et son rôle est révélé à tous. La ville apprend immédiatement si elle a pendu un mafieux… ou un innocent. Puis la nuit retombe.',
    tip: 'Après une erreur, cherchez qui a poussé au lynchage : c’est souvent là que se cache la Mafia.' },
];

/** Conditions de fin de partie (fidèles au moteur). */
export const WIN_CONDITIONS = [
  { team: 'TOWN',  emoji: '✦', title: 'VICTOIRE DE LA VILLE',
    text: 'Tous les membres de la Mafia sont morts. Chaque innocent encore en vie ou vengé partage la victoire.' },
  { team: 'MAFIA', emoji: '◆', title: 'VICTOIRE DE LA MAFIA',
    text: 'La Mafia égale ou dépasse en nombre les innocents survivants : plus rien ne peut arrêter la famille.' },
];

export const ROLE_DISTRIBUTIONS = {
  4: ['MAFIOSO', 'SHERIFF', 'DOCTOR', 'CITIZEN'],
  5: ['MAFIOSO', 'SHERIFF', 'DOCTOR', 'ESCORT', 'CITIZEN'],
  6: ['GODFATHER', 'MAFIOSO', 'SHERIFF', 'DOCTOR', 'ESCORT', 'CITIZEN'],
  7: ['GODFATHER', 'MAFIOSO', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'MAYOR', 'CITIZEN'],
  8: ['GODFATHER', 'JANITOR', 'SHERIFF', 'DOCTOR', 'ESCORT', 'LOOKOUT', 'CITIZEN', 'CITIZEN'],
  9: ['GODFATHER', 'MAFIOSO', 'FRAMER', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'BODYGUARD', 'VETERAN', 'CITIZEN'],
  10: ['GODFATHER', 'BLACKMAILER', 'CONSIGLIERE', 'SHERIFF', 'DOCTOR', 'ESCORT', 'LOOKOUT', 'MAYOR', 'MEDIUM', 'CITIZEN'],
  11: ['GODFATHER', 'MAFIOSO', 'JANITOR', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'BODYGUARD', 'INVESTIGATOR', 'BUS_DRIVER', 'CITIZEN'],
  12: ['GODFATHER', 'MAFIOSO', 'FRAMER', 'CONSORT', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'ESCORT', 'MAYOR', 'MEDIUM', 'CITIZEN'],
  13: ['GODFATHER', 'MAFIOSO', 'BLACKMAILER', 'JANITOR', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'BODYGUARD', 'INVESTIGATOR', 'VIGILANTE', 'SPY', 'CITIZEN'],
  14: ['GODFATHER', 'MAFIOSO', 'FRAMER', 'CONSIGLIERE', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'BODYGUARD', 'ESCORT', 'MAYOR', 'INVESTIGATOR', 'BUS_DRIVER', 'CITIZEN'],
  15: ['GODFATHER', 'MAFIOSO', 'BLACKMAILER', 'CONSORT', 'SHERIFF', 'DOCTOR', 'DETECTIVE', 'LOOKOUT', 'BUS_DRIVER', 'MEDIUM', 'MAYOR', 'INVESTIGATOR', 'VIGILANTE', 'VETERAN', 'SPY'],
};

// ─── Mécaniques détaillées par rôle (fidèles au moteur de jeu) ───────────────
// Affichées quand on clique un rôle dans le guide. Chaque entrée liste ce qui
// peut bloquer, fausser ou contrer l'action, et les interactions notables.
const fact = (icon, title, text) => ({ icon, title, text });
const BLOCKABLE = fact('🚫', 'BLOCAGE', "L'Escorte ou la Consort peuvent bloquer votre action : elle est annulée sans explication. Vous recevez seulement « vous avez été distrait·e cette nuit »." );
const BUSABLE   = fact('🚌', 'PERMUTATION', 'Le Chauffeur de bus peut intervertir votre destination avec celle d’un autre joueur : votre action s’applique alors à la mauvaise personne, sans que vous le sachiez.');
const VET_RISK  = fact('🎖️', 'RISQUE VÉTÉRAN', 'Visiter un Vétéran en alerte est mortel : il abat tous ses visiteurs, quel que soit leur camp.');

export const ROLE_MECHANICS = {
  CITIZEN: [
    fact('🗳️', 'ARMES', 'Aucun pouvoir nocturne : vos armes sont la discussion, le vote et votre testament.'),
    fact('🔎', 'ENQUÊTES', 'Le Shérif vous voit « non suspect » et l’Enquêteur ne vous trouve « aucun crime connu » — sauf si le Framer vous a piégé cette nuit-là.'),
  ],
  SHERIFF: [
    fact('⭐', 'RÉSULTAT', 'Vous apprenez si la cible paraît SUSPECTE (Mafia) ou non.'),
    fact('🎩', 'FAUX NÉGATIF', 'Le PARRAIN paraît toujours innocent à vos yeux. Un « non suspect » ne blanchit donc jamais totalement.'),
    fact('🖋️', 'FAUX POSITIF', 'Un innocent piégé par le FRAMER paraît SUSPECT cette nuit-là. Recoupez avant de faire pendre.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  INVESTIGATOR: [
    fact('🔎', 'RÉSULTAT', 'Vous découvrez les crimes de la cible (meurtre, chantage, intrusion…). « Aucun crime connu » = probablement innocent.'),
    fact('🔫', 'PIÈGE', 'Le VIGILANTE a un casier (« usage d’arme ») : un justicier du village peut passer pour un tueur.'),
    fact('🖋️', 'FAUX POSITIF', 'Une cible piégée par le FRAMER montre « falsification, intrusion » — un faux casier.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  DETECTIVE: [
    fact('👣', 'RÉSULTAT', 'Vous apprenez QUI votre cible a visité cette nuit — la destination réelle, après permutation éventuelle.'),
    fact('💡', 'LECTURE', 'Une visite chez la victime du soir est accablante… mais Médecin et Enquêteurs visitent aussi. Croisez avec la gazette.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  LOOKOUT: [
    fact('👁️', 'RÉSULTAT', 'Vous voyez TOUS les visiteurs de la cible (visites réelles, après permutation) — sauf vous-même : surveiller quelqu’un compte comme une visite, et la cible reçoit une notification de présence à cause de VOUS.'),
    fact('💡', 'LECTURE', 'Surveiller une cible probable de la Mafia (Maire révélé, rôle annoncé) permet d’identifier le tueur.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  DOCTOR: [
    fact('⚕️', 'EFFET', 'Votre protection annule toute attaque subie par la cible cette nuit (Mafia comme Vigilante). Elle ne sauve PAS un visiteur abattu chez un Vétéran en alerte.'),
    fact('❤️', 'AUTO-SOIN', 'Vous pouvez vous soigner vous-même, en nombre limité.'),
    fact('⚖️', 'PRIORITÉ', 'Le soin prime sur le sacrifice du Garde du corps : si les deux protègent la même cible, personne ne meurt.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  BODYGUARD: [
    fact('🛡️', 'EFFET', 'Si votre protégé est attaqué, vous mourez À SA PLACE. La gazette révèle votre sacrifice.'),
    fact('⚖️', 'PRIORITÉ', 'Un Médecin sur la même cible évite votre sacrifice : le soin est vérifié d’abord.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  ESCORT: [
    fact('💃', 'EFFET', 'La cible est bloquée : son action nocturne est annulée. Elle est prévenue anonymement, vous ne recevez AUCUNE confirmation (anti-fuite d’info).'),
    fact('🔪', 'DANGER', 'Bloquer le tueur mafia annule le meurtre… mais la famille saura qu’une Escorte rôde.'),
    BUSABLE, VET_RISK,
  ],
  BUS_DRIVER: [
    fact('🚌', 'EFFET', 'Vous intervertissez les destinations de deux joueurs : toutes les actions visant l’un touchent l’autre (meurtres, soins, enquêtes).'),
    fact('⚠️', 'DOUBLE TRANCHANT', 'Vous pouvez sauver une cible… ou faire tuer un innocent à sa place. L’historique de fin de partie révèle vos permutations.'),
    fact('🎖️', 'LIMITE', 'L’alerte du Vétéran ne se permute pas : elle frappe chez lui, quoi qu’il arrive.'),
    BLOCKABLE,
  ],
  VETERAN: [
    fact('🎖️', 'EFFET', 'En alerte, vous abattez TOUS vos visiteurs — y compris les innocents (Médecin, Enquêteur…). Alertes en nombre limité.'),
    fact('⚔️', 'SIMULTANÉ', 'Un visiteur peut accomplir son action avant de mourir : un tueur peut donc vous tuer en mourant.'),
    fact('🧠', 'INTEL MAFIA', 'Si le Consigliere découvre votre rôle, la famille évitera votre porte. Une annonce publique de Vétéran dissuade aussi.'),
    BLOCKABLE,
  ],
  VIGILANTE: [
    fact('🔫', 'EFFET', 'Tirs nocturnes en nombre limité. Un Médecin peut sauver votre cible.'),
    fact('⚠️', 'RISQUE', 'Tuer un innocent est un cadeau pour la Mafia — et l’Enquêteur voit votre casier « usage d’arme ».'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  MAYOR: [
    fact('🏛️', 'EFFET', 'Une fois révélé, votre vote compte DOUBLE, définitivement. La révélation est publique et irréversible.'),
    fact('🎯', 'CIBLE', 'Un Maire révélé devient la cible prioritaire de la Mafia : assurez-vous qu’un protecteur veille.'),
  ],
  SPY: [
    fact('📡', 'EFFET', 'Chaque nuit, vous apprenez qui la Mafia a visité.'),
    fact('🤫', 'DISCRÉTION', 'Ne révélez pas trop vite : un Espion annoncé est un Espion mort.'),
  ],
  MEDIUM: [
    fact('🔮', 'EFFET', 'La nuit, vous entendez les morts (canal des morts). Ils connaissent parfois leur assassin.'),
    fact('⚠️', 'PRUDENCE', 'Les morts mafieux peuvent mentir. Recoupez avec les testaments et la gazette.'),
  ],
  GODFATHER: [
    fact('🎩', 'IMMUNITÉ D’ENQUÊTE', 'Le Shérif vous voit toujours « non suspect ». Utilisez ce faux résultat pour bâtir votre crédibilité.'),
    fact('🔪', 'ORDRE', 'Votre choix de cible pèse double dans la décision de la famille.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  MAFIOSO: [
    fact('🔪', 'MEURTRE COMMUN', 'La famille ne commet qu’UN meurtre par nuit : la cible majoritaire (le Parrain pèse double).'),
    fact('👑', 'PROMOTION', 'Si tous les tueurs meurent, un mafioso utilitaire est promu Mafioso pour reprendre le couteau.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  CONSIGLIERE: [
    fact('🕵️', 'EFFET', 'Vous découvrez le RÔLE EXACT d’une cible — partagé avec toute la famille (cibles prioritaires, Vétéran à éviter).'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  CONSORT: [
    fact('🥀', 'EFFET', 'Comme l’Escorte : la cible est bloquée, prévenue anonymement, et vous n’avez aucune confirmation.'),
    fact('🎯', 'USAGE', 'Bloquez les protecteurs ou enquêteurs supposés la nuit du meurtre.'),
    BUSABLE, VET_RISK,
  ],
  BLACKMAILER: [
    fact('🤐', 'EFFET', 'La cible ne peut pas parler pendant TOUTE la journée suivante (chat bloqué). Elle peut voter.'),
    fact('🎯', 'USAGE', 'Faites taire un meneur ou un enquêteur prêt à annoncer ses résultats.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  JANITOR: [
    fact('🧹', 'EFFET', 'Si la cible du meurtre est celle que vous nettoyez, son rôle ET son testament sont effacés de la gazette.'),
    fact('🤝', 'COORDINATION', 'Inutile de nettoyer une cible que la famille ne tue pas : synchronisez-vous.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
  FRAMER: [
    fact('🖋️', 'EFFET', 'La cible paraît SUSPECTE au Shérif et montre un faux casier (« falsification, intrusion ») à l’Enquêteur, cette nuit seulement.'),
    fact('🎯', 'USAGE', 'Piégez un joueur déjà soupçonné : une enquête « confirmera » le mensonge et le village fera le travail.'),
    BLOCKABLE, BUSABLE, VET_RISK,
  ],
};
