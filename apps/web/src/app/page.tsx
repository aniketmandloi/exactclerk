import { buttonVariants } from "@exactclerk/ui/components/button";
import { cn } from "@exactclerk/ui/lib/utils";
import Link from "next/link";

import TitleFront from "./title-front";

const steps = [
  {
    title: "Upload the packet",
    who: "You",
    description: "Photograph the title, Form 130-U and odometer disclosure on your phone.",
  },
  {
    title: "Preflight Check",
    who: "ExactClerk",
    description:
      "Every page is checked against the Texas Title Manual. Each Finding cites its Rule and says who has to act.",
  },
  {
    title: "Clerk review",
    who: "A Texas title clerk",
    description:
      "A clerk checks the packet and hands it back in the order and form webDEALER expects.",
  },
  {
    title: "Submit and track",
    who: "You",
    description:
      "Submit under your own webDEALER login, then mark the title received when it arrives.",
  },
];

const findingKinds = [
  {
    kind: "Defect",
    effect: "Holds the packet",
    description: "The packet breaks a Rule. It gets fixed before anything is filed.",
    bar: "border-destructive",
    text: "text-destructive",
  },
  {
    kind: "Confirm",
    effect: "Waits on your answer",
    description:
      "A value couldn't be read with confidence. You tell us what it says; we never guess.",
    bar: "border-warning",
    text: "text-warning",
  },
  {
    kind: "Advisory",
    effect: "Holds nothing up",
    description: "Something worth knowing before you submit. It never stops the Deal.",
    bar: "border-muted-foreground/50",
    text: "text-muted-foreground",
  },
];

const tiers = [
  { name: "Standard", price: 49, when: "A retail sale or trade-in with a clean title" },
  { name: "Lien", price: 79, when: "A lienholder is on the title" },
  {
    name: "Complex",
    price: 99,
    when: "Out-of-state title, salvage, bonded, or a power-of-attorney sale",
  },
];

const eyebrow = "font-mono text-primary text-xs uppercase tracking-widest";
const sectionHeading = "cn-font-heading font-bold text-2xl tracking-tight sm:text-3xl";

export default function Home() {
  return (
    <div className="space-y-20 pb-8 sm:space-y-28">
      <section className="grid items-center gap-12 pt-4 sm:pt-10 lg:grid-cols-[1fr_1.05fr]">
        <div className="space-y-6">
          <p className={eyebrow}>Title work for Texas dealerships</p>
          <h1 className="cn-font-heading font-bold text-4xl leading-[1.05] [font-stretch:125%] sm:text-5xl">
            Find the missing signature before the county does.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground leading-relaxed">
            Upload a Deal's Title Packet from your phone. ExactClerk checks it against the Texas
            Title Manual, a title clerk reviews it, and you submit a packet that's ready for
            webDEALER.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Sign in
            </Link>
            <Link href="#pricing" className={buttonVariants({ size: "lg", variant: "outline" })}>
              See pricing
            </Link>
          </div>
        </div>
        <TitleFront />
      </section>

      <section aria-labelledby="how-heading" className="space-y-8">
        <div className="space-y-2">
          <p className={eyebrow}>How a Deal moves</p>
          <h2 id="how-heading" className={sectionHeading}>
            Every step names who acts.
          </h2>
        </div>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="space-y-2 border-primary border-t-2 pt-4">
              <p className="font-mono text-muted-foreground text-xs">Step {index + 1}</p>
              <h3 className="cn-font-heading font-bold text-lg">{step.title}</h3>
              <p className="font-medium text-primary text-sm">{step.who}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="border-primary border-l-4 bg-secondary px-4 py-3 text-sm leading-relaxed">
          <span className="font-semibold">Rejected?</span> Report the reason from the Deal. A clerk
          traces it to the Rule it broke and sends you the fix as a to-do. Three resubmission rounds
          are included.
        </p>
      </section>

      <section aria-labelledby="findings-heading" className="space-y-8">
        <div className="space-y-2">
          <p className={eyebrow}>Findings</p>
          <h2 id="findings-heading" className={sectionHeading}>
            Three kinds, and you always know which.
          </h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-3">
          {findingKinds.map((finding) => (
            <li
              key={finding.kind}
              className={cn(
                "space-y-2 border-l-4 bg-card p-5 ring-1 ring-foreground/10",
                finding.bar,
              )}
            >
              <p
                className={cn(
                  "font-medium font-mono text-xs uppercase tracking-wider",
                  finding.text,
                )}
              >
                {finding.kind}
              </p>
              <p className="font-semibold">{finding.effect}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{finding.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-20 space-y-8">
        <div className="space-y-2">
          <p className={eyebrow}>Pricing</p>
          <h2 id="pricing-heading" className={sectionHeading}>
            One price per title, shown before any work starts.
          </h2>
        </div>
        <dl className="divide-y bg-card ring-1 ring-foreground/10">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 p-5 sm:grid-cols-[10rem_1fr_auto]"
            >
              <dt className="cn-font-heading font-bold text-lg">{tier.name}</dt>
              <dd className="col-span-2 row-start-2 text-muted-foreground text-sm sm:col-span-1 sm:row-start-auto">
                {tier.when}
              </dd>
              <dd className="cn-font-heading col-start-2 row-start-1 font-bold text-2xl tabular-nums sm:col-start-auto sm:row-start-auto">
                ${tier.price}
              </dd>
            </div>
          ))}
        </dl>
        <p className="max-w-2xl text-muted-foreground text-sm leading-relaxed">
          The number of rejections never changes the price. If a Rule should have caught a
          rejection, that title's fee is refunded and we chase it to Cleared for free.
        </p>
      </section>

      <footer className="border-t pt-6 text-muted-foreground text-sm leading-relaxed">
        Texas only. ExactClerk prepares the packet, and you submit it in webDEALER under your own
        login. We never sign anything for anyone.
      </footer>
    </div>
  );
}
