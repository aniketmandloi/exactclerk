import { cn } from "@exactclerk/ui/lib/utils";

export default function Tag({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "neutral" | "pending";
}) {
  return (
    <span
      className={cn(
        "shrink-0 px-1.5 py-0.5 font-medium font-mono text-[0.6875rem] uppercase tracking-wider",
        tone === "pending"
          ? "bg-warning/10 text-warning"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}
