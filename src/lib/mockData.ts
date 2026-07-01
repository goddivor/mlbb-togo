
export const mockPlayers = [
  {
    id: '1', username: 'TogoKing', email: 'togoking@mlbb.tg', avatar: null,
    rank: 'mythic', role: 'assassin', favoriteHeroes: ['Gusion', 'Ling', 'Fanny'],
    wins: 1250, losses: 380, winRate: 76.7, mvpCount: 89, streak: 7,
    country: 'Togo', city: 'Lomé', bio: 'Meilleur assassin du Togo 🇹🇬 | Mythic 800+',
    badges: ['mvp', 'streak-5', 'tournament-winner'], joinedAt: '2023-01-15',
    lastActive: '2024-03-28', isOnline: true, teamId: 't1', role_user: 'admin',
  },
  {
    id: '2', username: 'MLBBQueens_TG', email: 'queens@mlbb.tg', avatar: null,
    rank: 'mythical-glory', role: 'mage', favoriteHeroes: ['Kagura', 'Lunox', 'Pharsa'],
    wins: 980, losses: 290, winRate: 77.2, mvpCount: 112, streak: 12,
    country: 'Togo', city: 'Lomé', bio: 'Pro mage player | Kagura main 🏆',
    badges: ['mvp', 'tournament-winner', 'streak-10'], joinedAt: '2022-08-20',
    lastActive: '2024-03-29', isOnline: true, teamId: 't2', role_user: 'moderator',
  },
  {
    id: '3', username: 'ShadowBlade_TG', email: 'shadow@mlbb.tg', avatar: null,
    rank: 'legend', role: 'assassin', favoriteHeroes: ['Hayabusa', 'Lancelot', 'Benedetta'],
    wins: 670, losses: 310, winRate: 68.4, mvpCount: 45, streak: 3,
    country: 'Togo', city: 'Kara', bio: 'Hayabusa one-trick 🔥',
    badges: ['first-win', 'team-leader'], joinedAt: '2023-06-10',
    lastActive: '2024-03-27', isOnline: false, teamId: 't1', role_user: 'user',
  },
  {
    id: '4', username: 'TankMaster_TG', email: 'tank@mlbb.tg', avatar: null,
    rank: 'mythic', role: 'tank', favoriteHeroes: ['Khufra', 'Atlas', 'Tigreal'],
    wins: 890, losses: 420, winRate: 67.9, mvpCount: 34, streak: 4,
    country: 'Togo', city: 'Sokodé', bio: 'Main tank 🛡️',
    badges: ['first-win', 'veteran'], joinedAt: '2022-03-01',
    lastActive: '2024-03-29', isOnline: true, teamId: 't3', role_user: 'user',
  },
  {
    id: '5', username: 'GoldLane_King', email: 'goldlane@mlbb.tg', avatar: null,
    rank: 'epic', role: 'marksman', favoriteHeroes: ['Granger', 'Claude', 'Beatrix'],
    wins: 450, losses: 280, winRate: 61.6, mvpCount: 28, streak: 2,
    country: 'Togo', city: 'Lomé', bio: 'Marksman main 🏹',
    badges: ['first-win'], joinedAt: '2023-11-05',
    lastActive: '2024-03-26', isOnline: false, teamId: null, role_user: 'user',
  },
  {
    id: '6', username: 'SupportGod_TG', email: 'support@mlbb.tg', avatar: null,
    rank: 'mythical-glory', role: 'support', favoriteHeroes: ['Angela', 'Rafaela', 'Floryn'],
    wins: 1100, losses: 350, winRate: 75.9, mvpCount: 67, streak: 9,
    country: 'Togo', city: 'Lomé', bio: 'Support main 💚',
    badges: ['mvp', 'streak-5', 'veteran', 'social-butterfly'], joinedAt: '2022-01-10',
    lastActive: '2024-03-29', isOnline: true, teamId: 't2', role_user: 'user',
  },
  {
    id: '7', username: 'FighterBeast', email: 'fighter@mlbb.tg', avatar: null,
    rank: 'grandmaster', role: 'fighter', favoriteHeroes: ['Yu Zhong', 'Paquito', 'Thamuz'],
    wins: 320, losses: 210, winRate: 60.4, mvpCount: 15, streak: 1,
    country: 'Togo', city: 'Atakpamé', bio: 'Fighter main ⚔️',
    badges: ['first-win'], joinedAt: '2024-01-15',
    lastActive: '2024-03-25', isOnline: false, teamId: null, role_user: 'user',
  },
  {
    id: '8', username: 'MageProdige', email: 'mage@mlbb.tg', avatar: null,
    rank: 'legend', role: 'mage', favoriteHeroes: ['Xavier', 'Valentina', 'Yve'],
    wins: 580, losses: 290, winRate: 66.7, mvpCount: 52, streak: 5,
    country: 'Togo', city: 'Lomé', bio: 'Xavier & Valentina main 🔮',
    badges: ['mvp', 'streak-5'], joinedAt: '2023-04-20',
    lastActive: '2024-03-28', isOnline: true, teamId: 't3', role_user: 'user',
  },
];

export const mockTeams = [
  {
    id: 't1', name: 'Thunder Titans TG', tag: 'TTT', logo: null,
    description: 'Équipe compétitive togolaise', captainId: '1', members: ['1', '3'],
    maxMembers: 7, wins: 45, losses: 12, winRate: 78.9, rank: 1,
    foundedAt: '2023-02-01', region: 'Togo',
    achievements: ['Champion Togo 2024 Q1', 'Top 8 West Africa Cup'],
    isRecruiting: true, lookingFor: ['tank', 'support'],
  },
  {
    id: 't2', name: 'Phoenix Rising TG', tag: 'PRT', logo: null,
    description: 'Rising from the ashes', captainId: '2', members: ['2', '6'],
    maxMembers: 7, wins: 52, losses: 8, winRate: 86.7, rank: 2,
    foundedAt: '2022-09-15', region: 'Togo',
    achievements: ['Vice-Champion Togo 2024'],
    isRecruiting: false, lookingFor: [],
  },
  {
    id: 't3', name: 'Dragon Warriors', tag: 'DW', logo: null,
    description: 'Force et honneur', captainId: '4', members: ['4', '8'],
    maxMembers: 7, wins: 28, losses: 15, winRate: 65.1, rank: 5,
    foundedAt: '2023-08-01', region: 'Togo',
    achievements: ['Top 16 National Championship'],
    isRecruiting: true, lookingFor: ['marksman', 'assassin'],
  },
];

export const mockPosts = [
  {
    id: 'p1', authorId: '1', authorName: 'TogoKing', authorRank: 'mythic',
    category: 'strategies', title: 'Guide: Comment counter les assassins en ranked',
    content: 'Les assassins dominent le meta actuel. Voici mes conseils...',
    likes: 45, views: 234, isPinned: true, createdAt: '2024-03-27T08:00:00Z',
    comments: [
      { id: 'c1', authorId: '3', authorName: 'ShadowBlade_TG', content: 'Super guide!', createdAt: '2024-03-27T10:30:00Z' },
      { id: 'c2', authorId: '4', authorName: 'TankMaster_TG', content: 'Le placement est crucial.', createdAt: '2024-03-27T11:15:00Z' },
    ],
  },
  {
    id: 'p2', authorId: '2', authorName: 'MLBBQueens_TG', authorRank: 'mythical-glory',
    category: 'recruitment', title: '📢 Phoenix Rising recrute un tank!',
    content: 'Recherche tank Mythic+ pour notre roster.',
    likes: 23, views: 156, isPinned: false, createdAt: '2024-03-26T14:00:00Z',
    comments: [
      { id: 'c3', authorId: '4', authorName: 'TankMaster_TG', content: 'Intéressé!', createdAt: '2024-03-26T15:00:00Z' },
    ],
  },
  {
    id: 'p3', authorId: '6', authorName: 'SupportGod_TG', authorRank: 'mythical-glory',
    category: 'guides', title: '📖 Guide Angela: Positionnement',
    content: "Angela est l'un des supports les plus forts du meta...",
    likes: 67, views: 312, isPinned: false, createdAt: '2024-03-25T09:00:00Z',
    comments: [],
  },
  {
    id: 'p4', authorId: '8', authorName: 'MageProdige', authorRank: 'legend',
    category: 'tournaments', title: '🏆 Lomé Championship - Inscriptions ouvertes!',
    content: 'Le plus grand tournoi MLBB du Togo! 500 000 FCFA de prize pool.',
    likes: 89, views: 567, isPinned: true, createdAt: '2024-03-24T12:00:00Z',
    comments: [
      { id: 'c4', authorId: '1', authorName: 'TogoKing', content: 'Thunder Titans sera là!', createdAt: '2024-03-24T16:00:00Z' },
    ],
  },
];

export const mockTournaments = [
  {
    id: 'tour1', name: 'Lomé Championship 2024',
    description: 'Le plus grand tournoi MLBB du Togo avec 500 000 FCFA',
    organizer: 'MLBB Togo Community', status: 'upcoming',
    startDate: '2024-04-15', endDate: '2024-04-20',
    prizePool: '500 000 FCFA', maxTeams: 16,
    registeredTeams: ['t1', 't2', 't3'], format: 'Double Elimination',
    rules: 'Standard MLBB tournament rules', banner: null, brackets: [],
    streamUrl: 'https://twitch.tv/mlbbtogo',
  },
  {
    id: 'tour2', name: 'Weekly Scrim Cup',
    description: 'Scrimmage hebdomadaire',
    organizer: 'Thunder Titans', status: 'ongoing',
    startDate: '2024-03-25', endDate: '2024-03-31',
    prizePool: '50 000 FCFA', maxTeams: 8,
    registeredTeams: ['t1', 't3'], format: 'Round Robin',
    rules: 'Bo3 format', banner: null, brackets: [], streamUrl: null,
  },
  {
    id: 'tour3', name: 'West Africa MLBB Cup',
    description: 'Tournoi régional ouest-africain',
    organizer: 'Moonton Africa', status: 'upcoming',
    startDate: '2024-05-01', endDate: '2024-05-10',
    prizePool: '2 000 000 FCFA', maxTeams: 32,
    registeredTeams: ['t1', 't2'], format: 'Group Stage + Knockout',
    rules: 'International rules', banner: null, brackets: [],
    streamUrl: 'https://youtube.com/mlbbafrica',
  },
];

export const mockEvents = [
  {
    id: 'e1', title: 'Scrim: Thunder Titans vs Phoenix Rising', type: 'scrim',
    description: "Match d'entraînement", date: '2024-03-30', time: '20:00',
    duration: '2h', participants: ['t1', 't2'], organizer: 'MLBB Togo', isPublic: true,
  },
  {
    id: 'e2', title: 'Session de coaching', type: 'coaching',
    description: 'Session gratuite avec Mythical Glory', date: '2024-04-02', time: '18:00',
    duration: '1h30', participants: [], organizer: 'SupportGod_TG', isPublic: true,
  },
  {
    id: 'e3', title: 'Lomé Championship - Groupes', type: 'tournament',
    description: 'Phase de groupes', date: '2024-04-15', time: '14:00',
    duration: '6h', participants: [], organizer: 'MLBB Togo Community', isPublic: true,
  },
];

export const mockMatches = [
  {
    id: 'm1', team1: { id: 't1', name: 'Thunder Titans TG', score: 2 },
    team2: { id: 't3', name: 'Dragon Warriors', score: 1 },
    tournament: 'Weekly Scrim Cup', date: '2024-03-28', status: 'completed',
    mvp: 'TogoKing', duration: '22:15', format: 'Bo3',
    games: [
      { number: 1, winner: 't1', duration: '18:30', mvp: 'TogoKing' },
      { number: 2, winner: 't3', duration: '21:45', mvp: 'MageProdige' },
      { number: 3, winner: 't1', duration: '19:20', mvp: 'ShadowBlade_TG' },
    ],
  },
  {
    id: 'm2', team1: { id: 't2', name: 'Phoenix Rising TG', score: 2 },
    team2: { id: 't1', name: 'Thunder Titans TG', score: 0 },
    tournament: 'Weekly Scrim Cup', date: '2024-03-27', status: 'completed',
    mvp: 'MLBBQueens_TG', duration: '35:00', format: 'Bo3',
    games: [
      { number: 1, winner: 't2', duration: '16:45', mvp: 'MLBBQueens_TG' },
      { number: 2, winner: 't2', duration: '18:15', mvp: 'SupportGod_TG' },
    ],
  },
  {
    id: 'm3', team1: { id: 't2', name: 'Phoenix Rising TG', score: 0 },
    team2: { id: 't3', name: 'Dragon Warriors', score: 0 },
    tournament: 'Lomé Championship 2024', date: '2024-04-15', status: 'upcoming',
    mvp: null, duration: null, format: 'Bo3', games: [],
  },
];

export const mockNotifications = [
  { id: 'n1', type: 'match', title: 'Match à venir', message: 'Votre match commence dans 30 min!', read: false, createdAt: '2024-03-30T19:30:00Z', link: '/matches' },
  { id: 'n2', type: 'team', title: "Invitation d'équipe", message: 'Dragon Warriors vous invite!', read: false, createdAt: '2024-03-29T14:00:00Z', link: '/teams' },
  { id: 'n3', type: 'forum', title: 'Nouveau commentaire', message: 'TankMaster a commenté votre post', read: true, createdAt: '2024-03-27T11:15:00Z', link: '/forum' },
  { id: 'n4', type: 'tournament', title: 'Inscription confirmée', message: 'Inscription au Lomé Championship confirmée!', read: true, createdAt: '2024-03-25T10:00:00Z', link: '/tournaments' },
];

export const mockAdminLogs = [
  { id: 'log_1', action: 'user_ban', admin: 'TogoKing', target: 'FighterBeast', details: 'Compte suspendu pour comportement toxique', timestamp: '2024-03-29T10:00:00Z' },
  { id: 'log_2', action: 'tournament_create', admin: 'TogoKing', target: 'Lomé Championship 2024', details: 'Création du tournoi', timestamp: '2024-03-28T14:30:00Z' },
  { id: 'log_3', action: 'post_delete', admin: 'MLBBQueens_TG', target: 'Post #p5', details: 'Suppression pour spam', timestamp: '2024-03-27T09:15:00Z' },
  { id: 'log_4', action: 'user_promote', admin: 'TogoKing', target: 'MLBBQueens_TG', details: 'Promu modérateur', timestamp: '2024-03-26T16:00:00Z' },
  { id: 'log_5', action: 'team_edit', admin: 'TogoKing', target: 'Thunder Titans TG', details: 'Mise à jour des informations', timestamp: '2024-03-25T11:00:00Z' },
];

export const mockFormTemplates = [
  {
    id: 'form_1', name: 'Inscription Tournoi Lomé', description: "Formulaire d'inscription pour le Lomé Championship",
    fields: [
      { id: 'f1', type: 'text', label: "Nom de l'équipe", required: true, placeholder: 'Ex: Thunder Titans' },
      { id: 'f2', type: 'text', label: 'Nom du capitaine', required: true, placeholder: 'Nom complet' },
      { id: 'f3', type: 'email', label: 'Email du capitaine', required: true, placeholder: 'email@example.com' },
      { id: 'f4', type: 'number', label: 'Nombre de joueurs', required: true, placeholder: '5-7' },
      { id: 'f5', type: 'select', label: "Rang moyen de l'équipe", required: true, options: ['Epic', 'Legend', 'Mythic', 'Mythical Glory', 'Mythical Immortal'] },
      { id: 'f6', type: 'textarea', label: "Message pour l'organisateur", required: false, placeholder: 'Optionnel' },
    ],
    createdAt: '2024-03-20T10:00:00Z', status: 'active', responses: 12,
  },
  {
    id: 'form_2', name: 'Recrutement Équipe', description: 'Formulaire pour rejoindre une équipe',
    fields: [
      { id: 'f1', type: 'text', label: 'Pseudo MLBB', required: true, placeholder: 'Votre pseudo' },
      { id: 'f2', type: 'text', label: 'ID MLBB', required: true, placeholder: 'Ex: 123456789' },
      { id: 'f3', type: 'select', label: 'Rang actuel', required: true, options: ['Epic', 'Legend', 'Mythic', 'Mythical Glory'] },
      { id: 'f4', type: 'select', label: 'Rôle principal', required: true, options: ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'] },
      { id: 'f5', type: 'checkbox', label: 'Disponible pour les scrims', required: false },
      { id: 'f6', type: 'file', label: 'Screenshot profil MLBB', required: false },
    ],
    createdAt: '2024-03-18T14:00:00Z', status: 'active', responses: 8,
  },
];

export const mockFormResponses = [
  { id: 'resp_1', formId: 'form_1', data: { "Nom de l'équipe": 'Dragon Warriors', 'Nom du capitaine': 'TankMaster', 'Email du capitaine': 'tank@mlbb.tg', 'Nombre de joueurs': 6, "Rang moyen de l'équipe": 'Mythic' }, submittedAt: '2024-03-25T10:00:00Z' },
  { id: 'resp_2', formId: 'form_1', data: { "Nom de l'équipe": 'Storm Breakers', 'Nom du capitaine': 'StormPlayer', 'Email du capitaine': 'storm@mlbb.tg', 'Nombre de joueurs': 5, "Rang moyen de l'équipe": 'Legend' }, submittedAt: '2024-03-24T14:30:00Z' },
  { id: 'resp_3', formId: 'form_2', data: { 'Pseudo MLBB': 'NewPlayer123', 'ID MLBB': '987654321', 'Rang actuel': 'Epic', 'Rôle principal': 'Mage' }, submittedAt: '2024-03-23T09:00:00Z' },
];
