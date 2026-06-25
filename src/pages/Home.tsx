import { Link } from 'react-router-dom';
import ScrollFade from '../components/ScrollFade';
import {
  CalendarCheck,
  Target,
  BarChart3,
  MapPin,
  Leaf,
  ArrowRight,
} from 'lucide-react';

const expertiseAreas = [
  {
    icon: CalendarCheck,
    title: 'Event Management Services',
    description: 'Full-service events management from concept through to delivery',
  },
  {
    icon: Target,
    title: 'Bid Development',
    description: 'Strategic bid preparation for event hosting opportunities',
  },
  {
    icon: BarChart3,
    title: 'MICE Research & Development',
    description: 'Data-driven insights for business tourism growth',
  },
  {
    icon: MapPin,
    title: 'Destination Marketing & Management',
    description: 'Positioning destinations for MICE success',
  },
  {
    icon: Leaf,
    title: 'Sustainability Frameworks',
    description: 'Integrating environmental responsibility into events',
  },
];

const pastClients = [
  { name: 'Mzurrie Flowers', logo: '/logos/mzurrie-flowers-logo.webp', height: 140 },
  { name: 'Interplant Roses', logo: '/logos/interplant-roses.svg' },
  { name: 'Tambuzi', logo: '/logos/tambuzi.jpg' },
  { name: 'Hazendal Wines', logo: '/logos/hazendal-wines.svg' },
  { name: 'LumaSky Drone Show', logo: '/logos/lumasky.svg', height: 154 },
  { name: 'Kvant Events', logo: '/logos/kvant.png' },
  { name: 'ZB Bank', logo: '/logos/zb-bank.png' },
  { name: 'Zimbabwe National Chamber of Commerce', logo: '/logos/zncc.png' },
  { name: 'Environmental Management Agency', logo: '/logos/ema.png', height: 122 },
  { name: 'Zimbabwe Tourism Authority', logo: '/logos/zta.png', height: 122 },
];

function LogoPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex-shrink-0 h-[70px] w-36 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
      <span className="font-['Inter'] text-xs text-gray-400 font-medium tracking-wide">{name}</span>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* Hero Section — left-aligned content */}
      <section className="relative bg-white min-h-[85vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          {/* PLACEHOLDER: Replace with professional conference or exhibition floor photo, minimum 1920px wide */}
          <img
            src="https://images.pexels.com/photos/1587014/pexels-photo-1587014.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Business conference session with delegates"
            className="w-full h-full object-cover opacity-12"
          />
          {/* Gradient: strong on left (where content sits), fades right */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/20" />
        </div>

        {/* Content — pinned left */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-24 lg:py-32">
          <div className="max-w-xl lg:max-w-2xl">
            <ScrollFade>
              <div className="mb-8">
                <img
                  src="/FN_MICE_(1920_x_1080_px).png"
                  alt="Farirai Nandipa Events"
                  className="h-[120px] lg:h-[168px] w-auto"
                />
                <p className="font-['Cormorant_Garamond'] text-sm lg:text-base tracking-[0.3em] uppercase text-[#3A3A3A] mt-2">
                  Events Management & MICE Agency
                </p>
              </div>
            </ScrollFade>

            <ScrollFade delay={200}>
              <h1 className="font-['Cormorant_Garamond'] text-4xl lg:text-6xl font-semibold text-[#21436A] mb-6">
                Strategic partners in the business of events
              </h1>
            </ScrollFade>

            <ScrollFade delay={400}>
              <p className="font-['Inter'] text-lg text-[#3A3A3A] mb-8 leading-relaxed">
                Expert events management and MICE consultancy across the full value chain —
                from bid development to execution — with a Pan-African perspective on business tourism.
              </p>
            </ScrollFade>

            <ScrollFade delay={600}>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 bg-[#21436A] text-white px-8 py-3.5 font-['Inter'] text-sm font-medium rounded hover:bg-[#1a3456] transition-colors duration-200"
              >
                Make an Enquiry
                <ArrowRight className="w-4 h-4" />
              </Link>
            </ScrollFade>
          </div>
        </div>
      </section>

      {/* Intro Band - Mint Background */}
      <section className="bg-[#BCD8D4] py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollFade>
            <p className="font-['Inter'] text-base lg:text-lg text-[#21436A] leading-relaxed">
              Farirai Nandipa Events is an events management and MICE agency based in Zimbabwe,
              specializing in the strategic planning, development, and execution of business events
              within the Meetings, Incentives, Conferences, and Exhibitions value chain. We offer a
              Pan-African perspective on MICE, positioning ourselves as strategic partners in the
              development of business tourism.
            </p>
          </ScrollFade>
        </div>
      </section>

      {/* Expertise Highlights */}
      <section className="bg-white py-20 lg:py-28 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A] text-center mb-4">
              Our Expertise
            </h2>
            <p className="font-['Inter'] text-base text-[#3A3A3A] text-center mb-12 max-w-2xl mx-auto">
              Delivering comprehensive events management and MICE solutions for organisations across Africa and beyond.
            </p>
          </ScrollFade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
            {expertiseAreas.map((area, index) => (
              <ScrollFade key={area.title} delay={index * 100}>
                <div className="bg-[#F9FAFB] p-6 rounded-lg hover:shadow-lg transition-shadow duration-300 h-full group">
                  <div className="w-12 h-12 bg-[#BCD8D4] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#21436A] transition-colors duration-300">
                    <area.icon className="w-6 h-6 text-[#21436A] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#21436A] mb-2">
                    {area.title}
                  </h3>
                  <p className="font-['Inter'] text-sm text-[#3A3A3A] leading-relaxed">
                    {area.description}
                  </p>
                </div>
              </ScrollFade>
            ))}
          </div>
        </div>
      </section>

      {/* How We Help */}
      <section className="bg-[#BCD8D4]/30 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-2xl lg:text-3xl font-semibold text-[#21436A] mb-6">
              How We Help
            </h2>
            <p className="font-['Inter'] text-base lg:text-lg text-[#3A3A3A] leading-relaxed">
              We support event organizers across Africa and beyond, both on-site and remotely — from
              leading a conference bid and curating a trade exhibition, to facilitating incentive travel
              programs and assisting with MICE policy development.
            </p>
          </ScrollFade>
        </div>
      </section>

      {/* Past Clients — infinite scrolling marquee */}
      <section className="bg-white py-12 lg:py-16 border-y border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <ScrollFade>
            <p className="font-['Inter'] text-sm text-[#3A3A3A] text-center uppercase tracking-wider">
              Who we have worked with
            </p>
          </ScrollFade>
        </div>

        {/* Marquee track — duplicated for seamless loop, pauses on hover */}
        <div className="relative overflow-hidden">
          <div className="marquee-track flex items-center gap-10 w-max">
            {/* First copy */}
            {pastClients.map((client, i) =>
              client.logo ? (
                <img
                  key={`a-${i}`}
                  src={client.logo}
                  alt={client.name}
                  style={{ height: `${client.height ?? 70}px` }}
                  className="flex-shrink-0 w-auto object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                />
              ) : (
                <LogoPlaceholder key={`a-${i}`} name={client.name} />
              )
            )}
            {/* Duplicate for seamless infinite loop */}
            {pastClients.map((client, i) =>
              client.logo ? (
                <img
                  key={`b-${i}`}
                  src={client.logo}
                  alt={client.name}
                  className="flex-shrink-0 h-[70px] w-auto object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                  aria-hidden="true"
                />
              ) : (
                <LogoPlaceholder key={`b-${i}`} name={client.name} />
              )
            )}
          </div>
        </div>
      </section>

      {/* Closing CTA Band */}
      <section className="bg-[#21436A] py-16 lg:py-20 relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-2xl lg:text-3xl font-semibold text-white mb-4">
              Let's plan your next business event
            </h2>
            <p className="font-['Inter'] text-base text-white/80 mb-8 max-w-xl mx-auto">
              Whether you're bidding for a major conference or developing MICE strategy,
              Farirai Nandipa Events is ready to be your strategic partner.
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
