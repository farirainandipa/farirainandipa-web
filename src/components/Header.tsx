import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Packages', path: '/packages' },
  { name: 'Insights', path: '/insights' },
  { name: 'Contact', path: '/contact' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/95'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="/FN_MICE_(1920_x_1080_px).png"
              alt="Farirai Nandipa Events, Events Management and MICE Agency"
              className="h-[62px] w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-['Inter'] text-sm font-medium transition-colors duration-200 ${
                  location.pathname === link.path
                    ? 'text-[#BCD8D4]'
                    : 'text-[#21436A] hover:text-[#BCD8D4]'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {/* Standalone dashboard served outside the SPA, so use a plain anchor for a full page load */}
            <a
              href="/pipeline"
              className="font-['Inter'] text-sm font-medium text-[#21436A] hover:text-[#BCD8D4] transition-colors duration-200"
            >
              Bid Dashboard Login
            </a>
            <Link
              to="/contact"
              className="bg-[#21436A] text-white px-5 py-2.5 font-['Inter'] text-sm font-medium rounded hover:bg-[#1a3456] transition-colors duration-200"
            >
              Make an Enquiry
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-[#21436A]"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden pb-4">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-['Inter'] text-sm font-medium py-2 transition-colors duration-200 ${
                    location.pathname === link.path
                      ? 'text-[#BCD8D4]'
                      : 'text-[#21436A]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {/* Standalone dashboard served outside the SPA, so use a plain anchor for a full page load */}
              <a
                href="/pipeline"
                className="font-['Inter'] text-sm font-medium py-2 text-[#21436A] hover:text-[#BCD8D4] transition-colors duration-200"
              >
                Bid Dashboard Login
              </a>
              <Link
                to="/contact"
                className="bg-[#21436A] text-white px-6 py-2.5 font-['Inter'] text-sm font-medium rounded text-center hover:bg-[#1a3456] transition-colors duration-200"
              >
                Make an Enquiry
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
