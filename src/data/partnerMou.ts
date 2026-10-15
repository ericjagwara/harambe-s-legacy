// Wording of the Partner Hub MOU shown on the unlisted /partner-mou page.
// Taken word for word from "MOU Startups Harambee Run 2026 Hub Co-Hosting" (the Word document), with the blanks
// (date, hub name, address, in-charge person) filled in from the form.
//
// Edit the text here. Bump MOU_VERSION whenever the wording changes: every signed record stores the
// version and the exact text the partner saw (Supabase: partner_mous).

export const MOU_VERSION = '2026-10-v1'

export type MouClause = { no?: string; text: string; level?: 0 | 1 | 2 }
export type MouSection = { no: string; heading: string; clauses: MouClause[] }

export type Mou = {
  letterhead: string[]
  title: string
  subtitle: string
  tagline: string
  dateLine: string
  sections: MouSection[]
  hubCounterparty: { name: string; title: string }
}

export type MouPartner = { hubName: string; hubAddress: string; date: Date }

const blank = (value: string, placeholder: string) => value.trim().replace(/\s+/g, ' ') || placeholder

export function buildMou({ hubName, hubAddress, date }: MouPartner): Mou {
  const hub = blank(hubName, '[Name of Innovation Hub]')
  const address = blank(hubAddress, '[Physical address / Institution]')
  const day = date.getDate()
  const month = date.toLocaleString('en-GB', { month: 'long' })

  return {
    letterhead: [
      'TechBuzz Hub',
      'Plot 668, Kayondo Road, P.O. Box 18 Ntinda, Kampala',
      'info@techbuzzhub.org · 070 279 9754 · www.techbuzzhub.org',
    ],
    title: 'Memorandum of Understanding',
    subtitle: 'for Co-Hosting Partnership in the Startups Harambee Run 2026',
    tagline: '#StartupsHarambeRun | #CapitalHarambeRun | Sunday, 29 November 2026 | Kampala, Uganda',
    dateLine: `This Memorandum of Understanding (“MOU”) is made on this ${day} day of ${month}, 2026.`,
    hubCounterparty: { name: 'Mr. Keneth Twesigye', title: 'V/CP Coordinator, Startups Harambee Run 2026' },
    sections: [
      {
        no: '1',
        heading: 'Parties',
        clauses: [
          { text: 'BETWEEN' },
          {
            text: 'TechBuzz Hub, an innovation hub located at Plot 668, Kayondo Road, P.O. Box 18 Ntinda, Kampala, Uganda, convener of the Startups Harambee Run 2026 under the Startup Funding Vehicles (SFV) initiative, acting through the Organising Committee of the Run (“TechBuzz Hub” or “the Convener”);',
          },
          { text: 'AND' },
          { text: `${hub}, of ${address} (“the Partner Hub”).` },
          { text: 'Together referred to as “the Parties” and each as a “Party”.' },
        ],
      },
      {
        no: '2',
        heading: 'Background',
        clauses: [
          { no: '2.1', text: 'The Startups Harambee Run 2026 (“the Run”), also known as the Capital Harambe Run, is an annual multi-origin fundraising run taking place on Sunday, 29 November 2026, from Makerere university to the finish line at Makerere University Freedom Square, Kampala.' },
          { no: '2.2', text: 'The Run aims to raise UGX 3,750,000,000 through tickets, sponsorships, pledges, donations, running kit sales and in-kind contributions, with targets of 5,000+ participants, 40+ investors and 50+ institutional partners.' },
          { no: '2.3', text: 'Proceeds are channelled to student startup programmes, hackathons, proof-of-concept grants, incubation and angel investor networks, under the oversight of a multi-stakeholder steering committee (the Fund Flow Committee).' },
          { no: '2.4', text: 'By letter dated 25 September 2026, TechBuzz Hub invited the Partner Hub to collaborate in the Run as an Innovation Hub Partner, and the Partner Hub has agreed to participate as a co-hosting partner.' },
          { no: '2.5', text: 'The Parties wish to record the terms of their collaboration in this MOU.' },
        ],
      },
      {
        no: '3',
        heading: 'Purpose and Scope',
        clauses: [
          { text: 'The purpose of this MOU is to establish the Partner Hub as a co-hosting partner of the Run, working with TechBuzz Hub to mobilise entrepreneurs, investors, students and sponsors, and to strengthen a local investment culture in Uganda. The collaboration covers:' },
          { no: '3.1', text: 'Community mobilisation and awareness before and during the Run.' },
          { no: '3.2', text: 'Resource mobilisation (sponsors, donors, funding partners, ticket and kit sales).' },
          { no: '3.3', text: 'Participation in the Organising Committee through an in-charge person serving as an Auxiliary Organising Committee Member.' },
          { no: '3.4', text: 'Follow-up programmes after the Run, including angel investor development and startup support.' },
        ],
      },
      {
        no: '4',
        heading: 'Guiding Principles',
        clauses: [
          { text: 'The Partner Hub agrees to uphold the Startups Harambee Run 2026 Guiding Principles (Version 1.1, adopted 23 September 2026), in particular:' },
          { no: '4.1', text: 'Mission first, funds follow: all activity serves the startup pipeline; no diversion of funds outside the approved award framework.' },
          { no: '4.2', text: 'Transparency and accountability: contributions and pledges mobilised by the Partner Hub are recorded and reported openly.' },
          { no: '4.3', text: 'Financial control: all contributions are made through the designated payment platform (www.haramberun.com); the Partner Hub does not collect cash on behalf of the Run unless authorised in writing by the Finance Lead.' },
          { no: '4.4', text: 'Ethical resource mobilisation: solicit truthfully, using only approved sponsorship tiers, benefits and materials.' },
          { no: '4.5', text: 'Safety, safeguarding and inclusion: follow the Run’s safety, consent and code-of-conduct protocols, especially for minors and students.' },
          { no: '4.6', text: 'Brand integrity: use the Run’s name, brand and your official company brand only which has entered into this MOU or as may be approved by the Communications Lead.' },
          { no: '4.7', text: 'Conflict of interest: declare any conflict of interest and excuse from related decisions.' },
        ],
      },
      {
        no: '5',
        heading: 'Roles and Responsibilities',
        clauses: [
          { no: '5.1', text: 'The Partner Hub shall:' },
          { no: '5.1.1', level: 1, text: 'Serve as the Run’s mobiliser for its community of entrepreneurs, startups and innovators.' },
          { no: '5.1.2', level: 1, text: 'Create awareness of the Run through its communication channels and share approved awareness materials.' },
          { no: '5.1.3', level: 1, text: 'Introduce the Run to its stakeholders, including potential sponsors, investors and funding partners.' },
          { no: '5.1.4', level: 1, text: 'Provide in-kind mobilisation resources where available (e.g. vehicles, fuel, activation venue and schedule, digital tools, creatives and marketing support) and financial support where its budget allows.' },
          { no: '5.1.5', level: 1, text: 'Encourage its staff and members to participate in the Run, buy running kits or sponsor kits.' },
          { no: '5.1.6', level: 1, text: 'Assign an in-charge person to join the Organising Committee as an Auxiliary Organising Committee Member (see clause 5.3).' },
          { no: '5.1.7', level: 1, text: 'Share timely updates on mobilisation progress, pledges and partner onboarding with the Coordinator.' },
          { no: '5.2', text: 'TechBuzz Hub (through the Organising /Fund management Committee ) shall:' },
          { no: '5.2.1', level: 1, text: 'Coordinate the overall planning and delivery of the Run, including permits, routes, safety and logistics.' },
          { no: '5.2.2', level: 1, text: 'Provide the Partner Hub with approved event details, sponsorship packages and awareness materials.' },
          { no: '5.2.3', level: 1, text: 'Allocate to participating hubs a package from the 30% of funds raised designated for hubs, to launch or champion an Angel Investing arm, in line with the award framework.' },
          { no: '5.2.4', level: 1, text: 'Provide mobilisation service refund of 10% of the sponsor, donor, funding partner and partner onboarding, as approved by the steering committee.' },
          { no: '5.2.5', level: 1, text: 'Give the Partner Hub a collaboration spotlight and visibility as an ecosystem enabler and co-host.' },
          { no: '5.2.6', level: 1, text: 'Offer angel investor training sponsorship and introduction and fundraising opportunities to the Partner Hub’s community.' },
          { no: '5.2.7', level: 1, text: 'Provide implementation support for follow-up programmes after the Run.' },
          { no: '5.2.8', level: 1, text: 'Share the post-event report with the Partner Hub within 15 days of the Run.' },
          { text: 'The size of incentives and packages under clause 5.2 depends on funds actually raised and is subject to approval by the steering committee (Fund Flow Committee).' },
          { no: '5.3', text: 'Auxiliary Organising Committee Member' },
          { no: '5.3.1', level: 1, text: 'The in-charge person assigned by the Partner Hub shall join the organising team as an Auxiliary Organising Committee Member.' },
          { no: '5.3.2', level: 1, text: 'The Auxiliary Member shall assist and support the respective members of the Organising Committee in planning, coordinating and managing the Run and all other planned activities.' },
          { no: '5.3.3', level: 1, text: 'The Auxiliary Member shall attend committee meetings and report to the Vice Chairperson / Coordinator, with no voting rights and no financial approval or payment-execution role.' },
          { no: '5.3.4', level: 1, text: 'The Auxiliary Member shall sign the Organising Committee’s confidentiality and conflict-of-interest declaration and is bound by the Guiding Principles.' },
          { no: '5.3.5', level: 1, text: 'The Partner Hub may replace its Auxiliary Member by written notice to the Coordinator.' },
        ],
      },
      {
        no: '6',
        heading: 'Funds and Financial Management',
        clauses: [
          { no: '6.1', text: 'All funds raised for the Run are managed under the Fund Flow and Management framework and overseen by the multi-stakeholder steering committee.' },
          { no: '6.2', text: 'Neither Party shall commit the other to any financial obligation without prior written approval.' },
          { no: '6.3', text: 'Each Party bears its own costs under this MOU unless otherwise agreed in writing.' },
        ],
      },
      {
        no: '7',
        heading: 'Branding and Communication',
        clauses: [
          { no: '7.1', text: 'Each Party may use the other’s name and logo only for the Run and only in materials approved by the Run’s Communications Lead.' },
          { no: '7.2', text: 'Public statements on behalf of the Run are made only by the Chairperson, the Communications Lead or persons they authorise.' },
        ],
      },
      {
        no: '8',
        heading: 'Confidentiality and Data Protection',
        clauses: [
          { text: 'The Parties shall keep confidential any non-public information shared under this MOU, and shall handle personal data of participants, donors and investors in line with Ugandan data protection law.' },
        ],
      },
      {
        no: '9',
        heading: 'Term and Termination',
        clauses: [
          { no: '9.1', text: 'This MOU takes effect on the date of the last signature and remains in force until the completion of the Run’s winding up and handover (by 13 December 2026), unless renewed for the next edition.' },
          { no: '9.2', text: 'Either Party may end this MOU by giving fourteen (14) days’ written notice.' },
          { no: '9.3', text: 'Either Party may end this MOU immediately if the other materially breaches the Guiding Principles, including misuse of funds, misuse of the brand or harm to participants.' },
        ],
      },
      {
        no: '10',
        heading: 'Nature of this MOU',
        clauses: [
          { text: 'This MOU is a statement of good-faith intent to collaborate. It does not create a legal partnership, joint venture or agency, and is not legally binding except for clauses 6.2, 7, 8 and 9. Any financial commitment shall be set out in a separate written agreement.' },
        ],
      },
      {
        no: '11',
        heading: 'Dispute Resolution',
        clauses: [
          { text: 'Any disagreement shall first be resolved amicably between the Coordinator and the Partner Hub’s representative and, if unresolved, referred to the Chairperson of the Organising Committee for a final decision before further actions are taken' },
        ],
      },
      {
        no: '12',
        heading: 'Amendment',
        clauses: [{ text: 'This MOU may be amended only in writing, signed by both Parties.' }],
      },
    ],
  }
}

// Plain-text version, saved with each signature and used to lay out the signed PDF.
// Format: letterhead lines, blank line, TITLE, subtitle/tagline/date lines, then "N. HEADING" lines followed by
// clauses written as "N.N text" (the number is indented by its depth in the PDF).
export function mouToText(mou: Mou): string {
  const lines: string[] = [...mou.letterhead, '', mou.title.toUpperCase(), '', mou.subtitle, mou.tagline, '', mou.dateLine, '']
  for (const section of mou.sections) {
    lines.push(`${section.no}. ${section.heading.toUpperCase()}`)
    for (const clause of section.clauses) lines.push(clause.no ? `${clause.no} ${clause.text}` : clause.text)
    lines.push('')
  }
  lines.push('13. SIGNATURES', '', 'IN WITNESS WHEREOF, the Parties have signed this MOU on the dates indicated below.')
  return lines.join('\n')
}
