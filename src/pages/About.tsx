import Seo from '../components/Seo';
import ScrollFade from '../components/ScrollFade';
import { Award, Globe, Leaf, Users } from 'lucide-react';

const credentials = [
  {
    icon: Award,
    title: 'Certified in Exhibitions Management (CEM)',
    description: 'Internationally recognized certification from IAEE',
  },
  {
    icon: Users,
    title: 'Certified Events Professional Africa (CEPA)',
    description: 'Council of Events Professionals Africa',
  },
  {
    icon: Leaf,
    title: 'Certified in Sustainable Tourism Destination Management',
    description: 'Expertise in sustainable event practices',
  },
];

const memberships = [
  { name: 'IAEE', fullName: 'International Association of Exhibitions & Events' },
  { name: 'MPI', fullName: 'Meeting Professionals International' },
  { name: 'AAXO', fullName: 'Association of African Exhibition Organisers' },
  { name: 'CEPA', fullName: 'Council of Events Professionals Africa' },
];

const highlights = [
  'Founder of the Institute of Events Professionals in Zimbabwe (IEPZ)',
  '15+ years of experience in the events industry',
  'Niche Partners Fellow, MICE Research and Business Development',
  'Council Member, Africa Business Events Council',
];


export default function About() {
  return (
    <div>
      <Seo
        title="About Us | Farirai Nandipa Events"
        description="Meet Farirai Nandipa Events, a strategic events management and MICE agency advancing business tourism across Africa with 15+ years of industry experience."
        path="/about"
      />
      {/* Hero Section */}
      <section className="bg-[#BCD8D4]/20 py-16 lg:py-24 relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <nav className="font-['Inter'] text-sm mb-8">
              <span className="text-[#3A3A3A]/60">Home</span>
              <span className="mx-2 text-[#3A3A3A]/40">/</span>
              <span className="text-[#21436A] font-medium">About</span>
            </nav>
            <h1 className="font-['Cormorant_Garamond'] text-4xl lg:text-5xl font-semibold text-[#21436A] mb-4">
              About Farirai Nandipa Events
            </h1>
            <p className="font-['Inter'] text-lg text-[#3A3A3A] max-w-2xl">
              A strategic events management and MICE agency dedicated to advancing business tourism across Africa.
            </p>
          </ScrollFade>
        </div>
      </section>

      {/* (a) Meet the Founder */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Photo */}
            <ScrollFade direction="right">
              <div className="relative max-w-xs mx-auto lg:max-w-sm lg:mx-0">
                <div className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src="/farirai-nandipa.webp"
                    alt="Farirai Nandipa, Founder, Farirai Nandipa Events"
                    width={896}
                    height={958}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-[#21436A] text-white px-6 py-3 rounded">
                  <p className="font-['Inter'] text-sm font-medium">15+ Years Experience</p>
                </div>
              </div>
            </ScrollFade>

            {/* Bio Content */}
            <div>
              <ScrollFade delay={200}>
                <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A] mb-6">
                  Meet the Founder
                </h2>
              </ScrollFade>

              <ScrollFade delay={300}>
                <p className="font-['Inter'] text-base text-[#3A3A3A] leading-relaxed mb-6">
                  Farirai Nandipa is a distinguished events management and MICE consultant with over
                  15 years of experience in the industry. As the founder of the Institute of Events
                  Professionals in Zimbabwe (IEPZ), she has been instrumental in spearheading the
                  professionalisation of the events sector in Zimbabwe.
                </p>
              </ScrollFade>

              <ScrollFade delay={400}>
                <div className="space-y-3 mb-8">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#BCD8D4] rounded-full mt-2 flex-shrink-0" />
                      <p className="font-['Inter'] text-base text-[#3A3A3A]">{item}</p>
                    </div>
                  ))}
                </div>
              </ScrollFade>

              <ScrollFade delay={500}>
                <p className="font-['Inter'] text-base text-[#3A3A3A] leading-relaxed">
                  With certifications spanning exhibitions management, sustainable tourism, and
                  African events professionalism, Farirai brings a unique blend of global best
                  practices and deep Pan-African expertise. Her work covers event planning and
                  execution, event support for regional and international organisers, bid
                  development and exhibitor training programs.
                </p>
              </ScrollFade>
            </div>
          </div>
        </div>
      </section>

      {/* (b) Memberships & Certifications — directly under Meet the Founder */}
      <section className="bg-[#BCD8D4]/20 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A] text-center mb-12">
              Memberships & Certifications
            </h2>
          </ScrollFade>

          {/* Certifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {credentials.map((cert, index) => (
              <ScrollFade key={cert.title} delay={index * 100}>
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <div className="w-12 h-12 bg-[#21436A] rounded-full flex items-center justify-center mx-auto mb-4">
                    <cert.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#21436A] mb-1">
                    {cert.title}
                  </h3>
                  <p className="font-['Inter'] text-sm text-[#3A3A3A]">{cert.description}</p>
                </div>
              </ScrollFade>
            ))}
          </div>

          {/* Memberships */}
          <ScrollFade delay={200}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {memberships.map((membership) => (
                <div
                  key={membership.name}
                  className="bg-white border border-[#BCD8D4]/60 p-5 rounded-lg text-center hover:border-[#21436A]/30 transition-colors duration-200"
                >
                  <p className="font-['Inter'] text-sm font-bold text-[#21436A] mb-1">
                    {membership.name}
                  </p>
                  <p className="font-['Inter'] text-xs text-[#3A3A3A]/70">{membership.fullName}</p>
                </div>
              ))}
            </div>
          </ScrollFade>
        </div>
      </section>

      {/* Mission & Approach */}
      <section className="bg-[#21436A] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-white text-center mb-12">
              Our Approach
            </h2>
          </ScrollFade>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ScrollFade delay={0}>
              <div className="border border-white/20 p-8 rounded-lg hover:border-[#BCD8D4]/60 transition-colors duration-300">
                <Globe className="w-10 h-10 text-[#BCD8D4] mb-4" />
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-white mb-3">
                  Global Best Practices
                </h3>
                <p className="font-['Inter'] text-base text-white/75 leading-relaxed">
                  Bringing international MICE standards and methodologies to African destinations,
                  ensuring world-class event delivery.
                </p>
              </div>
            </ScrollFade>

            <ScrollFade delay={100}>
              <div className="border border-white/20 p-8 rounded-lg hover:border-[#BCD8D4]/60 transition-colors duration-300">
                <Users className="w-10 h-10 text-[#BCD8D4] mb-4" />
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-white mb-3">
                  Pan-African Perspective
                </h3>
                <p className="font-['Inter'] text-base text-white/75 leading-relaxed">
                  Deep understanding of African markets, cultures, and opportunities, positioning
                  the continent as a premier MICE destination.
                </p>
              </div>
            </ScrollFade>

            <ScrollFade delay={200}>
              <div className="border border-white/20 p-8 rounded-lg hover:border-[#BCD8D4]/60 transition-colors duration-300">
                <Leaf className="w-10 h-10 text-[#BCD8D4] mb-4" />
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-white mb-3">
                  Sustainability Focus
                </h3>
                <p className="font-['Inter'] text-base text-white/75 leading-relaxed">
                  Integrating environmental and social responsibility into all MICE projects,
                  building events that create lasting positive impact.
                </p>
              </div>
            </ScrollFade>
          </div>
        </div>
      </section>
    </div>
  );
}
