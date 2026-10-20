// Wording of the Resource Mobiliser MOU shown on the unlisted /mobiliser-mou page.
// Taken word for word from "MOU Resource Mobiliser Startups Harambee Run 2026" (the Word document), with the blanks
// (date, name, address) filled in from the form.
//
// Edit the text here. Bump MOU_VERSION whenever the wording changes: every signed record stores the
// version and the exact text the signer saw (Supabase: mobiliser_mous).
import type { Mou } from './partnerMou'

export const MOU_VERSION = '2026-10-v1'

export type MobiliserParty = { name: string; address: string; date: Date }

const blank = (value: string, placeholder: string) => value.trim().replace(/\s+/g, ' ') || placeholder
const ordinal = (n: number) => {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`
}

export function buildMobiliserMou({ name, address, date }: MobiliserParty): Mou {
  const who = blank(name, '[Name of Resource Mobiliser]')
  const where = blank(address, '[Address]')
  const month = date.toLocaleString('en-GB', { month: 'long' })

  return {
    letterhead: [
      'TechBuzz Hub',
      'Plot 668, Kayondo Road, P.O. Box 18 Ntinda, Kampala',
      'info@techbuzzhub.org · 070 279 9754 · www.techbuzzhub.org',
    ],
    title: 'Memorandum of Understanding',
    subtitle: 'for Resource Mobilisation Partnership in the Startups Harambe Run 2026',
    tagline: '#StartupsHarambeRun | #CapitalHarambeRun | Sunday, 29 November 2026 | Kampala, Uganda',
    dateLine: `This Memorandum of Understanding (“MOU”) is made on this ${ordinal(date.getDate())} day of ${month}, ${date.getFullYear()}.`,
    hubCounterparty: { name: 'Mr. Keneth Twesigye', title: 'V/CP Coordinator, Startups Harambe Run 2026' },
    sections: [
      {
        no: '1',
        heading: 'Parties',
        clauses: [
          { text: 'BETWEEN' },
          {
            text: 'TechBuzz Hub, an innovation hub located at Plot 668, Kayondo Road, P.O. Box 18 Ntinda, Kampala, Uganda, convener of the Startups Harambe Run 2026 under the Startup Funding Vehicles (SFV) initiative, acting through the Organising Committee of the Run (“TechBuzz Hub” or “the Convener”);',
          },
          { text: 'AND' },
          { text: `${who}, of ${where} (“the Resource Mobiliser”).` },
          { text: 'Together referred to as “the Parties” and each as a “Party”.' },
        ],
      },
      {
        no: '2',
        heading: 'Background',
        clauses: [
          { no: '2.1', text: 'The Startups Harambe Run 2026 (“the Run”), also known as the Capital Harambe Run, is an annual fundraising run taking place on Sunday, 29 November 2026, from Makerere university to the finish line at Makerere University Freedom Square, Kampala.' },
          { no: '2.2', text: 'The Run aims to raise UGX 3,750,000,000 through tickets, sponsorships, pledges, donations, running kit sales and in-kind contributions, with targets of 5,000+ participants, 40+ investors and 50+ institutional partners.' },
          { no: '2.3', text: 'Proceeds are channeled to student startup programs, hackathons, proof-of-concept grants, incubation and angel investor networks, under the oversight of a multi-stakeholder steering committee (the Fund Flow Committee).' },
          { no: '2.4', text: 'By letter dated 17th October 2026, TechBuzz Hub invited the Resource Mobiliser to serve as a Resource Mobiliser / Fundraiser for the Run, and the Resource Mobiliser has agreed to take up this role.' },
          { no: '2.5', text: 'The Parties wish to record the terms of their collaboration in this MOU.' },
        ],
      },
      {
        no: '3',
        heading: 'Purpose and Scope',
        clauses: [
          { text: 'The purpose of this MOU is to engage the Resource Mobiliser to mobilise financial and in-kind resources for the Run, working with TechBuzz Hub to reach the Run’s fundraising target of UGX 3.75 billion and to strengthen a local investment culture in Uganda. The collaboration covers:' },
          { no: '3.1', text: 'Identifying and engaging potential sponsors, corporate partners, foundations, SACCOs, investors and individual donors.' },
          { no: '3.2', text: 'Securing sponsorship, endorsement, partnership and pledge commitments, and driving running kit sales and corporate team registrations.' },
          { no: '3.3', text: 'Mobilising in-kind contributions for the Run.' },
          { no: '3.4', text: 'Following up on pledges, onboarding partners and reporting the resources mobilised.' },
        ],
      },
      {
        no: '4',
        heading: 'Guiding Principles',
        clauses: [
          { text: 'The Resource Mobiliser agrees to uphold the Startups Harambe Run 2026 Guiding Principles (Version 1.1, adopted 23 September 2026), in particular:' },
          { no: '4.1', text: 'Mission first, funds follow: all activity serves the startup pipeline; no diversion of funds outside the approved award framework.' },
          { no: '4.2', text: 'Transparency and accountability: contributions and pledges mobilised by the Resource Mobiliser are recorded and reported openly.' },
          { no: '4.3', text: 'Financial control: all contributions are made through the designated payment platform (www.haramberun.com); the Resource Mobiliser does not collect cash on behalf of the Run unless authorized in writing by the Finance Lead.' },
          { no: '4.4', text: 'Ethical resource mobilisation: solicit truthfully, using only approved sponsorship tiers, benefits and materials.' },
          { no: '4.5', text: 'Safety, safeguarding and inclusion: follow the Run’s safety, consent and code-of-conduct protocols, especially for minors and students.' },
          { no: '4.6', text: 'Brand integrity: use the Run’s name and brand, and the Resource Mobiliser’s own name and brand, only in materials approved by the Communications Lead.' },
          { no: '4.7', text: 'Conflict of interest: declare any conflict of interest and excuse from related decisions.' },
        ],
      },
      {
        no: '5',
        heading: 'Roles and Responsibilities',
        clauses: [
          { no: '5.1', text: 'The Resource Mobiliser shall:' },
          { no: '5.1.1', level: 1, text: 'Identify and engage potential sponsors, corporate partners, foundations, SACCOs, investors and individual donors within its network.' },
          { no: '5.1.2', level: 1, text: 'Pitch the Run to prospective funders using the approved sponsorship packages and materials, and secure sponsorship, endorsement and partnership commitments.' },
          { no: '5.1.3', level: 1, text: 'Drive bulk running kit sales and corporate team registrations through its workplace, alumni, faith, community and business networks.' },
          { no: '5.1.4', level: 1, text: 'Organise fundraising drives, pledge campaigns and donor engagement meetings in the lead-up to the Run.' },
          { no: '5.1.5', level: 1, text: 'Mobilise in-kind contributions such as drinking water, refreshments, branded merchandise, transport, media airtime, sound and medical support.' },
          { no: '5.1.6', level: 1, text: 'Promote the fundraising campaign on its social media and professional platforms to reach new supporters.' },
          { no: '5.1.7', level: 1, text: 'Follow up on pledges, support partner onboarding, and share timely updates on the resources it has mobilised with the coordinator, so that each contribution is correctly attributed to the Resource Mobiliser.' },
          { no: '5.2', text: 'TechBuzz Hub (through the Organising / Fund Management Committee) shall:' },
          { no: '5.2.1', level: 1, text: 'Coordinate the overall planning and delivery of the Run, including permits, routes, safety and logistics.' },
          { no: '5.2.2', level: 1, text: 'Provide the Resource Mobiliser with approved event details, sponsorship packages, pitch and awareness materials.' },
          { no: '5.2.3', level: 1, text: 'Commission: pay the Resource Mobiliser a commission of 10% of the total resources it mobilizes (cash and the agreed value of in-kind contributions), on the terms in clause 5.3.' },
          { no: '5.2.4', level: 1, text: 'Collaborator visibility: where the Resource Mobiliser is an organisation, feature its logo on the #CapitalHarambeRun / TechBuzz Hub website as an official collaborator.' },
          { no: '5.2.5', level: 1, text: 'Recognise top-performing resource mobilisers with awards at the event, and issue the Resource Mobiliser a Certificate of Recognition as an official Resource Mobiliser of the #CapitalHarambeRun.' },
          { no: '5.2.6', level: 1, text: 'Provide networking opportunities with corporate sponsors, investors, university partners and leading startup ecosystem players.' },
          { no: '5.2.7', level: 1, text: 'Offer skills training in resource mobilisation and partnership building, and priority consideration for future SFV fundraising and partnership roles.' },
          { no: '5.2.8', level: 1, text: 'Share the post-event report with the Resource Mobiliser within 15 days of the Run, including a statement of the resources attributed to it.' },
          { text: 'Recognition and non-monetary incentives under clause 5.2 are subject to approval by the steering committee (Fund Flow Committee).' },
          { no: '5.3', text: 'Commission Terms' },
          { no: '5.3.1', level: 1, text: 'Commission is calculated only on resources actually received through the designated payment platform (or, for in-kind contributions, actually delivered) and verified by the Fund Flow Committee. Pledges that are not honored do not attract commission.' },
          { no: '5.3.2', level: 1, text: 'The value of any in-kind contribution for commission purposes shall be agreed in writing with the Finance Lead before the contribution is accepted.' },
          { no: '5.3.3', level: 1, text: 'Where more than one mobiliser claims the same contribution, the coordinator shall decide attribution based on the records submitted, and that decision shall be final.' },
          { no: '5.3.4', level: 1, text: 'Commission shall be paid within 7 days of verification, by bank transfer or mobile money to the account provided by the Resource Mobiliser, less any applicable taxes.' },
          { no: '5.3.5', level: 1, text: 'The Resource Mobiliser shall not deduct commission from any funds collected, nor hold funds on behalf of the Run.' },
        ],
      },
      {
        no: '6',
        heading: 'Funds and Financial Management',
        clauses: [
          { no: '6.1', text: 'All funds raised for the Run are managed under the Fund Flow and Management framework and overseen by the multi-stakeholder steering committee.' },
          { no: '6.2', text: 'Neither Party shall commit the other to any financial obligation without prior written approval.' },
          { no: '6.3', text: 'Each Party bears its own costs under this MOU unless otherwise agreed in writing. The commission and incentives under clause 5.2 are the Resource Mobiliser’s full compensation for its mobilisation work.' },
        ],
      },
      {
        no: '7',
        heading: 'Branding and Communication',
        clauses: [
          { no: '7.1', text: 'Each Party may use the other’s name and logo only for the Run and only in materials approved by the Run’s Communications Lead.' },
          { no: '7.2', text: 'Public statements on behalf of the Run are made only by the Chairperson; the Communications Lead or persons they authorise.' },
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
          { no: '9.2', text: 'Either Party may end this MOU by giving seven (7) days’ written notice.' },
          { no: '9.3', text: 'Either Party may end this MOU immediately if the other materially breaches the Guiding Principles, including misuse of funds, misuse of the brand or harm to participants.' },
          { no: '9.4', text: 'Commission earned on resources received and verified before termination remains payable under clause 5.3, unless the MOU is ended for the Resource Mobiliser’s breach of the Guiding Principles.' },
        ],
      },
      {
        no: '10',
        heading: 'Nature of this MOU',
        clauses: [
          { text: 'This MOU is a statement of good-faith intent to collaborate. It does not create employment, a legal partnership, joint venture or agency, and the Resource Mobiliser shall not present itself as an employee or agent of TechBuzz Hub. Clauses 5.2.3, 5.3, 6, 7, 8 and 9 are binding on the Parties.' },
        ],
      },
      {
        no: '11',
        heading: 'Dispute Resolution',
        clauses: [
          { text: 'Any disagreement shall first be resolved amicably between the Coordinator and the Resource Mobiliser and, if unresolved, referred to the Chairperson of the Organising Committee for a final decision before any further action is taken.' },
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
