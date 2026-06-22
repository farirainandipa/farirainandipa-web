import { Link } from 'react-router-dom';
import ScrollFade from '../components/ScrollFade';
import {
  Users,
  Target,
  BarChart3,
  MapPin,
  Leaf,
  ArrowRight,
} from 'lucide-react';

const expertiseAreas = [
  {
    icon: Target,
    title: 'Bid Development',
    description: 'Strategic bid preparation for event hosting opportunities',
  },
  {
    icon: Users,
    title: 'Stakeholder Engagement',
    description: 'Building partnerships across government, industry, and tourism bodies',
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

const certifications = [
  'IAEE Member',
  'CEM Certified',
  'CEPA',
  'MPI Member',
  'AAXO Member',
  'SA Events Council',
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-white min-h-[85vh] flex items-center overflow-hidden">
        {/* Background hero image */}
        <div className="absolute inset-0 z-0">
          {/* PLACEHOLDER: Replace with professional conference/event venue photo showing delegates or African convention space */}
          <img
            src="https://images.pexels.com/photos/2774197/pexels-photo-2774197.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Professional conference setting"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        {/* Watermark */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img
            src="/FN_MICE_(1920_x_1080_px).png"
            alt=""
            aria-hidden="true"
            className="w-[55%] max-w-2xl opacity-[0.04]"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <ScrollFade>
            {/* Logo in hero */}
            <div className="mb-8">
              <img
                src="/FN_MICE_(1920_x_1080_px).png"
                alt="Farirai Nandipa Events"
                className="h-20 lg:h-28 w-auto"
              />
              <p className="font-['Cormorant_Garamond'] text-sm lg:text-base tracking-[0.3em] uppercase text-[#3A3A3A] mt-2">
                Events Management & MICE Agency
              </p>
            </div>
          </ScrollFade>

          <ScrollFade delay={200}>
            <h1 className="font-['Cormorant_Garamond'] text-4xl lg:text-6xl font-semibold text-[#21436A] mb-6 max-w-3xl">
              Strategic partners in the business of events
            </h1>
          </ScrollFade>

          <ScrollFade delay={400}>
            <p className="font-['Inter'] text-lg lg:text-xl text-[#3A3A3A] mb-8 max-w-2xl leading-relaxed">
              Expert events management and MICE consultancy across the value chain — from bid development to full event execution — with a Pan-African perspective on business tourism.
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
        {/* Section watermark */}
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none pr-8 opacity-[0.035]">
          <img
            src="/FN_MICE_(1920_x_1080_px).png"
            alt=""
            aria-hidden="true"
            className="w-[40%] max-w-xl"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A] text-center mb-4">
              Our Expertise
            </h2>
            <p className="font-['Inter'] text-base text-[#3A3A3A] text-center mb-12 max-w-2xl mx-auto">
              Delivering comprehensive MICE solutions for organisations across Africa and beyond.
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

      {/* Credibility Strip */}
      <section className="bg-white py-12 lg:py-16 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <p className="font-['Inter'] text-sm text-[#3A3A3A] text-center mb-8 uppercase tracking-wider">
              Certifications & Memberships
            </p>
          </ScrollFade>
          <ScrollFade delay={200}>
            <div className="flex flex-wrap justify-center items-center gap-6 lg:gap-10">
              {certifications.map((cert) => (
                <div
                  key={cert}
                  className="bg-gray-50 px-5 py-3 rounded border border-gray-200 hover:border-[#BCD8D4] transition-colors duration-200"
                >
                  <span className="font-['Inter'] text-xs sm:text-sm text-[#21436A] font-medium">
                    {cert}
                  </span>
                </div>
              ))}
            </div>
          </ScrollFade>
        </div>
      </section>

      {/* Closing CTA Band */}
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
