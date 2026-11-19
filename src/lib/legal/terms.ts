import type { LegalDoc } from '@/components/Legal/LegalPage'

const p = (text: string) => ({ type: 'p' as const, text })

export const terms: LegalDoc = {
  title: 'Terms and Conditions',
  updated: '19 November 2026',
  intro:
    'Welcome to Printribe. By accessing or using Printribe website or placing an order, you agree to the following Terms and Conditions. Please read them carefully before proceeding.',
  sections: [
    {
      heading: '1. Acceptance of Terms',
      blocks: [
        p('1.1. The Terms and Conditions apply to all users of the site, including browsers, customers, and merchants. By engaging with Printribe, you accept these terms in full. If you do not agree, please refrain from using Printribe services.'),
        p('1.2. By using Printribe website and services, you confirm that you are at least 18 years old or have parental/guardian consent to use Printribe platform.'),
        p('1.3. These Terms and Conditions form a legally binding agreement between you and Printribe.'),
      ],
    },
    {
      heading: '2. Custom Orders',
      blocks: [
        p('2.1. All merchandise is made-to-order based on the specifications you provide.'),
        p('2.2. Production begins only after your payment is confirmed. For orders that include custom design work, production also begins only after you approve the design.'),
        p('2.3. Once approved, changes cannot be guaranteed and may incur additional costs.'),
        p('2.4. Minor design adjustments may be made to improve print output.'),
      ],
    },
    {
      heading: '3. Design Rights and Content',
      blocks: [
        p('3.1. You must have full rights to any logos, images, or text you upload or request.'),
        p('3.2. You grant Printribe a non-exclusive license to use your content for fulfilling your order and marketing purposes.'),
        p('3.3. Printribe reserves the right to reject designs that are offensive, illegal, or infringe intellectual property.'),
      ],
    },
    {
      heading: '4. Pricing and Payment',
      blocks: [
        p('4.1. All prices are subject to change without prior notice.'),
        p('4.2. In the event of pricing errors, Printribe reserves the right to cancel the order and issue a refund.'),
        p('4.3. Payments are made online through our payment partner, Razorpay (UPI, cards and netbanking). Printribe does not store your card or bank details.'),
      ],
    },
    {
      heading: '5. Shipping and Delivery',
      blocks: [
        p('5.1. Estimated delivery timelines will be communicated during checkout, via email or phone during order confirmation.'),
        p('5.2. Printribe is not liable for delays due to unforeseen circumstances (e.g., courier disruptions, strikes, national holidays, natural calamities, etc.).'),
        p('5.3. Risk and ownership transfer to you upon delivery to the shipping carrier.'),
      ],
    },
    {
      heading: '6. Cancellations and Refunds',
      blocks: [
        p('6.1. Orders can be canceled only before production begins.'),
        p('6.2. Since all items are custom-made, returns or exchanges are not accepted unless the item is defective or incorrectly produced.'),
        p('6.3. If there is a manufacturing error, Printribe will reserve the right to replace the product upon investigation.'),
      ],
    },
    {
      heading: '7. Limitation of Liability',
      blocks: [
        p('7.1. Printribe liability is limited to the value of the product ordered. Printribe shall not be held liable for indirect or consequential damages arising from use or inability to use the product and service.'),
      ],
    },
    {
      heading: '8. Intellectual Property',
      blocks: [p('8.1. All Printribe branding, designs, text, and media are Printribe intellectual property and may not be reused without written permission.')],
    },
    {
      heading: '9. Governing Law',
      blocks: [p('9.1. All terms are governed by the laws of India. Any disputes will be resolved in the courts of Bengaluru, Karnataka.')],
    },
    {
      heading: '10. Modifications to Terms',
      blocks: [p('10.1. Printribe reserves the right to update these Terms at any time. Changes will be posted on this page with an updated effective date.')],
    },
    {
      heading: '11. Contact Us',
      blocks: [p('11.1. If you have questions or concerns about these Terms and Conditions, please contact us at info@theprintribe.com')],
    },
  ],
}
