import { ORGANISATION as O } from './organisation';

// About page copy (FR/EN). Long texts live here rather than in i18n.ts;
// short labels (nav, footer, admin) stay in the i18n catalogue.

export interface AboutValue {
  key: 'community' | 'fairplay' | 'excellence' | 'transparency';
  title: string;
  desc: string;
}

export interface AboutFigureLabel {
  key: 'streamAudience' | 'socialReach' | 'teams' | 'offlineEvents';
  label: string;
  hint: string;
}

export interface AboutReason {
  key: 'visibility' | 'audience' | 'events' | 'content';
  title: string;
  desc: string;
}

export interface AboutFaq {
  q: string;
  a: string;
}

export interface AboutContent {
  hero: { eyebrow: string; title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  story: { eyebrow: string; title: string; paragraphs: string[] };
  mission: { eyebrow: string; title: string; text: string };
  values: { eyebrow: string; title: string; items: AboutValue[] };
  figures: { eyebrow: string; title: string; subtitle: string; items: AboutFigureLabel[] };
  sponsor: { eyebrow: string; title: string; subtitle: string; items: AboutReason[]; cta: string };
  faq: { eyebrow: string; title: string; items: AboutFaq[] };
}

export const ABOUT_FR: AboutContent = {
  hero: {
    eyebrow: 'À propos',
    title: `La maison des joueurs Mobile Legends du Togo`,
    subtitle:
      `${O.brand} rassemble les joueurs, les équipes et les organisateurs de Mobile Legends: Bang Bang au Togo. Classements, tournois, équipes et diffusion : une plateforme faite par la communauté, pour la communauté.`,
    ctaPrimary: 'Nous sponsoriser',
    ctaSecondary: 'Découvrir les équipes',
  },
  story: {
    eyebrow: 'Qui sommes-nous',
    title: 'Une communauté née sur le terrain',
    paragraphs: [
      `${O.brand} est né en ${O.foundedYear} de quelques joueurs loméens qui organisaient des tournois entre amis dans des cybercafés et des salles de quartier. Face à l'engouement, le collectif s'est structuré pour offrir aux joueurs togolais ce qui manquait : un classement fiable, des tournois réguliers et une vitrine pour les meilleures équipes.`,
      `Aujourd'hui, la plateforme héberge les profils des joueurs, les équipes communautaires, les saisons et les matchs officiels. L'équipe compétitive ${O.esportBrand} porte les couleurs du Togo dans les compétitions régionales et sert de modèle aux jeunes talents.`,
    ],
  },
  mission: {
    eyebrow: 'Notre mission',
    title: 'Structurer l\'esport mobile togolais',
    text:
      'Donner à chaque joueur, débutant ou confirmé, un cadre pour progresser, se mesurer aux autres et être repéré. Nous voulons que le Togo compte sur la scène africaine de Mobile Legends, avec des compétitions sérieuses, des équipes encadrées et des partenaires engagés.',
  },
  values: {
    eyebrow: 'Nos valeurs',
    title: 'Ce qui nous guide',
    items: [
      {
        key: 'community',
        title: 'Communauté',
        desc: 'La plateforme appartient à ses membres. Chaque décision importante est discutée avec les capitaines et les organisateurs.',
      },
      {
        key: 'fairplay',
        title: 'Fair-play',
        desc: 'Règlements clairs, arbitrage neutre et tolérance zéro pour la triche, les insultes et la vente de comptes.',
      },
      {
        key: 'excellence',
        title: 'Excellence',
        desc: 'Des tournois bien organisés, des statistiques fiables et une équipe compétitive qui vise le plus haut niveau régional.',
      },
      {
        key: 'transparency',
        title: 'Transparence',
        desc: 'Résultats publiés, cagnottes annoncées à l\'avance et partenariats affichés clairement.',
      },
    ],
  },
  figures: {
    eyebrow: 'Nos objectifs',
    title: 'Les chiffres que nous visons',
    subtitle: 'Des objectifs concrets pour la saison en cours, mis à jour par l\'équipe d\'organisation.',
    items: [
      { key: 'streamAudience', label: 'Vues cumulées en stream', hint: 'sur nos diffusions de matchs et de tournois' },
      { key: 'socialReach', label: 'Portée sur les réseaux', hint: 'personnes touchées chaque mois sur nos pages' },
      { key: 'teams', label: 'Équipes actives', hint: 'communautaires et esport inscrites sur la plateforme' },
      { key: 'offlineEvents', label: 'Événements en présentiel', hint: 'LAN, finales et rencontres organisées dans l\'année' },
    ],
  },
  sponsor: {
    eyebrow: 'Partenaires',
    title: 'Pourquoi nous sponsoriser',
    subtitle:
      'Le jeu mobile est le premier loisir numérique des 15-30 ans au Togo. S\'associer à MLBB Togo, c\'est parler directement à cette génération, dans un cadre positif et mesurable.',
    items: [
      {
        key: 'visibility',
        title: 'Une visibilité ciblée',
        desc: 'Votre logo sur le site, les overlays de stream, les maillots et les affiches de tournois, devant un public jeune et urbain.',
      },
      {
        key: 'audience',
        title: 'Une audience engagée',
        desc: 'Des joueurs qui reviennent chaque semaine pour les classements, les matchs et le forum, pas des visiteurs de passage.',
      },
      {
        key: 'events',
        title: 'Des événements clés en main',
        desc: 'Finales en présentiel, tournois sponsorisés ou activations en boutique : nous organisons, vous apparaissez.',
      },
      {
        key: 'content',
        title: 'Du contenu mesurable',
        desc: 'Rapport de visibilité après chaque activation : impressions, vues de stream, participants et retombées sur les réseaux.',
      },
    ],
    cta: 'Discutons de votre partenariat',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Questions fréquentes',
    items: [
      {
        q: 'Comment rejoindre la communauté ?',
        a: 'Créez un compte avec Google, puis liez votre identifiant Mobile Legends depuis votre profil. Votre rang et vos statistiques apparaissent dans le classement, et vous pouvez candidater dans une équipe ou vous inscrire aux tournois.',
      },
      {
        q: 'L\'inscription est-elle payante ?',
        a: 'Non. La plateforme est gratuite pour les joueurs. Certains tournois peuvent demander une participation modeste, toujours annoncée à l\'avance avec la répartition de la cagnotte.',
      },
      {
        q: 'Comment créer une équipe ?',
        a: 'Les équipes communautaires sont créées par l\'équipe d\'organisation sur demande d\'un capitaine, afin de garantir des effectifs sérieux. Utilisez le formulaire de contact ou la page Recrutement pour faire votre demande.',
      },
      {
        q: 'Êtes-vous affiliés à Moonton ?',
        a: `Non. ${O.brand} est un projet communautaire indépendant. Mobile Legends: Bang Bang et ses contenus appartiennent à Moonton ; nous les utilisons uniquement pour informer et animer la communauté.`,
      },
      {
        q: 'Comment devenir partenaire ou sponsor ?',
        a: `Écrivez-nous via le formulaire ci-dessous ou à ${O.contactEmail}. Nous vous enverrons notre dossier de partenariat avec les formules disponibles (tournoi, saison, équipe ${O.esportBrand}) et les chiffres d'audience à jour.`,
      },
      {
        q: 'Mes données sont-elles protégées ?',
        a: 'Oui. Nous ne demandons jamais votre mot de passe de jeu et ne vendons aucune donnée. Le détail figure dans notre politique de données personnelles et sur la page Sécurité.',
      },
    ],
  },
};

export const ABOUT_EN: AboutContent = {
  hero: {
    eyebrow: 'About',
    title: 'The home of Mobile Legends players in Togo',
    subtitle:
      `${O.brand} brings together the players, teams and organisers of Mobile Legends: Bang Bang in Togo. Rankings, tournaments, teams and streaming: a platform built by the community, for the community.`,
    ctaPrimary: 'Sponsor us',
    ctaSecondary: 'Discover the teams',
  },
  story: {
    eyebrow: 'Who we are',
    title: 'A community born on the ground',
    paragraphs: [
      `${O.brand} was born in ${O.foundedYear} from a handful of Lomé players who ran tournaments between friends in cybercafés and neighbourhood halls. As enthusiasm grew, the collective organised itself to give Togolese players what was missing: a reliable ranking, regular tournaments and a showcase for the best teams.`,
      `Today the platform hosts player profiles, community teams, seasons and official matches. The competitive team ${O.esportBrand} carries Togo's colours in regional competitions and serves as a model for young talents.`,
    ],
  },
  mission: {
    eyebrow: 'Our mission',
    title: 'Structuring mobile esports in Togo',
    text:
      'Give every player, beginner or experienced, a framework to improve, compete and get noticed. We want Togo to count on the African Mobile Legends scene, with serious competitions, well-coached teams and committed partners.',
  },
  values: {
    eyebrow: 'Our values',
    title: 'What guides us',
    items: [
      {
        key: 'community',
        title: 'Community',
        desc: 'The platform belongs to its members. Every important decision is discussed with captains and organisers.',
      },
      {
        key: 'fairplay',
        title: 'Fair play',
        desc: 'Clear rules, neutral refereeing and zero tolerance for cheating, insults and account selling.',
      },
      {
        key: 'excellence',
        title: 'Excellence',
        desc: 'Well-run tournaments, reliable statistics and a competitive team aiming for the highest regional level.',
      },
      {
        key: 'transparency',
        title: 'Transparency',
        desc: 'Published results, prize pools announced in advance and partnerships displayed clearly.',
      },
    ],
  },
  figures: {
    eyebrow: 'Our targets',
    title: 'The numbers we aim for',
    subtitle: 'Concrete goals for the current season, updated by the organising team.',
    items: [
      { key: 'streamAudience', label: 'Cumulated stream views', hint: 'on our match and tournament broadcasts' },
      { key: 'socialReach', label: 'Social reach', hint: 'people reached every month on our pages' },
      { key: 'teams', label: 'Active teams', hint: 'community and esport teams registered on the platform' },
      { key: 'offlineEvents', label: 'Offline events', hint: 'LANs, finals and meetups organised over the year' },
    ],
  },
  sponsor: {
    eyebrow: 'Partners',
    title: 'Why sponsor us',
    subtitle:
      'Mobile gaming is the first digital pastime of 15 to 30 year olds in Togo. Partnering with MLBB Togo means speaking directly to this generation, in a positive and measurable setting.',
    items: [
      {
        key: 'visibility',
        title: 'Targeted visibility',
        desc: 'Your logo on the website, stream overlays, jerseys and tournament posters, in front of a young urban audience.',
      },
      {
        key: 'audience',
        title: 'An engaged audience',
        desc: 'Players who come back every week for rankings, matches and the forum, not passing visitors.',
      },
      {
        key: 'events',
        title: 'Turnkey events',
        desc: 'Offline finals, sponsored tournaments or in-store activations: we organise, you appear.',
      },
      {
        key: 'content',
        title: 'Measurable content',
        desc: 'A visibility report after each activation: impressions, stream views, participants and social media results.',
      },
    ],
    cta: 'Let us talk about your partnership',
  },
  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions',
    items: [
      {
        q: 'How do I join the community?',
        a: 'Create an account with Google, then link your Mobile Legends ID from your profile. Your rank and statistics appear in the ranking, and you can apply to a team or register for tournaments.',
      },
      {
        q: 'Is registration paid?',
        a: 'No. The platform is free for players. Some tournaments may ask for a modest entry fee, always announced in advance together with the prize pool split.',
      },
      {
        q: 'How do I create a team?',
        a: 'Community teams are created by the organising team at the request of a captain, to guarantee serious rosters. Use the contact form or the Recruitment page to make your request.',
      },
      {
        q: 'Are you affiliated with Moonton?',
        a: `No. ${O.brand} is an independent community project. Mobile Legends: Bang Bang and its content belong to Moonton; we only use them to inform and animate the community.`,
      },
      {
        q: 'How do I become a partner or sponsor?',
        a: `Write to us through the form below or at ${O.contactEmail}. We will send you our partnership deck with the available packages (tournament, season, ${O.esportBrand} team) and up-to-date audience figures.`,
      },
      {
        q: 'Is my data protected?',
        a: 'Yes. We never ask for your game password and never sell any data. Details are in our personal data policy and on the Security page.',
      },
    ],
  },
};

export function getAboutContent(lang: string): AboutContent {
  return lang === 'en' ? ABOUT_EN : ABOUT_FR;
}
