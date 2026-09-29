import Guilloche from "@/components/guilloche";

function Field({ label, children, wide }: { label: string; children: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}

// The Finding is the Texas Ruleset's title-seller-signature Rule, as a Dealer would see it.
export default function TitleFront() {
  return (
    <figure
      aria-label="Example: a Preflight Check Finding on the front of a title"
      className="w-full"
    >
      <div className="bg-card shadow-sm ring-1 ring-foreground/10">
        <Guilloche className="text-primary/40" />
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4 border-b pb-3">
            <p className="cn-font-heading font-bold text-sm uppercase">Title (front)</p>
            <p className="font-mono text-muted-foreground text-xs">2014 Ford F-150</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Field label="VIN" wide>
              1FTFW1ET4EKE57219
            </Field>
            <Field label="Odometer">104,882 mi</Field>
            <Field label="Lienholder">None</Field>
          </dl>
          <div className="space-y-4">
            <p className="font-mono text-[0.6875rem] text-muted-foreground uppercase tracking-wider">
              Assignment of title
            </p>
            <div className="relative">
              <div className="h-8 border-foreground/40 border-b" />
              <p className="mt-1 text-muted-foreground text-xs">Seller signature</p>
              <svg
                aria-hidden="true"
                viewBox="0 0 210 44"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -inset-x-2 -top-2 h-14 w-[calc(100%+1rem)] text-destructive"
              >
                <path
                  d="M14 22 C12 8 196 2 202 18 C207 33 34 42 10 30 C3 26 8 14 34 10"
                  pathLength={1}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="1"
                  vectorEffect="non-scaling-stroke"
                  className="motion-safe:animate-ring-draw"
                />
              </svg>
            </div>
            <div>
              <div className="flex h-8 items-end border-foreground/40 border-b pb-1 pl-2 font-medium text-foreground/80 italic">
                J. Alvarez
              </div>
              <p className="mt-1 text-muted-foreground text-xs">Buyer signature</p>
            </div>
          </div>
        </div>
      </div>

      <figcaption className="relative -mt-3 ml-4 border-destructive border-l-4 bg-card p-4 shadow-lg ring-1 ring-foreground/10 motion-safe:animate-finding-in sm:ml-10">
        <div className="flex items-center gap-2">
          <span className="bg-destructive/10 px-1.5 py-0.5 font-medium font-mono text-[0.6875rem] text-destructive uppercase tracking-wider">
            Defect
          </span>
          <span className="text-muted-foreground text-xs">Title (front)</span>
        </div>
        <p className="mt-2 font-semibold">Seller signature is missing on the assignment line.</p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Who acts</dt>
          <dd>Previous owner</dd>
          <dt className="text-muted-foreground">Next</dt>
          <dd>Get the previous owner to sign, then re-upload the front of the title.</dd>
        </dl>
        <p className="mt-3 font-mono text-muted-foreground text-xs">
          Texas Title Manual · dealer chapter
        </p>
      </figcaption>
    </figure>
  );
}
