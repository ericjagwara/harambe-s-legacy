# Startups Harambe Run 2026

Official website for the Startups Harambe Run 2026, a multi-origin fundraising run
converging at Makerere University on Sunday 6 December 2026 to strengthen Uganda's
startup investment pipeline.

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3 + shadcn/ui theme system
- Hash-based page routing (no server rewrites needed on static hosts)

## Pages

Home, Runners, Route, Programs, Partners, Results, Register, Donate, Contact.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Output lands in `dist/`.

## Deploy to Netlify

The repo includes `netlify.toml` with the build command and publish directory,
so connected-repo deploys work out of the box:

1. Push this repository to GitHub.
2. In Netlify: Add new site, import the GitHub repository.
3. Netlify reads `netlify.toml` automatically (build: `npm run build`, publish: `dist`).
4. Deploy.

All routes use hash URLs (for example `/#/runners`), so no SPA redirect rules are
required. Alternatively, run `npm run build` locally and drag the `dist/` folder
into the Netlify dashboard.

## Notes

- Registration, donation, sponsorship, booth, volunteer, and contact forms are
  front-end flows only. No backend or payment gateway is connected; payment
  channels remain subject to TechBuzz Hub confirmation.
- Fundraising figures on the Results page are labeled sample preview data.
- Brand assets live in `public/assets/`.
