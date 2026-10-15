// Records a partner hub's signed Memorandum of Understanding (unlisted page /partner-mou) in
// public.partner_mous, then emails a signed PDF to the partner and a notice to the team
// (ENQUIRY_NOTIFY_EMAIL, default info@haramberun.com). TechBuzz Hub's signature (Mr. Keneth Twesigye) is
// already applied to every MOU, undated, so the MOU is fully signed as soon as the partner signs.
// The partner must DRAW their signature: a typed name is not accepted. Staff can read every record in
// Supabase: Table Editor -> partner_mous.
// Both emails carry the full MOU in the body and a printable PDF attachment, on the TechBuzz Hub letterhead
// (the image the website serves at /techbuzz-letterhead.jpg).
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
const MAX_PER_IP_PER_10_MIN = 15
const MIN_SIGNATURE_IMAGE = 1800 // characters of base64: a blank pad exports far smaller than a real signature

type Attachment = { filename: string; content: string }

// Signature of Mr. Keneth Twesigye (V/CP Coordinator) for TechBuzz Hub: a small transparent PNG, drawn
// above his name on every MOU. Deliberately undated. Same image as public/assets/ken-signature.png.
const TECHBUZZ_SIGNATURE_PNG = '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'

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
  mouText: string
  signatureImage: string
  hubName: string
  repName: string
  repTitle: string
  auxName: string
  auxPhone: string
  auxEmail: string
  reference: string
  when: string
  mouVersion: string
}

// Lays the MOU text out as a letter (same structure as mouToText on the site) and adds the signature
// blocks. Standard PDF fonts only cover Western characters; anything else prints as "?".
async function buildPdf(input: PdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle(`Startups Harambe Run 2026 Partner Hub MOU (${input.reference})`)
  doc.setAuthor('TechBuzz Hub')
  doc.setSubject('Signed Memorandum of Understanding')
  doc.setCreator('haramberun.com')

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

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

  // US Letter with the same text margin as the volunteer agreement.
  const PAGE_W = 612
  const PAGE_H = 792
  const MARGIN = 72
  const BOTTOM = 80
  const CONTENT_W = PAGE_W - MARGIN * 2

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
  // `label` (a clause number) is drawn at `labelX` beside the first line.
  const write = (value: string, style: Style, leading = 1.45, label?: string, labelX = MARGIN) => {
    const x = style.x ?? MARGIN
    const lineHeight = style.size * leading
    let firstLine = true
    for (const line of wrap(value, style.font, style.size, style.width ?? CONTENT_W - (x - MARGIN))) {
      ensure(lineHeight)
      y -= lineHeight
      const baseline = y + lineHeight * 0.28
      const drawX = style.center ? (PAGE_W - style.font.widthOfTextAtSize(line, style.size)) / 2 : x
      page.drawText(line, { x: drawX, y: baseline, size: style.size, font: style.font, color: style.color })
      if (label && firstLine) page.drawText(label, { x: labelX, y: baseline, size: style.size, font: bold, color: GREY })
      firstLine = false
    }
  }

  const lines = input.mouText.replace(/\r/g, '').split('\n')
  let i = 0

  // The text begins with the letterhead lines (up to the first blank line). The letterhead image already
  // shows them; without the image, print them as a plain header.
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
  let preamble = 0 // subtitle, hashtag line, then the "made on this day" line
  for (; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const section = line.match(/^(\d+)\.\s+([A-Z][A-Z ,&/'\u2019-]+)$/)
    if (!titleDone && line === line.toUpperCase() && /[A-Z]/.test(line) && !section) {
      titleDone = true
      y -= 16
      write(line, { font: bold, size: 14, color: INK, center: true }, 1.3)
      y -= 6
    } else if (section) {
      ensure(section[1] === '13' ? 340 : 56) // keep the signing line with both signature blocks
      ensure(56)
      y -= 10
      write(`${section[1]}. ${section[2]}`, { font: bold, size: 9.5, color: GREEN })
      y -= 2
    } else if (!section && preamble < 3 && titleDone && !lines.slice(0, i).some((l) => /^\d+\.\s+[A-Z]/.test(l))) {
      if (preamble === 0) write(line, { font: bold, size: 11, color: INK, center: true }, 1.4)
      else if (preamble === 1) {
        write(line, { font: regular, size: 8.5, color: GREY, center: true }, 1.4)
        y -= 8
      } else {
        write(line, { font: regular, size: 10.5, color: INK })
        y -= 5
      }
      preamble++
    } else {
      const clause = line.match(/^(\d+(?:\.\d+)+)\s+(.*)$/)
      if (clause) {
        const depth = clause[1].split('.').length - 1 // 2.1 -> 1, 5.1.1 -> 2
        const labelX = MARGIN + (depth - 1) * 30
        write(clause[2], { font: regular, size: 10.5, color: INK, x: labelX + 32 }, 1.45, clause[1], labelX)
        y -= 4
      } else {
        write(line, { font: line === 'BETWEEN' || line === 'AND' ? bold : regular, size: 10.5, color: INK })
        y -= 5
      }
    }
  }

  // Signature blocks, kept together on one page. TechBuzz Hub's side carries the pre-applied, undated signature.
  ensure(250)
  y -= 14
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.75, color: GREY })
  y -= 8
  const blockTop = y
  const rightX = MARGIN + 270
  const colW = 240

  write('FOR AND ON BEHALF OF TECHBUZZ HUB', { font: bold, size: 8.5, color: GREEN, width: colW })
  write('Mr. Keneth Twesigye', { font: regular, size: 10, color: INK, width: colW }, 1.4)
  write('V/CP Coordinator, Startups Harambe Run 2026', { font: regular, size: 9.5, color: GREY, width: colW }, 1.35)
  const techbuzzSig = await doc.embedPng(Uint8Array.from(atob(TECHBUZZ_SIGNATURE_PNG), (c) => c.charCodeAt(0)))
  const techbuzzSize = techbuzzSig.scaleToFit(150, 44)
  y -= techbuzzSize.height + 8
  page.drawImage(techbuzzSig, { x: MARGIN, y, width: techbuzzSize.width, height: techbuzzSize.height })
  page.drawLine({ start: { x: MARGIN, y: y - 2 }, end: { x: MARGIN + colW, y: y - 2 }, thickness: 0.75, color: GREY })
  y -= 2
  write('Signature', { font: regular, size: 8.5, color: GREY, width: colW }, 1.5)
  const leftBottom = y

  y = blockTop
  write('FOR AND ON BEHALF OF THE PARTNER HUB', { font: bold, size: 8.5, color: GREEN, x: rightX, width: colW })
  write(input.hubName, { font: regular, size: 10, color: INK, x: rightX, width: colW }, 1.4)
  const png: PDFImage = await doc.embedPng(Uint8Array.from(atob(input.signatureImage.split(',')[1]), (c) => c.charCodeAt(0)))
  const size = png.scaleToFit(colW - 20, 52)
  y -= size.height + 6
  page.drawImage(png, { x: rightX, y, width: size.width, height: size.height })
  page.drawLine({ start: { x: rightX, y: y - 2 }, end: { x: rightX + colW, y: y - 2 }, thickness: 0.75, color: GREY })
  y -= 2
  write(`${input.repName}, ${input.repTitle}`, { font: regular, size: 9.5, color: INK, x: rightX, width: colW }, 1.4)
  write(`Signed electronically on ${input.when}`, { font: regular, size: 9, color: GREY, x: rightX, width: colW }, 1.35)
  write(`Reference ${input.reference}`, { font: regular, size: 9, color: GREY, x: rightX, width: colW }, 1.35)
  y = Math.min(y, leftBottom)

  ensure(70)
  y -= 14
  write('PARTNER HUB IN-CHARGE PERSON (AUXILIARY ORGANISING COMMITTEE MEMBER)', { font: bold, size: 8.5, color: GREEN })
  write(`Name: ${input.auxName}`, { font: regular, size: 10, color: INK }, 1.4)
  write(`Phone: ${input.auxPhone}`, { font: regular, size: 10, color: INK }, 1.4)
  write(`Email: ${input.auxEmail}`, { font: regular, size: 10, color: INK }, 1.4)

  // Footer on every page.
  const pages = doc.getPages()
  pages.forEach((p, index) => {
    const label = clean(`Ref ${input.reference} - MOU version ${input.mouVersion} - Page ${index + 1} of ${pages.length}`)
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

    const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    const hubName = text(body.hubName, 200).replace(/\s+/g, ' ')
    const hubAddress = text(body.hubAddress, 300).replace(/\s+/g, ' ')
    const repName = text(body.repName, 160).replace(/\s+/g, ' ')
    const repTitle = text(body.repTitle, 160).replace(/\s+/g, ' ')
    const email = text(body.email, 200)
    const phone = text(body.phone, 40)
    const auxName = text(body.auxName, 160).replace(/\s+/g, ' ')
    const auxPhone = text(body.auxPhone, 40)
    const auxEmail = text(body.auxEmail, 200)
    const mouVersion = text(body.mouVersion, 40)
    const mouText = String(body.mouText ?? '').trim()
    const consents = (body.consents && typeof body.consents === 'object' ? body.consents : {}) as Record<string, unknown>

    if (hubName.length < 2) return json({ error: 'Please enter the name of your hub.' }, 400)
    if (hubAddress.length < 3) return json({ error: 'Please enter the address of your hub.' }, 400)
    if (repName.length < 3) return json({ error: 'Please enter your full name.' }, 400)
    if (repTitle.length < 2) return json({ error: 'Please enter your title at the hub.' }, 400)
    if (!emailOk(email)) return json({ error: 'Please enter a valid email address.' }, 400)
    if (phone.replace(/\D/g, '').length < 9) return json({ error: 'Please enter a valid phone number.' }, 400)
    if (auxName.length < 3) return json({ error: 'Please enter the name of the hub in-charge person.' }, 400)
    if (auxPhone.replace(/\D/g, '').length < 9) return json({ error: 'Please enter a valid phone number for the in-charge person.' }, 400)
    if (!emailOk(auxEmail)) return json({ error: 'Please enter a valid email address for the in-charge person.' }, 400)
    if (!/^[\w.-]{1,40}$/.test(mouVersion)) return json({ error: 'Invalid request.' }, 400)
    if (mouText.length < 500 || mouText.length > 40_000) return json({ error: 'Invalid request.' }, 400)
    if (!(consents.authority === true && consents.agreement === true && consents.esign === true)) {
      return json({ error: 'Please tick every box to confirm and sign the MOU.' }, 400)
    }

    // The signature must be a drawn one: a PNG data URL of real size. A typed name is never accepted.
    const signatureImage = String(body.signatureImage ?? '')
    if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signatureImage)) return json({ error: 'Please draw your signature in the box. A typed name is not accepted.' }, 400)
    if (signatureImage.length > MAX_SIGNATURE_IMAGE) return json({ error: 'The drawn signature is too large. Please clear it and draw a simpler one.' }, 400)
    if (signatureImage.length < MIN_SIGNATURE_IMAGE) return json({ error: 'Your signature looks empty or too small. Please clear it and sign again.' }, 400)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null
    const userAgent = text(req.headers.get('user-agent'), 300) || null

    if (ip) {
      const since = new Date(Date.now() - 10 * 60_000).toISOString()
      const { count } = await supabase
        .from('partner_mous')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .gte('created_at', since)
      if ((count ?? 0) >= MAX_PER_IP_PER_10_MIN) {
        return json({ error: 'Too many signatures from this connection just now. Please try again in a few minutes.' }, 429)
      }
    }

    const reference = `PM26-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const signedAt = new Date().toISOString()
    const { data: saved, error } = await supabase
      .from('partner_mous')
      .insert({
        reference,
        hub_name: hubName,
        hub_address: hubAddress,
        rep_name: repName,
        rep_title: repTitle,
        email,
        phone,
        aux_name: auxName,
        aux_phone: auxPhone,
        aux_email: auxEmail,
        signature_image: signatureImage,
        mou_version: mouVersion,
        mou_text: mouText,
        consents: { authority: true, agreement: true, esign: true },
        signed_at: signedAt,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505' && String(error.message).includes('hub_version')) {
        return json({ error: 'This hub has already signed the current MOU. If you need to correct your details, email info@haramberun.com.' }, 409)
      }
      console.error('partner mou insert failed', error)
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
    const first = repName.split(' ')[0]
    let pdfBase64: string | null = null
    try {
      pdfBase64 = toBase64(
        await buildPdf({ mouText, signatureImage, hubName, repName, repTitle, auxName, auxPhone, auxEmail, reference, when, mouVersion }),
      )
    } catch (error) {
      console.error('partner mou pdf failed', reference, error)
    }
    const attachments: Attachment[] = pdfBase64
      ? [{ filename: `Harambe-Run-Partner-MOU-${reference}.pdf`, content: pdfBase64 }]
      : [{ filename: 'signature.png', content: signatureImage.split(',')[1] }]

    const details = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px">${row('Reference', reference)}${row('Hub', hubName)}${row('Signed by', `${repName}, ${repTitle}`)}${row('Signed', when)}${row('MOU version', mouVersion)}</table>`

    const volunteerHtml = wrap(
      'MOU signed',
      `<p style="margin:0">Hi ${esc(first)},</p>
<p style="margin:14px 0 0">Thank you for co-hosting Startups Harambe Run 2026 with us. This email is your copy of the MOU you signed for ${esc(hubName)}. It carries TechBuzz Hub's signature, so it is now fully signed. Please keep this email.</p>
${details}
<p style="margin:22px 0 8px;font-weight:bold">MOU you signed</p>
<div style="white-space:pre-wrap;font-size:13px;line-height:20px;border:1px solid #e3e0d6;background:#faf9f5;padding:14px">${esc(mouText)}</div>
<p style="margin:10px 0 0;font-size:13px;color:#5b6b63">${esc(pdfBase64 ? 'A printable PDF copy of the signed MOU is attached.' : 'Your drawn signature is attached as signature.png.')}</p>
<p style="margin:22px 0 0;font-size:13px;color:#5b6b63">Questions? Reply to this email or write to info@haramberun.com.</p>`,
    )
    const volunteerText = [
      'Your signed MOU: Startups Harambe Run 2026 Partner Hub',
      '',
      `Reference: ${reference}`,
      `Hub: ${hubName}`,
      `Signed by: ${repName}, ${repTitle}`,
      `Signed: ${when}`,
      `MOU version: ${mouVersion}`,
      '',
      mouText,
      '',
      "It carries TechBuzz Hub's signature, so it is now fully signed.",
    ].join('\n')

    const teamHtml = wrap(
      'Partner MOU signed',
      `<p style="margin:0">${esc(hubName)} signed the co-hosting MOU. TechBuzz Hub's signature (Mr. Keneth Twesigye) is already applied, so it is fully signed and needs no further action.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px">${row('Reference', reference)}${row('Hub', hubName)}${row('Address', hubAddress)}${row('Signed by', `${repName}, ${repTitle}`)}${row('Email', email)}${row('Phone', phone)}${row('In-charge person', auxName)}${row('In-charge phone', auxPhone)}${row('In-charge email', auxEmail)}${row('Signed', when)}${row('MOU version', mouVersion)}${row('IP address', ip)}</table>
<p style="margin:22px 0 8px;font-weight:bold">MOU signed</p>
<div style="white-space:pre-wrap;font-size:13px;line-height:20px;border:1px solid #e3e0d6;background:#faf9f5;padding:14px">${esc(mouText)}</div>
<p style="margin:12px 0 0;font-size:13px;color:#5b6b63">${esc(pdfBase64 ? 'A printable PDF of the signed MOU is attached. ' : 'Their drawn signature is attached as signature.png. ')}The record is also stored in Supabase (partner_mous). Reply to this email to contact ${esc(first)} directly.</p>`,
    )
    const teamText = [
      `${hubName} signed the co-hosting MOU. TechBuzz Hub's signature is already applied; no further action needed.`,
      '',
      `Reference: ${reference}`,
      `Hub: ${hubName}`,
      `Address: ${hubAddress}`,
      `Signed by: ${repName}, ${repTitle}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `In-charge person: ${auxName}, ${auxPhone}, ${auxEmail}`,
      `Signed: ${when}`,
      `MOU version: ${mouVersion}`,
      `IP address: ${ip ?? 'unknown'}`,
      '',
      mouText,
    ].join('\n')

    const team = Deno.env.get('ENQUIRY_NOTIFY_EMAIL')?.trim() || 'info@haramberun.com'
    const [partnerMail, teamMail] = await Promise.all([
      sendEmail(email, `Your signed MOU: Harambe Run 2026 (${reference})`, volunteerHtml, volunteerText, 'info@haramberun.com', attachments),
      sendEmail(team, `Partner MOU signed: ${hubName}`, teamHtml, teamText, email, attachments),
    ])
    if (partnerMail.status !== 'sent' || teamMail.status !== 'sent') {
      console.warn('partner mou email not sent', reference, partnerMail, teamMail)
    }
    await supabase
      .from('partner_mous')
      .update({ emails: { partner: partnerMail.status, team: teamMail.status, pdf: pdfBase64 ? 'attached' : 'failed' } })
      .eq('id', saved.id)

    // The signed PDF is returned too, so the website can offer the same file that is emailed.
    return json({ ok: true, reference, signedAt, emailed: partnerMail.status === 'sent', pdf: pdfBase64 })
  } catch (error) {
    console.error('sign-partner-mou error', error)
    return json({ error: 'Something went wrong. Please try again, or email info@haramberun.com.' }, 500)
  }
})
