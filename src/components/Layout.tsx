import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import OrganizationSchema from './OrganizationSchema';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <OrganizationSchema />
      <Header />
      <main className="flex-grow pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
