// Policy pages shown at /privacy, /cookies, /terms and /refunds, linked from the footer.
// Plain text only: each section has paragraphs and/or bullet points. Keep UPDATED in step with real changes.
// These are drafted from how the site actually works (see the notes at the top of each). Have them read by a
// lawyer before the run, and update them whenever the site starts collecting or sharing something new.

export const POLICIES_UPDATED = '1 November 2026'
export const POLICY_EMAIL = 'info@haramberun.com'

export type PolicySection = { heading: string; paragraphs?: string[]; bullets?: string[]; after?: string[] }
export type Policy = { slug: 'privacy' | 'cookies' | 'terms' | 'refunds'; title: string; summary: string; sections: PolicySection[] }

const WHO = 'TechBuzz Hub, Plot 668, Kayondo Road, P.O. Box 18 Ntinda, Kampala, Uganda (“we”, “us”), the convener of the Startups Harambe Run 2026 (“the Run”) under the Startup Funding Vehicles (SFV) initiative'

export const policies: Record<Policy['slug'], Policy> = {
  privacy: {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'What personal information we collect on haramberun.com, why, who we share it with, and the choices you have.',
    sections: [
      {
        heading: 'Who we are',
        paragraphs: [
          `This website, haramberun.com, is run by ${WHO}. We are responsible for the personal information described here.`,
          `We follow the Data Protection and Privacy Act, 2019 of Uganda. If you have a question or want to use any of your rights, write to ${POLICY_EMAIL}.`,
        ],
      },
      {
        heading: 'What we collect, and why',
        paragraphs: ['We only ask for what we need for the thing you are doing.'],
        bullets: [
          'Runner registration: your name, email, phone number, gender, date of birth, running category and distance, kit size, university or organisation (or business name), next of kin (name, relationship, phone), and any medical conditions or allergies you choose to tell us. We use these to confirm your place, hand over your kit, keep you safe on the day, and contact your next of kin in an emergency.',
          'Donations: your name, email, phone number, the amount, and whether you want your name shown on the public donor board or shown as anonymous.',
          'Payments: your mobile money number or the result of a card payment. Card details are typed on our payment partner’s secure page and are never seen or stored by us.',
          'Volunteer applications, sponsor, exhibitor and partner enquiries: the details you type in the form, such as your name, contact details, organisation, role preferences and message.',
          'Signed documents (volunteer agreements and partner or resource mobiliser MOUs): your details, your drawn signature, the time of signing, and your IP address and browser details as evidence that you signed.',
          '“I’ll be there” posters: your name, email, and how you will take part. Your photo is used on your own device to make the poster and is not uploaded or kept by us. Only the finished poster is emailed to you.',
          'Newsletter: your email address, if you join the updates list.',
          'Visits to the website: pages viewed, the page or site you came from, device type (mobile, tablet or desktop), country, a random visitor number saved in your browser, and a scrambled (hashed) version of your IP address that lets us count unique visitors without storing the address itself. We use this to understand how the site is used and to see how many visits and sign-ups come through each partner page. See the Cookie Policy for details.',
          'Referral tracking: if you arrive through a volunteer’s or partner’s link, we remember that link for 7 days so the person who shared it is credited.',
        ],
      },
      {
        heading: 'Why we are allowed to use it',
        bullets: [
          'To carry out what you asked for: registering you, taking your payment, sending receipts and confirmations.',
          'With your consent, where we ask for it (for example the optional medical information, the updates list and the poster email).',
          'To meet legal obligations, such as keeping accounting and payment records.',
          'For our legitimate interests in running a safe event, preventing fraud and understanding how the website is used, always in a way that respects your rights.',
        ],
      },
      {
        heading: 'Who we share it with',
        paragraphs: ['We do not sell your personal information. We share it only with people who help us run the Run and this site:'],
        bullets: [
          'Blink Pay, our payment provider, to process mobile money and Visa card payments.',
          'EgoSMS, to send you payment and confirmation text messages.',
          'Resend, to send you receipts, confirmations, signed documents and posters by email.',
          'Supabase and Netlify, which host our database, functions and website.',
          'GoAffPro, which tracks volunteer referral links so volunteers can be credited.',
          'Google Fonts, which delivers the website’s typeface when your browser loads a page.',
          'The Run’s organising committee, partners and volunteers, only as far as they need it to deliver the event, for example the kit pickup desk checking your registration.',
          'Authorities or professional advisers, where the law requires it.',
        ],
        after: [
          'Some of these providers store data outside Uganda. Where that happens we rely on them to protect it to a standard comparable to Ugandan law.',
        ],
      },
      {
        heading: 'What is public',
        paragraphs: [
          'The website shows a donor board and running totals. It can show a donor’s name, the amount and how long ago they gave. If you choose “Display as anonymous” when you give, your name is not shown. Partner pages show only the total raised through that page, never who gave.',
        ],
      },
      {
        heading: 'How long we keep it',
        paragraphs: [
          'We keep your information for as long as we need it for the Run, for the follow-up programmes it funds, and for our legal and accounting duties. Payment and receipt records are kept for the period the law requires. Website visit records are kept only as long as they are useful for reporting. Poster emails and codes are not kept longer than needed.',
          `You can ask us to delete your information at any time (see your rights below). We may need to keep some payment records even after that.`,
        ],
      },
      {
        heading: 'How we protect it',
        paragraphs: [
          'The website uses an encrypted connection. Our database is not open to the public, and administrator access is limited and protected. No online service is completely secure, so please keep your receipt links and passwords private.',
        ],
      },
      {
        heading: 'Children and young people',
        paragraphs: [
          'Runners under 18 must register with the knowledge and consent of a parent or guardian, who is responsible for the details given. We do not knowingly collect information from children for marketing.',
        ],
      },
      {
        heading: 'Your rights',
        paragraphs: ['You can ask us to:'],
        bullets: [
          'tell you what we hold about you and give you a copy;',
          'correct information that is wrong or out of date;',
          'delete information we no longer need;',
          'stop using your information for a purpose you object to, including the updates list (every update can be opted out of);',
          'withdraw a consent you gave, without affecting what we did before.',
        ],
        after: [
          `Write to ${POLICY_EMAIL}. We will answer as soon as we can. If you are not happy with our answer you can complain to Uganda’s Personal Data Protection Office.`,
        ],
      },
      {
        heading: 'Changes to this policy',
        paragraphs: [`We will update this page if what we do changes. The date at the top shows when it was last updated (${POLICIES_UPDATED}).`],
      },
    ],
  },

  cookies: {
    slug: 'cookies',
    title: 'Cookie Policy',
    summary: 'What small files and browser storage this website uses, what for, and how to control them.',
    sections: [
      {
        heading: 'What cookies and similar storage are',
        paragraphs: [
          'Cookies are small files a website saves in your browser. Websites can also use “local storage” and “session storage”, which work in a similar way. We use the words “cookies and similar technologies” for all of them.',
        ],
      },
      {
        heading: 'Our approach',
        paragraphs: [
          'We keep this simple. haramberun.com does not use advertising cookies and does not follow you around the internet. The site does not use Google Analytics or Facebook Pixel. We run our own basic visit counting, and we use only a few small items in your browser that help the site work.',
        ],
      },
      {
        heading: 'What we store in your browser',
        bullets: [
          'harambe_vid (local storage, stays until you clear it): a random number that lets us count unique visitors. It does not contain your name or any personal details.',
          'harambe_sid (session storage, cleared when you close the tab): a random number that groups the pages you view in one visit.',
          'harambe_hub (local storage, 7 days): remembers which partner page you came from so a kit or donation you make is counted for that partner.',
          'harambe_ref (local storage, 7 days): remembers a volunteer’s or partner’s referral link so they are credited if you register or give.',
        ],
        after: [
          'These items are used to make the site work and to count visits and sign-ups. We also record a scrambled version of your IP address, which cannot be turned back into the address, to count unique visitors. See the Privacy Policy for more.',
        ],
      },
      {
        heading: 'Third parties',
        paragraphs: ['A few services we use can set their own cookies or receive your IP address when they load:'],
        bullets: [
          'GoAffPro (affiliate tracking): its script may set a cookie to remember a referral link for about 7 days so volunteers are credited. It is not used for advertising.',
          'Google Fonts: loads our typeface from Google. Google receives your IP address and browser details when your browser asks for the font.',
          'Blink Pay: if you pay by card you are taken to Blink’s secure payment page, which has its own cookies and policies. Mobile money prompts happen on your phone.',
          'WhatsApp: the chat button opens WhatsApp, which has its own policy.',
        ],
        after: ['We do not control the cookies of other companies. Please read their policies for details.'],
      },
      {
        heading: 'Your choices',
        bullets: [
          'You can delete cookies and site data at any time in your browser settings. The site will still work, and you will simply be counted as a new visitor.',
          'You can set your browser to block cookies and local storage. Some parts of the site, such as partner-page credit, may not work.',
          'Private or incognito windows clear this storage when you close them.',
          'Our visit counting is anonymous and does not build a profile of you. If you would rather not be counted, block local storage in your browser.',
        ],
      },
      {
        heading: 'Changes and contact',
        paragraphs: [
          `We will update this page if we start using other cookies or tools. Questions? Write to ${POLICY_EMAIL}. Last updated ${POLICIES_UPDATED}.`,
        ],
      },
    ],
  },

  terms: {
    slug: 'terms',
    title: 'Terms and Conditions',
    summary: 'The rules for using this website, registering for the Run and taking part on the day.',
    sections: [
      {
        heading: 'About these terms',
        paragraphs: [
          `These terms apply when you use haramberun.com, register for, donate to or take part in the Startups Harambe Run 2026. The Run is convened by ${WHO}. By using the site or registering, you agree to them.`,
        ],
      },
      {
        heading: 'The Run',
        paragraphs: [
          'The Run takes place on Sunday, 29 November 2026. Runners follow the published Makerere Club route at Makerere University, Kampala. Times, routes and arrangements may change for safety, weather or official instructions, and we will tell registered runners when they do.',
        ],
      },
      {
        heading: 'Registering',
        bullets: [
          'You must give correct and complete details, and you must be the person taking part or have their permission to register them.',
          'Runners under 18 must have the consent of a parent or guardian.',
          'A place is confirmed only once payment is received. You then get a receipt on screen, by SMS and by email.',
          'Registrations are personal to the named runner. If you cannot run, write to us before kit pickup to ask for a name change, and see the Refund Policy.',
        ],
      },
      {
        heading: 'Prices and the student rate',
        paragraphs: [
          'Prices are shown in Ugandan shillings on the registration page and are set by us. The student rate is for students with a valid student ID, which you must show at kit pickup. If you cannot show one, you may be asked to pay the standard difference or may not be given a kit at the student rate.',
          'Mobile money and card networks may charge their own fees, which are shown to you before you pay.',
        ],
      },
      {
        heading: 'Kit pickup',
        paragraphs: [
          'Show your receipt or confirmation SMS (and your student ID if you booked the student rate) at the kit pickup desk. A kit is handed over once. Please keep your receipt link private.',
        ],
      },
      {
        heading: 'Health, safety and conduct',
        bullets: [
          'You take part at your own risk and confirm you are fit to take part. Please see a doctor first if you are unsure.',
          'Tell the medical team on the day about any condition that may affect you. Details you give us about next of kin and medical conditions may be used to help you in an emergency.',
          'Follow the instructions of marshals, medical staff, police and organisers. Stay on the official route for your distance and wear your bib where it can be seen.',
          'Behave respectfully towards other runners, volunteers and the public. We may remove anyone who puts others at risk, and no refund is due in that case.',
          'We run the Run with medical cover, marshals and police coordination, but we cannot remove every risk of a public road event.',
        ],
      },
      {
        heading: 'Photos and video',
        paragraphs: [
          'The Run will be photographed and filmed. By registering and taking part you allow TechBuzz Hub and the Run’s partners to use photos, video and results showing you to promote and report on the Run. If you do not want to appear, tell the media team at the event or write to us.',
        ],
      },
      {
        heading: 'Donations and the Startups Harambe Fund',
        paragraphs: [
          'Donations and the donation part of a kit payment support student startup programmes, hackathons, proof-of-concept grants, incubation and angel investor networks, under the oversight of a multi-stakeholder steering committee (the Fund Flow Committee). Donations are voluntary gifts and are not investments, and they do not give you any ownership or return.',
          'Pages made for partner hubs show how much has been raised through that page. A donor board may show your name unless you choose to be shown as anonymous.',
        ],
      },
      {
        heading: 'Using the website',
        bullets: [
          'Do not misuse the site, try to break into it, overload it, or use it to send spam or false information.',
          'Do not copy the Run’s name, logos or content for commercial use without our written permission.',
          'The content, designs and logos on the site belong to us or our partners and are protected by law. Partner and sponsor logos belong to their owners.',
          'Links to other websites are for convenience. We are not responsible for what they contain.',
        ],
      },
      {
        heading: 'Changes, cancellation and things outside our control',
        paragraphs: [
          'We may change the programme, routes or timings, or cancel or postpone the Run if we have to for safety, weather, public health, government or police direction, or other events beyond our control. If that happens we will tell registered runners and handle payments as described in the Refund Policy.',
        ],
      },
      {
        heading: 'Our responsibility',
        paragraphs: [
          'We take reasonable care in running the Run and this website. As far as the law allows, we are not responsible for loss or injury that is not caused by our negligence, for indirect loss, or for losses caused by events beyond our control. Nothing in these terms limits any right you have under Ugandan law that cannot be limited.',
        ],
      },
      {
        heading: 'Law and disputes',
        paragraphs: [
          'These terms are governed by the laws of Uganda. If we have a disagreement, please write to us first so we can try to settle it fairly. Failing that, the courts of Uganda can decide it.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [`Questions about these terms? Write to ${POLICY_EMAIL}. Last updated ${POLICIES_UPDATED}.`],
      },
    ],
  },

  refunds: {
    slug: 'refunds',
    title: 'Refund and Cancellation Policy',
    summary: 'When payments for kits, tickets and donations can be refunded, changed or moved.',
    sections: [
      {
        heading: 'Running kits and tickets',
        bullets: [
          'Payments for running kits and tickets are final once the payment is confirmed, because we order and prepare kits for registered runners.',
          'If you cannot run, you may ask us to move your registration to another person. Write to us with the reference on your receipt and the new runner’s name and contact details, before kit pickup. We will confirm the change by email.',
          'If you paid at the student rate, the person who takes the place must also qualify for it and show a valid student ID.',
        ],
      },
      {
        heading: 'Donations',
        paragraphs: [
          'Donations are voluntary gifts and are not refundable. If you gave by mistake, paid twice, or entered the wrong amount, write to us within 7 days with your reference and we will put it right.',
        ],
      },
      {
        heading: 'Duplicate or failed payments',
        bullets: [
          'If you are charged more than once for the same registration or gift, we will refund the duplicate.',
          'If money left your account but you got no receipt, wait a few minutes, as approvals can be slow. You can look up a payment on the receipt page with your reference and phone number. If it still shows no confirmation after that, write to us with your phone number and the time of payment.',
          'If a payment did not complete, you are normally not charged. Your mobile money provider can confirm that.',
        ],
      },
      {
        heading: 'If we change or cancel the Run',
        paragraphs: [
          'If we move the Run to a new date, your registration stays valid for the new date, and you may ask for a refund of your kit or ticket instead if you cannot attend.',
          'If we cancel the Run and do not hold it again, we will refund kit and ticket payments, less any payment-processing fees we cannot recover. Donations made to the Fund are not refunded.',
          'If the Run goes ahead but is shortened or changed because of weather, safety or official direction, no refund is due.',
        ],
      },
      {
        heading: 'How refunds are paid',
        paragraphs: [
          'Approved refunds are sent to the mobile money number or card used to pay, normally within 14 days of approval. Refunds are made in Ugandan shillings.',
        ],
      },
      {
        heading: 'How to ask',
        paragraphs: [
          `Email ${POLICY_EMAIL} with your payment reference (it starts with HR26-), the name on the registration and what you need. Last updated ${POLICIES_UPDATED}.`,
        ],
      },
    ],
  },
}

export const policyList = [policies.privacy, policies.cookies, policies.terms, policies.refunds]
