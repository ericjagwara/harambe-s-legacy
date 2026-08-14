import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EVENT } from "@/data/event";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact the Organisers | Startups Harambe Run" },
      {
        name: "description",
        content:
          "Reach the Startups Harambe Run team at TechBuzz Hub - email, phone, office location and a direct message form.",
      },
      { property: "og:title", content: "Contact - Startups Harambe Run" },
      {
        property: "og:description",
        content: "Questions about running, donating, sponsoring or exhibiting? Talk to the team.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Contact us"
        title="Talk to the organisers"
        description="Runners, sponsors, exhibitors and media - we answer within two working days."
      />

      <section className="section grid gap-10 lg:grid-cols-2">
        <div>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Message sent - thank you for reaching out.");
              (e.currentTarget as HTMLFormElement).reset();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" required rows={6} />
            </div>
            <Button type="submit" className="bg-ember text-ember-foreground hover:bg-ember/90">
              Send message
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-lift">
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="size-5 text-ember" />
                <a href={`mailto:${EVENT.email}`} className="font-semibold hover:text-primary">
                  {EVENT.email}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-5 text-ember" />
                <a href={`tel:${EVENT.phone.replace(/\s/g, "")}`} className="font-semibold">
                  {EVENT.phone}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 text-ember" />
                <span className="font-semibold">{EVENT.address}</span>
              </li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-xl border border-border shadow-lift">
            <iframe
              title="TechBuzz Hub location map"
              src="https://www.google.com/maps?q=Kampala%2C%20Uganda&output=embed"
              className="h-[320px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
