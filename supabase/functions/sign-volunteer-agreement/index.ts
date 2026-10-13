// Records a volunteer's digitally signed agreement (unlisted page /volunteer-agreement) in
// public.volunteer_agreements, then emails a copy to the volunteer and a notice to the team
// (ENQUIRY_NOTIFY_EMAIL, default info@haramberun.com). Staff can read every record in Supabase:
// Table Editor -> volunteer_agreements.
// Both emails carry the full agreement in the body and a printable signed PDF attachment, on the
// TechBuzz Hub letterhead (the image the website serves at /techbuzz-letterhead.jpg).
// Email secrets: RESEND_API_KEY, optional EMAIL_FROM. Email or PDF failures never lose the signature:
// it is saved first, and the outcome of each email is stored on the record.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFImage } from 'npm:pdf-lib@1.17.1'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const text = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max)
const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const normalise = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()

const MAX_SIGNATURE_IMAGE = 250_000 // characters of base64, roughly 185 KB
const MAX_PER_IP_PER_10_MIN = 30 // generous: a whole briefing session may sign on one campus Wi-Fi

type Attachment = { filename: string; content: string }

async function sendEmail(to: string, subject: string, html: string, plain: string, replyTo: string, attachments?: Attachment[]) {
  const key = Deno.env.get('RESEND_API_KEY')?.trim()
  if (!key) return { status: 'not_configured' }
  const from = Deno.env.get('EMAIL_FROM')?.trim() || 'Harambe Run <info@haramberun.com>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text: plain,
        reply_to: replyTo,
        ...(attachments?.length ? { attachments } : {}),
      }),
    })
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
    return res.ok ? { status: 'sent', id: body.id ?? null } : { status: 'error', http: res.status, summary: body.message ?? null }
  } catch (error) {
    return { status: 'error', response: String(error).slice(0, 200) }
  }
}

// ---------- Signed PDF ----------

const GREEN = rgb(0, 0.337, 0.227)
const INK = rgb(0.043, 0.18, 0.133)
const GREY = rgb(0.36, 0.42, 0.39)

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

// The letterhead (logo, address, footer strip, watermark) is one page-sized JPEG served by the website.
// A missing file often comes back as the site's index.html, so check that it really is a JPEG.
let letterheadCache: Uint8Array | null = null
async function loadLetterhead(): Promise<Uint8Array | null> {
  if (letterheadCache) return letterheadCache
  const site = (Deno.env.get('SITE_URL')?.trim() || 'https://haramberun.com').replace(/\/+$/, '')
  try {
    const res = await fetch(`${site}/techbuzz-letterhead.jpg`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.length < 1000 || bytes.length > 600_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
    letterheadCache = bytes
    return bytes
  } catch {
    return null
  }
}

type PdfInput = {
  agreementText: string
  typedSignature: string
  signatureImage: string | null
  fullName: string
  role: string
  reference: string
  when: string
  agreementVersion: string
}

// Lays the agreement text out as a letter (same structure as agreementToText on the site) and adds the
// signature block. Standard PDF fonts only cover Western characters; anything else prints as "?".
async function buildPdf(input: PdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Startups Harambe Run 2026 Volunteer Agreement (${input.reference})`)
  doc.setAuthor('TechBuzz Hub')
  doc.setSubject('Signed volunteer agreement')
  doc.setCreator('haramberun.com')

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique)
  const script = await doc.embedFont(StandardFonts.TimesRomanItalic)

  const supported = new Set(regular.getCharacterSet())
  const clean = (value: string) => {
    let out = ''
    for (const ch of value.replace(/\r/g, '').normalize('NFC')) {
      const code = ch.codePointAt(0)!
      if (supported.has(code)) {
        out += ch
        continue
      }
      if (/\s/.test(ch)) {
        out += ' '
        continue
      }
      const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      out += base && [...base].every((c) => supported.has(c.codePointAt(0)!)) ? base : '?'
    }
    return out
  }

  // US Letter with the same text margin as the original appointment letter.
  const PAGE_W = 612
  const PAGE_H = 792
  const MARGIN = 72
  const BOTTOM = 80
  const CONTENT_W = PAGE_W - MARGIN * 2

  // Without the letterhead image, fall back to a plain text header.
  const letterheadBytes = await loadLetterhead()
  let letterhead: PDFImage | null = null
  if (letterheadBytes) {
    try {
      letterhead = await doc.embedJpg(letterheadBytes)
    } catch (error) {
      console.warn('letterhead image could not be added to the pdf', error)
    }
  }
  const TOP = letterhead ? PAGE_H - 94 : PAGE_H - MARGIN

  let page = doc.addPage([PAGE_W, PAGE_H])
  let y = TOP
  // Same placement as the letterhead in the original letter; drawn first so the text sits on top.
  const drawBackground = () => {
    if (letterhead) page.drawImage(letterhead, { x: 27, y: 11, width: 558, height: 789.2 })
  }
  drawBackground()

  const ensure = (needed: number) => {
    if (y - needed < BOTTOM) {
      page = doc.addPage([PAGE_W, PAGE_H])
      drawBackground()
      y = TOP
    }
  }

  const wrap = (value: string, font: PDFFont, size: number, width: number) => {
    const lines: string[] = []
    let line = ''
    for (const word of clean(value).split(/\s+/).filter(Boolean)) {
      let rest = word
      while (font.widthOfTextAtSize(rest, size) > width) {
        // A single word wider than the line (a long email address, say): break it.
        let cut = rest.length - 1
        while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut--
        if (line) {
          lines.push(line)
          line = ''
        }
        lines.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      const candidate = line ? `${line} ${rest}` : rest
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate
      } else {
        lines.push(line)
        line = rest
      }
    }
    if (line) lines.push(line)
    return lines
  }

  type Style = { font: PDFFont; size: number; color: ReturnType<typeof rgb>; x?: number; width?: number; center?: boolean }
  // `label` (a list number) is drawn at the left margin beside the first line.
  const write = (value: string, style: Style, leading = 1.45, label?: string) => {
    const x = style.x ?? MARGIN
    const lineHeight = style.size * leading
    let firstLine = true
    for (const line of wrap(value, style.font, style.size, style.width ?? CONTENT_W - (x - MARGIN))) {
      ensure(lineHeight)
      y -= lineHeight
      const baseline = y + lineHeight * 0.28
      const drawX = style.center ? (PAGE_W - style.font.widthOfTextAtSize(line, style.size)) / 2 : x
      page.drawText(line, { x: drawX, y: baseline, size: style.size, font: style.font, color: style.color })
      if (label && firstLine) page.drawText(label, { x: MARGIN, y: baseline, size: style.size, font: style.font, color: style.color })
      firstLine = false
    }
  }

  const lines = input.agreementText.replace(/\r/g, '').split('\n')
  let i = 0

  // The agreement text begins with the letterhead lines (up to the first blank line). The letterhead image
  // already shows them; without the image, print them as a plain header.
  let first = true
  while (i < lines.length && lines[i].trim() !== '') {
    if (!letterhead) {
      write(lines[i].trim(), first ? { font: bold, size: 13, color: INK } : { font: regular, size: 9, color: GREY }, first ? 1.3 : 1.4)
    }
    first = false
    i++
  }
  if (!letterhead) {
    y -= 8
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1.5, color: GREEN })
    y -= 4
  }

  let titleDone = false
  for (; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const isHeading = line.length <= 70 && line === line.toUpperCase() && /[A-Z]/.test(line)
    if (isHeading && !titleDone) {
      titleDone = true
      y -= 16
      write(line, { font: bold, size: 14, color: INK, center: true }, 1.3)
      y -= 8
    } else if (isHeading) {
      ensure(56)
      y -= 10
      write(line, { font: bold, size: 9.5, color: GREEN })
      y -= 2
    } else {
      const item = line.match(/^(\d+)\.\s+(.*)$/)
      if (item) {
        write(item[2], { font: regular, size: 10.5, color: INK, x: MARGIN + 20 }, 1.45, `${item[1]}.`)
        y -= 4
      } else if (/^role-specific note/i.test(line)) {
        write(line, { font: oblique, size: 10.5, color: INK })
        y -= 4
      } else if (/^issued by/i.test(line)) {
        y -= 2
        write(line, { font: regular, size: 9, color: GREY })
      } else {
        write(line, { font: regular, size: 10.5, color: INK })
        y -= 5
      }
    }
  }

  // Signature block, kept together on one page.
  ensure(190)
  y -= 14
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.75, color: GREY })
  y -= 8
  const blockTop = y
  const rightX = MARGIN + 285

  write('SIGNED BY THE VOLUNTEER', { font: bold, size: 8.5, color: GREEN, width: 265 })
  if (input.signatureImage) {
    try {
      const png: PDFImage = await doc.embedPng(Uint8Array.from(atob(input.signatureImage.split(',')[1]), (c) => c.charCodeAt(0)))
      const size = png.scaleToFit(180, 58)
      y -= size.height + 4
      page.drawImage(png, { x: MARGIN, y, width: size.width, height: size.height })
    } catch (error) {
      console.warn('signature image could not be added to the pdf', error)
    }
  }
  write(input.typedSignature, { font: script, size: 22, color: INK, width: 265 }, 1.3)
  y -= 2
  write(`${input.fullName} - ${input.role}`, { font: regular, size: 9.5, color: GREY, width: 265 }, 1.35)
  write(`Signed electronically on ${input.when}`, { font: regular, size: 9.5, color: GREY, width: 265 }, 1.35)
  write(`Reference ${input.reference} - agreement version ${input.agreementVersion}`, { font: regular, size: 9.5, color: GREY, width: 265 }, 1.35)
  const leftBottom = y

  y = blockTop
  write('ISSUED BY', { font: bold, size: 8.5, color: GREEN, x: rightX, width: PAGE_W - MARGIN - rightX })
  write('TechBuzz Hub, on behalf of the Startups Harambe Run 2026 Organising Committee', {
    font: regular,
    size: 9.5,
    color: GREY,
    x: rightX,
    width: PAGE_W - MARGIN - rightX,
  }, 1.35)
  y = Math.min(y, leftBottom)

  // Footer on every page.
  const pages = doc.getPages()
  pages.forEach((p, index) => {
    const label = clean(`Ref ${input.reference} - Agreement version ${input.agreementVersion} - Page ${index + 1} of ${pages.length}`)
    p.drawText(label, { x: (PAGE_W - regular.widthOfTextAtSize(label, 8)) / 2, y: letterhead ? 58 : 34, size: 8, font: regular, color: GREY })
  })

  return await doc.save()
}

const wrap = (title: string, inner: string) => `<!doctype html><html><body style="margin:0;background:#f4f2ec;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff">
<tr><td style="background:#00563a;padding:22px 28px"><p style="margin:0;color:#e1a524;font-size:11px;letter-spacing:3px;font-weight:bold;text-transform:uppercase">Startups Harambe Run 2026</p>
<p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:bold;text-transform:uppercase">${esc(title)}</p></td></tr>
<tr><td style="padding:26px 28px;color:#0b2e22;font-size:15px;line-height:22px">${inner}</td></tr>
</table></td></tr></table></body></html>`

const row = (label: string, value: unknown) =>
  value
    ? `<tr><td style="padding:6px 14px 6px 0;color:#5b6b63;font-size:13px;vertical-align:top;white-space:nowrap">${esc(label)}</td><td style="padding:6px 0;font-size:14px;font-weight:bold">${esc(value)}</td></tr>`
    : ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return json({ error: 'Invalid request.' }, 400)

    // Hidden field that people never see; bots fill it in. Pretend it worked.
    if (text(body.website, 200)) return json({ ok: true })

    const fullName = text(body.fullName, 160).replace(/\s+/g, ' ')
    const email = text(body.email, 200)
    const phone = text(body.phone, 40)
    const role = text(body.role, 200)
    const typedSignature = text(body.typedSignature, 160).replace(/\s+/g, ' ')
    const agreementVersion = text(body.agreementVersion, 40)
    const agreementText = String(body.agreementText ?? '').trim()
    const consents = (body.consents && typeof body.consents === 'object' ? body.consents : {}) as Record<string, unknown>

    if (fullName.length < 3) return json({ error: 'Please enter your full name.' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email address.' }, 400)
    if (phone.replace(/\D/g, '').length < 9) return json({ error: 'Please enter a valid phone number.' }, 400)
    if (!role) return json({ error: 'Please choose your volunteer role.' }, 400)
    if (normalise(typedSignature) !== normalise(fullName)) {
      return json({ error: 'Your typed signature must match your full name.' }, 400)
    }
    if (!/^[\w.-]{1,40}$/.test(agreementVersion)) return json({ error: 'Invalid request.' }, 400)
    if (agreementText.length < 200 || agreementText.length > 30_000) return json({ error: 'Invalid request.' }, 400)
    if (!(consents.adult === true && consents.agreement === true && consents.confidentiality === true && consents.esign === true)) {
      return json({ error: 'Please tick every box to confirm and sign the agreement.' }, 400)
    }

    // Optional drawn signature: a PNG data URL, size-limited.
    let signatureImage: string | null = null
    if (body.signatureImage) {
      const image = String(body.signatureImage)
      if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)) return json({ error: 'The drawn signature could not be read. Please clear it and draw again.' }, 400)
      if (image.length > MAX_SIGNATURE_IMAGE) return json({ error: 'The drawn signature is too large. Please clear it and draw a simpler one.' }, 400)
      signatureImage = image
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
    const userAgent = text(req.headers.get('user-agent'), 300) || null

    if (ip) {
      const since = new Date(Date.now() - 10 * 60_000).toISOString()
      const { count } = await supabase
        .from('volunteer_agreements')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', since)
      if ((count ?? 0) >= MAX_PER_IP_PER_10_MIN) {
        return json({ error: 'Too many signatures from this connection just now. Please try again in a few minutes.' }, 429)
      }
    }

    const reference = `VA26-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const signedAt = new Date().toISOString()
    const { data: saved, error } = await supabase
      .from('volunteer_agreements')
      .insert({
        reference,
        full_name: fullName,
        email,
        phone,
        role,
        typed_signature: typedSignature,
        signature_image: signatureImage,
        agreement_version: agreementVersion,
        agreement_text: agreementText,
        consents: { adult: true, agreement: true, confidentiality: true, esign: true },
        signed_at: signedAt,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505' && String(error.message).includes('email_version')) {
        return json({ error: 'This email address has already signed the current agreement. If you need to correct your details, email info@haramberun.com.' }, 409)
      }
      console.error('volunteer agreement insert failed', error)
      return json({ error: 'We could not record your signature. Please try again, or email info@haramberun.com.' }, 500)
    }

    // Emails are best effort; the signature is already saved.
    const when = `${new Date(signedAt).toLocaleString('en-GB', {
      timeZone: 'Africa/Kampala',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })} (EAT)`
    const first = fullName.split(' ')[0]
    // Printable signed PDF for both the volunteer and the team. If it cannot be made, the emails still
    // carry the full text, plus the drawn signature as a plain image.
    let pdfBase64: string | null = null
    try {
      pdfBase64 = toBase64(
        await buildPdf({ agreementText, typedSignature, signatureImage, fullName, role, reference, when, agreementVersion }),
      )
    } catch (error) {
      console.error('volunteer agreement pdf failed', reference, error)
    }
    const attachments: Attachment[] | undefined = pdfBase64
      ? [{ filename: `Harambe-Run-Volunteer-Agreement-${reference}.pdf`, content: pdfBase64 }]
      : signatureImage
        ? [{ filename: 'signature.png', content: signatureImage.split(',')[1] }]
        : undefined
    const attachedNote = pdfBase64
      ? 'A printable PDF copy of the signed agreement is attached.'
      : signatureImage
        ? 'Your drawn signature is attached as signature.png.'
        : ''

    const details = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px">${row('Reference', reference)}${row('Name', fullName)}${row('Role', role)}${row('Signed', when)}${row('Agreement version', agreementVersion)}</table>`

    const volunteerHtml = wrap(
      'Agreement signed',
      `<p style="margin:0">Hi ${esc(first)},</p>
<p style="margin:14px 0 0">Thank you for volunteering with Startups Harambe Run 2026. This email is your copy of the volunteer agreement you signed electronically. Please keep it.</p>
${details}
<p style="margin:22px 0 8px;font-weight:bold">Agreement you signed</p>
<div style="white-space:pre-wrap;font-size:13px;line-height:20px;border:1px solid #e3e0d6;background:#faf9f5;padding:14px">${esc(agreementText)}</div>
<p style="margin:20px 0 4px;font-size:13px;color:#5b6b63">Your signature</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic">${esc(typedSignature)}</p>
${attachedNote ? `<p style="margin:10px 0 0;font-size:13px;color:#5b6b63">${esc(attachedNote)}</p>` : ''}
<p style="margin:22px 0 0;font-size:13px;color:#5b6b63">Questions? Reply to this email or write to info@haramberun.com.</p>`,
    )
    const volunteerText = [
      'Your signed volunteer agreement: Startups Harambe Run 2026',
      '',
      `Reference: ${reference}`,
      `Name: ${fullName}`,
      `Role: ${role}`,
      `Signed: ${when}`,
      `Agreement version: ${agreementVersion}`,
      '',
      agreementText,
      '',
      `Signature: ${typedSignature}`,
    ].join('\n')

    const teamHtml = wrap(
      'Volunteer agreement signed',
      `<p style="margin:0">${esc(fullName)} signed the volunteer agreement.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px">${row('Reference', reference)}${row('Name', fullName)}${row('Role', role)}${row('Email', email)}${row('Phone', phone)}${row('Signed', when)}${row('Agreement version', agreementVersion)}${row('IP address', ip)}</table>
<p style="margin:22px 0 8px;font-weight:bold">Agreement signed</p>
<div style="white-space:pre-wrap;font-size:13px;line-height:20px;border:1px solid #e3e0d6;background:#faf9f5;padding:14px">${esc(agreementText)}</div>
<p style="margin:20px 0 4px;font-size:13px;color:#5b6b63">Signature</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic">${esc(typedSignature)}</p>
<p style="margin:12px 0 0;font-size:13px;color:#5b6b63">${esc(pdfBase64 ? 'A printable PDF of the signed agreement is attached. ' : signatureImage ? 'Their drawn signature is attached as signature.png. ' : '')}The record is also stored in Supabase (volunteer_agreements). Reply to this email to contact ${esc(first)} directly.</p>`,
    )
    const teamText = [
      `${fullName} signed the volunteer agreement.`,
      '',
      `Reference: ${reference}`,
      `Role: ${role}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Signed: ${when}`,
      `Agreement version: ${agreementVersion}`,
      `IP address: ${ip ?? 'unknown'}`,
      '',
      agreementText,
      '',
      `Signature: ${typedSignature}`,
    ].join('\n')

    const team = Deno.env.get('ENQUIRY_NOTIFY_EMAIL')?.trim() || 'info@haramberun.com'
    const [volunteerMail, teamMail] = await Promise.all([
      sendEmail(email, `Your signed volunteer agreement: Harambe Run 2026 (${reference})`, volunteerHtml, volunteerText, 'info@haramberun.com', attachments),
      sendEmail(team, `Volunteer agreement signed: ${fullName} (${role})`, teamHtml, teamText, email, attachments),
    ])
    if (volunteerMail.status !== 'sent' || teamMail.status !== 'sent') {
      console.warn('volunteer agreement email not sent', reference, volunteerMail, teamMail)
    }
    await supabase
      .from('volunteer_agreements')
      .update({ emails: { volunteer: volunteerMail.status, team: teamMail.status, pdf: pdfBase64 ? 'attached' : 'failed' } })
      .eq('id', saved.id)

    return json({ ok: true, reference, signedAt, emailed: volunteerMail.status === 'sent' })
  } catch (error) {
    console.error('sign-volunteer-agreement error', error)
    return json({ error: 'Something went wrong. Please try again, or email info@haramberun.com.' }, 500)
  }
})
