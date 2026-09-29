import { buttonVariants } from "@exactclerk/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@exactclerk/ui/components/card";
import Link from "next/link";

export default function NotFound() {
  return (
    <Card className="mx-auto mt-10 w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Page not found</CardTitle>
        <CardDescription>That page doesn't exist or has moved.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Back to home
        </Link>
      </CardContent>
    </Card>
  );
}
