import { ORGANISATION as O } from './organisation';
import type { LegalCatalogue } from './legal';

// French legal copy. Long texts live here rather than in i18n.ts to keep the
// label catalogue small. Facts (name, address, e-mails) come from
// organisation.ts so they are edited in one place.

export const LEGAL_FR: LegalCatalogue = {
  'mentions-legales': {
    slug: 'mentions-legales',
    label: 'Mentions légales',
    title: 'Mentions légales',
    intro:
      `Conformément aux dispositions applicables au Togo en matière de services en ligne et de commerce électronique, voici les informations relatives à l'éditeur, à l'hébergeur et aux conditions d'utilisation du site ${O.brand}.`,
    sections: [
      {
        id: 'editeur',
        title: 'Éditeur du site',
        paragraphs: [
          `Le site ${O.website} est édité par ${O.legalName} (${O.legalForm}), structure communautaire qui anime la communauté togolaise du jeu Mobile Legends: Bang Bang ainsi que l'équipe compétitive ${O.esportBrand}.`,
        ],
        bullets: [
          `Dénomination : ${O.legalName}`,
          `Forme juridique : ${O.legalForm}`,
          `Immatriculation : ${O.registration}`,
          `Siège : ${O.address}`,
          `${O.publisher}`,
          `Courriel : ${O.contactEmail}`,
          `Téléphone : ${O.phone}`,
        ],
      },
      {
        id: 'hebergement',
        title: 'Hébergement',
        paragraphs: [
          'Le site et son interface de programmation (API) sont hébergés par des prestataires spécialisés qui assurent la disponibilité de l\'infrastructure et la sauvegarde des données.',
        ],
        bullets: [`Hébergeur : ${O.hostName}`, `Adresse : ${O.hostAddress}`],
      },
      {
        id: 'propriete-intellectuelle',
        title: 'Propriété intellectuelle',
        paragraphs: [
          `L'ensemble des contenus originaux du site (textes, logos ${O.brand} et ${O.esportBrand}, visuels d'équipes, code source, base de données communautaire) est protégé par le droit d'auteur et reste la propriété de ${O.legalName} ou de ses contributeurs. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation écrite préalable est interdite.`,
          'Mobile Legends: Bang Bang, les noms de héros, les illustrations et les éléments du jeu sont la propriété de Moonton Technology Co., Ltd. Ils sont utilisés à des fins d\'information et de promotion de la communauté, sans affiliation ni parrainage de Moonton. Ce site est un projet communautaire non officiel.',
        ],
      },
      {
        id: 'contenus-utilisateurs',
        title: 'Contenus publiés par les membres',
        paragraphs: [
          'Les membres restent responsables des contenus qu\'ils publient sur le forum, les fiches d\'équipe, les profils et la messagerie. En publiant, ils accordent au site une licence non exclusive et gratuite pour afficher ces contenus dans le cadre du service.',
          'Tout contenu illicite, injurieux, discriminatoire ou portant atteinte aux droits d\'un tiers peut être retiré sans préavis, et le compte concerné suspendu. Les signalements sont à adresser à l\'adresse de contact indiquée ci-dessus.',
        ],
      },
      {
        id: 'responsabilite',
        title: 'Limitation de responsabilité',
        paragraphs: [
          `${O.legalName} s'efforce de fournir des informations exactes et à jour (classements, statistiques, calendriers). Ces informations proviennent en partie de données déclarées par les joueurs et de services tiers ; elles sont fournies à titre indicatif et peuvent comporter des erreurs ou des retards.`,
          'Le site ne saurait être tenu responsable des dommages directs ou indirects résultant de l\'utilisation du service, d\'une interruption temporaire, d\'une perte de données ou d\'un contenu publié par un membre.',
        ],
      },
      {
        id: 'liens',
        title: 'Liens externes',
        paragraphs: [
          'Le site peut contenir des liens vers des plateformes tierces (chaînes de diffusion, réseaux sociaux, sites des partenaires). Ces sites sont indépendants et leur contenu n\'engage pas la responsabilité de l\'éditeur.',
        ],
      },
      {
        id: 'droit-applicable',
        title: 'Droit applicable',
        paragraphs: [
          'Les présentes mentions sont soumises au droit togolais. En cas de litige, et à défaut de règlement amiable, les juridictions compétentes de Lomé seront saisies.',
        ],
      },
    ],
  },

  securite: {
    slug: 'securite',
    label: 'Sécurité',
    title: 'Sécurité',
    intro:
      `La protection des comptes et des données des membres est une priorité. Cette page décrit les mesures mises en place par ${O.brand} et les bonnes pratiques à adopter.`,
    sections: [
      {
        id: 'mesures',
        title: 'Mesures techniques',
        paragraphs: [
          'Le site et l\'API sont servis exclusivement en HTTPS (TLS). Les mots de passe ne sont jamais stockés en clair : ils sont hachés avec un algorithme éprouvé avant enregistrement. Les sessions reposent sur des jetons signés à durée limitée.',
          'Les accès à la base de données sont restreints aux serveurs de l\'application et protégés par authentification. Des sauvegardes régulières sont réalisées par l\'hébergeur. Les dépendances logicielles sont mises à jour lorsque des vulnérabilités sont publiées.',
        ],
      },
      {
        id: 'connexion',
        title: 'Connexion et compte de jeu',
        paragraphs: [
          'La connexion s\'effectue par compte Google (OAuth) ou par la liaison de votre identifiant Mobile Legends. Nous ne demandons jamais votre mot de passe Moonton : la vérification passe par le code envoyé par le jeu et seules les informations publiques du profil (pseudo, rang, statistiques) sont récupérées.',
          'Un compte peut être lié à une seule identité de jeu. En cas de doute sur une liaison, contactez-nous pour la faire retirer.',
        ],
      },
      {
        id: 'bonnes-pratiques',
        title: 'Bonnes pratiques pour les membres',
        paragraphs: ['Quelques réflexes simples réduisent fortement les risques :'],
        bullets: [
          'Ne partagez jamais votre code de vérification ni vos identifiants Google avec un autre joueur, même un capitaine ou un administrateur.',
          `Vérifiez l'adresse du site (${O.website}) avant de vous connecter et méfiez-vous des liens reçus en message privé.`,
          'Activez la validation en deux étapes sur votre compte Google et sur votre compte Moonton.',
          'Signalez tout message suspect (arnaque aux diamants, faux tournoi, vente de compte) depuis la messagerie ou par courriel.',
        ],
      },
      {
        id: 'signalement',
        title: 'Signaler une vulnérabilité',
        paragraphs: [
          `Si vous découvrez une faille de sécurité, écrivez à ${O.securityEmail} en décrivant les étapes de reproduction. Nous nous engageons à accuser réception sous 72 heures et à corriger les failles avérées dans les meilleurs délais. Nous demandons de ne pas exploiter la faille, de ne pas accéder aux données d'autres membres et de ne pas la divulguer publiquement avant correction.`,
        ],
      },
      {
        id: 'incident',
        title: 'En cas d\'incident',
        paragraphs: [
          'Si une violation de données susceptible d\'affecter les membres était constatée, les personnes concernées seraient informées par courriel et par une annonce sur le site, avec la nature de l\'incident, les données touchées et les mesures prises.',
        ],
      },
    ],
  },

  cookies: {
    slug: 'cookies',
    label: 'Charte cookies',
    title: 'Charte relative aux cookies',
    intro:
      `Cette charte explique quels traceurs le site ${O.brand} dépose sur votre appareil, à quoi ils servent et comment les contrôler.`,
    sections: [
      {
        id: 'definition',
        title: 'Qu\'est-ce qu\'un cookie ?',
        paragraphs: [
          'Un cookie est un petit fichier texte déposé par un site sur votre navigateur. Le site utilise aussi le stockage local du navigateur (localStorage), qui remplit un rôle comparable : conserver des informations entre deux visites.',
        ],
      },
      {
        id: 'traceurs',
        title: 'Traceurs utilisés',
        paragraphs: ['Le site n\'utilise que des traceurs strictement nécessaires à son fonctionnement ou au confort d\'utilisation :'],
        bullets: [
          'Jeton de session (mlbb-token) : conserve votre connexion entre deux visites. Durée : jusqu\'à déconnexion ou expiration du jeton.',
          'Préférences d\'affichage (mlbb-theme, mlbb-palette, mlbb-lang) : mémorisent le thème clair ou sombre, la palette de couleurs et la langue choisie.',
          'Cookies techniques de Google lors de la connexion OAuth, gérés par Google selon sa propre politique.',
        ],
      },
      {
        id: 'pas-de-pub',
        title: 'Absence de traceurs publicitaires',
        paragraphs: [
          'Aucun cookie publicitaire ni traceur de suivi entre sites n\'est déposé. Si des outils de mesure d\'audience étaient ajoutés à l\'avenir, ils seraient configurés pour anonymiser les données ou soumis à votre consentement préalable, et cette charte serait mise à jour.',
        ],
      },
      {
        id: 'controle',
        title: 'Comment les contrôler',
        paragraphs: [
          'Vous pouvez supprimer à tout moment les données stockées depuis les paramètres de votre navigateur (rubrique « Confidentialité » ou « Données de site »). La suppression du jeton de session vous déconnecte ; celle des préférences réinitialise le thème et la langue. Le blocage total du stockage local empêche la connexion au site.',
        ],
      },
      {
        id: 'contenus-tiers',
        title: 'Contenus intégrés',
        paragraphs: [
          'Les vidéos et diffusions en direct (YouTube, Twitch) intégrées sur la page Stream peuvent déposer leurs propres cookies lorsque vous lancez la lecture. Ces traceurs relèvent de la politique de la plateforme concernée.',
        ],
      },
    ],
  },

  'donnees-personnelles': {
    slug: 'donnees-personnelles',
    label: 'Données personnelles',
    title: 'Politique de protection des données personnelles',
    intro:
      `${O.legalName} traite les données personnelles des membres de ${O.brand} dans le respect de la loi togolaise n° 2019-014 relative à la protection des données à caractère personnel. Cette politique décrit les données collectées, leurs finalités et vos droits.`,
    sections: [
      {
        id: 'responsable',
        title: 'Responsable du traitement',
        paragraphs: [
          `Le responsable du traitement est ${O.legalName}, ${O.address}. Pour toute question relative à vos données : ${O.privacyEmail}.`,
        ],
      },
      {
        id: 'donnees-collectees',
        title: 'Données collectées',
        paragraphs: ['Selon votre utilisation du site, nous traitons les catégories suivantes :'],
        bullets: [
          'Identité et contact : nom d\'affichage, adresse e-mail et avatar fournis par Google lors de la connexion.',
          'Profil de jeu : identifiant et serveur Mobile Legends, pseudo, rang, niveau, statistiques et héros favoris, récupérés depuis les services de Moonton avec votre accord.',
          'Activité sur la plateforme : messages du forum et de la messagerie, candidatures aux équipes, participation aux tournois, notifications, progression et récompenses.',
          'Données techniques : adresse IP, type de navigateur et journaux de connexion conservés à des fins de sécurité.',
          'Formulaire de contact : nom, e-mail, sujet et message que vous nous adressez.',
        ],
      },
      {
        id: 'finalites',
        title: 'Finalités et bases légales',
        paragraphs: ['Les données sont utilisées pour :'],
        bullets: [
          'Fournir le service (création du compte, classements, équipes, tournois, messagerie) : exécution du contrat d\'utilisation.',
          'Assurer la sécurité du site et prévenir les abus : intérêt légitime.',
          'Envoyer des notifications liées à votre activité (matchs, candidatures, messages) : exécution du contrat, avec réglages désactivables depuis votre profil.',
          'Répondre à vos demandes de contact et de partenariat : intérêt légitime.',
          'Publier des contenus promotionnels (photos d\'événements, résultats d\'équipes) : consentement, recueilli lors des événements.',
        ],
      },
      {
        id: 'destinataires',
        title: 'Destinataires et transferts',
        paragraphs: [
          'Les données sont accessibles à l\'équipe d\'administration du site, tenue à la confidentialité, et aux prestataires techniques nécessaires au service (hébergement, envoi d\'e-mails, authentification Google). Les profils de jeu, les classements et les contenus publiés sur le forum sont visibles par les autres membres.',
          'Certains prestataires sont situés hors du Togo (États-Unis, Union européenne). Ces transferts sont encadrés par les garanties contractuelles des prestataires concernés. Aucune donnée n\'est vendue à des tiers.',
        ],
      },
      {
        id: 'conservation',
        title: 'Durées de conservation',
        paragraphs: [],
        bullets: [
          'Compte et profil : pendant toute la durée d\'utilisation du service, puis suppression dans les 30 jours suivant la demande de suppression du compte.',
          'Contenus publiés : jusqu\'à suppression par l\'auteur ou l\'administration ; les messages peuvent être anonymisés plutôt que supprimés pour préserver la cohérence des discussions.',
          'Journaux techniques : 12 mois maximum.',
          'Messages de contact : 24 mois après le dernier échange.',
        ],
      },
      {
        id: 'droits',
        title: 'Vos droits',
        paragraphs: [
          `Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition sur vos données, ainsi que du droit de retirer votre consentement à tout moment. Vous pouvez exercer ces droits depuis les paramètres de votre compte ou en écrivant à ${O.privacyEmail}. Une réponse vous sera apportée dans un délai d'un mois.`,
          'Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir l\'Instance de protection des données à caractère personnel (IPDCP) du Togo.',
        ],
      },
      {
        id: 'mineurs',
        title: 'Mineurs',
        paragraphs: [
          'Le service s\'adresse aux joueurs âgés d\'au moins 13 ans, conformément aux conditions du jeu. Les membres de moins de 18 ans doivent obtenir l\'accord de leurs parents ou tuteurs avant de participer à des événements en présentiel ou de figurer sur des contenus publiés.',
        ],
      },
      {
        id: 'modifications',
        title: 'Modifications de la politique',
        paragraphs: [
          'Cette politique peut être mise à jour pour refléter l\'évolution du service ou de la réglementation. La date de dernière mise à jour figure en haut de la page ; les changements importants sont annoncés sur le site.',
        ],
      },
    ],
  },
};
