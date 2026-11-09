// Destinations content for farirainandipa.co.zw/destinations
// Strings containing "[" are placeholders for the owner to fill.
// The production build fails while any remain (see scripts/placeholder-guard.ts);
// set ALLOW_PLACEHOLDERS=1 to build locally with them.
//
// Photo fields: a value starting with "/" is rendered as an image
// (e.g. '/images/destinations/kenya/hero.webp'); anything else is shown as a
// striped placeholder box describing the intended shot.

export type EventType = 'association' | 'corporate' | 'incentive' | 'government';

export interface Fact { label: string; value: string }
export interface Reason { title: string; body: string }
export interface Venue {
  name: string;
  city: string;
  type: string;
  largestRoom: string;
  breakouts: string;
  roomsNearby: string;
}
export interface Experience { title: string; body: string; photo: string }
export interface ProgrammeDay { day: string; title: string; items: string[] }
export interface PipelineMatch { event: string; year: string; delegates: string; bidDeadline: string }

export interface Destination {
  slug: string;
  name: string;
  cities: string;
  eventTypes: EventType[];
  bestFor: string;          // one line, used on hub cards
  headline: string;         // italic line under the H1; also the meta description
  intro: string;
  photos: { hero: string; card: string; cardAlt: string };
  facts: Fact[];
  why: Reason[];
  venues: Venue[];
  access: { flights: string; entry: string; transfers: string };
  experiences: Experience[];
  programmeTitle: string;
  programme: ProgrammeDay[];
  pipelineMatches: PipelineMatch[]; // block hidden while empty
  comparison: {
    flagshipVenue: string;
    largestPlenary: string;
    airports: string;
    bestFor: string;
    signatureAddOn: string;
  };
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  association: 'Association congress',
  corporate: 'Corporate meeting',
  incentive: 'Incentive travel',
  government: 'Government summit',
};

const venue = (name: string, city: string, type: string): Venue => ({
  name, city, type,
  largestRoom: '[XXXX] theatre',
  breakouts: '[XX]',
  roomsNearby: '[XXX] within 15 min',
});

// While false, only the /destinations hub is live: the /destinations/:slug
// pages are not routed or prerendered, hub cards and footer entries are not
// links, and the placeholder guard checks only what the hub shows.
// Set to true (add the five URLs back to public/sitemap.xml and remove the
// /destinations/* redirect in netlify.toml) once each
// destination's content is ready.
export const destinationPagesLive = false;

export const destinations: Destination[] = [
  {
    slug: 'kenya',
    name: 'Kenya',
    cities: 'Nairobi · Mombasa · Maasai Mara',
    eventTypes: ['government', 'association', 'corporate'],
    bestFor: 'Regional summits, UN and NGO-linked meetings, East African association events.',
    headline: 'Where East Africa meets, negotiates and does business.',
    intro: 'Nairobi hosts UN offices, regional headquarters and a deep pool of event suppliers. When a summit needs diplomacy, delegates and connectivity in one city, it lands here.',
    photos: {
      hero: '[Photo: KICC or a Nairobi venue from the site visit]',
      card: '/images/destinations/kenya-card.jpg', // Unsplash License, unsplash.com/photos/7XA8SJ5ODq4
      cardAlt: 'A giraffe in Nairobi National Park with the city skyline behind',
    },
    facts: [
      { label: 'Main airport', value: 'Nairobi JKIA (NBO)' },
      { label: 'Flagship venue', value: 'Kenyatta International Convention Centre' },
      { label: 'Best for', value: 'Summits, NGO and UN-linked meetings' },
    ],
    why: [
      { title: 'A regional diplomatic hub', body: 'UN offices at Gigiri and many regional headquarters. Some of your delegates may already be based here.' },
      { title: 'Connectivity', body: 'JKIA links East Africa to the rest of the continent, Europe, the Gulf and Asia.' },
      { title: 'Add-ons that sell', body: 'The Maasai Mara and the coast turn a working week into a reason to attend.' },
    ],
    venues: [
      venue('Kenyatta International Convention Centre', 'Nairobi', 'Convention centre'),
      venue('UN Office at Nairobi conference facilities', 'Nairobi (Gigiri)', 'UN conference complex'),
      venue('[Hotel conference venue]', 'Nairobi', 'Hotel'),
      venue('[Coastal resort]', 'Mombasa / Diani', 'Resort'),
    ],
    access: {
      flights: 'Hub at Jomo Kenyatta International (NBO); Mombasa (MBA) for the coast; short flights to Mara airstrips.',
      entry: '[Current entry rules for key delegate markets. Confirm and date-stamp before publishing.]',
      transfers: '[XX] min JKIA to KICC off-peak; allow more at rush hour.',
    },
    experiences: [
      { title: 'Game drive before breakfast', body: 'Nairobi National Park sits at the edge of the city.', photo: '[Photo]' },
      { title: 'Welcome dinner', body: '[Your recommended venue for a signature welcome evening.]', photo: '[Photo]' },
      { title: 'Community CSR session', body: '[A vetted local project your groups can support.]', photo: '[Photo]' },
      { title: 'Maasai Mara post-tour', body: 'A short flight for VIPs, speakers or top performers.', photo: '[Photo]' },
    ],
    programmeTitle: 'A 3-day regional summit in Nairobi',
    programme: [
      { day: 'Day 1', title: 'Arrive and connect', items: ['Arrivals and registration', 'Ministerial or partner briefings', 'Welcome reception'] },
      { day: 'Day 2', title: 'Plenary and breakouts', items: ['Opening plenary at KICC', 'Parallel breakout tracks', 'Gala dinner'] },
      { day: 'Day 3', title: 'Close and explore', items: ['Closing plenary and declarations', 'Nairobi National Park or city tour', 'Departures or Mara extension'] },
    ],
    pipelineMatches: [],
    comparison: {
      flagshipVenue: 'Kenyatta International Convention Centre, Nairobi',
      largestPlenary: 'Up to 4,000 (KICC Tsavo Ballroom)', // published figure: kicc.co.ke; Cvent lists 3,500 theatre
      airports: 'Nairobi JKIA (NBO), Mombasa (MBA)',
      bestFor: 'Summits, NGO and UN-linked',
      signatureAddOn: 'Maasai Mara safari',
    },
  },
  {
    slug: 'rwanda',
    name: 'Rwanda',
    cities: 'Kigali · Musanze',
    eventTypes: ['association', 'government'],
    bestFor: 'Association congresses and high-profile summits that must run like clockwork.',
    headline: 'A congress city built to run like clockwork.',
    intro: 'Kigali has made hosting part of its national brand. It is compact, safe and well organised. Associations choose it when the event cannot afford to go wrong.',
    photos: {
      hero: '[Photo: Kigali, partner-supplied]',
      card: '/images/destinations/rwanda-card.jpg', // Unsplash License, unsplash.com/photos/VikU8k-XJ54
      cardAlt: 'Kigali seen from a hilltop',
    },
    facts: [
      { label: 'Main airport', value: 'Kigali International (KGL)' },
      { label: 'Flagship venue', value: 'Kigali Convention Centre' },
      { label: 'Best for', value: 'Association congresses, summits' },
    ],
    why: [
      { title: 'Purpose-built venues', body: 'Kigali Convention Centre, Intare Conference Arena and BK Arena give congresses room to grow.' },
      { title: 'A bureau that backs bids', body: 'The Rwanda Convention Bureau supports associations from bid stage to delivery.' },
      { title: 'A post-tour unlike any other', body: 'Gorilla trekking in Volcanoes National Park, a short drive from the capital.' },
    ],
    venues: [
      venue('Kigali Convention Centre', 'Kigali', 'Convention centre'),
      venue('Intare Conference Arena', 'Kigali', 'Conference arena'),
      venue('BK Arena', 'Kigali', 'Indoor arena'),
      venue('[Hotel conference venue]', 'Kigali', 'Hotel'),
    ],
    access: {
      flights: 'Kigali International (KGL), home base of RwandAir, with regional and long-haul links.',
      entry: '[Current entry rules for key delegate markets. Confirm and date-stamp before publishing.]',
      transfers: '[XX] min airport to Kigali Convention Centre.',
    },
    experiences: [
      { title: 'Gorilla trekking', body: 'Volcanoes National Park. Permits are limited, so plan well ahead.', photo: '[Photo]' },
      { title: 'Kigali Genocide Memorial', body: 'A guided, respectful visit that gives delegates context.', photo: '[Photo]' },
      { title: 'Akagera safari', body: 'Savannah game viewing in the east of the country.', photo: '[Photo]' },
      { title: 'Coffee and craft', body: '[A coffee or artisan experience you recommend.]', photo: '[Photo]' },
    ],
    programmeTitle: 'A 3-day association congress in Kigali',
    programme: [
      { day: 'Day 1', title: 'Open the congress', items: ['Registration and exhibition set-up', 'Opening ceremony', 'Welcome reception'] },
      { day: 'Day 2', title: 'Science and sessions', items: ['Plenary keynotes', 'Abstract and poster sessions', 'Networking dinner'] },
      { day: 'Day 3', title: 'Close and travel on', items: ['General assembly', 'Closing plenary', 'Post-tour to Musanze'] },
    ],
    pipelineMatches: [],
    comparison: {
      flagshipVenue: 'Kigali Convention Centre',
      largestPlenary: '2,600 theatre (KCC Auditorium)', // published figure: AIPC member listing
      airports: 'Kigali (KGL)',
      bestFor: 'Association congresses',
      signatureAddOn: 'Gorilla trekking',
    },
  },
  {
    slug: 'south-africa',
    name: 'South Africa',
    cities: 'Cape Town · Durban · Johannesburg',
    eventTypes: ['association', 'corporate', 'incentive'],
    bestFor: 'Large congresses, exhibitions and incentive travel at scale.',
    headline: 'The continent’s most complete meetings infrastructure.',
    intro: 'Three convention cities, deep hotel stock and suppliers who have delivered world congresses. When the delegate count is large, South Africa is the benchmark.',
    photos: {
      hero: '[Photo: CTICC or another venue from the site visit]',
      card: '/images/destinations/south-africa-card.jpg', // Unsplash License, unsplash.com/photos/1GgWbP74phY
      cardAlt: 'Aerial view of Cape Town and Table Mountain',
    },
    facts: [
      { label: 'Main airports', value: 'Johannesburg (JNB), Cape Town (CPT), Durban (DUR)' },
      { label: 'Flagship venues', value: 'CTICC, Durban ICC, Sandton Convention Centre' },
      { label: 'Best for', value: 'Large congresses, exhibitions, incentives' },
    ],
    why: [
      { title: 'Three convention cities', body: 'Cape Town, Durban and Johannesburg each offer a purpose-built centre with surrounding hotel stock.' },
      { title: 'Scale and supply', body: 'Experienced PCOs, DMCs and production companies for events in the thousands.' },
      { title: 'Incentives that close', body: 'Winelands, Big Five safaris and the Garden Route within easy reach.' },
    ],
    venues: [
      venue('Cape Town International Convention Centre (CTICC)', 'Cape Town', 'Convention centre'),
      venue('Durban ICC', 'Durban', 'Convention centre'),
      venue('Sandton Convention Centre', 'Johannesburg', 'Convention centre'),
      venue('[Wine estate venue]', 'Stellenbosch', 'Incentive venue'),
    ],
    access: {
      flights: 'OR Tambo (JNB) is a major African hub; direct long-haul to Cape Town and Durban.',
      entry: '[Current entry rules for key delegate markets. Confirm and date-stamp before publishing.]',
      transfers: '[XX] min CPT to CTICC; [XX] min JNB to Sandton.',
    },
    experiences: [
      { title: 'Table Mountain evening', body: 'A sunset event above the city.', photo: '[Photo]' },
      { title: 'Winelands dinner', body: 'Private estate dining in Stellenbosch or Franschhoek.', photo: '[Photo]' },
      { title: 'Big Five extension', body: 'Kruger or private reserves for incentive groups.', photo: '[Photo]' },
      { title: 'Township CSR experience', body: '[A vetted community partner you recommend.]', photo: '[Photo]' },
    ],
    programmeTitle: 'A 3-day international congress in Cape Town',
    programme: [
      { day: 'Day 1', title: 'Arrive and register', items: ['Registration at CTICC', 'Exhibition opening', 'Waterfront welcome reception'] },
      { day: 'Day 2', title: 'Full programme', items: ['Plenary and parallel sessions', 'Exhibition and poster hall', 'Winelands gala dinner'] },
      { day: 'Day 3', title: 'Close and explore', items: ['Closing plenary', 'Table Mountain or Cape Peninsula', 'Departures or safari extension'] },
    ],
    pipelineMatches: [],
    comparison: {
      flagshipVenue: 'CTICC, Durban ICC, Sandton Convention Centre',
      largestPlenary: '6,000 theatre (Durban ICC)', // published figure: AIPC member listing; CTICC Auditorium 1 is 1,516
      airports: 'Johannesburg (JNB), Cape Town (CPT), Durban (DUR)',
      bestFor: 'Large congresses, exhibitions',
      signatureAddOn: 'Winelands and Big Five',
    },
  },
  {
    slug: 'zambia',
    name: 'Zambia',
    cities: 'Lusaka · Livingstone',
    eventTypes: ['corporate', 'incentive'],
    bestFor: 'Regional corporate meetings and value-led incentives on the Zambezi.',
    headline: 'Value, warmth and the Falls from the Zambian side.',
    intro: 'Lusaka carries regional government and corporate meetings. Livingstone delivers the incentive. Together they give budget-conscious groups more for their money.',
    photos: {
      hero: '[Photo: Livingstone or Lusaka venue from the site visit]',
      card: '/images/destinations/zambia-card.jpg', // Unsplash License, unsplash.com/photos/lqBM9IsXhiY
      cardAlt: 'The Victoria Falls Bridge over the Zambezi gorge',
    },
    facts: [
      { label: 'Main airports', value: 'Lusaka (LUN), Livingstone (LVI)' },
      { label: 'Flagship venue', value: 'Mulungushi International Conference Centre' },
      { label: 'Best for', value: 'Regional meetings, incentives, retreats' },
    ],
    why: [
      { title: 'A regional meetings capital', body: 'Lusaka hosts SADC, COMESA and government-level meetings with established venues.' },
      { title: 'Livingstone retreats', body: 'Resort-style meetings on the Zambezi, minutes from the Falls.' },
      { title: 'Built for twin-destination', body: 'Pairs naturally with Zimbabwe for cross-border Falls programmes.' },
    ],
    venues: [
      venue('Mulungushi International Conference Centre', 'Lusaka', 'Convention centre'),
      venue('Avani Victoria Falls Resort', 'Livingstone', 'Resort'),
      venue('[Hotel conference venue]', 'Lusaka', 'Hotel'),
      venue('[Lodge on the Zambezi]', 'Livingstone', 'Lodge'),
    ],
    access: {
      flights: 'Kenneth Kaunda International (LUN) and Harry Mwaanga Nkumbula International, Livingstone (LVI).',
      entry: '[Current entry and cross-border rules. Confirm and date-stamp before publishing.]',
      transfers: '[XX] min LVI to Falls-side resorts.',
    },
    experiences: [
      { title: 'Zambezi sunset cruise', body: 'The classic Livingstone evening for groups.', photo: '[Photo]' },
      { title: 'Livingstone Island', body: 'Seasonal access to the edge of the Falls.', photo: '[Photo]' },
      { title: 'Lower Zambezi', body: 'Canoe and game-viewing extension.', photo: '[Photo]' },
      { title: 'Village CSR visit', body: '[A vetted community project you recommend.]', photo: '[Photo]' },
    ],
    programmeTitle: 'A 3-day leadership retreat in Livingstone',
    programme: [
      { day: 'Day 1', title: 'Arrive at the river', items: ['Arrivals into LVI', 'Check-in and briefing', 'Sunset cruise dinner'] },
      { day: 'Day 2', title: 'Work, then wonder', items: ['Morning strategy sessions', 'Guided tour of the Falls', 'Boma-style dinner'] },
      { day: 'Day 3', title: 'Commit and depart', items: ['Action-planning session', 'Optional cross-border visit', 'Departures'] },
    ],
    pipelineMatches: [],
    comparison: {
      flagshipVenue: 'Mulungushi International Conference Centre, Lusaka',
      largestPlenary: '2,500 (main hall)', // published figure: ILAE congress venue page; not confirmed by the venue
      airports: 'Lusaka (LUN), Livingstone (LVI)',
      bestFor: 'Regional meetings, incentives',
      signatureAddOn: 'Zambezi and the Falls',
    },
  },
  {
    slug: 'zimbabwe',
    name: 'Zimbabwe',
    cities: 'Harare · Victoria Falls · Hwange',
    eventTypes: ['incentive', 'corporate'],
    bestFor: 'Boutique conferences, leadership retreats and incentives at the Falls.',
    headline: 'Boutique conferences and retreats at a wonder of the world.',
    intro: 'Victoria Falls is the incentive Africa sells best. Harare carries the national meetings and government agenda. This is my home market, and I know it from the inside.',
    photos: {
      hero: '[Photo: Victoria Falls venue from the site visit]',
      card: '/images/destinations/zimbabwe-card.jpg', // Unsplash License, unsplash.com/photos/ELO9ynmwmBE
      cardAlt: 'Victoria Falls',
    },
    facts: [
      { label: 'Main airports', value: 'Harare (HRE), Victoria Falls (VFA)' },
      { label: 'Flagship venues', value: 'Harare International Conference Centre; Victoria Falls resorts' },
      { label: 'Best for', value: 'Retreats, incentives, boutique conferences' },
    ],
    why: [
      { title: 'Victoria Falls', body: 'Conference resorts, river experiences and the Falls within one small town.' },
      { title: 'Harare for national events', body: 'HICC and city hotels for government, association and corporate meetings.' },
      { title: 'Local expertise', body: 'My home ground. Local suppliers, local relationships and local problem-solving.' },
    ],
    venues: [
      venue('Harare International Conference Centre', 'Harare', 'Convention centre'),
      venue('Elephant Hills Resort', 'Victoria Falls', 'Conference resort'),
      venue('The Victoria Falls Hotel', 'Victoria Falls', 'Heritage hotel'),
      venue('[Lodge or boutique venue]', 'Victoria Falls', 'Lodge'),
    ],
    access: {
      flights: 'Victoria Falls International (VFA) and Robert Gabriel Mugabe International, Harare (HRE).',
      entry: '[Current entry and cross-border rules. Confirm and date-stamp before publishing.]',
      transfers: '[XX] min VFA to Falls-side resorts.',
    },
    experiences: [
      { title: 'Guided tour of the Falls', body: 'Best timed with the season and water levels.', photo: '[Photo]' },
      { title: 'Zambezi river dinner', body: 'A private cruise for the welcome or closing night.', photo: '[Photo]' },
      { title: 'Boma dinner', body: 'Drumming, local cuisine and storytelling for groups.', photo: '[Photo]' },
      { title: 'Hwange extension', body: 'Safari for VIPs and top performers.', photo: '[Photo]' },
    ],
    programmeTitle: 'A 3-day incentive at Victoria Falls',
    programme: [
      { day: 'Day 1', title: 'Arrive and unwind', items: ['Arrivals into VFA', 'Welcome briefing', 'Zambezi river dinner'] },
      { day: 'Day 2', title: 'Recognition and adventure', items: ['Morning awards session', 'Guided tour of the Falls', 'Boma dinner'] },
      { day: 'Day 3', title: 'Choose your experience', items: ['Helicopter flight or game drive', 'Farewell lunch', 'Departures or Hwange extension'] },
    ],
    pipelineMatches: [],
    comparison: {
      flagshipVenue: 'Harare International Conference Centre; Victoria Falls resorts',
      largestPlenary: '4,500 (HICC main auditorium)', // published figure: rtgafrica.com
      airports: 'Harare (HRE), Victoria Falls (VFA)',
      bestFor: 'Retreats, boutique conferences',
      signatureAddOn: 'Victoria Falls and Hwange',
    },
  },
];

export const getDestination = (slug: string) => destinations.find((d) => d.slug === slug);

// ---- Hub page content ----

export const hub = {
  eyebrow: 'MICE Destination Portfolio · 2027',
  title: 'Five African destinations. Matched to your event.',
  intro: 'Most destination decisions in Africa are made from brochures. That is how congresses end up in the wrong city. I have walked the venues, timed the transfers and met the bureaux. Tell me about your event. I will tell you where it belongs.',
  primaryCta: 'Get the 2027 Destination Guide',
  secondaryCta: 'Compare destinations',
  // Stock stand-ins (Unsplash License) until own photos are ready:
  // main Q_KdjKxntH8, left 6vAjp0pscX0, right nf7W_hn6DKQ (unsplash.com/photos/<id>).
  heroPhotos: {
    main: '/images/destinations/hub-main.jpg',
    left: '/images/destinations/hub-plenary.jpg',
    right: '/images/destinations/hub-incentive.jpg',
  },
  heroPhotoAlts: {
    main: 'A conference room set with round tables and three projection screens',
    left: 'A speaker on stage before a large plenary audience',
    right: 'Elephants seen from an open safari vehicle',
  },
  portfolio: {
    eyebrow: 'The portfolio',
    title: 'Choose by event, not by postcard.',
    body: 'Filter by the kind of event you are planning. Each destination page carries a venue snapshot, access details and a sample programme.',
    allLabel: 'All destinations',
    emptyLabel: 'No destinations match that event type yet.',
  },
  compare: {
    eyebrow: 'Side by side',
    title: 'The comparison planners ask me for.',
    body: 'Capacities come from venue confirmations.',
  },
  combos: {
    eyebrow: 'Signature combinations',
    title: 'One trip. Two reasons to attend.',
    body: 'Attendance rises when the destination is part of the programme. These pairings are built for 2027.',
  },
  servicesIntro: {
    eyebrow: 'How to work with me',
    title: 'Start small. Decide with evidence.',
    featuredTag: 'Most requested',
  },
  stats: [
    { value: '5', label: 'African destinations' },
    { value: 'Since 2020', label: 'In business events' },
    { value: 'CEM · CEPA', label: 'Certified exhibition and event professional' },
    { value: 'Pan-African', label: 'From bid development to execution' },
  ],
  comparisonUpdated: 'November 2026',
  signatureCombos: [
    { countries: 'Zimbabwe + Zambia', title: 'Victoria Falls Twin-Destination', body: 'Meet on one side of the Falls. Celebrate on the other. A leadership retreat or incentive with two countries, one wonder and no long transfers.', meta: '4 nights · 40 to 300 guests' },
    { countries: 'Rwanda', title: 'Kigali Congress + Gorilla Post-tour', body: 'A disciplined congress city, followed by the experience delegates talk about for years. Built for associations that need both.', meta: '3 congress days + 2 post-tour days' },
    { countries: 'Kenya', title: 'Nairobi Summit + Mara Incentive', body: 'Regional summit in the capital, then a short flight to the Maasai Mara for top performers or VIP delegates.', meta: '3 summit days + 2 safari days' },
  ],
  services: [
    { price: 'Free', title: '2027 Destination Guide', body: 'All five destinations in one PDF. Venue snapshots, access notes, best-fit events and seasons.', cta: 'Download the guide', featured: false },
    { price: '$150 · fixed', title: 'Destination Shortlist Report', body: 'Three destinations ranked for your specific event. Venue fit, delegate access, cost bands and the risks nobody puts in a brochure. Delivered in 3 working days.', cta: 'Order a shortlist', featured: true },
    { price: 'By proposal', title: 'Bid and Site Inspection Advisory', body: 'Bid feasibility, bid coordination and hosted site inspections where I lead your committee through the venues. Destination representation for bureaux.', cta: 'Make an Enquiry', featured: false },
  ],
  pipeline: {
    eyebrow: 'Africa MICE Dashboard',
    title: 'Which congresses could your destination win for 2027 to 2029?',
    body: 'I track international association events that rotate into Africa. Bureaux and associations use the pipeline to bid early, not late.',
    ctaLabel: 'Find out more',
    ctaHref: 'https://africamicedashboard.netlify.app',
  },
  enquiry: {
    eyebrow: 'Planning for 2027?',
    title: 'Tell me about your event.',
    body: 'You will receive the 2027 Destination Guide straight away. If your brief fits, I will reply within two working days with a suggested next step.',
    talkFirst: 'Prefer to talk first?',
    contactLine: '+263 777 098 756 · nandie@farirainandipa.co.zw',
    eventTypeOptions: ['Association congress', 'Corporate meeting', 'Incentive trip', 'Government summit', 'Exhibition'],
    delegateOptions: ['Under 100', '100 to 500', '500 to 1,500', '1,500 or more'],
    datesPlaceholder: 'e.g. Q3 2027, flexible',
    notSureLabel: 'Not sure yet',
    submitLabel: 'Make an Enquiry',
    successTitle: 'Thank you. Your enquiry is in.',
    successBody: 'I will reply within two working days with a suggested next step.',
  },
};

// Shared across the destination brief forms and the hub enquiry form.
export const guide = {
  // Set to '/downloads/2027-destination-guide.pdf' once the PDF is in public/downloads/.
  // While empty, the confirmation says the guide will be emailed instead.
  pdfUrl: '',
  downloadLabel: 'Download the 2027 Destination Guide',
  emailedLine: 'We will email the guide to you.',
};

// ---- Destination page template copy (section headings shared by every destination) ----

export const destinationTemplate = {
  breadcrumbRoot: 'Destinations',
  briefCta: (name: string) => `Request the ${name} Destination Brief`,
  whyEyebrow: (name: string) => `Why ${name}`,
  whyTitle: 'Three reasons it wins the shortlist.',
  venueEyebrow: 'Venue snapshot',
  venueTitle: 'Where your event could sit.',
  venueNote: 'Capacities confirmed [MONTH YEAR]. Full floor plans in the Destination Brief.',
  accessTitle: 'Getting delegates there',
  accessLabels: { flights: 'Flights', entry: 'Entry and visas', transfers: 'Transfers' },
  experiencesEyebrow: 'Beyond the plenary',
  experiencesTitle: 'Experiences delegates remember.',
  programmeEyebrow: 'Sample programme',
  pipelineEyebrow: 'From the Africa MICE Dashboard',
  pipelineTitle: (name: string) => `Congresses ${name} could bid for`,
  pipelineBody: "Associations rotating into Africa in the next three years, matched to this destination's capacity.",
  briefTitle: (name: string) => `Considering ${name} for 2027?`,
  briefBody: 'Get the full Destination Brief, with floor plans, rate bands, supplier contacts and my complete inspection notes.',
  briefSubmit: 'Send me the brief',
  briefSuccess: 'Thank you. Your brief request is in.',
  shortlistLink: 'Or order a Destination Shortlist Report',
};
