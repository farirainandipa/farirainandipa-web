import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Seo from '../components/Seo';
import ServicesSchema from '../components/ServicesSchema';
import ScrollFade from '../components/ScrollFade';
import {
  Users,
  Target,
  LayoutGrid,
  Plane,
  Shield,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ExternalLink,
  Briefcase,
  MapPin,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { supabase, Service, ServiceItem } from '../lib/supabase';

const iconMap: Record<string, LucideIcon> = {
  Users: Users,
  Target: Target,
  LayoutGrid: LayoutGrid,
  Plane: Plane,
  Shield: Shield,
  GraduationCap: GraduationCap,
};

// Sector exhibition tours (moved here from the retired Packages page).
const tradeDelegations = [
  {
    sector: 'Mining & Resources',
    exhibition: 'Mining Indaba, Cape Town, South Africa',
    region: 'Southern Africa',
    description:
      "Africa's largest and most influential mining investment conference. We curate hosted buyer tours connecting mining professionals with project developers and investors.",
  },
  {
    sector: 'Tourism & Hospitality',
    exhibition: "Africa's Travel Indaba, Durban, South Africa",
    region: 'Southern Africa',
    description:
      "Southern Africa's premier travel trade show. We facilitate exhibition tours for tourism boards, hotel groups, and tour operators seeking African market access.",
  },
  {
    sector: 'Agriculture & Agribusiness',
    exhibition: 'Agra Agricultural Show, Namibia',
    region: 'Southern Africa',
    description:
      "Southern Africa's leading agricultural exhibition. Ideal for agribusiness companies seeking market intelligence and trade connections across SADC.",
  },
  {
    sector: 'Technology & Innovation',
    exhibition: 'Africa Tech Festival, Cape Town, South Africa',
    region: 'Southern Africa',
    description:
      "The continent's leading technology, mobile, and fintech event. We coordinate delegation tours for tech companies, start-ups, and digital economy stakeholders.",
  },
  {
    sector: 'Trade & Commerce',
    exhibition: 'Zimbabwe International Trade Fair (ZITF), Bulawayo',
    region: 'Zimbabwe / SADC',
    description:
      "Zimbabwe's flagship trade show attracting exhibitors and buyers from across Africa. We provide comprehensive support for international delegations attending ZITF.",
  },
  {
    sector: 'Real Estate & Infrastructure',
    exhibition: 'AfriCities Summit, Various African Cities',
    region: 'Pan-African',
    description:
      'A continental platform for African city leaders, developers, and investors. We organise delegation packages for mayors, urban planners, and infrastructure companies.',
  },
];

interface ServiceWithItems extends Service {
  service_items: ServiceItem[];
}

function ServiceCard({ category }: { category: ServiceWithItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const IconComponent = iconMap[category.icon_name] || Users;

  return (
    <ScrollFade>
      <div className="border border-gray-200 rounded-lg overflow-hidden hover:border-[#BCD8D4] transition-colors duration-300">
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors duration-200"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#BCD8D4] rounded-lg flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-6 h-6 text-[#21436A]" />
            </div>
            <div className="text-left">
              <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#21436A] lg:text-2xl">
                {category.title}
              </h3>
              <p className="font-['Inter'] text-sm text-[#3A3A3A] hidden sm:block mt-1">
                {category.description}
              </p>
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-[#21436A]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#21436A]" />
          )}
        </button>

        {/* Services List */}
        {isOpen && (
          <div className="p-6 pt-0 mt-2 border-t border-gray-100">
            <p className="font-['Inter'] text-sm text-[#3A3A3A] mb-4 sm:hidden">
              {category.description}
            </p>
            <ul className="space-y-3 mb-6">
              {category.service_items
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#21436A] rounded-full mt-2 flex-shrink-0" />
                    <span className="font-['Inter'] text-sm text-[#3A3A3A]">{item.name}</span>
                  </li>
                ))}
            </ul>
            {category.category_key === 'training' ? (
              <a
                href="https://iepz.org.zw"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200"
              >
                <ExternalLink className="w-4 h-4" />
                Visit IEPZ, Institute of Events Professionals in Zimbabwe
              </a>
            ) : (
              <Link
                to={`/contact?service=${category.category_key}`}
                className="inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200"
              >
                <MessageSquare className="w-4 h-4" />
                Discuss this service
              </Link>
            )}
          </div>
        )}
      </div>
    </ScrollFade>
  );
}

export default function Services() {
  const [services, setServices] = useState<ServiceWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    async function fetchServices() {
      try {
        const { data, error: fetchError } = await supabase
          .from('services')
          .select('*, service_items(*)')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;
        setServices((data as ServiceWithItems[]) || []);
      } catch (err) {
        setError('Failed to load services');
        console.error('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  // ScrollToTop resets to the top on route change, and the services list above
  // loads asynchronously, so scroll to a hash (e.g. #trade-delegations) once it has.
  useEffect(() => {
    if (loading || !location.hash) return;
    const t = window.setTimeout(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
    }, 50);
    return () => window.clearTimeout(t);
  }, [loading, location.hash]);

  return (
    <div>
      <Seo
        title="Our Services | Farirai Nandipa Events"
        description="Comprehensive MICE services from Farirai Nandipa Events, including strategic consulting, bid development, and hands-on event management across Africa."
        path="/services"
      />
      <ServicesSchema />
      {/* Hero Section */}
      <section className="bg-[#BCD8D4]/20 py-16 lg:py-24 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <nav className="font-['Inter'] text-sm mb-8">
              <span className="text-[#3A3A3A]/60">Home</span>
              <span className="mx-2 text-[#3A3A3A]/40">/</span>
              <span className="text-[#21436A] font-medium">Services</span>
            </nav>
            <h1 className="font-['Cormorant_Garamond'] text-4xl lg:text-5xl font-semibold text-[#21436A] mb-4">
              Our Services
            </h1>
            <p className="font-['Inter'] text-lg text-[#3A3A3A] max-w-2xl">
              Comprehensive MICE services tailored to meet your unique needs, from strategic
              consulting to hands-on event management.
            </p>
          </ScrollFade>
        </div>
      </section>

      {/* Services List */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <ScrollFade>
              <p className="font-['Inter'] text-sm text-[#3A3A3A]">
                Select a service category below to explore our offerings.
              </p>
            </ScrollFade>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#21436A] border-t-transparent mx-auto" />
              <p className="font-['Inter'] text-sm text-[#3A3A3A] mt-4">Loading services...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="font-['Inter'] text-sm text-red-600">{error}</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-['Inter'] text-sm text-[#3A3A3A]">
                No services available at the moment. Please check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((category) => (
                <ServiceCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trade Delegations & Hosted Buyer Programmes */}
      <section
        id="trade-delegations"
        aria-labelledby="trade-delegations-h"
        className="bg-[#BCD8D4]/15 py-16 lg:py-24 scroll-mt-20"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <h2
              id="trade-delegations-h"
              className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A] mb-4"
            >
              Trade Delegations & Hosted Buyer Programmes
            </h2>
            <p className="font-['Inter'] text-base text-[#3A3A3A] max-w-3xl mb-10 leading-relaxed">
              We organise targeted sector exhibition tours, giving your delegation focused market access
              at Africa's leading trade shows and exhibitions. From logistics to matched business meetings,
              we manage the full tour programme.
            </p>
          </ScrollFade>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tradeDelegations.map((tour) => (
              <ScrollFade key={tour.exhibition}>
                <article className="h-full bg-white border border-gray-200 rounded-lg p-6 flex flex-col hover:border-[#BCD8D4] transition-colors duration-300">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#BCD8D4] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-[#21436A]" />
                    </div>
                    <div>
                      <p className="font-['Inter'] text-xs font-medium uppercase tracking-wider text-[#3A3A3A]/70">
                        {tour.sector}
                      </p>
                      <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#21436A] lg:text-2xl">
                        {tour.exhibition}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[#3A3A3A]/70 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-['Inter'] text-xs">{tour.region}</span>
                  </div>
                  <p className="font-['Inter'] text-sm text-[#3A3A3A] leading-relaxed mb-4 flex-1">
                    {tour.description}
                  </p>
                  <Link
                    to="/contact?service=packages-exhibition-tours"
                    className="self-start inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200"
                  >
                    Enquire about this tour
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </article>
              </ScrollFade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#21436A] py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-2xl lg:text-3xl font-semibold text-white mb-4">
              Ready to Partner with Us?
            </h2>
            <p className="font-['Inter'] text-base text-white/80 mb-8 max-w-xl mx-auto">
              Let's discuss how our services can support your next event or strategic initiative.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-[#BCD8D4] text-[#21436A] px-8 py-3.5 font-['Inter'] text-sm font-medium rounded hover:bg-white transition-colors duration-200"
            >
              Make an Enquiry
            </Link>
          </ScrollFade>
        </div>
      </section>
    </div>
  );
}
