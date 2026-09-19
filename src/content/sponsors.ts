import { ORGANISATION as O } from './organisation';

// "Become a sponsor" page copy (FR/EN). Long texts live here rather than in
// i18n.ts; short labels (tiers, form, admin) stay in the i18n catalogue.

export type SponsorTier = 'title' | 'gold' | 'silver' | 'partner';

export interface SponsorActivation {
  key: 'stream' | 'jersey' | 'events' | 'feed' | 'content' | 'prizes';
  title: string;
  desc: string;
}

export interface SponsorsContent {
  hero: { eyebrow: string; title: string; subtitle: string; ctaPrimary: string; ctaSecondary: string };
  pitch: { eyebrow: string; title: string; paragraphs: string[] };
  figures: { eyebrow: string; title: string; subtitle: string };
  offers: { eyebrow: string; title: string; subtitle: string; empty: string; cta: string; custom: string };
  activations: { eyebrow: string; title: string; subtitle: string; items: SponsorActivation[] };
  faq: { eyebrow: string; title: string };
  form: { eyebrow: string; title: string; subtitle: string };
  current: { eyebrow: string; title: string; subtitle: string };
  tiers: Record<SponsorTier, { label: string; desc: string }>;
}

export const SPONSORS_FR: SponsorsContent = {
  hero: {
    eyebrow: 'Devenir sponsor',
    title: 'Associez votre marque à la ligue MLBB du Togo',
    subtitle: `${O.brand} organise la ligue de référence de Mobile Legends: Bang Bang au Togo : saisons régulières, finales en présentiel, diffusion en direct et une communauté de joueurs qui revient chaque semaine. Nos partenaires sont visibles à chaque étape.`,
    ctaPrimary: 'Voir les offres',
    ctaSecondary: 'Nous contacter',
  },
  pitch: {
    eyebrow: 'Argumentaire',
    title: 'Pourquoi sponsoriser la ligue',
    paragraphs: [
      'Le jeu mobile est le premier loisir numérique des 15-30 ans au Togo, et Mobile Legends en est le titre compétitif phare. Chaque saison, des dizaines d’équipes s’affrontent devant une audience qui suit les classements, commente les matchs et se déplace pour les finales.',
      'Sponsoriser la ligue, c’est parler à cette génération dans un cadre positif, structuré et mesurable : logo sur le site et les overlays de stream, mentions à l’antenne, activations en présentiel, contenus dédiés sur nos réseaux et bilan chiffré en fin de saison.',
    ],
  },
  figures: {
    eyebrow: 'Chiffres cibles',
    title: 'Ce que nous visons cette saison',
    subtitle: 'Des objectifs concrets, mis à jour par l’équipe d’organisation et partagés avec nos partenaires.',
  },
  offers: {
    eyebrow: 'Offres',
    title: 'Nos packs de sponsoring',
    subtitle: 'Chaque pack est rattaché à une saison de ligue. Les tarifs sont communiqués sur devis selon la durée et les activations retenues.',
    empty: 'Les offres de la saison seront publiées prochainement. Contactez-nous pour recevoir la plaquette.',
    cta: 'Choisir ce pack',
    custom: 'Vous avez un projet particulier ? Nous construisons aussi des offres sur mesure.',
  },
  activations: {
    eyebrow: 'Activations',
    title: 'Où votre marque apparaît',
    subtitle: 'Des supports concrets, sur le site, à l’antenne et sur le terrain.',
    items: [
      { key: 'stream', title: 'Diffusions en direct', desc: 'Logo sur les overlays, mentions par les commentateurs et écran de pause sponsorisé pendant les matchs diffusés.' },
      { key: 'jersey', title: 'Maillots et visuels', desc: 'Présence sur les maillots de l’équipe compétitive, les affiches de tournois et les visuels de résultats.' },
      { key: 'events', title: 'Finales en présentiel', desc: 'Stand, kakémonos, animation et remise des trophées lors des finales et des rencontres organisées à Lomé.' },
      { key: 'feed', title: 'Annonces sponsorisées', desc: 'Publications identifiées à votre marque dans le fil de communication et sur la page d’accueil de la ligue.' },
      { key: 'content', title: 'Contenus dédiés', desc: 'Interviews, portraits d’équipes et récapitulatifs de journée réalisés avec votre marque.' },
      { key: 'prizes', title: 'Dotations', desc: 'Lots et récompenses remis en votre nom aux vainqueurs et aux joueurs de la saison.' },
    ],
  },
  faq: { eyebrow: 'FAQ', title: 'Questions fréquentes' },
  form: {
    eyebrow: 'Partenariat',
    title: 'Parlons de votre projet',
    subtitle: 'Laissez-nous vos coordonnées : nous revenons vers vous sous 48 heures ouvrées avec une proposition détaillée.',
  },
  current: {
    eyebrow: 'Ils nous font confiance',
    title: 'Les sponsors de la saison',
    subtitle: 'Merci aux partenaires qui accompagnent la ligue.',
  },
  tiers: {
    title: { label: 'Sponsor titre', desc: 'Naming de la saison et présence maximale sur tous les supports.' },
    gold: { label: 'Sponsor or', desc: 'Logo premium, mentions à l’antenne et activation en présentiel.' },
    silver: { label: 'Sponsor argent', desc: 'Logo sur le site et les diffusions, annonce sponsorisée.' },
    partner: { label: 'Partenaire', desc: 'Présence sur le site et remerciements en fin de saison.' },
  },
};

export const SPONSORS_EN: SponsorsContent = {
  hero: {
    eyebrow: 'Become a sponsor',
    title: 'Put your brand on the Togolese MLBB league',
    subtitle: `${O.brand} runs the reference Mobile Legends: Bang Bang league in Togo: regular seasons, offline finals, live streaming and a community of players who come back every week. Our partners are visible at every step.`,
    ctaPrimary: 'See the packages',
    ctaSecondary: 'Contact us',
  },
  pitch: {
    eyebrow: 'The case',
    title: 'Why sponsor the league',
    paragraphs: [
      'Mobile gaming is the first digital pastime of 15 to 30 year olds in Togo, and Mobile Legends is its flagship competitive title. Every season, dozens of teams compete in front of an audience that follows the standings, comments the matches and travels to the finals.',
      'Sponsoring the league means talking to this generation in a positive, structured and measurable setting: logo on the website and stream overlays, on-air mentions, offline activations, dedicated content on our channels and a figures report at the end of the season.',
    ],
  },
  figures: {
    eyebrow: 'Target figures',
    title: 'What we aim for this season',
    subtitle: 'Concrete goals, updated by the organising team and shared with our partners.',
  },
  offers: {
    eyebrow: 'Packages',
    title: 'Our sponsoring packages',
    subtitle: 'Each package is attached to a league season. Prices are quoted on request depending on the duration and the activations chosen.',
    empty: 'The packages of the season will be published soon. Contact us to receive the brochure.',
    cta: 'Choose this package',
    custom: 'Have a specific project in mind? We also build tailor-made packages.',
  },
  activations: {
    eyebrow: 'Activations',
    title: 'Where your brand appears',
    subtitle: 'Concrete media, on the website, on air and on the ground.',
    items: [
      { key: 'stream', title: 'Live broadcasts', desc: 'Logo on the overlays, mentions by the casters and a sponsored break screen during streamed matches.' },
      { key: 'jersey', title: 'Jerseys and visuals', desc: 'Presence on the competitive team jerseys, tournament posters and result visuals.' },
      { key: 'events', title: 'Offline finals', desc: 'Booth, banners, entertainment and trophy ceremony at the finals and meetups held in Lomé.' },
      { key: 'feed', title: 'Sponsored announcements', desc: 'Posts branded with your name in the communication feed and on the league home page.' },
      { key: 'content', title: 'Dedicated content', desc: 'Interviews, team portraits and matchday recaps produced with your brand.' },
      { key: 'prizes', title: 'Prizes', desc: 'Gifts and rewards handed out in your name to the winners and players of the season.' },
    ],
  },
  faq: { eyebrow: 'FAQ', title: 'Frequently asked questions' },
  form: {
    eyebrow: 'Partnership',
    title: 'Let’s talk about your project',
    subtitle: 'Leave us your details: we get back to you within 48 business hours with a detailed proposal.',
  },
  current: {
    eyebrow: 'They trust us',
    title: 'Sponsors of the season',
    subtitle: 'Thanks to the partners supporting the league.',
  },
  tiers: {
    title: { label: 'Title sponsor', desc: 'Season naming and maximum presence on every medium.' },
    gold: { label: 'Gold sponsor', desc: 'Premium logo, on-air mentions and an offline activation.' },
    silver: { label: 'Silver sponsor', desc: 'Logo on the website and broadcasts, a sponsored announcement.' },
    partner: { label: 'Partner', desc: 'Presence on the website and end-of-season thanks.' },
  },
};

export function getSponsorsContent(lang: string): SponsorsContent {
  return lang === 'en' ? SPONSORS_EN : SPONSORS_FR;
}
