/**
 * Site content for the marketing surface.
 *
 * Copy here is deliberately process-oriented: it describes what Creditxora
 * reviews and does, never a guaranteed deletion, approval or score increase.
 */

export type ServiceSlug =
  | "credit-report-review"
  | "hard-inquiry-review"
  | "collection-account-review"
  | "charge-off-review"
  | "late-payment-review"
  | "repossession-review"
  | "medical-collection-review"
  | "identity-theft-assistance"
  | "duplicate-account-review"
  | "personal-information-errors"
  | "student-loan-reporting-review"
  | "credit-building-guidance";

export type Service = {
  slug: ServiceSlug;
  title: string;
  short: string;
  icon: string;
  /** What the review involves. */
  involves: string[];
  /** What information is examined. */
  examines: string[];
  /** What the client receives. */
  receives: string[];
  /** What happens afterward. */
  afterward: string;
};

export const SERVICES: Service[] = [
  {
    slug: "credit-report-review",
    title: "Credit Report Review",
    short:
      "A line-by-line read of all three bureau reports to surface potential inaccuracies and inconsistencies.",
    icon: "FileSearch",
    involves: [
      "A structured review of your Experian, Equifax and TransUnion reports side by side",
      "Identification of entries that appear inaccurate, incomplete, outdated or unverifiable",
      "A comparison across bureaus to catch information reported inconsistently",
    ],
    examines: [
      "Personal information and address history",
      "Account status, balances, payment history and dates",
      "Public records, collections and inquiries",
      "Duplicate or mismatched tradelines",
    ],
    receives: [
      "A written summary of what was found, in plain language",
      "A prioritised list of items worth addressing first",
      "A recommended sequence of appropriate next steps",
    ],
    afterward:
      "Your specialist walks you through the summary, agrees the plan with you, and prepares any documentation needed for the items you decide to address.",
  },
  {
    slug: "hard-inquiry-review",
    title: "Hard Inquiry Review",
    short:
      "Examine the inquiries on your reports and identify any you did not authorise.",
    icon: "Search",
    involves: [
      "A full inventory of hard inquiries across all three bureaus",
      "Matching each inquiry against applications you recognise",
      "Flagging inquiries that appear unauthorised or unrecognised",
    ],
    examines: [
      "Inquiry dates, requesting parties and permissible-purpose indicators",
      "Duplicate inquiries from a single rate-shopping window",
      "Inquiries that may relate to identity theft",
    ],
    receives: [
      "A clear list of every inquiry with the date and the party who requested it",
      "Guidance on which inquiries can appropriately be questioned",
      "Documentation support for the ones you choose to pursue",
    ],
    afterward:
      "Unrecognised inquiries are documented and raised with the relevant bureau or furnisher, and we track responses as they arrive.",
  },
  {
    slug: "collection-account-review",
    title: "Collection Account Review",
    short:
      "Review collection entries for accuracy, ownership, balances and reporting timelines.",
    icon: "ReceiptText",
    involves: [
      "Verifying that the collection is reported against the correct consumer",
      "Checking balances and dates against the original creditor's records",
      "Confirming the account is within the applicable reporting period",
    ],
    examines: [
      "Original creditor, current owner and chain of assignment",
      "Date of first delinquency and reporting age",
      "Balance discrepancies between bureaus",
      "Duplicate reporting of the same underlying debt",
    ],
    receives: [
      "A written assessment of each collection entry",
      "An explanation of your rights regarding validation",
      "A prepared, documented approach for entries you choose to address",
    ],
    afterward:
      "Where an entry appears inaccurate, we prepare and support the appropriate dispute or validation request and monitor the response window.",
  },
  {
    slug: "charge-off-review",
    title: "Charge-Off Review",
    short:
      "Check charged-off accounts for accurate balances, dates and duplicate reporting.",
    icon: "FileX2",
    involves: [
      "Reviewing how each charge-off is reported across the bureaus",
      "Checking the charge-off date, balance and status fields for consistency",
      "Identifying charge-offs also reported by a collection agency",
    ],
    examines: [
      "Charge-off date versus date of first delinquency",
      "Reported balance versus the last statement balance",
      "Status codes and payment-history grids",
    ],
    receives: [
      "A summary of every charged-off account and how it is reporting",
      "Notes on any inconsistency worth addressing",
      "A recommended order of action based on your goals",
    ],
    afterward:
      "Items with documented inconsistencies proceed to a dispute, and your specialist keeps you updated as each bureau responds.",
  },
  {
    slug: "late-payment-review",
    title: "Late Payment Review",
    short:
      "Verify reported late payments against your own records and statements.",
    icon: "CalendarClock",
    involves: [
      "Building a timeline of reported late payments per account",
      "Comparing that timeline against your statements and bank records",
      "Flagging months reported late that your records show as paid on time",
    ],
    examines: [
      "Payment-history grids across all three bureaus",
      "Reported dates versus your proof of payment",
      "Accounts reporting different histories at different bureaus",
    ],
    receives: [
      "A month-by-month view of what each bureau reports",
      "A list of discrepancies supported by your own documentation",
      "Guidance on assembling proof for the items you pursue",
    ],
    afterward:
      "Discrepancies backed by documentation are raised with the furnisher and bureau, and outcomes are recorded in your portal.",
  },
  {
    slug: "repossession-review",
    title: "Repossession Review",
    short:
      "Review repossession entries for accurate balances, notices and reporting dates.",
    icon: "Car",
    involves: [
      "Reviewing how the repossession and any deficiency balance are reported",
      "Checking dates, status and balance consistency across bureaus",
      "Identifying duplicate reporting between lender and collection agency",
    ],
    examines: [
      "Voluntary versus involuntary designation",
      "Deficiency balance and post-sale accounting",
      "Reporting dates against the applicable timeline",
    ],
    receives: [
      "A written assessment of the entry and supporting notes",
      "An explanation of what documentation strengthens your position",
      "A prepared approach for the items you decide to address",
    ],
    afterward:
      "Where the reporting appears inaccurate or unverifiable, we prepare the appropriate dispute and track each bureau's response.",
  },
  {
    slug: "medical-collection-review",
    title: "Medical Collection Review",
    short:
      "Review medical collections against current reporting rules and insurance records.",
    icon: "Stethoscope",
    involves: [
      "Checking each medical collection against current reporting thresholds and waiting periods",
      "Comparing balances against your explanation-of-benefits statements",
      "Identifying amounts that insurance should have covered",
    ],
    examines: [
      "Date the account was reported and any applicable waiting period",
      "Balance versus insurer-adjudicated amounts",
      "Paid medical collections still reporting a balance",
      "Duplicate entries from provider and agency",
    ],
    receives: [
      "A summary of every medical collection on your reports",
      "Notes on entries that appear inconsistent with your records",
      "Guidance on gathering insurer documentation",
    ],
    afterward:
      "Documented inconsistencies proceed to a dispute, and we follow up with both the bureau and the furnisher as needed.",
  },
  {
    slug: "identity-theft-assistance",
    title: "Identity Theft / Fraud Assistance",
    short:
      "Structured support for reports affected by identity theft or fraudulent accounts.",
    icon: "ShieldAlert",
    involves: [
      "Cataloguing every account, inquiry and address you do not recognise",
      "Guiding you through filing an FTC Identity Theft Report",
      "Supporting fraud alert and security freeze placement with each bureau",
    ],
    examines: [
      "Accounts opened without your authorisation",
      "Addresses and employers you have no connection to",
      "Inquiries tied to fraudulent applications",
    ],
    receives: [
      "A documented inventory of everything affected",
      "Help preparing the identity-theft documentation bureaus require",
      "An ongoing record of every submission and response in your portal",
    ],
    afterward:
      "Identity-theft blocks and disputes are submitted with the supporting documentation, and we monitor each bureau's response closely.",
  },
  {
    slug: "duplicate-account-review",
    title: "Duplicate Account Review",
    short:
      "Find the same debt reported more than once and document the overlap.",
    icon: "Copy",
    involves: [
      "Cross-referencing tradelines that share an original creditor or balance",
      "Identifying a debt reported by both the original creditor and a collector",
      "Documenting the overlap with account numbers and dates",
    ],
    examines: [
      "Account numbers, opening dates and balances across bureaus",
      "Transferred or sold accounts still reporting an active balance",
      "Near-identical tradelines with small formatting differences",
    ],
    receives: [
      "A side-by-side comparison of the duplicated entries",
      "A written explanation of why the reporting appears duplicative",
      "A prepared dispute package for the entries you pursue",
    ],
    afterward:
      "The duplication is raised with the bureaus with the comparison attached, and results are logged against your file.",
  },
  {
    slug: "personal-information-errors",
    title: "Personal Information Errors",
    short:
      "Correct names, addresses, employers and identifiers that don't belong to you.",
    icon: "UserRoundCog",
    involves: [
      "Reviewing every personal-information field each bureau holds",
      "Identifying names, addresses and employers you have no connection to",
      "Checking for mixed files caused by a similar name or identifier",
    ],
    examines: [
      "Name variations and misspellings",
      "Current and former address history",
      "Employer records and date-of-birth fields",
      "Signs your file has been merged with another consumer's",
    ],
    receives: [
      "A list of every entry that appears incorrect",
      "Guidance on the proof of identity and address each bureau expects",
      "A prepared correction request for each bureau",
    ],
    afterward:
      "Correction requests are submitted with your documentation, and we confirm the update on your next report.",
  },
  {
    slug: "student-loan-reporting-review",
    title: "Student Loan Reporting Review",
    short:
      "Check how servicer transfers, deferments and forbearances are being reported.",
    icon: "GraduationCap",
    involves: [
      "Mapping every student loan tradeline across the three bureaus",
      "Checking servicer transfers for duplicate reporting",
      "Verifying deferment and forbearance periods are reported correctly",
    ],
    examines: [
      "Duplicate tradelines created by a servicer transfer",
      "Payment history during deferment, forbearance or an approved plan",
      "Balances and status codes after consolidation",
    ],
    receives: [
      "A consolidated view of every student loan on your reports",
      "Notes on entries that conflict with your servicer records",
      "A prepared approach for the discrepancies you pursue",
    ],
    afterward:
      "Discrepancies are raised with the servicer and the bureaus, and your portal tracks each response.",
  },
  {
    slug: "credit-building-guidance",
    title: "Credit-Building Guidance",
    short:
      "Practical, personalised guidance on the habits that shape your profile over time.",
    icon: "TrendingUp",
    involves: [
      "Reviewing your utilisation, account mix, payment history and file age",
      "Setting realistic milestones against the goal you're working toward",
      "Explaining which habits move which parts of a credit profile",
    ],
    examines: [
      "Revolving utilisation, overall and per card",
      "Payment-history consistency and any recent delinquency",
      "Average age of accounts and recent inquiry activity",
      "Account mix relative to your goal",
    ],
    receives: [
      "A written plan you can act on month by month",
      "Guidance on timing applications around your goal",
      "Ongoing check-ins as your profile changes",
    ],
    afterward:
      "Guidance continues alongside any review work, and your plan is revisited as your reports update.",
  },
];

export const SERVICE_BY_SLUG = new Map(SERVICES.map((service) => [service.slug, service]));

// --- How it works ----------------------------------------------------------

export const PROCESS_STEPS = [
  {
    number: "01",
    title: "Get Started",
    description: "Complete your initial assessment.",
    detail:
      "A short, structured questionnaire tells us what you're dealing with, what you're working toward, and where your credit profile stands today. It takes about three minutes.",
  },
  {
    number: "02",
    title: "Credit Profile Review",
    description: "Your information and available credit reports are reviewed.",
    detail:
      "A specialist reads your Experian, Equifax and TransUnion reports side by side, looking for entries that appear inaccurate, incomplete, outdated or unverifiable.",
  },
  {
    number: "03",
    title: "Personalized Action Plan",
    description: "Potential issues and appropriate next steps are identified.",
    detail:
      "You receive a plain-language summary of what was found and a prioritised plan. Nothing is submitted until you understand it and agree to it.",
  },
  {
    number: "04",
    title: "Monitor & Improve",
    description: "Track progress and receive credit-building guidance.",
    detail:
      "Your portal shows every item in progress and every response received, while your specialist works with you on the habits that shape your profile long term.",
  },
] as const;

// --- Trust indicators ------------------------------------------------------

export const TRUST_INDICATORS = [
  { label: "Confidential", detail: "Encrypted document handling", icon: "Lock" },
  { label: "Professional", detail: "Assigned credit specialist", icon: "BadgeCheck" },
  { label: "U.S.-Focused", detail: "All 50 states and D.C.", icon: "MapPin" },
  { label: "Results-Focused", detail: "Tracked, documented progress", icon: "Target" },
] as const;

// --- Success stories -------------------------------------------------------

export const SUCCESS_STORIES = [
  {
    quote:
      "My credit profile became much easier to understand, and I finally had a clear plan for what to address.",
    name: "Jordan H.",
    location: "Charlotte, NC",
    goal: "Mortgage readiness",
    accountsReviewed: 21,
    itemsCorrected: 4,
    timeline: "5 months",
  },
  {
    quote:
      "Two inquiries I never authorised were documented and raised properly. I wouldn't have known where to start on my own.",
    name: "Aisha B.",
    location: "Houston, TX",
    goal: "Auto financing",
    accountsReviewed: 14,
    itemsCorrected: 2,
    timeline: "3 months",
  },
  {
    quote:
      "The medical collections on my report didn't match what my insurer paid. Having someone organise the paperwork made the difference.",
    name: "Daniel O.",
    location: "Miami, FL",
    goal: "General improvement",
    accountsReviewed: 18,
    itemsCorrected: 5,
    timeline: "6 months",
  },
] as const;

// --- FAQ -------------------------------------------------------------------

export const FAQS = [
  {
    question: "What is credit repair?",
    answer:
      "Credit repair is the process of reviewing your credit reports for information that appears inaccurate, incomplete, outdated or unverifiable, and then formally raising those items with the credit bureaus and the companies that reported them. Accurate negative information cannot be removed, and no company can lawfully promise otherwise.",
  },
  {
    question: "How does Creditxora work?",
    answer:
      "You start with a short assessment. A specialist reviews your credit reports and any documentation you upload, then prepares a written summary and a prioritised plan. Once you agree to the plan, appropriate items are raised with the bureaus and furnishers, and every step and response is tracked in your client portal.",
  },
  {
    question: "Which credit bureaus do you work with?",
    answer:
      "We review reports from all three nationwide consumer reporting agencies — Experian, Equifax and TransUnion — because the same account is often reported differently at each one.",
  },
  {
    question: "Can you guarantee that negative information will be removed?",
    answer:
      "No, and you should be cautious of any company that says it can. Accurate, timely and verifiable information stays on your report. What we can do is identify entries that appear inaccurate or unverifiable, document them properly, and raise them through the process the law provides. Outcomes depend on what the bureaus and furnishers find.",
  },
  {
    question: "How long does the process take?",
    answer:
      "Credit bureaus generally have 30 days to investigate a dispute, and 45 days in certain circumstances. Most clients work with us over several months because items are addressed in sequence and some require follow-up. Your portal shows exactly where each item stands.",
  },
  {
    question: "What information do I need to provide?",
    answer:
      "Your basic contact details to start, then proof of identity and address, and copies of your credit reports. Supporting documents — statements, insurer explanations of benefits, payment records — strengthen specific items and your specialist will tell you which ones matter for your file.",
  },
  {
    question: "Do I need a credit report to get started?",
    answer:
      "No. You can complete the assessment without one. You are entitled to free reports from each bureau through AnnualCreditReport.com, and your specialist will walk you through obtaining them if you don't have recent copies.",
  },
  {
    question: "Can you help with identity-theft-related information?",
    answer:
      "Yes. We help you catalogue accounts, inquiries and addresses you don't recognise, guide you through filing an FTC Identity Theft Report, support fraud alert or security freeze placement, and prepare the documentation bureaus require for identity-theft blocks.",
  },
  {
    question: "Can I cancel my service?",
    answer:
      "Yes. You may cancel at any time, and you will not be charged for a service period that has not begun. Our cancellation and refund terms are set out in full on the Terms of Service page and in the service agreement you receive before any work starts.",
  },
  {
    question: "How do I contact Creditxora?",
    answer:
      "Use the contact form on this site, email support@creditxora.com, or message us on WhatsApp or Telegram. Existing clients can also message their specialist directly from the client portal, which keeps the whole conversation attached to their file.",
  },
] as const;

// --- Credit resources ------------------------------------------------------

export type ResourceCategory = "Credit Tips" | "Credit Guides" | "Financial Education";

export type Resource = {
  slug: string;
  category: ResourceCategory;
  title: string;
  excerpt: string;
  readMinutes: number;
};

export const RESOURCES: Resource[] = [
  {
    slug: "understanding-utilization",
    category: "Credit Tips",
    title: "Understanding credit utilisation",
    excerpt:
      "Why the balance reported on your statement date matters more than what you actually spend, and how to manage it across several cards.",
    readMinutes: 5,
  },
  {
    slug: "why-payment-history-matters",
    category: "Credit Tips",
    title: "Why payment history matters most",
    excerpt:
      "Payment history is the single largest factor in most scoring models. Here's how a single late payment is recorded and how long it stays.",
    readMinutes: 4,
  },
  {
    slug: "checking-your-credit-reports",
    category: "Credit Tips",
    title: "How to check your credit reports properly",
    excerpt:
      "Where to get all three reports at no cost, what to read first, and the fields most people skip that quietly cause problems.",
    readMinutes: 6,
  },
  {
    slug: "understanding-inquiries",
    category: "Credit Tips",
    title: "Hard inquiries, soft inquiries and rate shopping",
    excerpt:
      "What actually affects your profile, what doesn't, and how the rate-shopping window works when you're comparing loan offers.",
    readMinutes: 4,
  },
  {
    slug: "how-credit-scores-work",
    category: "Credit Guides",
    title: "How credit scores work",
    excerpt:
      "The five factors behind most scoring models, roughly how they're weighted, and why you have more than one score.",
    readMinutes: 8,
  },
  {
    slug: "how-to-read-a-credit-report",
    category: "Credit Guides",
    title: "How to read a credit report",
    excerpt:
      "A section-by-section walkthrough — personal information, accounts, public records and inquiries — and what to question in each.",
    readMinutes: 9,
  },
  {
    slug: "understanding-collections",
    category: "Credit Guides",
    title: "Understanding collections",
    excerpt:
      "How a debt reaches a collection agency, what validation means, and how the date of first delinquency governs the reporting clock.",
    readMinutes: 7,
  },
  {
    slug: "understanding-charge-offs",
    category: "Credit Guides",
    title: "Understanding charge-offs",
    excerpt:
      "What a charge-off actually means, why the debt doesn't disappear, and how it can end up reported twice.",
    readMinutes: 6,
  },
  {
    slug: "credit-cards",
    category: "Financial Education",
    title: "Using credit cards to build a profile",
    excerpt:
      "Secured versus unsecured, why closing an old card can backfire, and how to choose a first card while rebuilding.",
    readMinutes: 7,
  },
  {
    slug: "auto-financing",
    category: "Financial Education",
    title: "Preparing for auto financing",
    excerpt:
      "What lenders look at beyond the score, how to compare offers inside one rate-shopping window, and what to fix first.",
    readMinutes: 6,
  },
  {
    slug: "mortgages",
    category: "Financial Education",
    title: "Getting mortgage-ready",
    excerpt:
      "Which score version mortgage lenders use, the timeline to plan around, and the report issues worth resolving early.",
    readMinutes: 9,
  },
  {
    slug: "business-credit",
    category: "Financial Education",
    title: "Building business credit",
    excerpt:
      "How business credit profiles differ from personal ones, and the groundwork that makes a business fundable later.",
    readMinutes: 8,
  },
];

// --- Navigation ------------------------------------------------------------

export const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/results", label: "Success Stories" },
  { href: "/resources", label: "Resources" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

// --- Social ----------------------------------------------------------------

export const SOCIAL_LINKS = [
  { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@creditxora" },
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/creditxora1/" },
  { key: "x", label: "X", href: "https://x.com/Creditxora" },
  {
    key: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/share/18FBuE97nC/?mibextid=wwXIfr",
  },
] as const;

export type SocialKey = (typeof SOCIAL_LINKS)[number]["key"];

// --- Assessment options ----------------------------------------------------

export const CONCERN_OPTIONS = [
  { value: "collections", label: "Collections", description: "Accounts sent to a collection agency" },
  { value: "charge_offs", label: "Charge-offs", description: "Accounts a creditor has written off" },
  { value: "late_payments", label: "Late payments", description: "Missed or delayed payment reporting" },
  { value: "hard_inquiries", label: "Hard inquiries", description: "Credit checks you may not recognise" },
  { value: "repossessions", label: "Repossessions", description: "Vehicle or property repossession entries" },
  { value: "medical_collections", label: "Medical collections", description: "Healthcare bills in collections" },
  { value: "identity_theft", label: "Identity theft / fraud", description: "Accounts opened without your consent" },
  { value: "student_loans", label: "Student loans", description: "Servicer transfers or deferment reporting" },
  { value: "personal_info_errors", label: "Personal information errors", description: "Wrong name, address or employer" },
  { value: "not_sure", label: "Not sure / full review", description: "Review everything and tell me what you find" },
] as const;

export const GOAL_OPTIONS = [
  { value: "improve_profile", label: "Improve my credit profile", description: "General strengthening across the board" },
  { value: "auto_financing", label: "Prepare for auto financing", description: "Getting ready for a vehicle loan" },
  { value: "mortgage", label: "Prepare for a mortgage", description: "Working toward a home purchase" },
  { value: "business_funding", label: "Prepare for business funding", description: "Positioning for a business loan or line" },
  { value: "credit_card_eligibility", label: "Improve credit-card eligibility", description: "Qualifying for better card products" },
  { value: "general_improvement", label: "General credit improvement", description: "No specific deadline in mind" },
] as const;

export const SCORE_RANGE_OPTIONS = [
  { value: "under_500", label: "Under 500" },
  { value: "500_549", label: "500 – 549" },
  { value: "550_599", label: "550 – 599" },
  { value: "600_649", label: "600 – 649" },
  { value: "650_699", label: "650 – 699" },
  { value: "700_plus", label: "700 or above" },
  { value: "unknown", label: "I don't know" },
] as const;

export const BUREAU_OPTIONS = [
  { value: "experian", label: "Experian" },
  { value: "equifax", label: "Equifax" },
  { value: "transunion", label: "TransUnion" },
] as const;

export const NEGATIVE_ACCOUNT_OPTIONS = [
  "1-3",
  "4-6",
  "7-10",
  "More than 10",
  "Not sure",
] as const;

export const CONTACT_REASONS = [
  "New credit assessment",
  "Existing client support",
  "Question about services",
  "Business credit enquiry",
  "Partnership enquiry",
  "Something else",
] as const;

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" }, { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" }, { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" }, { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" }, { code: "PR", name: "Puerto Rico" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];
