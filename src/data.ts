export const asset = (name: string) => `/assets/${name}`

export const organizerLogos = [
  { name: 'TechBuzz Hub', src: asset('startupsharamberun-2026-sponsorship-p13-03-402x135.png') },
  { name: 'Startup Funding Vehicles', src: asset('startupsharamberun-2026-sponsorship-p13-02-365x175.png') },
  { name: 'Makerere University', src: asset('startupsharamberun-2026-sponsorship-p13-04-313x148.png') },
]

export const partnerLogos = [
  { name: 'AFBAN', src: asset('partner-afban.png') },
  { name: 'Fie Consult', src: asset('partner-fie-consult.png') },
  { name: 'Imuka Access', src: asset('partner-imuka-access.png') },
  { name: 'KONN', src: asset('partner-konnect.png') },
  { name: 'Offisar', src: asset('offisar-logo-1-p01-01-2000x938.png') },
  { name: 'Ortus Africa Capital', src: asset('partner-ortus-africa.png') },
]

export const heroStats = [
  { value: 'UGX 3.75B', label: 'fundraising target' },
  { value: '5,000+', label: 'expected participants' },
  { value: '22', label: 'official dispatch points' },
  { value: '1', label: 'Makerere finish line' },
]

export const missionStats = [
  { value: 'UGX 3.75B', label: 'to be raised through tickets, pledges and donations' },
  { value: '650+', label: 'Ugandans trained by SFV on angel investing and blended finance' },
  { value: '100+', label: 'local startups targeted for catalytic funding' },
  { value: '50+', label: 'angel investors to be trained and networked' },
]

export const surveyStats = [
  { value: 76, suffix: '%', label: 'of surveyed respondents have never made an angel investment' },
  { value: 73, suffix: '%', label: 'poorly understand or do not understand angel investing' },
  { value: 61, suffix: '%', label: 'are not personally engaged with tech entrepreneurship' },
  { value: 84, suffix: '%', label: 'of angel tech deals in Uganda remain below USD 20,000' },
]

export const programCards = [
  {
    title: 'University startup programs',
    metric: '10+ universities',
    text: 'Student startup education, hackathons and proof of concept support across participating campuses.',
    image: asset('program-team.webp'),
    alt: 'SFV team members at an ecosystem field program',
  },
  {
    title: 'Venture funding pipeline',
    metric: '100+ startups',
    text: 'Matching grants, incubation support and investor readiness for early-stage Ugandan ventures.',
    image: asset('program-awards.webp'),
    alt: 'Startup award ceremony with oversized grant cheques',
  },
  {
    title: 'Angel investor network',
    metric: '50+ investors',
    text: 'Investment training, network grants and structured syndication opportunities for local angels.',
    image: asset('program-celebration.webp'),
    alt: 'Entrepreneurs and ecosystem partners celebrating together',
  },
]

export const universityStarts = [
  'Makerere University, Hill Road',
  'Makerere University Business School',
  'Kyambogo University',
  'Islamic University in Uganda',
  'Nkumba University and Team University',
  'Ndejje University',
  'Muteesa I Royal University',
  'Uganda Martyrs University, Lubaga',
  'Cavendish University Kampala',
  'Uganda Christian University',
  'ISBAT University Kampala',
  'Victoria University',
  'Kampala International University',
  'International University of East Africa',
  'Universal Technology and Management University',
]

export const neighborhoodStarts = [
  'Ntinda traffic lights',
  'Kalerwe Market',
  'Bwaise station, Bombo Road',
  'Namungoona roundabout',
  'Kabuusu Junction',
  'Busega roundabout',
  'Entebbe Road roundabout',
]

export const safetyNotes = [
  'Route marshals stationed at dispatch points and key junctions',
  'Ambulance and first aid cover along the official routes',
  'Police route clearance and traffic coordination',
  'Signed convergence protocol at Makerere University Freedom Square Pitch',
]

export const ticketTypes = [
  {
    name: 'Student runner',
    price: 'UGX 30,000',
    detail: 'Valid student ID required. Start from a partner university campus.',
  },
  {
    name: 'General public runner',
    price: 'UGX 50,000',
    detail: 'Open category. Start from a campus or neighborhood station.',
  },
  {
    name: 'Virtual donor',
    price: 'Open pledge',
    detail: 'Support the pipeline without running. Named or anonymous display.',
  },
]

export const kitItems = [
  'Branded running vest',
  'Drawstring bag',
  'Branded water bottle',
  'Glucose pack',
  'Corporate sticker',
  'Whistle',
  'Branded bottle opener',
  'Numbered registration tag',
]

export const kitImages = [
  { name: 'Running vest', src: asset('kit-vest.webp') },
  { name: 'Drawstring bag', src: asset('kit-bag.webp') },
  { name: 'Finisher medal', src: asset('kit-medal.webp') },
  { name: 'Water bottle', src: asset('kit-bottle.webp') },
]

export const sponsorTiers = [
  {
    name: 'Platinum',
    price: 'UGX 75M',
    summary: 'Lead champion of the Ugandan startup ecosystem with premium branding, VIP engagement and speaking opportunity.',
  },
  {
    name: 'Gold',
    price: 'UGX 40M',
    summary: 'Strategic brand association across signage, digital promotion, website features and stakeholder sessions.',
  },
  {
    name: 'Silver',
    price: 'UGX 25M',
    summary: 'Meaningful visibility for mid-size organisations across selected print, digital and event moments.',
  },
  {
    name: 'Bronze',
    price: 'UGX 10M',
    summary: 'Solid early association through website listing, social mentions and event acknowledgment.',
  },
]

export const sectorPackages = [
  ['Government and Policy Partner', 'UGX 100M'],
  ['Development Partner', 'UGX 80M'],
  ['Corporate Venture Capital Partner', 'UGX 50M'],
  ['Media and Visibility Partner', 'UGX 40M in kind'],
  ['Running Kit Sponsor', 'UGX 30M'],
  ['In-kind and Logistics Sponsor', 'UGX 20M'],
  ['Prize Sponsor', 'UGX 20M'],
  ['Diaspora Investment Package', 'UGX 20M'],
  ['Medical Sponsor', 'UGX 15M'],
  ['Angel Investor Package', 'UGX 15M'],
  ['Enterprise Sponsorship', 'UGX 10M'],
  ['Academic and Research Partner', 'UGX 10M'],
]

export const booths = [
  {
    name: 'Gold booth',
    size: '6 by 6 metres',
    price: 'UGX 5,000,000',
    image: asset('booth-gold.webp'),
  },
  {
    name: 'Silver booth',
    size: '6 by 3 metres',
    price: 'UGX 3,500,000',
    image: asset('booth-silver.webp'),
  },
  {
    name: 'Bronze booth',
    size: '3 by 3 metres',
    price: 'UGX 1,500,000',
    image: asset('booth-bronze.webp'),
  },
]

export const donorRows = [
  { name: 'Anonymous partner', type: 'Corporate pledge', amount: 'UGX 25,000,000' },
  { name: 'Kampala Angels Circle', type: 'Investor network', amount: 'UGX 15,000,000' },
  { name: 'University innovation club', type: 'Student team', amount: 'UGX 3,400,000' },
  { name: 'Individual donor', type: 'Online donation', amount: 'UGX 850,000' },
]

export const fundFlow = [
  {
    title: 'Students',
    text: 'Training programs, hackathons and proof of concept grants across participating universities.',
  },
  {
    title: 'Entrepreneurs',
    text: 'Matching grants, incubation support and investor readiness for early-stage ventures.',
  },
  {
    title: 'Investors',
    text: 'Angel network grants, investment training and structured syndication opportunities.',
  },
]
