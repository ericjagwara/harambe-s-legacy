import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CAMPUSES, KIT_CONTENTS, STATIONS, TICKETS, ugx } from "@/data/event";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register, Donate or Volunteer | Startups Harambe Run" },
      {
        name: "description",
        content:
          "Register as a student runner (UGX 30,000), a general public runner (UGX 50,000) or a virtual donor, choose your starting point and pay — plus volunteer and referral sign-ups.",
      },
      { property: "og:title", content: "Registration — Startups Harambe Run" },
      {
        property: "og:description",
        content: "Pick your category, choose your starting point and confirm with payment.",
      },
    ],
  }),
  component: Register,
});

function Register() {
  const [category, setCategory] = useState<string>("student");
  const ticket = TICKETS.find((t) => t.id === category)!;
  const isRunner = category !== "virtual";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Registration"
        title="Claim your number, choose your start"
        description="Three ways to take part: run as a student, run as a member of the public, or give as a virtual donor."
      />

      <div className="section grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <Card className="shadow-lift">
            <CardHeader>
              <CardTitle className="uppercase">1. Choose your participation</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={category} onValueChange={setCategory} className="gap-3">
                {TICKETS.map((t) => (
                  <Label
                    key={t.id}
                    htmlFor={t.id}
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary/60"
                  >
                    <RadioGroupItem value={t.id} id={t.id} className="mt-1" />
                    <span>
                      <span className="block font-display font-extrabold uppercase">{t.title}</span>
                      <span className="block text-sm text-muted-foreground">{t.verification}</span>
                      <span className="mt-1 block text-sm font-bold text-ember">
                        {t.price ? ugx(t.price) : "Any amount you choose"}
                      </span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="shadow-lift">
            <CardHeader>
              <CardTitle className="uppercase">2. Your details & payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-5 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success(
                    "Registration captured. Payment processing is connected in the next build step.",
                  );
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" required placeholder="Jane Nakato" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required placeholder="you@email.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone (Mobile Money)</Label>
                  <Input id="phone" required placeholder="+256 7XX XXX XXX" />
                </div>

                {isRunner && (
                  <div className="grid gap-2">
                    <Label htmlFor="start">Starting point</Label>
                    <Select>
                      <SelectTrigger id="start">
                        <SelectValue placeholder="Select campus or station" />
                      </SelectTrigger>
                      <SelectContent>
                        {(category === "student"
                          ? CAMPUSES
                          : [...CAMPUSES, ...STATIONS]
                        ).map((s) => (
                          <SelectItem key={s.name} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {category === "student" && (
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="studentId">Student ID (photo or PDF)</Label>
                    <Input id="studentId" type="file" accept="image/*,.pdf" required />
                    <p className="text-xs text-muted-foreground">
                      Required to qualify for the {ugx(30000)} student rate.
                    </p>
                  </div>
                )}

                {category === "virtual" && (
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount to give (UGX)</Label>
                    <Input id="amount" type="number" min={5000} step={1000} required placeholder="50000" />
                  </div>
                )}

                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="channel">Payment channel</Label>
                  <Select>
                    <SelectTrigger id="channel">
                      <SelectValue placeholder="Mobile Money or card" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                      <SelectItem value="airtel">Airtel Money</SelectItem>
                      <SelectItem value="card">Visa / Mastercard</SelectItem>
                      <SelectItem value="bank">Bank transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-ember text-ember-foreground hover:bg-ember/90"
                  >
                    {isRunner ? `Pay ${ugx(ticket.price)} & confirm` : "Give now"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-lift">
            <CardHeader>
              <CardTitle className="uppercase">Other ways to join in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Thanks for volunteering — the team will reach out.");
                }}
              >
                <div className="sm:col-span-2">
                  <h3 className="text-lg uppercase">Become a volunteer</h3>
                  <p className="text-sm text-muted-foreground">No payment required.</p>
                </div>
                <Input required placeholder="Full name" aria-label="Volunteer name" />
                <Input required type="email" placeholder="Email" aria-label="Volunteer email" />
                <Textarea
                  className="sm:col-span-2"
                  placeholder="Where would you like to help? (marshalling, kit desk, media…)"
                  aria-label="Volunteer interest"
                />
                <Button type="submit" variant="secondary" className="sm:col-span-2">
                  Sign up to volunteer
                </Button>
              </form>

              <Separator />

              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Referral sent. Thank you for spreading the word!");
                }}
              >
                <div className="sm:col-span-2">
                  <h3 className="text-lg uppercase">Refer a friend or company</h3>
                </div>
                <Input required placeholder="Their name or company" aria-label="Referral name" />
                <Input required type="email" placeholder="Their email" aria-label="Referral email" />
                <Button type="submit" variant="outline" className="sm:col-span-2">
                  Send referral
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-lift">
            <p className="eyebrow">Your kit</p>
            <h2 className="mt-2 text-2xl uppercase">Every ticket includes</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {KIT_CONTENTS.map((k) => (
                <li key={k} className="border-b border-border/70 pb-2 font-semibold">
                  {k}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Collected at the campus or station you select during registration.
            </p>
          </div>
          <div className="rounded-xl bg-primary p-6 text-primary-foreground">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Sponsors</p>
            <h2 className="mt-2 text-2xl uppercase">Partner, sponsor or book a booth</h2>
            <p className="mt-3 text-sm text-primary-foreground/80">
              Gold, Silver and Bronze exhibition packages, with a 50% Bronze discount for
              early-stage startups.
            </p>
            <Button asChild className="mt-5 w-full bg-gold text-gold-foreground hover:bg-gold/90">
              <a href="/partners-kits">View partner options</a>
            </Button>
          </div>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
