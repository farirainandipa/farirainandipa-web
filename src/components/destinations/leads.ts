import { supabase } from '../../lib/supabase';

// Destinations leads go through the same path as the /contact form: an insert
// into `contact_submissions`, which triggers the admin email notification.
// The table has no source/destination columns, so the lead source is carried in
// `service` and the details are folded into `message`.
export async function submitDestinationLead(lead: {
  source: 'destinations-hub' | 'destination-brief';
  email: string;
  name?: string;
  details: string[];
}) {
  const { error } = await supabase.from('contact_submissions').insert({
    name: lead.name?.trim() ?? '',
    email: lead.email.trim(),
    phone: '',
    service: lead.source,
    message: [`Source: ${lead.source}`, ...lead.details].join('\n'),
    submission_type: 'enquiry',
    status: 'new',
  });
  if (error) throw error;
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
