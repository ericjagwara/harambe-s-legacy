export const BLINKPAY_URL = (Deno.env.get('BLINKPAY_API_URL') ?? 'https://payments-dev.blink.co.ug/api/').replace(/\/?$/, '/')

export async function blinkpay(payload: Record<string, unknown>) {
  const res = await fetch(BLINKPAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: Deno.env.get('BLINKPAY_MM_USERNAME'),
      password: Deno.env.get('BLINKPAY_MM_PASSWORD'),
      ...payload,
    }),
  })
  const text = await res.text()
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return { error: true, message: `Unexpected response from payment provider (${res.status})` }
  }
}

export function normaliseMsisdn(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('256')) return digits
  if (digits.startsWith('0')) return `256${digits.slice(1)}`
  if (digits.length === 9) return `256${digits}`
  return digits
}
