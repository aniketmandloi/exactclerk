import { buttonVariants } from "@exactclerk/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@exactclerk/ui/components/card";
import { CircleCheck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Payment successful" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  const { checkout_id } = await searchParams;

  return (
    <Card className="mx-auto mt-6 w-full max-w-md sm:mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-2xl [font-stretch:125%]">
          <CircleCheck className="text-success" aria-hidden="true" />
          Payment successful
        </CardTitle>
        {checkout_id && (
          <CardDescription>
            Checkout ID: <span className="font-mono">{checkout_id}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Link href="/dashboard" className={buttonVariants()}>
          Back to dashboard
        </Link>
      </CardContent>
    </Card>
  );
}
