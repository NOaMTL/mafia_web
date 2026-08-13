# Mafia — Client Web

Client web Next.js avec chat en jeu (3 canaux : jour, mafia, morts).
Le mobile Flutter reste sans chat ; ce client est la version « jeu en ligne ».

## Démarrage

```bash
cd webapp
npm install
npm run dev        # → http://localhost:3001
```

Par défaut le client pointe sur le backend Railway. Pour du dev local :

```bash
cp .env.local.example .env.local
# puis éditer NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Architecture

- `lib/api.js` — client REST (auth, lobby, profil, avatars, stats, succès) + session localStorage
- `lib/socket.js` — singleton Socket.IO authentifié (namespace /game)
- `lib/roleGuide.js` — données du guide (rôles + phases)
- `app/page.js` — connexion / inscription
- `app/lobby/page.js` — créer / rejoindre par code
- `app/lobby/[id]/page.js` — salle d'attente (prêt, bots)
- `app/game/[id]/page.js` — écran de jeu piloté par les phases :
  révélation du rôle, actions de nuit + confirmation, gazette, enquêtes,
  procès, jugement en direct, sentence + testament, récompenses de fin
- `app/profile/page.js` — stats, succès, historique (onglets)
- `app/shop/page.js` — avatars : achat aux diamants + équipement
- `app/guide/page.js` — guide des rôles et déroulé d'une partie
- `components/Chat.js` — chat 3 canaux (le serveur décide du canal)
- `components/GamePanel.js` — Dossier de partie (drawer) : joueurs+notes,
  testament, journal des événements, guide des rôles
- `components/NavHeader.js` — navigation commune des pages méta

## Règles du chat (résolues côté serveur)

| Situation                    | Canal   | Qui reçoit           |
|------------------------------|---------|----------------------|
| Vivant, phase de jour        | `day`   | tout le monde        |
| Mafia vivant, nuit           | `mafia` | mafiosi vivants      |
| Mort                         | `dead`  | les morts uniquement |
| Vivant non-mafia, nuit       | —       | silencieux           |
