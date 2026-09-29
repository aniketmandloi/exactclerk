"use client";
import { Button } from "@exactclerk/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@exactclerk/ui/components/card";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <Card className="mx-auto mt-6 w-full max-w-md sm:mt-12">
      <CardHeader>
        <CardTitle className="font-bold text-2xl [font-stretch:125%]">
          Something went wrong
        </CardTitle>
        <CardDescription>The page failed to load. Try again in a moment.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => retry()}>Try again</Button>
      </CardContent>
    </Card>
  );
}
