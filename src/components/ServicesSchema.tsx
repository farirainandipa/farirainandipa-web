import { Head } from 'vite-react-ssg';

const SITE_URL = 'https://www.farirainandipa.co.zw';

// Stable brand service offerings (drawn from site copy, not the dynamic
// Supabase list) so the schema is deterministic in the served markup.
const offerings = [
  {
    name: 'Conference & Meeting Management',
    description:
      'Full-service management of conferences, meetings, and business events from concept through to delivery.',
  },
  {
    name: 'Bid Development',
    description:
      'Strategic bid and destination bid preparation for organisations competing to host conferences and congresses across Africa.',
  },
  {
    name: 'Exhibition Management',
    description: 'Planning, curation, and delivery of trade exhibitions and expos.',
  },
  {
    name: 'MICE Strategic Consulting',
    description:
      'Advisory on MICE strategy, business tourism development, and destination marketing and management.',
  },
  {
    name: 'Training',
    description: 'Events and MICE professional training and capacity building.',
  },
];

const servicesSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: offerings.map((offering, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: {
      '@type': 'Service',
      name: offering.name,
      description: offering.description,
      serviceType: offering.name,
      provider: {
        '@type': 'Organization',
        name: 'Farirai Nandipa Events',
        url: SITE_URL,
      },
      areaServed: {
        '@type': 'Place',
        name: 'Africa',
      },
    },
  })),
};

export default function ServicesSchema() {
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(servicesSchema)}</script>
    </Head>
  );
}
