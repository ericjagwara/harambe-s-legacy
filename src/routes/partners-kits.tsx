import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import { PartnerStrip } from "@/components/PartnerStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BOOTHS, KIT_CONTENTS, TICKETS, ugx } from "@/data/event";

export const Route = createFileRoute("/partners-kits")({
  head: () => ({
    meta: [
      { title: "Partners, Sponsorship, Kits & Exhibition Booths | Startups Harambe Run" },
      {
        name: "description",
        content:
          "Sponsorship roles, running kit contents, ticket pricing and Gold/Silver/Bronze exhibition booth packages with the early-stage startup discount.",
      },
      { property: "og:title", content: "Partners & Kits — Startups Harambe Run" },
      {
        property: "og:description",
        content: "Become a partner, sponsor the run, or book exhibition space at the finish line.",
      },
    ],
  }),
  component: PartnersKits,
});

function PartnersKits() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Partners & kits"
        title="Put your brand on the finish line"
        description="Sponsorship roles, exhibition packages and exactly what every runner carries on race day."
      />
      <PartnerStrip />

      <section className="section">
        <p className="eyebrow">Tickets & kits</p>
        <h2 className="mt-3 text-3xl uppercase">What a ticket buys</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TICKETS.map((t) => (
            <Card key={t.id} className="shadow-lift">
              <CardHeader>
                <CardTitle className="uppercase">{t.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-extrabold text-primary">
                  {t.price ? ugx(t.price) : "Any amount"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t.verification}</p>
                <p className="mt-1 text-sm text-muted-foreground">Start: {t.start}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-border bg-secondary/50 p-6">
          <h3 className="text-xl uppercase">Inside the running kit</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {KIT_CONTENTS.map((k) => (
              <li key={k} className="flex items-center gap-2 text-sm font-semibold">
                <Check className="size-4 text-ember" /> {k}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="section">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">
            Exhibition booths
          </p>
          <h2 className="mt-3 text-3xl uppercase">Trade at the convergence point</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {BOOTHS.map((b) => (
              <div key={b.name} className="rounded-xl border border-gold/40 bg-primary-foreground/5 p-6">
                <h3 className="text-2xl uppercase text-gold">{b.name}</h3>
                <p className="mt-1 text-sm text-primary-foreground/75">{b.size}</p>
                <p className="mt-4 font-display text-2xl font-extrabold">{ugx(b.price)}</p>
                {b.name === "Bronze" && (
                  <p className="mt-3 text-sm text-primary-foreground/80">
                    50% off for early-stage startups: proof of registration 1–3 years old and
                    maximum annual revenue of {ugx(35_000_000)}.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section grid gap-8 lg:grid-cols-2">
        <Card className="shadow-lift">
          <CardHeader>
            <CardTitle className="uppercase">Become a partner / sponsor</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Sponsorship interest received — the team will contact you.");
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="org">Organisation</Label>
                <Input id="org" required />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input required placeholder="Contact person" aria-label="Contact person" />
                <Input required type="email" placeholder="Email" aria-label="Sponsor email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Sponsorship role</Label>
                <Select>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="headline">Headline sponsor</SelectItem>
                    <SelectItem value="corridor">Corridor / starting-point sponsor</SelectItem>
                    <SelectItem value="kit">Kit sponsor</SelectItem>
                    <SelectItem value="water">Water & refreshment sponsor</SelectItem>
                    <SelectItem value="media">Media partner</SelectItem>
                    <SelectItem value="pledge">Corporate pledge only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea placeholder="What would you like to sponsor or pledge?" aria-label="Message" />
              <Button type="submit" className="bg-ember text-ember-foreground hover:bg-ember/90">
                Submit interest
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lift">
          <CardHeader>
            <CardTitle className="uppercase">Book an exhibition booth</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Booth request received. Payment link follows by email.");
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor="package">Package</Label>
                <Select>
                  <SelectTrigger id="package">
                    <SelectValue placeholder="Gold, Silver or Bronze" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOTHS.map((b) => (
                      <SelectItem key={b.name} value={b.name}>
                        {b.name} — {b.size} · {ugx(b.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input required placeholder="Company" aria-label="Company" />
                <Input required type="email" placeholder="Email" aria-label="Exhibitor email" />
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Checkbox id="startup" className="mt-1" />
                <Label htmlFor="startup" className="text-sm font-normal leading-relaxed">
                  Apply the 50% early-stage startup discount (Bronze only). I can supply proof of
                  company registration dated 1–3 years before the event and evidence of annual
                  revenue not exceeding {ugx(35_000_000)}.
                </Label>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proof">Verification documents (optional now)</Label>
                <Input id="proof" type="file" accept="image/*,.pdf" multiple />
              </div>
              <Button type="submit" variant="secondary">
                Request booking
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
      <SiteFooter />
    </div>
  );
}
