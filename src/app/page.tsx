"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  const [greeting, setGreeting] = useState("hello world");

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold font-headline">
            Greeting Display
          </CardTitle>
          <CardDescription>
            Enter text to see it appear below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-6">
            <Input
              id="greeting-input"
              type="text"
              placeholder="Type something..."
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="h-12 w-full text-center text-lg"
              aria-label="Greeting Input"
            />
            <div className="flex h-24 w-full items-center justify-center rounded-lg bg-muted p-4">
              {greeting ? (
                <p className="animate-fade-in text-4xl font-bold tracking-wider text-primary font-headline">
                  {greeting}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Your text will appear here
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
