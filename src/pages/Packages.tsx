import { Link } from 'react-router-dom';
import ScrollFade from '../components/ScrollFade';
import { MapPin, Clock, ArrowRight, Building2, Briefcase, Landmark } from 'lucide-react';

const conferencePackages = [
  {
    venue: 'Harare International Conference Centre',
    country: 'Zimbabwe',
    region: 'Southern Africa',
    description:
      'State-of-the-art facilities in the heart of Zimbabwe\'s capital, ideal for pan-African summits, regional association conferences, and government meetings.',
    capacity: 'Up to 2 000 delegates',
    image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    venue: 'Cape Town International Convention Centre',
    country: 'South Africa',
    region: 'Southern Africa',
    description:
      'One of Africa\'s premier MICE destinations offering world-class infrastructure, excellent airlift, and an exceptional delegate experience.',
    capacity: 'Up to 10 000 delegates',
    image: 'https://images.pexels.com/photos/2774197/pexels-photo-2774197.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    venue: 'Kigali Convention Centre',
    country: 'Rwanda',
    region: 'East Africa',
    description:
      'A landmark destination for East African conferences, recognized globally for its accessibility, safety, and innovation-driven meeting environment.',
    capacity: 'Up to 5 000 delegates',
    image: 'https://images.pexels.com/photos/1308624/pexels-photo-1308624.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    venue: 'Sandton Convention Centre',
    country: 'South Africa',
    region: 'Southern Africa',
    description:
      'Located in Africa\'s financial hub, offering premium conference facilities, extensive hotel options, and strong connectivity for business events.',
    capacity: 'Up to 6 000 delegates',
    image: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    venue: 'Victoria Falls Conference Resort',
    country: 'Zimbabwe / Zambia',
    region: 'Southern Africa',
    description:
      'A unique bush conference destination at one of the world\'s natural wonders, combining world-class meeting facilities with a memorable African experience.',
    capacity: 'Up to 500 delegates',
    image: 'https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    venue: 'Nairobi Convention Precinct',
    country: 'Kenya',
    region: 'East Africa',
    description:
      'A rapidly growing MICE hub well-positioned for United Nations agencies, NGO conferences, and East African trade events.',
    capacity: 'Up to 3 000 delegates',
    image: 'https://images.pexels.com/photos/1181435/pexels-photo-1181435.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

const incentivePackages = [
  {
    destination: 'Victoria Falls, Zimbabwe and Zambia',
    duration: '4 Nights / 5 Days',
    highlights: [
      'Sunset cruise on the Zambezi River',
      'Helicopter flight over the falls',
      'Bush walk with expert guides',
      'Bespoke gala dinner at the gorge',
    ],
    image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    destination: 'Cape Winelands and Garden Route, South Africa',
    duration: '5 Nights / 6 Days',
    highlights: [
      'Private wine estate experiences',
      'Garden Route coastal journey',
      'Whale watching (seasonal)',
      'Team-building culinary workshop',
    ],
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    destination: 'Zanzibar Island, Tanzania',
    duration: '5 Nights / 6 Days',
    highlights: [
      'Private beach resort buyout',
      'Spice farm and culture tour',
      'Dhow sunset sailing experience',
      'Luxury spa & wellness programme',
    ],
    image: 'https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    destination: 'Serengeti and Ngorongoro, Tanzania',
    duration: '6 Nights / 7 Days',
    highlights: [
      'Private game drive vehicles',
      'Bush camp dining experience',
      'Hot air balloon safari',
      'Maasai cultural exchange',
    ],
    image: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    destination: 'Okavango Delta, Botswana',
    duration: '4 Nights / 5 Days',
    highlights: [
      'Exclusive mokoro (canoe) expeditions',
      'Private island bush camp',
      'Big 5 game viewing on foot',
      'Star gazing with astronomers',
    ],
    image: 'https://images.pexels.com/photos/3889877/pexels-photo-3889877.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

const exhibitionTours = [
  {
    sector: 'Mining & Resources',
    exhibition: 'Mining Indaba, Cape Town, South Africa',
    region: 'Southern Africa',
    description:
      'Africa\'s largest and most influential mining investment conference. We curate hosted buyer tours connecting mining professionals with project developers and investors.',
    image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    sector: 'Tourism & Hospitality',
    exhibition: 'Africa\'s Travel Indaba, Durban, South Africa',
    region: 'Southern Africa',
    description:
      'Southern Africa\'s premier travel trade show. We facilitate exhibition tours for tourism boards, hotel groups, and tour operators seeking African market access.',
    image: 'https://images.pexels.com/photos/2774197/pexels-photo-2774197.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    sector: 'Agriculture & Agribusiness',
    exhibition: 'Agra Agricultural Show, Namibia',
    region: 'Southern Africa',
    description:
      'Southern Africa\'s leading agricultural exhibition. Ideal for agribusiness companies seeking market intelligence and trade connections across SADC.',
    image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    sector: 'Technology & Innovation',
    exhibition: 'Africa Tech Festival, Cape Town, South Africa',
    region: 'Southern Africa',
    description:
      'The continent\'s leading technology, mobile, and fintech event. We coordinate delegation tours for tech companies, start-ups, and digital economy stakeholders.',
    image: 'https://images.pexels.com/photos/1181435/pexels-photo-1181435.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    sector: 'Trade & Commerce',
    exhibition: 'Zimbabwe International Trade Fair (ZITF), Bulawayo',
    region: 'Zimbabwe / SADC',
    description:
      'Zimbabwe\'s flagship trade show attracting exhibitors and buyers from across Africa. We provide comprehensive support for international delegations attending ZITF.',
    image: 'https://images.pexels.com/photos/1114425/pexels-photo-1114425.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    sector: 'Real Estate & Infrastructure',
    exhibition: 'AfriCities Summit, Various African Cities',
    region: 'Pan-African',
    description:
      'A continental platform for African city leaders, developers, and investors. We organise delegation packages for mayors, urban planners, and infrastructure companies.',
    image: 'https://images.pexels.com/photos/1308624/pexels-photo-1308624.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
];

export default function Packages() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#BCD8D4]/20 py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none pr-12 opacity-[0.05]">
          <img
            src="/FN_MICE_(1920_x_1080_px).png"
            alt=""
            aria-hidden="true"
            className="w-[35%] max-w-sm"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <nav className="font-['Inter'] text-sm mb-8">
              <span className="text-[#3A3A3A]/60">Home</span>
              <span className="mx-2 text-[#3A3A3A]/40">/</span>
              <span className="text-[#21436A] font-medium">Packages</span>
            </nav>
            <h1 className="font-['Cormorant_Garamond'] text-4xl lg:text-5xl font-semibold text-[#21436A] mb-4">
              Packages
            </h1>
            <p className="font-['Inter'] text-lg text-[#3A3A3A] max-w-2xl leading-relaxed">
              From conference hosting to incentive travel and exhibition tours, Farirai Nandipa Events
              offers curated packages across Africa and beyond. Browse our offerings below and send us
              an enquiry to discuss your requirements.
            </p>
          </ScrollFade>
        </div>
      </section>

      {/* Section 1: Conferences */}
      <section className="bg-white py-16 lg:py-24" id="conferences">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-[#BCD8D4] rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-[#21436A]" />
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A]">
                Conferences
              </h2>
            </div>
            <p className="font-['Inter'] text-base text-[#3A3A3A] max-w-3xl mb-12 leading-relaxed">
              We work with leading conference venues across Africa, supporting bid development,
              programme design, delegate logistics, and full event management. Below are destination
              and venue options we regularly work with.
            </p>
          </ScrollFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {conferencePackages.map((pkg, index) => (
              <ScrollFade key={pkg.venue} delay={index * 80}>
                <article className="group border border-gray-200 rounded-lg overflow-hidden hover:border-[#BCD8D4] hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                  <div className="aspect-[16/9] overflow-hidden">
                    {/* PLACEHOLDER: Replace with real venue/destination photo */}
                    <img
                      src={pkg.image}
                      alt={`${pkg.venue}, ${pkg.country}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-[#3A3A3A]/60 mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-['Inter'] text-xs">{pkg.country} · {pkg.region}</span>
                    </div>
                    <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#21436A] mb-2">
                      {pkg.venue}
                    </h3>
                    <p className="font-['Inter'] text-sm text-[#3A3A3A] leading-relaxed mb-3 flex-1">
                      {pkg.description}
                    </p>
                    <p className="font-['Inter'] text-xs text-[#21436A] font-medium mb-4">
                      {pkg.capacity}
                    </p>
                    <Link
                      to="/contact?service=packages-conferences"
                      className="inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200"
                    >
                      Enquire about this venue
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              </ScrollFade>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: Incentive Travel */}
      <section className="bg-[#BCD8D4]/15 py-16 lg:py-24" id="incentive-travel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-[#21436A] rounded-lg flex items-center justify-center flex-shrink-0">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A]">
                Incentive Travel
              </h2>
            </div>
            <p className="font-['Inter'] text-base text-[#3A3A3A] max-w-3xl mb-12 leading-relaxed">
              Reward and motivate your top performers with curated African incentive travel experiences.
              We design and manage bespoke itineraries that combine authentic African experiences with
              premium hospitality and seamless logistics.
            </p>
          </ScrollFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {incentivePackages.map((pkg, index) => (
              <ScrollFade key={pkg.destination} delay={index * 80}>
                <article className="group bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                  <div className="aspect-[16/9] overflow-hidden">
                    {/* PLACEHOLDER: Replace with real destination photo */}
                    <img
                      src={pkg.image}
                      alt={pkg.destination}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-[#3A3A3A]/60 mb-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="font-['Inter'] text-xs">{pkg.duration}</span>
                    </div>
                    <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#21436A] mb-3">
                      {pkg.destination}
                    </h3>
                    <ul className="space-y-1.5 mb-4 flex-1">
                      {pkg.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-[#BCD8D4] rounded-full mt-1.5 flex-shrink-0" />
                          <span className="font-['Inter'] text-sm text-[#3A3A3A]">{h}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to="/contact?service=packages-incentive"
                      className="inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200 mt-2"
                    >
                      Enquire about this package
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              </ScrollFade>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Exhibition Tours */}
      <section className="bg-white py-16 lg:py-24" id="exhibition-tours">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-[#BCD8D4] rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-[#21436A]" />
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A]">
                Exhibition Tours
              </h2>
            </div>
            <p className="font-['Inter'] text-base text-[#3A3A3A] max-w-3xl mb-12 leading-relaxed">
              We organise targeted sector exhibition tours, giving your delegation focused market access
              at Africa's leading trade shows and exhibitions. From logistics to matched business meetings,
              we manage the full tour programme.
            </p>
          </ScrollFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {exhibitionTours.map((tour, index) => (
              <ScrollFade key={tour.sector} delay={index * 80}>
                <article className="group border border-gray-200 rounded-lg overflow-hidden hover:border-[#BCD8D4] hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                  <div className="aspect-[16/9] overflow-hidden relative">
                    {/* PLACEHOLDER: Replace with real exhibition/sector photo */}
                    <img
                      src={tour.image}
                      alt={`${tour.sector}, ${tour.exhibition}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#21436A] text-white text-xs font-['Inter'] px-3 py-1 rounded">
                        {tour.sector}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-[#3A3A3A]/60 mb-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="font-['Inter'] text-xs">{tour.region}</span>
                    </div>
                    <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#21436A] mb-2">
                      {tour.exhibition}
                    </h3>
                    <p className="font-['Inter'] text-sm text-[#3A3A3A] leading-relaxed mb-4 flex-1">
                      {tour.description}
                    </p>
                    <Link
                      to="/contact?service=packages-exhibition-tours"
                      className="inline-flex items-center gap-2 text-[#21436A] font-['Inter'] text-sm font-medium hover:text-[#BCD8D4] transition-colors duration-200"
                    >
                      Enquire about this tour
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              </ScrollFade>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="bg-[#21436A] py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
          <img
            src="/FN_MICE_(1920_x_1080_px).png"
            alt=""
            aria-hidden="true"
            className="w-[50%] max-w-lg brightness-0 invert"
          />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-2xl lg:text-3xl font-semibold text-white mb-4">
              Ready to explore a bespoke package?
            </h2>
            <p className="font-['Inter'] text-base text-white/80 mb-8 max-w-xl mx-auto">
              Our packages are fully customisable. Get in touch and we'll design the perfect
              conference, incentive, or exhibition tour experience for your organisation.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-[#BCD8D4] text-[#21436A] px-8 py-3.5 font-['Inter'] text-sm font-medium rounded hover:bg-white transition-colors duration-200"
            >
              Make an Enquiry
              <ArrowRight className="w-4 h-4" />
            </Link>
          </ScrollFade>
        </div>
      </section>
    </div>
  );
}
