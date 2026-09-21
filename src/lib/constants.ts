export const MLBB_RANKS = [
  { id: 'warrior', name: 'Warrior', color: '#8b8b8b', minStars: 0 },
  { id: 'elite', name: 'Elite', color: '#4a9eff', minStars: 100 },
  { id: 'master', name: 'Master', color: '#9b59b6', minStars: 200 },
  { id: 'grandmaster', name: 'Grandmaster', color: '#e74c3c', minStars: 300 },
  { id: 'epic', name: 'Epic', color: '#c0392b', minStars: 400 },
  { id: 'legend', name: 'Legend', color: '#f39c12', minStars: 500 },
  { id: 'mythic', name: 'Mythic', color: '#00d4ff', minStars: 600 },
  { id: 'mythical-glory', name: 'Mythical Glory', color: '#ff6b35', minStars: 800 },
  { id: 'mythical-immortal', name: 'Mythical Immortal', color: '#ff1493', minStars: 1000 },
];

export const MLBB_ROLE_ICONS: Record<string, string> = {
  tank: 'https://akmweb.youngjoygame.com/web/gms/image/60638c59536d9505c9c731af13f7fdfd.png',
  support: 'https://akmweb.youngjoygame.com/web/gms/image/1e4609b25a4cd63ee5a13015d4058159.png',
  fighter: 'https://akmweb.youngjoygame.com/web/gms/image/629e282165d4b63deceaf350426ea440.png',
  assassin: 'https://akmweb.youngjoygame.com/web/gms/image/d0b8b65a47fc43dc7bb2bac447072fd2.png',
  mage: 'https://akmweb.youngjoygame.com/web/gms/image/1c6985dd0caec2028ccb6d1b8ca95e0f.png',
  marksman: 'https://akmweb.youngjoygame.com/web/gms/image/025c69a764924f4bac526a2662f1a0b9.png',
};

export const MLBB_ARROW_LEFT = 'https://akmweb.youngjoygame.com/web/gms/image/b5e4de459ce7ea23df0ae3c69b5e4807.svg';
export const MLBB_ARROW_RIGHT = 'https://akmweb.youngjoygame.com/web/gms/image/34c36941f4ac9bf0fcb1e085ac03e54c.svg';

export const MLBB_ROLES = [
  { id: 'tank', name: 'Tank', icon: '🛡️', color: '#3498db' },
  { id: 'fighter', name: 'Fighter', icon: '⚔️', color: '#e74c3c' },
  { id: 'assassin', name: 'Assassin', icon: '🗡️', color: '#9b59b6' },
  { id: 'mage', name: 'Mage', icon: '🔮', color: '#e67e22' },
  { id: 'marksman', name: 'Marksman', icon: '🏹', color: '#2ecc71' },
  { id: 'support', name: 'Support', icon: '💚', color: '#1abc9c' },
];

export const MLBB_HEROES: Record<string, string[]> = {
  tank: ['Tigreal', 'Akai', 'Franco', 'Minotaur', 'Lolita', 'Gatotkaca', 'Hylos', 'Uranus', 'Belerick', 'Khufra', 'Esmeralda', 'Atlas', 'Barats', 'Gloo', 'Edith'],
  fighter: ['Alucard', 'Balmond', 'Bane', 'Freya', 'Chou', 'Sun', 'Alpha', 'Lapu-Lapu', 'Jawhead', 'Martis', 'Aldous', 'Leomord', 'Thamuz', 'Masha', 'Yu Zhong', 'Paquito', 'Phoveus', 'Aulus', 'Yin', 'Julian', 'Arlott', 'Cici'],
  assassin: ['Saber', 'Karina', 'Fanny', 'Hayabusa', 'Natalia', 'Lancelot', 'Helcurt', 'Gusion', 'Hanzo', 'Ling', 'Benedetta', 'Aamon', 'Joy', 'Nolan'],
  mage: ['Eudora', 'Alice', 'Gord', 'Kagura', 'Cyclops', 'Vexana', 'Aurora', 'Odette', 'Pharsa', 'Lylia', 'Luo Yi', 'Yve', 'Valentina', 'Xavier', 'Novaria', 'Zhuxin'],
  marksman: ['Miya', 'Layla', 'Bruno', 'Clint', 'Yi Sun-shin', 'Moskov', 'Karrie', 'Irithel', 'Lesley', 'Hanabi', 'Claude', 'Kimmy', 'Granger', 'Wanwan', 'Brody', 'Beatrix', 'Melissa', 'Ixia'],
  support: ['Rafaela', 'Estes', 'Diggie', 'Angela', 'Carmilla', 'Mathilda', 'Floryn', 'Faramis'],
};

export const BADGES = [
  { id: 'first-win', name: 'Première Victoire', icon: '🥇', description: 'Gagner votre premier match' },
  { id: 'mvp', name: 'MVP', icon: '⭐', description: "Être élu MVP d'un match" },
  { id: 'team-leader', name: "Chef d'Équipe", icon: '👑', description: 'Créer une équipe' },
  { id: 'forum-active', name: 'Forum Actif', icon: '💬', description: 'Publier 10 posts' },
  { id: 'tournament-winner', name: 'Vainqueur de Tournoi', icon: '🏆', description: 'Gagner un tournoi' },
  { id: 'veteran', name: 'Vétéran', icon: '🎖️', description: 'Membre depuis 1 an' },
  { id: 'streak-5', name: 'Série de 5', icon: '🔥', description: '5 victoires consécutives' },
  { id: 'streak-10', name: 'Série de 10', icon: '💥', description: '10 victoires consécutives' },
  { id: 'all-roles', name: 'Polyvalent', icon: '🎭', description: 'Jouer tous les rôles' },
  { id: 'social-butterfly', name: 'Papillon Social', icon: '🦋', description: 'Rejoindre 5 équipes' },
];

export const COUNTRIES = ['Togo', 'Bénin', 'Ghana', 'Nigeria', "Côte d'Ivoire", 'France', 'Autre'];

export const TOURNAMENT_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const MATCH_RESULT = {
  WIN: 'win',
  LOSS: 'loss',
  DRAW: 'draw',
};

export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
};

export const NAV_ITEMS = [
  { path: '/', label: 'Accueil', icon: 'Home' },
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/players', label: 'Joueurs', icon: 'Users' },
  { path: '/teams', label: 'Équipes', icon: 'Shield' },
  { path: '/forum', label: 'Forum', icon: 'MessageSquare' },
  { path: '/tournaments', label: 'Tournois', icon: 'Trophy' },
  { path: '/events', label: 'Événements', icon: 'Calendar' },
  { path: '/matches', label: 'Matchs', icon: 'Swords' },
  { path: '/heroes', label: 'Héros', icon: 'Sparkles' },
];

export const FORM_FIELD_TYPES = [
  { id: 'text', label: 'Texte', icon: 'Type' },
  { id: 'email', label: 'Email', icon: 'Mail' },
  { id: 'number', label: 'Nombre', icon: 'Hash' },
  { id: 'select', label: 'Liste déroulante', icon: 'ChevronDown' },
  { id: 'checkbox', label: 'Case à cocher', icon: 'CheckSquare' },
  { id: 'radio', label: 'Bouton radio', icon: 'Circle' },
  { id: 'textarea', label: 'Zone de texte', icon: 'AlignLeft' },
  { id: 'file', label: 'Fichier', icon: 'Upload' },
  { id: 'date', label: 'Date', icon: 'Calendar' },
];
