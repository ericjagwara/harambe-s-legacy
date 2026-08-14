import { Link } from "@tanstack/react-router";
import { EVENT } from "@/data/event";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="text-lg uppercase text-gold">{EVENT.name}</h3>
          <p className="mt-3 text-sm text-primary-foreground/80">
            TechBuzz Hub's annual fundraising run under the Startup Funding Vehicles (SFV)
            initiative. {EVENT.date}, finishing at {EVENT.finish}.
          </p>
          <p className="mt-4 text-sm font-bold text-gold">{EVENT.hashtag} #RunBySFV</p>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-gold">Quick links</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            {[
              { to: "/register", label: "Register or donate" },
              { to: "/run", label: "Route & safety" },
              { to: "/partners-kits", label: "Partners, kits & booths" },
              { to: "/statistics", label: "Live fundraising tracker" },
              { to: "/contact", label: "Contact us" },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-gold">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-[0.2em] text-gold">Contacts</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <li>{EVENT.email}</li>
            <li>{EVENT.phone}</li>
            <li>{EVENT.address}</li>
          </ul>
          <div className="mt-4 flex gap-3 text-sm font-semibold">
            {EVENT.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-primary-foreground/10 px-3 py-1.5 hover:bg-gold hover:text-gold-foreground"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs text-primary-foreground/70">
        © {new Date().getFullYear()} TechBuzz Hub · Startup Funding Vehicles
      </div>
    </footer>
  );
}
