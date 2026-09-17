import { ORGANISATION as O } from './organisation';
import type { LegalCatalogue } from './legal';

// English legal copy, mirror of legal.fr.ts.

export const LEGAL_EN: LegalCatalogue = {
  'mentions-legales': {
    slug: 'mentions-legales',
    label: 'Legal notice',
    title: 'Legal notice',
    intro:
      `In accordance with the rules applicable in Togo to online services and electronic commerce, here is the information about the publisher, the host and the terms of use of the ${O.brand} website.`,
    sections: [
      {
        id: 'editeur',
        title: 'Publisher',
        paragraphs: [
          `The website ${O.website} is published by ${O.legalName} (${O.legalForm}), a community organisation that runs the Togolese Mobile Legends: Bang Bang community and the competitive team ${O.esportBrand}.`,
        ],
        bullets: [
          `Name: ${O.legalName}`,
          `Legal form: ${O.legalForm}`,
          `Registration: ${O.registration}`,
          `Registered office: ${O.address}`,
          `${O.publisher}`,
          `E-mail: ${O.contactEmail}`,
          `Phone: ${O.phone}`,
        ],
      },
      {
        id: 'hebergement',
        title: 'Hosting',
        paragraphs: [
          'The website and its API are hosted by specialised providers that ensure the availability of the infrastructure and the backup of the data.',
        ],
        bullets: [`Host: ${O.hostName}`, `Address: ${O.hostAddress}`],
      },
      {
        id: 'propriete-intellectuelle',
        title: 'Intellectual property',
        paragraphs: [
          `All original content of the website (texts, ${O.brand} and ${O.esportBrand} logos, team visuals, source code, community database) is protected by copyright and remains the property of ${O.legalName} or its contributors. Any reproduction, representation or distribution, in whole or in part, without prior written permission is prohibited.`,
          'Mobile Legends: Bang Bang, hero names, artwork and in-game elements are the property of Moonton Technology Co., Ltd. They are used for information and community promotion purposes, without affiliation with or endorsement by Moonton. This website is an unofficial community project.',
        ],
      },
      {
        id: 'contenus-utilisateurs',
        title: 'Content published by members',
        paragraphs: [
          'Members remain responsible for the content they publish on the forum, team pages, profiles and messaging. By publishing, they grant the website a non-exclusive, royalty-free licence to display that content as part of the service.',
          'Any unlawful, abusive or discriminatory content, or content infringing the rights of a third party, may be removed without notice and the related account suspended. Reports should be sent to the contact address above.',
        ],
      },
      {
        id: 'responsabilite',
        title: 'Limitation of liability',
        paragraphs: [
          `${O.legalName} strives to provide accurate and up-to-date information (rankings, statistics, schedules). Part of this information comes from data declared by players and from third-party services; it is provided for information only and may contain errors or delays.`,
          'The website cannot be held liable for direct or indirect damage resulting from the use of the service, a temporary interruption, a loss of data or content published by a member.',
        ],
      },
      {
        id: 'liens',
        title: 'External links',
        paragraphs: [
          'The website may contain links to third-party platforms (streaming channels, social networks, partner websites). These websites are independent and the publisher is not responsible for their content.',
        ],
      },
      {
        id: 'droit-applicable',
        title: 'Governing law',
        paragraphs: [
          'This notice is governed by Togolese law. In the event of a dispute, and failing an amicable settlement, the competent courts of Lomé shall have jurisdiction.',
        ],
      },
    ],
  },

  securite: {
    slug: 'securite',
    label: 'Security',
    title: 'Security',
    intro:
      `Protecting members' accounts and data is a priority. This page describes the measures put in place by ${O.brand} and the good practices to adopt.`,
    sections: [
      {
        id: 'mesures',
        title: 'Technical measures',
        paragraphs: [
          'The website and the API are served exclusively over HTTPS (TLS). Passwords are never stored in clear text: they are hashed with a proven algorithm before being saved. Sessions rely on signed tokens with a limited lifetime.',
          'Database access is restricted to the application servers and protected by authentication. Regular backups are performed by the host. Software dependencies are updated when vulnerabilities are published.',
        ],
      },
      {
        id: 'connexion',
        title: 'Sign-in and game account',
        paragraphs: [
          'You sign in with a Google account (OAuth) or by linking your Mobile Legends ID. We never ask for your Moonton password: verification goes through the code sent by the game, and only public profile information (nickname, rank, statistics) is retrieved.',
          'An account can be linked to a single game identity. If you have doubts about a link, contact us to have it removed.',
        ],
      },
      {
        id: 'bonnes-pratiques',
        title: 'Good practices for members',
        paragraphs: ['A few simple habits greatly reduce the risks:'],
        bullets: [
          'Never share your verification code or your Google credentials with another player, even a captain or an administrator.',
          `Check the website address (${O.website}) before signing in and be wary of links received in private messages.`,
          'Enable two-step verification on your Google account and on your Moonton account.',
          'Report any suspicious message (diamond scams, fake tournaments, account selling) from the messaging or by e-mail.',
        ],
      },
      {
        id: 'signalement',
        title: 'Reporting a vulnerability',
        paragraphs: [
          `If you discover a security flaw, write to ${O.securityEmail} describing the steps to reproduce it. We commit to acknowledging receipt within 72 hours and to fixing confirmed flaws as soon as possible. We ask you not to exploit the flaw, not to access other members' data and not to disclose it publicly before it is fixed.`,
        ],
      },
      {
        id: 'incident',
        title: 'In the event of an incident',
        paragraphs: [
          'Should a data breach likely to affect members be identified, the people concerned would be informed by e-mail and by an announcement on the website, with the nature of the incident, the data affected and the measures taken.',
        ],
      },
    ],
  },

  cookies: {
    slug: 'cookies',
    label: 'Cookie policy',
    title: 'Cookie policy',
    intro:
      `This policy explains which trackers the ${O.brand} website stores on your device, what they are used for and how to control them.`,
    sections: [
      {
        id: 'definition',
        title: 'What is a cookie?',
        paragraphs: [
          'A cookie is a small text file stored by a website in your browser. The website also uses the browser local storage (localStorage), which plays a similar role: keeping information between two visits.',
        ],
      },
      {
        id: 'traceurs',
        title: 'Trackers in use',
        paragraphs: ['The website only uses trackers that are strictly necessary for its operation or for your comfort:'],
        bullets: [
          'Session token (mlbb-token): keeps you signed in between visits. Duration: until sign-out or token expiry.',
          'Display preferences (mlbb-theme, mlbb-palette, mlbb-lang): remember the light or dark theme, the colour palette and the chosen language.',
          'Google technical cookies during OAuth sign-in, managed by Google under its own policy.',
        ],
      },
      {
        id: 'pas-de-pub',
        title: 'No advertising trackers',
        paragraphs: [
          'No advertising cookie or cross-site tracker is stored. If audience measurement tools were added in the future, they would be configured to anonymise data or be subject to your prior consent, and this policy would be updated.',
        ],
      },
      {
        id: 'controle',
        title: 'How to control them',
        paragraphs: [
          'You can delete stored data at any time from your browser settings ("Privacy" or "Site data" section). Deleting the session token signs you out; deleting the preferences resets the theme and the language. Blocking local storage entirely prevents signing in.',
        ],
      },
      {
        id: 'contenus-tiers',
        title: 'Embedded content',
        paragraphs: [
          'Videos and live streams (YouTube, Twitch) embedded on the Stream page may set their own cookies when you start playback. These trackers fall under the policy of the platform concerned.',
        ],
      },
    ],
  },

  'donnees-personnelles': {
    slug: 'donnees-personnelles',
    label: 'Personal data',
    title: 'Personal data protection policy',
    intro:
      `${O.legalName} processes the personal data of ${O.brand} members in compliance with Togolese law no. 2019-014 on the protection of personal data. This policy describes the data collected, its purposes and your rights.`,
    sections: [
      {
        id: 'responsable',
        title: 'Data controller',
        paragraphs: [
          `The data controller is ${O.legalName}, ${O.address}. For any question about your data: ${O.privacyEmail}.`,
        ],
      },
      {
        id: 'donnees-collectees',
        title: 'Data collected',
        paragraphs: ['Depending on how you use the website, we process the following categories:'],
        bullets: [
          'Identity and contact: display name, e-mail address and avatar provided by Google at sign-in.',
          'Game profile: Mobile Legends ID and server, nickname, rank, level, statistics and favourite heroes, retrieved from Moonton services with your consent.',
          'Platform activity: forum and private messages, team applications, tournament participation, notifications, progression and rewards.',
          'Technical data: IP address, browser type and connection logs kept for security purposes.',
          'Contact form: name, e-mail, subject and the message you send us.',
        ],
      },
      {
        id: 'finalites',
        title: 'Purposes and legal bases',
        paragraphs: ['The data is used to:'],
        bullets: [
          'Provide the service (account creation, rankings, teams, tournaments, messaging): performance of the terms of use.',
          'Keep the website secure and prevent abuse: legitimate interest.',
          'Send notifications related to your activity (matches, applications, messages): performance of the terms of use, with settings you can disable from your profile.',
          'Answer your contact and partnership requests: legitimate interest.',
          'Publish promotional content (event photos, team results): consent, collected at events.',
        ],
      },
      {
        id: 'destinataires',
        title: 'Recipients and transfers',
        paragraphs: [
          'The data is accessible to the website administration team, bound by confidentiality, and to the technical providers required for the service (hosting, e-mail delivery, Google authentication). Game profiles, rankings and forum content are visible to other members.',
          'Some providers are located outside Togo (United States, European Union). These transfers are covered by the contractual safeguards of the providers concerned. No data is sold to third parties.',
        ],
      },
      {
        id: 'conservation',
        title: 'Retention periods',
        paragraphs: [],
        bullets: [
          'Account and profile: for as long as you use the service, then deletion within 30 days of the account deletion request.',
          'Published content: until deleted by the author or the administration; messages may be anonymised rather than deleted to keep discussions consistent.',
          'Technical logs: 12 months maximum.',
          'Contact messages: 24 months after the last exchange.',
        ],
      },
      {
        id: 'droits',
        title: 'Your rights',
        paragraphs: [
          `You have the right to access, rectify, erase, restrict and object to the processing of your data, and the right to withdraw your consent at any time. You can exercise these rights from your account settings or by writing to ${O.privacyEmail}. You will receive an answer within one month.`,
          'If you believe your rights are not respected, you can lodge a complaint with the Togolese personal data protection authority (IPDCP).',
        ],
      },
      {
        id: 'mineurs',
        title: 'Minors',
        paragraphs: [
          'The service is intended for players aged 13 and over, in line with the game terms. Members under 18 must obtain the consent of their parents or guardians before taking part in in-person events or appearing in published content.',
        ],
      },
      {
        id: 'modifications',
        title: 'Changes to this policy',
        paragraphs: [
          'This policy may be updated to reflect changes in the service or in regulations. The last update date appears at the top of the page; significant changes are announced on the website.',
        ],
      },
    ],
  },
};
