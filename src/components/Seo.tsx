import { useEffect } from 'react';
import { Head } from 'vite-react-ssg';

const SITE_URL = 'https://www.farirainandipa.co.zw';
const DEFAULT_OG_IMAGE = `${SITE_URL}/FN_MICE_(1920_x_1080_px).png`;

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article';
}

// Keep a single <meta>/<link> of the given selector in sync on the client,
// creating it if the prerendered document didn't already have one.
function syncHeadTag(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  apply(el);
}

export default function Seo({ title, description, path, image = DEFAULT_OG_IMAGE, type = 'website' }: SeoProps) {
  const url = `${SITE_URL}${path}`;

  // The bundled react-helmet-async (via vite-react-ssg's <Head>) writes the
  // correct head on the server/prerender and on hard loads, but does not update
  // it on client-side (SPA) navigation. This effect keeps the user-facing and
  // canonical head values correct as the user moves between routes. Crawlers
  // load each route fresh, so they always get the prerendered <Head> output.
  useEffect(() => {
    document.title = title;
    syncHeadTag(
      'meta[name="description"]',
      () => Object.assign(document.createElement('meta'), { name: 'description' }),
      (el) => el.setAttribute('content', description)
    );
    syncHeadTag(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement('link'), { rel: 'canonical' }),
      (el) => el.setAttribute('href', url)
    );
  }, [title, description, url]);

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Farirai Nandipa Events" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
