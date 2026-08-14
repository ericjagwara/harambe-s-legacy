import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHero } from "@/components/PageHero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DONORS, EVENT, ugx } from "@/data/event";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Live Fundraising Tracker & Donations | Startups Harambe Run" },
      {
        name: "description",
        content:
          "See funds raised, kits sold and the public contribution list for the Startups Harambe Run - and make a donation or corporate pledge.",
      },
      { property: "og:title", content: "Statistics & Donations - Startups Harambe Run" },
      {
        property: "og:description",
        content: "Transparent, live reporting of every shilling raised for Uganda's startups.",
      },
    ],
  }),
  component: Statistics,
});

function Statistics() {
  const pct = Math.round((EVENT.raised / EVENT.target) * 100);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <PageHero
        eyebrow="Statistics & donations"
        title="Every shilling, in the open"
        description="Ticket payments, corporate pledges, individual donations and booth bookings - reconciled and reported publicly."
      />

      <section className="section">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 shadow-lift">
            <CardHeader>
              <CardTitle className="uppercase">Progress to target</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-display text-4xl font-extrabold text-primary">
                {ugx(EVENT.raised)}
              </p>
              <p className="text-sm text-muted-foreground">of {ugx(EVENT.target)}</p>
              <Progress value={pct} className="mt-5" />
              <p className="mt-2 text-sm font-bold text-ember">{pct}% funded</p>
            </CardContent>
          </Card>
          <div className="grid gap-6">
            <Card className="shadow-lift">
              <CardHeader>
                <CardTitle className="uppercase">Kits sold</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-extrabold">{EVENT.kitsSold}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lift">
              <CardHeader>
                <CardTitle className="uppercase">Contributors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-extrabold">{DONORS.length}+</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-2xl uppercase">Contribution list</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Contributors choose whether their name is shown or kept anonymous. That choice is
              respected everywhere on this site.
            </p>
            <div className="mt-5 overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DONORS.map((d, i) => (
                    <TableRow key={`${d.name}-${i}`}>
                      <TableCell className="font-semibold">
                        {d.name}
                        {d.name === "Anonymous" && (
                          <Badge variant="secondary" className="ml-2">
                            hidden by request
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{d.type}</TableCell>
                      <TableCell className="text-right font-bold">{ugx(d.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Card className="shadow-lift">
            <CardHeader>
              <CardTitle className="uppercase">Make a payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Thank you! Payment processing is wired up in the next build step.");
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="type">Payment type</Label>
                  <Select>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="donation">Individual donation</SelectItem>
                      <SelectItem value="pledge">Corporate pledge</SelectItem>
                      <SelectItem value="ticket">Ticket / kit payment</SelectItem>
                      <SelectItem value="booth">Exhibition booth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="donor">Name</Label>
                  <Input id="donor" required placeholder="Name or company" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="donorEmail">Email</Label>
                  <Input id="donorEmail" type="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="donorAmount">Amount (UGX)</Label>
                  <Input id="donorAmount" type="number" min={5000} step={1000} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="donorChannel">Channel</Label>
                  <Select>
                    <SelectTrigger id="donorChannel">
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
                <div className="flex items-start gap-3">
                  <Checkbox id="anon" className="mt-1" />
                  <Label htmlFor="anon" className="text-sm font-normal">
                    Show me as "Anonymous" on the public tracker
                  </Label>
                </div>
                <Button type="submit" className="bg-ember text-ember-foreground hover:bg-ember/90">
                  Pay now
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
