import { ViteReactSSG } from 'vite-react-ssg';
import { routes } from './App';
import './index.css';

// vite-react-ssg provides the Router and react-helmet-async HelmetProvider
// on both the server (prerender) and the client (hydration), so no manual
// BrowserRouter/HelmetProvider wrapper is needed here.
export const createRoot = ViteReactSSG({ routes });
