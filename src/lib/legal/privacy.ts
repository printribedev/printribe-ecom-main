import type { LegalDoc } from '@/components/Legal/LegalPage'

const p = (text: string) => ({ type: 'p' as const, text })
const h3 = (text: string) => ({ type: 'h3' as const, text })
const ul = (...items: string[]) => ({ type: 'ul' as const, items })

export const privacy: LegalDoc = {
  title: 'Privacy Policy',
  updated: '19 November 2026',
  intro:
    'At Printribe, your privacy matters. This Privacy Policy outlines how we collect, use, and safeguard your data when you interact with our website, services, and products. By using our platform, you consent to the practices described in this policy.',
  sections: [
    {
      heading: '1. Information We Collect',
      blocks: [
        p('We may collect the following types of information:'),
        h3('1.1. Personal Information'),
        ul('Name, email, phone number', 'Shipping/billing address and GST details', 'Order details', 'Any files or designs you upload'),
        p('We also collect technical data via cookies (browser type, IP address, pages visited) to improve your experience.'),
        h3('1.2. Usage Data'),
        ul(
          'IP address, browser type, operating system, and device information.',
          'Details about how you interact with our website (e.g., pages visited, features used, session duration).',
        ),
        h3('1.3. Data You Provide'),
        ul('Any content, queries, or files you share for order purposes.', 'Feedback or survey responses submitted through our platform.'),
      ],
    },
    {
      heading: '2. How We Use Your Information',
      blocks: [
        p('We use your information for the following purposes:'),
        ul(
          'To process and deliver your order.',
          'To contact you regarding your inquiry or support request.',
          'To send you order updates or important account notices.',
          'For legal compliance and fraud prevention.',
        ),
      ],
    },
    {
      heading: '3. How We Share Your Information',
      blocks: [
        p('We value your privacy and only share your information under the following circumstances:'),
        ul(
          'With trusted third-party service providers (e.g., payment processors, GST filing) for operational purposes.',
          'To comply with legal requirements or respond to lawful requests from public authorities.',
          'In the event of a business transfer, such as a merger, acquisition, or sale of assets.',
        ),
        p('We do not sell your personal information to third parties.'),
      ],
    },
    {
      heading: '4. Data Security',
      blocks: [
        p('We implement industry-standard measures to protect your data, including encryption, secure servers, and access controls. However, no system is completely secure, and we cannot guarantee the absolute security of your information.'),
      ],
    },
    {
      heading: '5. Cookies and Tracking Technologies',
      blocks: [
        p('Our website uses cookies and similar technologies to:'),
        ul('Enhance your browsing experience.', 'Analyze traffic and usage patterns.', 'Keep the website secure and working properly.'),
        p('You can manage or disable cookies through your browser settings.'),
      ],
    },
    {
      heading: '6. Your Rights',
      blocks: [
        p('Depending on your location, you may have the following rights regarding your data:'),
        ul(
          'Access and Portability: Request a copy of your personal information.',
          'Correction: Update or correct inaccurate information.',
          'Deletion: Request the deletion of your data, subject to legal obligations.',
          'Opt-Out: Unsubscribe from marketing communications or data collection for certain purposes.',
        ),
        p('To exercise these rights, contact us at info@theprintribe.com.'),
      ],
    },
    {
      heading: '7. Third-Party Links',
      blocks: [
        p('Our website may contain links to third-party websites or services. We are not responsible for their privacy practices, and we encourage you to review their policies before sharing your information.'),
      ],
    },
    {
      heading: '8. Changes to This Privacy Policy',
      blocks: [
        p('We may update this Privacy Policy periodically. Any changes will be posted on this page with a new effective date. Continued use of our services after changes are made indicates your acceptance of the updated policy.'),
      ],
    },
  ],
}
