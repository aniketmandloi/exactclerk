"use client";
import { Button } from "@exactclerk/ui/components/button";
import { Checkbox } from "@exactclerk/ui/components/checkbox";
import { Input } from "@exactclerk/ui/components/input";
import { Label } from "@exactclerk/ui/components/label";
import { useState } from "react";

import { type DealKind, FACT_LABEL, INTAKE_FACTS, type IntakeFact, KIND_LABEL } from "./labels";

export type Intake = { vin: string; kind: DealKind } & Record<IntakeFact, boolean>;

const KINDS = Object.keys(KIND_LABEL) as DealKind[];

export default function IntakeForm({
  initial,
  submitLabel,
  pending,
  onSubmit,
}: {
  initial: Intake;
  submitLabel: string;
  pending: boolean;
  onSubmit: (intake: Intake) => void;
}) {
  const [intake, setIntake] = useState(initial);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(intake);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="vin">VIN</Label>
        <Input
          id="vin"
          value={intake.vin}
          onChange={(e) => setIntake({ ...intake, vin: e.target.value })}
          className="font-mono uppercase tracking-wider"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          pattern="\s*[A-Za-z0-9]{1,17}\s*"
          title="Up to 17 letters and digits"
          aria-describedby="vin-hint"
          required
        />
        <p id="vin-hint" className="text-muted-foreground text-xs">
          On the dashboard by the windshield, or the driver's door jamb.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 font-medium text-sm">What kind of Deal is it?</legend>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((kind) => (
            <label
              key={kind}
              className="flex min-h-12 cursor-pointer items-center gap-2 border px-3 text-sm has-checked:border-primary has-checked:bg-primary/5"
            >
              <input
                type="radio"
                name="kind"
                value={kind}
                checked={intake.kind === kind}
                onChange={() => setIntake({ ...intake, kind })}
                className="accent-primary"
              />
              {KIND_LABEL[kind]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-1">
        <legend className="font-medium text-sm">Does any of this apply?</legend>
        <p className="mb-2 text-muted-foreground text-xs">These decide the price.</p>
        {INTAKE_FACTS.map((fact) => (
          <div key={fact} className="flex items-center gap-3">
            <Checkbox
              id={fact}
              checked={intake[fact]}
              onCheckedChange={(checked) => setIntake({ ...intake, [fact]: checked })}
            />
            <Label htmlFor={fact} className="min-h-11 flex-1 cursor-pointer font-normal">
              {FACT_LABEL[fact]}
            </Label>
          </div>
        ))}
      </fieldset>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
