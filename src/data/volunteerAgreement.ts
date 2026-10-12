// Wording of the volunteer agreement shown on the unlisted /volunteer-agreement page.
// Adapted from the Startups Harambe Run 2026 Organising Committee appointment letter.
//
// Edit the text here. Bump AGREEMENT_VERSION whenever the wording changes: every signed record
// stores the version and the exact text the volunteer saw (Supabase: volunteer_agreements).

export const AGREEMENT_VERSION = '2026-10-v1'

// Keep in sync with the roles on the volunteer sign-up page (src/pages/VolunteerPage.tsx).
export const volunteerRoles = [
  'Community mobiliser champion (organise run meetings)',
  'Social media campaign influencer',
  'TikTok content creator',
  'Marketing and sales',
  'Workout trainer',
  'Run marshal',
  'Digital marketing',
]

export type AgreementSection = {
  heading: string
  paragraphs?: string[]
  items?: string[]
  note?: string
}

export type Agreement = {
  letterhead: string[]
  title: string
  intro: string
  sections: AgreementSection[]
  closing: string
  issuedBy: string
}

export function buildAgreement(rawName: string, rawRole: string): Agreement {
  const name = rawName.trim().replace(/\s+/g, ' ') || '[your full name]'
  const role = rawRole.trim() || '[your chosen role]'

  return {
    letterhead: [
      'TechBuzz Hub',
      'Plot 668, Kayondo Road, P.O. Box 18 Ntinda, Kampala',
      'info@techbuzzhub.org · 070 279 9754 · www.techbuzzhub.org',
    ],
    title: 'Startups Harambe Run 2026 Volunteer Agreement',
    intro:
      `This agreement is made between ${name} (“the Volunteer”) and TechBuzz Hub, as convener of the Startups Harambe Run 2026 (“the Run”) under the Startup Funding Vehicles (SFV) initiative. ` +
      `It confirms the Volunteer’s place on the Run’s volunteer team in the role of ${role}, and sets out the responsibilities and expectations below, in line with the Run’s Code of Conduct and volunteer safeguarding guidelines.`,
    sections: [
      {
        heading: 'Role Purpose',
        paragraphs: [
          'To help deliver the Startups Harambe Run 2026, a fundraising run whose proceeds support startup programmes in universities, catalytic funds for startups and angel investor training, by carrying out your volunteer role reliably, safely and with integrity.',
        ],
      },
      {
        heading: 'Objective',
        paragraphs: [
          'To mobilise runners, support run-day operations and represent the Run positively within your chosen role, as briefed by the Organising Committee.',
        ],
      },
      {
        heading: 'Duties and Responsibilities',
        items: [
          'Carry out the duties of your chosen role as briefed by the Organising Committee and your team lead.',
          'Attend volunteer briefings and team meetings as scheduled, and take part in pre-run activities and on run day (Sunday, 29 November 2026) according to the availability you confirmed.',
          'Represent the Run respectfully in person and online, and use its name, logo and messages only as approved by the Organising Committee.',
          'Use the Run’s official channels for registrations, payments and donations, and do not collect money on the Run’s behalf in any other way unless the Organising Committee has authorised you in writing.',
          'Handle participant, donor and sponsor information with care, in line with data protection requirements, and share it only with Run team members who need it.',
          'Follow safety and safeguarding instructions, and report any incident, injury or concern to the Safety and Welfare team straight away.',
        ],
      },
      {
        heading: 'Terms',
        paragraphs: [
          'The mandate of this agreement runs from the date you sign it until the completion of winding up and handover to the Fund Flow Committee, expected to conclude within two (2) weeks of the Run, by 13 December 2026, unless the steering committee resolves otherwise.',
          'By signing, you make a confidentiality and conflict-of-interest declaration, agree to attend briefings and team meetings as scheduled, and agree to uphold the Run’s Code of Conduct and safeguarding guidelines throughout planning, execution and handover.',
          'Volunteering is voluntary and does not create an employment relationship. Any incentives, recognition or merchandise are as communicated separately by the Organising Committee.',
        ],
        note: 'Role-specific note: the duties above apply to all volunteer roles. Details specific to your role will be confirmed by your team lead and the Organising Committee.',
      },
    ],
    closing: 'The Run takes place on Sunday, 29 November 2026 at Makerere University Freedom Square.',
    issuedBy:
      'Issued by TechBuzz Hub, convener of the Startups Harambe Run 2026 under the Startup Funding Vehicles (SFV) initiative.',
  }
}

// Plain-text version, saved with each signature and included in the emailed copy.
export function agreementToText(agreement: Agreement): string {
  const lines: string[] = [...agreement.letterhead, '', agreement.title.toUpperCase(), '', agreement.intro, '']
  for (const section of agreement.sections) {
    lines.push(section.heading.toUpperCase())
    section.paragraphs?.forEach((paragraph) => lines.push(paragraph, ''))
    section.items?.forEach((item, index) => lines.push(`${index + 1}. ${item}`))
    if (section.items) lines.push('')
    if (section.note) lines.push(section.note, '')
  }
  lines.push(agreement.closing, '', agreement.issuedBy)
  return lines.join('\n')
}
