import { lazy } from 'react';
import type { RouteRecord } from 'vite-react-ssg';
import Layout from './components/Layout';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Packages = lazy(() => import('./pages/Packages'));
const Insights = lazy(() => import('./pages/Insights'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const Contact = lazy(() => import('./pages/Contact'));

// Routes are defined as data (not <Routes> JSX) so vite-react-ssg can
// prerender each static route to real HTML at build time. Lazy page imports
// keep per-route code-splitting; vite-react-ssg waits for Suspense to resolve
// during prerender, so the split routes still emit full static markup.
// The dynamic /insights/:slug route has no getStaticPaths, so it is left
// client-rendered (article data is fetched from Supabase at runtime).
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    entry: 'src/components/Layout.tsx',
    children: [
      { index: true, element: <Home />, entry: 'src/pages/Home.tsx' },
      { path: 'about', element: <About />, entry: 'src/pages/About.tsx' },
      { path: 'services', element: <Services />, entry: 'src/pages/Services.tsx' },
      { path: 'packages', element: <Packages />, entry: 'src/pages/Packages.tsx' },
      { path: 'insights', element: <Insights />, entry: 'src/pages/Insights.tsx' },
      { path: 'insights/:slug', element: <ArticleDetail />, entry: 'src/pages/ArticleDetail.tsx' },
      { path: 'contact', element: <Contact />, entry: 'src/pages/Contact.tsx' },
    ],
  },
];
