/* ------------------------------------------------------------------
   SINGLE SOURCE OF TRUTH for all business content on the site.
   Edit here, not inside components. See README "Editing content".

   Every employment date below is taken from the supplied CV
   (Aniruddha Dasgupta CV.pdf). Nothing here is invented: no client
   endorsements, no metrics, no awards, no certifications beyond those
   printed on the CV.
   ------------------------------------------------------------------ */

export const PROFILE = {
  name: 'Aniruddha Dasgupta',
  initials: 'AD',
  role: 'Business Operations & Transformation Consultant',
  disciplines: 'Customer Success · Process Improvement · CRM · Practical AI',
  location: 'Mumbai, India',
  email: 'adi852002@gmail.com',
  phone: '+91 99879 86857',
  phoneHref: '+919987986857',
  linkedin: 'https://www.linkedin.com/in/aniruddhagkdasgupta',
  /* Set this once a real booking page exists (Cal.com, Calendly…).
     While it is null the "Book a discovery call" button scrolls to the
     contact form and preselects the "Discovery call" intent.
     Never point this at a URL that has not been created. */
  bookingUrl: null as string | null,
  /* The CV already published in the project repository, so it is cleared
     for public download. Set to null to hide the download link. */
  resumeUrl: '/Aniruddha-Dasgupta-Resume.pdf' as string | null,
} as const;

export const HERO = {
  eyebrow: 'Operations · Customer success · Practical AI',
  headline: ['Better operations.', 'More room to grow.'],
  lede: 'I help teams simplify processes, improve customer experience and put AI to work.',
} as const;

/* The one contact action on the overview. Restrained on purpose: the
   studio controls are the primary navigation, this is the way out of it. */
export const OVERVIEW_CTA = {
  lede: 'Something slowing your team down?',
  label: 'Let’s talk',
  href: '/contact/',
} as const;

export const SUMMARY = [
  { icon: 'flow',   title: 'Simplify operations',            copy: 'Streamline workflows and reduce friction.' },
  { icon: 'people', title: 'Strengthen customer experience', copy: 'Create smoother, more human experiences.' },
  { icon: 'chip',   title: 'Make AI useful',                 copy: 'Turn AI ideas into practical outcomes.' },
] as const;

/* Services are offers, not guaranteed outcomes. Deliverables are phrased
   as what an engagement typically produces. */
export const SERVICES = [
  {
    id: 'operations',
    title: 'Operations & Process Improvement',
    who: 'For teams dealing with fragmented workflows, unclear responsibilities or repetitive manual work.',
    deliverables: ['Process maps', 'SOPs', 'Ownership models', 'Practical reporting'],
  },
  {
    id: 'customer-success',
    title: 'Customer Success & Service Delivery',
    who: 'For teams seeking a more consistent customer journey and clearer service ownership.',
    deliverables: ['Escalation frameworks', 'Onboarding workflows', 'Service review structures', 'Visibility into customer issues'],
  },
  {
    id: 'crm-ai',
    title: 'CRM & Practical AI',
    who: 'For teams looking to organise customer information and apply automation thoughtfully.',
    deliverables: ['CRM workflow design', 'Adoption support', 'Automation opportunities', 'Implementation roadmaps'],
  },
] as const;

export type WorkStatus = 'past-role' | 'concept' | 'prototype' | 'live';

export const STATUS_LABEL: Record<WorkStatus, string> = {
  'past-role': 'Past work — employed role',
  concept:     'Concept demonstration',
  prototype:   'Prototype',
  live:        'Live project',
};

/* NOTE ON FRAMING — important and deliberate.
   These are roles held as an employee or officer of the business named.
   They are NOT client engagements, and the companies named have not
   engaged, endorsed or hired this consultancy. The status label on each
   card says so on the page itself. */
export const WORK = [
  {
    slug: 'dynamic-travels-transformation',
    name: 'Dynamic Travels (Shinto Pvt. Ltd.)',
    type: 'Business transformation',
    status: 'past-role' as WorkStatus,
    dates: 'Feb 2026 – Apr 2026 · on-call strategic advisor since Apr 2026',
    context:
      'A travel business running on manual processes, with customer information scattered across tools and no shared definition of how work moved between sales, operations and support.',
    role:
      'Chief Business Officer & Business Transformation Consultant. I was the business owner for the change — not the vendor delivering it.',
    delivered: [
      'Owned a CRM implementation from the business side: requirements, workflows, priorities and UAT, coordinating an external technology team.',
      'Directed website modernisation by defining business requirements, customer journeys and feature roadmaps.',
      'Established SOPs across sales, operations, marketing and customer support.',
      'Introduced AI-assisted productivity practices.',
    ],
    outcome: null,
    link: null,
  },
  {
    slug: 'ultimatix-escalation-operations',
    name: 'Tata Consultancy Services — Ultimatix',
    type: 'Enterprise escalation operations',
    status: 'past-role' as WorkStatus,
    dates: 'Oct 2019 – Jan 2026',
    context:
      'Specialist escalation operations for an enterprise employee-services platform, where a single unresolved request could stall work across several corporate functions at once.',
    role:
      'Project Lead / Process Lead. Day to day this also meant owning the customer-success relationship with the business units depending on the platform.',
    delivered: [
      'Led specialist enterprise escalation operations.',
      'Acted as liaison across HR, IT, SAP Ariba, Procurement and other enterprise functions.',
      'Supported onboarding, access management and governance processes.',
      'Prepared MIS dashboards and executive reporting.',
      'Drove process improvements for enterprise support operations.',
    ],
    outcome: null,
    link: null,
  },
  {
    slug: 'telstra-service-delivery',
    name: 'Tata Consultancy Services — Telstra Australia',
    type: 'Service delivery leadership',
    status: 'past-role' as WorkStatus,
    dates: 'Aug 2016 – Oct 2019',
    context:
      'Enterprise customer operations for an Australian telecommunications account, delivered from the Mumbai centre, where quality and SLA consistency had to hold across a large floor.',
    role:
      'Process Lead / Team Lead / Trainer, providing operational leadership for approximately 200 associates.',
    delivered: [
      'Operational leadership supporting approximately 200 associates.',
      'Team lead, trainer and mentor for new-hire batches and live-floor readiness.',
      'Oversaw quality, SLA adherence, performance coaching and operational governance.',
      'Managed critical escalations affecting enterprise customers.',
    ],
    outcome: null,
    link: null,
  },
] as const;

export const PROCESS = [
  { n: '01', title: 'Understand', copy: 'Clarify the problem, people and constraints.' },
  { n: '02', title: 'Simplify',   copy: 'Map the process and identify what needs to change.' },
  { n: '03', title: 'Implement',  copy: 'Build or introduce the practical solution.' },
  { n: '04', title: 'Improve',    copy: 'Review adoption, feedback and performance.' },
] as const;

export const ABOUT = {
  heading: 'I work on the part that usually gets skipped.',
  paragraphs: [
    'I have spent fifteen years inside operations that cannot afford to stop — enterprise telecom support, service delivery for global accounts, and more recently the business side of transformation projects.',
    'Nine of those years were at Tata Consultancy Services in Mumbai. First on the Telstra Australia account, running quality, coaching and SLA governance across roughly 200 associates. Then leading specialist escalation operations for Ultimatix, working across HR, IT, procurement and SAP Ariba, and building the reporting leadership actually used.',
    'Most recently I was Chief Business Officer at Dynamic Travels, where I owned a CRM implementation end to end from the business side, alongside a website rebuild and a full set of SOPs. I still advise their leadership team.',
    'What I care about is whether a process still holds once the person who wrote it has moved on. So I write documentation people will open, coach the team that has to live with the change, and keep the reporting honest enough to make decisions from.',
  ],
  credentials: [
    'BBA (Marketing), Bundelkhand University, Jhansi',
    'Generative AI certification — NSDC, Government of India',
    'Generative AI bootcamp — OutSkill',
    'SAP Ariba — enterprise experience',
    'Microsoft Power BI — working knowledge',
  ],
} as const;

export const CONTACT = {
  heading: 'Let’s make your business work better.',
  lede: 'Tell me what is slowing your team down, and we can explore a practical way forward.',
  topics: [
    { value: 'operations',       label: 'Operations and processes' },
    { value: 'customer-success', label: 'Customer success' },
    { value: 'crm',              label: 'CRM' },
    { value: 'ai',               label: 'AI and automation' },
    { value: 'discovery-call',   label: 'Discovery call' },
    { value: 'other',            label: 'Something else' },
  ],
} as const;

/* Where each object in the studio leads. The camera destinations live in
   components/studio/shots.ts; this is the accessible list used for the
   control row and for the equivalent pages. */
export const DESTINATIONS = [
  { id: 'work',     label: 'Selected work', href: '/work/' },
  { id: 'process',  label: 'Process & CRM', href: '/services/#process' },
  { id: 'ai',       label: 'AI in action',  href: '/services/#ai' },
  { id: 'services', label: 'How I work',    href: '/services/' },
  { id: 'about',    label: 'About',         href: '/about/' },
] as const;
