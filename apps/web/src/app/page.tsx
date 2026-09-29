import { buttonVariants } from "@exactclerk/ui/components/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@exactclerk/ui/components/card";
import Link from "next/link";

const steps = [
  {
    title: "Preflight Check",
    description:
      "Each Title Packet is checked against the State Ruleset before it is filed, so problems surface while the Dealer can still fix them.",
  },
  {
    title: "Findings that cite the Rule",
    description:
      "Every Defect, Confirm and Advisory names the Rule behind it, so you can see why something was flagged.",
  },
  {
    title: "Chase to Cleared",
    description:
      "If the Title Authority sends a Rejection, we resolve it and refile until the title clears.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <section className="space-y-4">
        <h1 className="font-semibold text-3xl tracking-tight sm:text-4xl">
          Title paperwork, checked and chased until it clears.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          ExactClerk checks each Deal's Title Packet against the state's rules, files it, and chases
          any Rejection for independent used-car Dealers. Launching in Texas.
        </p>
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          Sign in
        </Link>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {steps.map(({ title, description }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
