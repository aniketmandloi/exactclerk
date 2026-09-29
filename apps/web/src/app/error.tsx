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
    <Card className="mx-auto mt-10 w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Something went wrong</CardTitle>
        <CardDescription>The page failed to load. Try again in a moment.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => retry()}>Try again</Button>
      </CardContent>
    </Card>
  );
}
