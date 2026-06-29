import { useLangStore } from '@/store/useStore';

type Dict = Record<string, string>;

export const translations: Record<string, Dict> = {
  fr: {
    // Header
    'header.login': 'Connexion',
    'header.dashboard': 'Tableau de bord',
    'header.logout': 'Déconnexion',
    'header.menu.login': 'Connexion',
    'header.menu.register': 'Créer un compte',
    // Connexion (modal)
    'signin.title': 'CONNEXION',
    'signin.withCode': 'Connexion par code de vérification',
    'signin.gameId': 'ID de jeu',
    'signin.serverId': 'ID du serveur',
    'signin.code': 'Code de vérification',
    'signin.getCode': 'Recevoir le code',
    'signin.hint': 'Le code sera envoyé dans votre courrier en jeu (valable 5 min).',
    'signin.signin': 'Se connecter',
    'signin.or': 'ou',
    'signin.google': 'Continuer avec Google',
    'signin.back': 'Retour',
    'signin.codeSent': 'Code envoyé dans votre courrier en jeu.',
    'signin.success': 'Connexion réussie !',
    'signin.fillIds': "Saisissez votre ID de jeu et votre serveur d'abord.",
    'signin.fillAll': 'Renseignez tous les champs.',
    'signin.googleSoon': 'Connexion Google bientôt disponible.',
    // Navigation par sections
    'nav.home': 'Accueil',
    'nav.features': 'Fonctionnalités',
    'nav.mtl': 'MTL',
    'nav.heroes': 'Héros',
    'nav.partners': 'Partenaires',
    'nav.contact': 'Contact',

    // Hero
    'hero.titlePre': 'La communauté',
    'hero.titlePost': 'du Togo',
    'hero.subtitle':
      'Classements, équipes, tournois, forum et toute la méta des héros. Rejoignez les meilleurs joueurs togolais.',

    // Features
    'features.eyebrow': 'La plateforme',
    'features.titlePre': "Tout l'écosystème",
    'features.subtitle':
      "De la compétition à la communauté, retrouvez tout ce qu'il faut pour progresser, vibrer et briller sur la Land of Dawn.",
    'features.discover': 'Découvrir',
    'feat.tournaments.title': 'Tournois',
    'feat.tournaments.desc':
      'Participez aux compétitions togolaises et remportez des cash prizes en FCFA. Inscriptions, brackets et résultats en direct.',
    'feat.rankings.title': 'Classements',
    'feat.rankings.desc':
      'Grimpez dans le leaderboard de la communauté. Win rate, MVP, séries de victoires : suivez votre progression.',
    'feat.teams.title': 'Équipes',
    'feat.teams.desc':
      'Créez ou rejoignez une équipe, recrutez vos coéquipiers et préparez vos scrims pour dominer la ligue.',
    'feat.forum.title': 'Forum',
    'feat.forum.desc':
      'Partagez vos stratégies, guides et builds. Échangez avec les meilleurs joueurs et restez à jour sur la méta.',
    'feat.matches.title': 'Matchs',
    'feat.matches.desc':
      'Suivez les confrontations, les scores game par game et les MVP de chaque rencontre de la communauté.',
    'feat.events.title': 'Événements',
    'feat.events.desc':
      'Scrims, sessions de coaching, lancements de saison : ne manquez aucun rendez-vous de la scène togolaise.',
    'feat.heroes.title': 'Héros & Méta',
    'feat.heroes.desc':
      'La galerie complète des héros, leurs compétences et le classement méta (win, pick et ban rate) en temps réel.',
    'feat.esport.title': 'E-sport ETERNUM',
    'feat.esport.desc':
      "Découvrez l'organisation ETERNUM, ses sous-équipes et la ligue MTL qui anime l'e-sport au Togo.",

    // Latest heroes
    'latestHeroes': 'Derniers héros',

    // Sponsors
    'sponsors.title': 'Nos partenaires',

    // Contact
    'contact.eyebrow': 'Contact',
    'contact.title': 'Contactez-nous',
    'contact.subtitle':
      'Une question, un partenariat, ou envie de rejoindre la communauté ? Écrivez-nous.',
    'contact.name': 'Votre nom',
    'contact.email': 'Votre email',
    'contact.subject': 'Sujet (optionnel)',
    'contact.message': 'Votre message',
    'contact.send': 'Envoyer',
    'contact.fillError': 'Merci de remplir le nom, un email valide et un message.',
    'contact.sendError': "Échec de l'envoi",
    'contact.success': 'Message envoyé. Merci, nous reviendrons vers vous.',

    // Footer
    'footer.desc':
      "La plateforme communautaire des joueurs Mobile Legends: Bang Bang du Togo. Classements, équipes, tournois, méta des héros et l'e-sport ETERNUM.",
    'footer.col.discover': 'Découvrir',
    'footer.col.community': 'Communauté',
    'footer.col.account': 'Compte',
    'footer.link.home': 'Accueil',
    'footer.link.heroes': 'Héros',
    'footer.link.rankings': 'Classements',
    'footer.link.teams': 'Équipes',
    'footer.link.forum': 'Forum',
    'footer.link.tournaments': 'Tournois',
    'footer.link.events': 'Événements',
    'footer.link.matches': 'Matchs',
    'footer.link.login': 'Connexion',
    'footer.link.register': 'Créer un compte',
    'footer.copyright': 'Communauté non officielle.',
    'footer.moonton': 'Mobile Legends: Bang Bang © Moonton Technology.',
  },

  en: {
    // Header
    'header.login': 'Login',
    'header.dashboard': 'Dashboard',
    'header.logout': 'Log out',
    'header.menu.login': 'Login',
    'header.menu.register': 'Sign up',
    // Sign-in (modal)
    'signin.title': 'SIGN IN',
    'signin.withCode': 'Login with verification code',
    'signin.gameId': 'Game ID',
    'signin.serverId': 'Server ID',
    'signin.code': 'Verification code',
    'signin.getCode': 'Get code',
    'signin.hint': 'The code will be sent to your in-game Mail (valid for 5 mins).',
    'signin.signin': 'Sign in',
    'signin.or': 'or',
    'signin.google': 'Continue with Google',
    'signin.back': 'Back',
    'signin.codeSent': 'Code sent to your in-game Mail.',
    'signin.success': 'Signed in!',
    'signin.fillIds': 'Enter your Game ID and Server first.',
    'signin.fillAll': 'Please fill in all fields.',
    'signin.googleSoon': 'Google sign-in coming soon.',
    // Section navigation
    'nav.home': 'Home',
    'nav.features': 'Features',
    'nav.mtl': 'MTL',
    'nav.heroes': 'Heroes',
    'nav.partners': 'Partners',
    'nav.contact': 'Contact',

    // Hero
    'hero.titlePre': 'The',
    'hero.titlePost': 'community of Togo',
    'hero.subtitle':
      "Rankings, teams, tournaments, forum and the full hero meta. Join Togo's best players.",

    // Features
    'features.eyebrow': 'The platform',
    'features.titlePre': 'The whole',
    'features.subtitle':
      'From competition to community, find everything you need to improve, thrive and shine on the Land of Dawn.',
    'features.discover': 'Discover',
    'feat.tournaments.title': 'Tournaments',
    'feat.tournaments.desc':
      'Join Togolese competitions and win cash prizes in FCFA. Registrations, brackets and live results.',
    'feat.rankings.title': 'Rankings',
    'feat.rankings.desc':
      'Climb the community leaderboard. Win rate, MVP, win streaks: track your progression.',
    'feat.teams.title': 'Teams',
    'feat.teams.desc':
      'Create or join a team, recruit your teammates and prepare your scrims to dominate the league.',
    'feat.forum.title': 'Forum',
    'feat.forum.desc':
      'Share your strategies, guides and builds. Talk with the best players and stay on top of the meta.',
    'feat.matches.title': 'Matches',
    'feat.matches.desc':
      'Follow the games, game-by-game scores and the MVP of every community matchup.',
    'feat.events.title': 'Events',
    'feat.events.desc':
      'Scrims, coaching sessions, season launches: never miss a Togolese scene event.',
    'feat.heroes.title': 'Heroes & Meta',
    'feat.heroes.desc':
      'The full hero gallery, their skills and the meta ranking (win, pick and ban rate) in real time.',
    'feat.esport.title': 'ETERNUM E-sport',
    'feat.esport.desc':
      'Discover the ETERNUM organization, its sub-teams and the MTL league driving e-sport in Togo.',

    // Latest heroes
    'latestHeroes': 'Latest heroes',

    // Sponsors
    'sponsors.title': 'Our partners',

    // Contact
    'contact.eyebrow': 'Contact',
    'contact.title': 'Contact us',
    'contact.subtitle': 'A question, a partnership, or want to join the community? Write to us.',
    'contact.name': 'Your name',
    'contact.email': 'Your email',
    'contact.subject': 'Subject (optional)',
    'contact.message': 'Your message',
    'contact.send': 'Send',
    'contact.fillError': 'Please fill in your name, a valid email and a message.',
    'contact.sendError': 'Sending failed',
    'contact.success': "Message sent. Thanks, we'll get back to you.",

    // Footer
    'footer.desc':
      'The community platform for Mobile Legends: Bang Bang players in Togo. Rankings, teams, tournaments, hero meta and ETERNUM e-sport.',
    'footer.col.discover': 'Discover',
    'footer.col.community': 'Community',
    'footer.col.account': 'Account',
    'footer.link.home': 'Home',
    'footer.link.heroes': 'Heroes',
    'footer.link.rankings': 'Rankings',
    'footer.link.teams': 'Teams',
    'footer.link.forum': 'Forum',
    'footer.link.tournaments': 'Tournaments',
    'footer.link.events': 'Events',
    'footer.link.matches': 'Matches',
    'footer.link.login': 'Login',
    'footer.link.register': 'Sign up',
    'footer.copyright': 'Unofficial community.',
    'footer.moonton': 'Mobile Legends: Bang Bang © Moonton Technology.',
  },
};

/** Hook : renvoie la fonction de traduction t(key) selon la langue courante. */
export function useT() {
  const lang = useLangStore((s: any) => s.lang);
  return (key: string): string => translations[lang]?.[key] ?? translations.fr[key] ?? key;
}
