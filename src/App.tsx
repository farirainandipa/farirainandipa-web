import { lazy } from 'react';
import type { RouteRecord } from 'vite-react-ssg';
import Layout from './components/Layout';
import Home from './pages/Home';
import { destinationPagesLive, destinations } from './data/destinations';

const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Destinations = lazy(() => import('./pages/Destinations'));
const DestinationPage = lazy(() => import('./pages/DestinationPage'));
const Insights = lazy(() => import('./pages/Insights'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Contact = lazy(() => import('./pages/Contact'));

// Routes are defined as data (not <Routes> JSX) so vite-react-ssg can
// prerender each static route to real HTML at build time. Lazy page imports
// keep per-route code-splitting; vite-react-ssg waits for Suspense to resolve
// during prerender, so the split routes still emit full static markup.
// The dynamic /insights/:slug route has no getStaticPaths, so it is left
// client-rendered (article data is fetched from Supabase at runtime).
// /destinations/:slug content is static data, so every slug is prerendered
// (only while destinationPagesLive is true; until then the route is left out).
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/components/Layout.tsx',
    children: [
      { index: true, element: <Home />, entry: 'src/pages/Home.tsx' },
      { path: 'about', element: <About />, entry: 'src/pages/About.tsx' },
      { path: 'services', element: <Services />, entry: 'src/pages/Services.tsx' },
      { path: 'destinations', element: <Destinations />, entry: 'src/pages/Destinations.tsx' },
      ...(destinationPagesLive
        ? [
            {
              path: 'destinations/:slug',
              element: <DestinationPage />,
              entry: 'src/pages/DestinationPage.tsx',
              getStaticPaths: () => destinations.map((d) => `destinations/${d.slug}`),
            },
          ]
        : []),
      { path: 'insights', element: <Insights />, entry: 'src/pages/Insights.tsx' },
      { path: 'insights/:slug', element: <ArticleDetail />, entry: 'src/pages/ArticleDetail.tsx' },
      { path: 'contact', element: <Contact />, entry: 'src/pages/Contact.tsx' },
    ],
  },
];
