import { Helmet } from 'react-helmet-async';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Farirai Nandipa Events',
  url: 'https://www.farirainandipa.co.zw',
  logo: 'https://www.farirainandipa.co.zw/FN_MICE_(1920_x_1080_px).png',
  description:
    'Farirai Nandipa Events is a leading events management and MICE agency based in Zimbabwe, offering strategic planning, bid development, and full-service event consultancy across Africa.',
  email: 'admin@farirainandipa.co.zw',
  telephone: '+263777098756',
};

export default function OrganizationSchema() {
  return (
    <Helmet defer={false}>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
    </Helmet>
  );
}
