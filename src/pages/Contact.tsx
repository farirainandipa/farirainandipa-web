import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ScrollFade from '../components/ScrollFade';
import {
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const serviceCategories = [
  { value: '', label: 'Select a service' },
  { value: 'conferences', label: 'Conferences & Meetings Management' },
  { value: 'strategic', label: 'Strategic & Specialised Consulting' },
  { value: 'exhibitions', label: 'Exhibition Management' },
  { value: 'travel', label: 'Travel Management' },
  { value: 'packages-conferences', label: 'Conference Packages' },
  { value: 'packages-incentive', label: 'Incentive Travel Packages' },
  { value: 'packages-exhibition-tours', label: 'Exhibition Tour Packages' },
  { value: 'compliance', label: 'Compliance Management' },
  { value: 'training', label: 'Training' },
  { value: 'other', label: 'Other' },
];

const serviceFromUrl: Record<string, string> = {
  conferences: 'conferences',
  strategic: 'strategic',
  exhibitions: 'exhibitions',
  travel: 'travel',
  compliance: 'compliance',
  training: 'training',
  'packages-conferences': 'packages-conferences',
  'packages-incentive': 'packages-incentive',
  'packages-exhibition-tours': 'packages-exhibition-tours',
};

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam && serviceFromUrl[serviceParam]) {
      setFormData((prev) => ({ ...prev, service: serviceFromUrl[serviceParam] }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !formData.name.trim() ||
      !emailRegex.test(formData.email) ||
      !formData.phone.trim() ||
      !formData.service ||
      !formData.message.trim()
    ) {
      setIsSubmitting(false);
      setSubmitStatus('error');
      return;
    }

    try {
      const { error: insertError } = await supabase.from('contact_submissions').insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        service: formData.service,
        message: formData.message.trim(),
        submission_type: 'enquiry',
        status: 'new',
      });

      if (insertError) throw insertError;

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', service: '', message: '' });
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <span className="text-[#21436A] font-medium">Contact</span>
            </nav>
            <h1 className="font-['Cormorant_Garamond'] text-4xl lg:text-5xl font-semibold text-[#21436A] mb-4">
              Make an Enquiry
            </h1>
            <p className="font-['Inter'] text-lg text-[#3A3A3A] max-w-2xl">
              Ready to discuss your event or MICE needs? Send us an enquiry and we'll be in touch shortly.
            </p>
          </ScrollFade>
        </div>
      </section>

      {/* Contact Content */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info Side */}
            <div>
              <ScrollFade direction="right">
                <h2 className="font-['Cormorant_Garamond'] text-2xl lg:text-3xl font-semibold text-[#21436A] mb-8">
                  Get in Touch
                </h2>
              </ScrollFade>

              <ScrollFade delay={100}>
                <div className="space-y-6">
                  <a href="tel:+263777098756" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-[#BCD8D4] rounded-lg flex items-center justify-center group-hover:bg-[#21436A] transition-colors duration-200">
                      <Phone className="w-5 h-5 text-[#21436A] group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div>
                      <p className="font-['Inter'] text-sm text-[#3A3A3A]/60">Phone</p>
                      <p className="font-['Inter'] text-base text-[#21436A] font-medium group-hover:text-[#BCD8D4] transition-colors duration-200">
                        +263 777 098 756
                      </p>
                    </div>
                  </a>

                  <a href="mailto:admin@farirainandipa.co.zw" className="flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-[#BCD8D4] rounded-lg flex items-center justify-center group-hover:bg-[#21436A] transition-colors duration-200">
                      <Mail className="w-5 h-5 text-[#21436A] group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div>
                      <p className="font-['Inter'] text-sm text-[#3A3A3A]/60">Email</p>
                      <p className="font-['Inter'] text-base text-[#21436A] font-medium group-hover:text-[#BCD8D4] transition-colors duration-200">
                        admin@farirainandipa.co.zw
                      </p>
                    </div>
                  </a>

                  <a
                    href="https://www.farirainandipa.co.zw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 bg-[#BCD8D4] rounded-lg flex items-center justify-center group-hover:bg-[#21436A] transition-colors duration-200">
                      <Globe className="w-5 h-5 text-[#21436A] group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div>
                      <p className="font-['Inter'] text-sm text-[#3A3A3A]/60">Website</p>
                      <p className="font-['Inter'] text-base text-[#21436A] font-medium group-hover:text-[#BCD8D4] transition-colors duration-200">
                        www.farirainandipa.co.zw
                      </p>
                    </div>
                  </a>
                </div>
              </ScrollFade>

              {/* WhatsApp Button */}
              <ScrollFade delay={200}>
                <div className="mt-8">
                  <a
                    href="https://wa.me/263777098756"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-[#25D366] text-white px-6 py-3 rounded-lg font-['Inter'] text-sm font-medium hover:bg-[#128C7E] transition-colors duration-200"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Chat on WhatsApp
                  </a>
                </div>
              </ScrollFade>

              {/* Response time note */}
              <ScrollFade delay={300}>
                <div className="mt-8 p-5 bg-[#BCD8D4]/20 rounded-lg border border-[#BCD8D4]/40">
                  <p className="font-['Cormorant_Garamond'] text-lg font-semibold text-[#21436A] mb-1">
                    We respond within 24 hours
                  </p>
                  <p className="font-['Inter'] text-sm text-[#3A3A3A]">
                    All enquiries are reviewed by our team and you'll receive a personalised response from Farirai Nandipa Events.
                  </p>
                </div>
              </ScrollFade>
            </div>

            {/* Enquiry Form */}
            <ScrollFade delay={200} direction="left">
              <div className="bg-[#F9FAFB] p-8 rounded-lg">
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#21436A] mb-6">
                  Send an Enquiry
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block font-['Inter'] text-sm font-medium text-[#21436A] mb-2"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#BCD8D4] focus:ring-2 focus:ring-[#BCD8D4]/20 transition-colors duration-200"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block font-['Inter'] text-sm font-medium text-[#21436A] mb-2"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#BCD8D4] focus:ring-2 focus:ring-[#BCD8D4]/20 transition-colors duration-200"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block font-['Inter'] text-sm font-medium text-[#21436A] mb-2"
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#BCD8D4] focus:ring-2 focus:ring-[#BCD8D4]/20 transition-colors duration-200"
                      placeholder="+263 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="service"
                      className="block font-['Inter'] text-sm font-medium text-[#21436A] mb-2"
                    >
                      Area of Interest *
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#BCD8D4] focus:ring-2 focus:ring-[#BCD8D4]/20 transition-colors duration-200 bg-white"
                    >
                      {serviceCategories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block font-['Inter'] text-sm font-medium text-[#21436A] mb-2"
                    >
                      Your Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-['Inter'] text-sm focus:outline-none focus:border-[#BCD8D4] focus:ring-2 focus:ring-[#BCD8D4]/20 transition-colors duration-200 resize-none"
                      placeholder="Tell us about your event, project, or requirements..."
                    />
                  </div>

                  {submitStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-3 rounded-lg">
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="font-['Inter'] text-sm">
                        Thank you! Your enquiry has been received. We'll be in touch within 24 hours.
                      </span>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 px-4 py-3 rounded-lg">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="font-['Inter'] text-sm">
                        Please fill in all required fields correctly and try again.
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-[#21436A] text-white px-6 py-3.5 rounded-lg font-['Inter'] text-sm font-medium hover:bg-[#1a3456] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Enquiry
                      </>
                    )}
                  </button>
                </form>
              </div>
            </ScrollFade>
          </div>
        </div>
      </section>
    </div>
  );
}
