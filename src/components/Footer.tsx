import { Link } from 'react-router-dom';
import { Phone, Mail, Globe, Linkedin, Instagram } from 'lucide-react';

const quickLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Packages', path: '/packages' },
  { name: 'Insights', path: '/insights' },
  { name: 'Contact', path: '/contact' },
];

export default function Footer() {
  return (
    <footer className="bg-[#21436A] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img
              src="/FN_MICE_(1920_x_1080_px).png"
              alt="Farirai Nandipa Events"
              className="h-[67px] w-auto mb-4 brightness-0 invert"
            />
            <p className="font-['Cormorant_Garamond'] text-sm tracking-[0.2em] uppercase text-white/70 mb-3">
              Events Management & MICE Agency
            </p>
            <p className="font-['Inter'] text-sm text-white/70 leading-relaxed">
              Strategic partners in the business of events, building Africa's MICE capacity through expertise and collaboration.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold mb-4">
              Services
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200">
                  Conferences & Meetings
                </Link>
              </li>
              <li>
                <Link to="/services" className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200">
                  Strategic Consulting
                </Link>
              </li>
              <li>
                <Link to="/services" className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200">
                  Exhibition Management
                </Link>
              </li>
              <li>
                <Link to="/packages" className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200">
                  Packages
                </Link>
              </li>
              <li>
                <Link to="/services" className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200">
                  Training
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#BCD8D4] flex-shrink-0" />
                <a
                  href="tel:+263777098756"
                  className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200"
                >
                  +263 777 098 756
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#BCD8D4] flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:admin@farirainandipa.co.zw"
                  className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200 break-all"
                >
                  admin@farirainandipa.co.zw
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#BCD8D4] flex-shrink-0" />
                <a
                  href="https://www.farirainandipa.co.zw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-['Inter'] text-sm text-white/75 hover:text-[#BCD8D4] transition-colors duration-200"
                >
                  www.farirainandipa.co.zw
                </a>
              </li>
            </ul>
            {/* Social Icons */}
            <div className="flex gap-4 mt-6">
              <a
                href="#"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#BCD8D4] hover:text-[#21436A] transition-colors duration-200"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#BCD8D4] hover:text-[#21436A] transition-colors duration-200"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/20 text-center">
          <p className="font-['Inter'] text-sm text-white/50">
            © {new Date().getFullYear()} Farirai Nandipa Events. Events Management & MICE Agency
          </p>
        </div>
      </div>
    </footer>
  );
}
