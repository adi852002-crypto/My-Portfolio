export const PROFILE = {
  name: 'Aniruddha Dasgupta',
  title: 'Enterprise Transformation & Business Operations Leader',
  email: 'adi852002@gmail.com',
  phone: '+91 99879 86857',
  phoneHref: '+919987986857',
  linkedin: 'https://www.linkedin.com/in/aniruddhagkdasgupta',
  location: 'Mumbai, Maharashtra, India',
  available: 'Available now — roles & consulting'
};

export const FIGURES = [
  { n: 15, suffix: '+', label: 'Years in operations' },
  { n: 200, prefix: '~', label: 'Associates supported on one account' },
  { n: 9, label: 'Years at Tata Consultancy Services' },
  { n: 4, label: 'Industries — telecom, travel, hospitality, services' }
];

export const FIRMS = [
  ['Tata Consultancy Services', 'Delivery'],
  ['Telstra Australia', 'Enterprise account'],
  ['Ultimatix', 'Escalation ops'],
  ['Tech Mahindra', 'Operations'],
  ['Dynamic Travels', 'Transformation'],
  ['Sanlam Investments', 'Commercial'],
  ['Blue Water AlcoBev', 'Regional sales'],
  ['Animus Gaming', 'Founding']
] as const;

export type Role = {
  when: string; what: string; where: string;
  cat: string; note: string; detail: string[];
};

export const ROLES: Role[] = [
  {
    when: 'Feb — May 2026',
    what: 'Chief Business Officer & Business Transformation Consultant',
    where: 'Dynamic Travels (Shinto Pvt. Ltd.)',
    cat: 'transformation',
    note: 'Business owner for the CRM implementation, website modernisation and company-wide SOPs, then on-call strategic advisor.',
    detail: [
      'Owned the CRM implementation from the business side — requirements, workflows, priorities and UAT',
      'Rebuilt the company website and digital presence',
      'Wrote SOPs across sales, operations, marketing and support',
      'Introduced AI-assisted tooling for reporting and documentation'
    ]
  },
  {
    when: '2019 — 2026',
    what: 'Project Lead / Process Lead / Customer Success Manager',
    where: 'Tata Consultancy Services — Ultimatix',
    cat: 'enterprise transformation',
    note: 'Specialist enterprise escalation operations, and the customer success relationship with the business units depending on them.',
    detail: [
      'Ran specialist escalation operations for enterprise employee services',
      'Liaison across HR, IT, Procurement and SAP Ariba',
      'Root-cause analysis on recurring failures, with fixes documented and handed over',
      'Built MIS dashboards and executive reporting leadership acted on',
      'Managed access and onboarding controls'
    ]
  },
  {
    when: '2016 — 2019',
    what: 'Customer Success Manager / Process Lead / Trainer',
    where: 'Tata Consultancy Services — Telstra Australia',
    cat: 'enterprise',
    note: "Customer success and operational leadership for roughly 200 associates serving Telstra's enterprise customers from the Mumbai delivery centre.",
    detail: [
      'Quality, coaching and SLA governance across roughly 200 associates',
      'Account health, retention and escalation point for enterprise customers',
      'Trained and onboarded new associates onto the account',
      'Process improvements carried from the floor into standard practice'
    ]
  },
  {
    when: '2015 — 2016',
    what: 'Process Associate',
    where: 'Tech Mahindra Business Services',
    cat: 'enterprise',
    note: 'Three UK customer operations — SLA adherence, customer experience and new-associate onboarding.',
    detail: [
      'Worked across three UK customer operations',
      'SLA adherence and customer experience metrics',
      'Supported onboarding for incoming associates'
    ]
  },
  {
    when: '2011 — 2015',
    what: 'Founder',
    where: 'Animus Gaming',
    cat: 'commercial',
    note: 'Built an experiential gaming and events venture — business development, partnerships, vendors and commercial operations.',
    detail: [
      'Founded and ran an experiential gaming and events venture',
      'Business development and partnership deals',
      'Vendor management and day-to-day commercial operations'
    ]
  },
  {
    when: '2010 — 2011',
    what: 'Marketing Associate',
    where: 'Sanlam Investments',
    cat: 'commercial',
    note: 'Marketing initiatives, client engagement and business development.',
    detail: ['Marketing initiatives and campaign support', 'Client engagement and relationship handling', 'Business development activity']
  },
  {
    when: '2008 — 2010',
    what: 'Event Manager',
    where: 'Dimensions',
    cat: 'commercial',
    note: 'End-to-end event operations, vendor coordination and client delivery.',
    detail: ['End-to-end event operations', 'Vendor coordination and on-site delivery', 'Client-facing planning and sign-off']
  },
  {
    when: '2007 — 2008',
    what: 'Regional Sales Head',
    where: 'Blue Water AlcoBev',
    cat: 'commercial',
    note: 'South Mumbai region. Grew hospitality partnerships and opened opportunities in the domestic airline sector.',
    detail: ['Owned the South Mumbai region', 'Grew hospitality and on-trade partnerships', 'Opened opportunities in the domestic airline sector']
  }
];

export const FILTERS = [
  { key: 'all', label: 'All roles' },
  { key: 'enterprise', label: 'Enterprise delivery' },
  { key: 'transformation', label: 'Transformation' },
  { key: 'commercial', label: 'Commercial & founder' }
];

export const CAPABILITIES = [
  { k: 'Delivery & CS', h: 'Service delivery & customer success',
    p: 'SLA governance, quality, coaching and escalation management for teams in the hundreds — plus the client-facing half: account health, retention and being the escalation point when it matters.' },
  { k: 'Change', h: 'Transformation from the business side',
    p: 'CRM and digital projects owned by the business, not handed to a vendor. Requirements, workflows, UAT — and the adoption work that decides whether any of it survives launch.' },
  { k: 'Process', h: 'Process & governance',
    p: 'SOPs, root-cause analysis, access and onboarding controls, MIS dashboards and executive reporting that answers the question actually being asked.' },
  { k: 'AI', h: 'AI where it earns its place',
    p: 'Practical assistant workflows for reporting, documentation and first-draft analysis. Trained through NSDC and OutSkill — and sceptical of pilots that never leave the pilot.' }
];

export const TOOLS = [
  'Customer success', 'CRM implementation', 'SAP Ariba', 'Power BI', 'Advanced Excel',
  'UAT', 'SOP development', 'MIS & dashboards', 'Change management',
  'Stakeholder management', 'Prompt engineering'
];
