/**
 * Legal page copy.
 *
 * These are working drafts that reflect how the platform actually behaves. They
 * are NOT a substitute for review by a licensed U.S. attorney, and the site
 * displays that notice on every legal page.
 */

export type LegalSection = { heading: string; body: string[] };

export type LegalDocument = {
  slug: string;
  title: string;
  summary: string;
  updated: string;
  sections: LegalSection[];
};

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "What personal information Creditxora collects, why we collect it, how it is stored, and the choices you have.",
    updated: "September 2026",
    sections: [
      {
        heading: "Information we collect",
        body: [
          "Information you give us directly: your name, email address, phone number, state and ZIP code when you submit a credit assessment; the concerns, goals and credit situation you describe; and any message you send us.",
          "Documents you upload: credit reports from Experian, Equifax and TransUnion, identity-theft documentation, account statements and other supporting files you choose to provide through the client portal.",
          "Information collected automatically: basic technical data such as browser type and the pages you visit, used to keep the service secure and to understand which parts of the site are useful.",
        ],
      },
      {
        heading: "How we use your information",
        body: [
          "To review your credit reports and identify entries that appear inaccurate, incomplete, outdated or unverifiable.",
          "To prepare and, with your approval, submit disputes and related correspondence to credit bureaus and furnishers.",
          "To operate your client portal, communicate with you about your file, and send service notifications.",
          "To meet legal, regulatory and record-keeping obligations that apply to services of this kind.",
        ],
      },
      {
        heading: "How your information is protected",
        body: [
          "Uploaded documents are encrypted at rest and are accessible only to the staff assigned to your file. They are never transmitted or stored in ordinary email.",
          "Access to client records requires authentication, and staff access is limited by role.",
          "Passwords are stored only as salted one-way hashes. Creditxora staff cannot read your password.",
        ],
      },
      {
        heading: "Sharing your information",
        body: [
          "We share information with credit bureaus and furnishers only as necessary to carry out the work you have approved.",
          "We use service providers (for example hosting and email delivery) that are bound to handle your information solely on our instructions.",
          "We do not sell your personal information, and we do not share it for third-party advertising.",
          "We may disclose information where required by law, legal process, or to protect the rights and safety of our clients and staff.",
        ],
      },
      {
        heading: "Your choices and rights",
        body: [
          "You may request a copy of the personal information we hold about you, ask us to correct it, or ask us to delete it, subject to any records we are required to retain.",
          "You may withdraw consent to be contacted at any time; this may mean we can no longer provide the service.",
          "Depending on your state of residence, you may have additional rights regarding access, deletion, correction and the sale or sharing of personal information.",
          "To exercise any of these rights, contact privacy@creditxora.com.",
        ],
      },
      {
        heading: "Retention",
        body: [
          "Client records and dispute documentation are retained for the period required by applicable federal and state law, and then securely deleted.",
          "Assessment submissions that do not become client files are retained for a limited period and then deleted.",
        ],
      },
      {
        heading: "Cookies",
        body: [
          "This site uses cookies and similar technologies that are strictly necessary for it to function, such as keeping you signed in to your portal.",
          "Where analytics or marketing technologies are used, they are disclosed and, where required, run only with your consent.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    summary:
      "The terms that govern your use of the Creditxora website and client portal.",
    updated: "September 2026",
    sections: [
      {
        heading: "Acceptance",
        body: [
          "By accessing this website or using the Creditxora client portal, you agree to these Terms of Service. If you do not agree, do not use the service.",
        ],
      },
      {
        heading: "What Creditxora provides",
        body: [
          "Creditxora provides credit report review, dispute-support services and credit-building guidance to U.S. consumers.",
          "Creditxora is not a law firm and does not provide legal advice. It is not a credit bureau, a lender, or a debt settlement company.",
          "Nothing on this site is a promise that any specific item will be removed or that your credit score will change by any amount.",
        ],
      },
      {
        heading: "Your responsibilities",
        body: [
          "You agree that the information you provide is accurate and that the documents you upload relate to you and that you are authorised to share them.",
          "You agree not to ask Creditxora to dispute information you know to be accurate, and not to use the service to create a false identity or credit profile.",
          "You are responsible for keeping your portal credentials confidential and for all activity under your account.",
        ],
      },
      {
        heading: "Fees and billing",
        body: [
          "Fees, billing frequency and the services included are set out in the written service agreement you receive before any work begins.",
          "Charges are made only after services have been performed, in the manner set out in that agreement and as permitted by applicable law.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "To the fullest extent permitted by law, Creditxora is not liable for indirect, incidental, special or consequential damages arising from your use of the service.",
          "Creditxora's total liability in connection with the service is limited to the fees you paid in the twelve months preceding the claim.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "We may update these terms. Material changes will be posted on this page with a revised date, and where required, notified to you directly.",
        ],
      },
    ],
  },
  {
    slug: "disclosures",
    title: "Credit Repair Organization Disclosures",
    summary:
      "Required disclosures regarding credit repair services and your rights under federal law.",
    updated: "September 2026",
    sections: [
      {
        heading: "You have the right to do this yourself",
        body: [
          "You have a right to dispute inaccurate information in your credit report by contacting the credit bureau directly. However, neither you nor any credit repair company or credit repair organization has the right to have accurate, current and verifiable information removed from your credit report.",
          "If information in your credit report is accurate, current and verifiable, it will remain on your report for the period the law allows — generally up to seven years, and up to ten years for a bankruptcy.",
        ],
      },
      {
        heading: "Free and low-cost options",
        body: [
          "You have the right to obtain a free copy of your credit report from each nationwide credit bureau through AnnualCreditReport.com.",
          "You may dispute inaccurate information with the credit bureaus yourself, at no cost.",
          "Non-profit credit counselling services may be available in your area at little or no cost.",
        ],
      },
      {
        heading: "Your right to cancel",
        body: [
          "You may cancel your contract with Creditxora, without penalty or obligation, at any time before midnight of the third business day after the date on which you signed the contract.",
          "A written notice of cancellation form is provided with your service agreement. Cancelling is effective when you send written notice to the address shown in that agreement.",
        ],
      },
      {
        heading: "No advance fees",
        body: [
          "Creditxora does not charge or receive money for credit repair services before those services have been fully performed, as required by federal law.",
        ],
      },
      {
        heading: "Complaints",
        body: [
          "You may report any inaccuracies or complaints to the Consumer Financial Protection Bureau at consumerfinance.gov, to the Federal Trade Commission at ftc.gov, or to your state Attorney General's office.",
        ],
      },
    ],
  },
  {
    slug: "consumer-rights",
    title: "Consumer Rights Information",
    summary:
      "A summary of your rights under the Fair Credit Reporting Act and related consumer protection laws.",
    updated: "September 2026",
    sections: [
      {
        heading: "Your rights under the Fair Credit Reporting Act",
        body: [
          "You must be told if information in your file has been used against you — for example, to deny an application for credit, insurance or employment.",
          "You have the right to know what is in your file, and to obtain a free file disclosure in certain circumstances.",
          "You have the right to ask for a credit score, though scores are not always free.",
          "You have the right to dispute incomplete or inaccurate information. Credit bureaus must investigate, generally within 30 days.",
          "Inaccurate, incomplete or unverifiable information must be corrected or deleted by the credit bureau, usually within 30 days.",
          "Credit bureaus may not report outdated negative information — in most cases, information more than seven years old, or ten years for bankruptcies.",
          "Access to your file is limited to those with a valid need, such as creditors, insurers, landlords and employers.",
          "Your consent is required for reports provided to employers.",
          "You may limit prescreened offers of credit and insurance based on information in your credit report.",
          "You may seek damages from violators.",
          "Identity theft victims and active duty military personnel have additional rights.",
        ],
      },
      {
        heading: "Identity theft",
        body: [
          "If you are a victim of identity theft, you may place a fraud alert or a security freeze on your credit file at no cost.",
          "You may file an Identity Theft Report at IdentityTheft.gov, which supports your right to block fraudulent information from appearing on your report.",
          "You are entitled to receive copies of documents relating to fraudulent transactions made in your name.",
        ],
      },
      {
        heading: "Where to learn more",
        body: [
          "For more information, visit the Consumer Financial Protection Bureau at consumerfinance.gov/learnmore, or write to the CFPB at 1700 G Street N.W., Washington, DC 20552.",
        ],
      },
    ],
  },
  {
    slug: "cancellation",
    title: "Cancellation & Refund Policy",
    summary:
      "How to cancel your service, what happens to work in progress, and how refunds are handled.",
    updated: "September 2026",
    sections: [
      {
        heading: "Three-day right to cancel",
        body: [
          "You may cancel your contract with Creditxora, without penalty or obligation, at any time before midnight of the third business day after the date on which you signed the contract. If you cancel within this period, any amounts paid are refunded in full.",
        ],
      },
      {
        heading: "Cancelling at any other time",
        body: [
          "You may cancel at any time by notifying us in writing at support@creditxora.com or through your client portal.",
          "Cancellation takes effect at the end of the service period already paid for. You are not charged for any service period that has not begun.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "Fees are charged only for services already performed. Where a fee has been collected for work that was not performed, that amount is refunded.",
          "Refunds are issued to the original payment method, typically within 5 to 10 business days of approval.",
        ],
      },
      {
        heading: "What happens to your file",
        body: [
          "On cancellation you receive a copy of the written summary and any dispute documentation prepared on your behalf.",
          "Documents you uploaded are retained only as long as required by applicable law, then securely deleted. You may request earlier deletion, subject to those requirements.",
          "Disputes already submitted to a bureau continue through the bureau's investigation process; we will forward any response we receive.",
        ],
      },
    ],
  },
];

export const LEGAL_BY_SLUG = new Map(LEGAL_DOCUMENTS.map((doc) => [doc.slug, doc]));
