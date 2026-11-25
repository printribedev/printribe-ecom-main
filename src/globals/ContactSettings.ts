import type { GlobalConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/** The contact details shown on the Contact page. Anything left empty is simply not shown. */
export const ContactSettings: GlobalConfig = {
  slug: 'contact-settings',
  label: 'Contact details',
  // Public: the Contact page needs to read these
  access: { read: () => true, update: authenticated },
  admin: { group: 'Shop' },
  fields: [
    { name: 'email', type: 'email', defaultValue: 'info@theprintribe.com', admin: { description: 'Shown on the Contact page. New enquiries are also emailed here once email sending is set up.' } },
    {
      name: 'whatsapp',
      type: 'text',
      admin: { description: 'WhatsApp number with country code, digits only, for example 919845012345. Leave empty to hide the WhatsApp button.' },
    },
    { name: 'phone', type: 'text', admin: { description: 'Phone number customers can call, for example +91 98450 12345. Leave empty to hide it.' } },
    { name: 'hours', type: 'text', admin: { description: 'For example "Monday to Saturday, 10 am to 6 pm". Leave empty to hide it.' } },
    { name: 'location', type: 'text', defaultValue: 'Bengaluru, India', admin: { description: 'City or full address. Leave empty to hide it.' } },
    {
      name: 'replyTime',
      type: 'text',
      defaultValue: 'within 24 hours',
      admin: { description: 'Shown as "We reply ___" under the enquiry form. Only promise what your team can keep.' },
    },
  ],
}
