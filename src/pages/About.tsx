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
  { name: 'SA Events Council', fullName: 'South Africa Events Council' },
];

const highlights = [
  'Founder of the Institute of Events Professionals in Zimbabwe (IEPZ)',
  '15+ years of experience in the events industry',
  'Niche Partners Fellow — MICE Research & Business Development',
];

export default function About() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-[#BCD8D4]/20 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Founder Bio Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Photo */}
            <ScrollFade direction="right">
              <div className="relative">
                <div className="aspect-[4/5] bg-gray-100 rounded-lg overflow-hidden">
                  {/* PLACEHOLDER: Replace with professional headshot of Farirai Nandipa */}
                  <img
                    src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Farirai Nandipa - Professional headshot"
                    className="w-full h-full object-cover"
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
                  Farirai Nandipa is a distinguished MICE consultant with over 15 years of experience
                  in the events industry. As the founder of the Institute of Events Professionals in
                  Zimbabwe (IEPZ), she has been instrumental in professionalizing the events sector
                  and establishing industry standards across the country.
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
                  practices and deep Pan-African expertise. Her work spans from leading conference
                  bids to developing MICE policy frameworks for destinations across the continent.
                </p>
              </ScrollFade>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-[#BCD8D4]/30 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-[#21436A] text-center mb-12">
              Certifications
            </h2>
          </ScrollFade>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {credentials.map((cert, index) => (
              <ScrollFade key={cert.title} delay={index * 100}>
                <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                  <div className="w-14 h-14 bg-[#21436A] rounded-full flex items-center justify-center mx-auto mb-4">
                    <cert.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#21436A] mb-2">
                    {cert.title}
                  </h3>
                  <p className="font-['Inter'] text-sm text-[#3A3A3A]">{cert.description}</p>
                </div>
              </ScrollFade>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Approach */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ScrollFade delay={0}>
              <div className="border border-gray-200 p-8 rounded-lg hover:border-[#BCD8D4] transition-colors duration-300">
                <Globe className="w-10 h-10 text-[#BCD8D4] mb-4" />
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#21436A] mb-3">
                  Global Best Practices
                </h3>
                <p className="font-['Inter'] text-base text-[#3A3A3A] leading-relaxed">
                  Bringing international MICE standards and methodologies to African destinations,
                  ensuring world-class event delivery.
                </p>
              </div>
            </ScrollFade>

            <ScrollFade delay={100}>
              <div className="border border-gray-200 p-8 rounded-lg hover:border-[#BCD8D4] transition-colors duration-300">
                <Users className="w-10 h-10 text-[#BCD8D4] mb-4" />
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#21436A] mb-3">
                  Pan-African Perspective
                </h3>
                <p className="font-['Inter'] text-base text-[#3A3A3A] leading-relaxed">
                  Deep understanding of African markets, cultures, and opportunities — positioning
                  the continent as a premier MICE destination.
                </p>
              </div>
            </ScrollFade>

            <ScrollFade delay={200}>
              <div className="border border-gray-200 p-8 rounded-lg hover:border-[#BCD8D4] transition-colors duration-300">
                <Leaf className="w-10 h-10 text-[#BCD8D4] mb-4" />
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#21436A] mb-3">
                  Sustainability Focus
                </h3>
                <p className="font-['Inter'] text-base text-[#3A3A3A] leading-relaxed">
                  Integrating environmental and social responsibility into all MICE projects,
                  building events that create lasting positive impact.
                </p>
              </div>
            </ScrollFade>
          </div>
        </div>
      </section>

      {/* Memberships */}
      <section className="bg-[#21436A] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollFade>
            <h2 className="font-['Cormorant_Garamond'] text-3xl lg:text-4xl font-semibold text-white text-center mb-12">
              Memberships
            </h2>
          </ScrollFade>

          <ScrollFade delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {memberships.map((membership) => (
                <div
                  key={membership.name}
                  className="bg-white/10 border border-white/20 p-6 rounded-lg text-center hover:bg-white/15 transition-colors duration-200"
                >
                  <p className="font-['Inter'] text-sm font-bold text-white mb-1">
                    {membership.name}
                  </p>
                  <p className="font-['Inter'] text-xs text-white/70">{membership.fullName}</p>
                </div>
              ))}
            </div>
          </ScrollFade>
        </div>
      </section>
    </div>
  );
}
