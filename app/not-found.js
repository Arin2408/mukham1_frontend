import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Page Not Found", robots: { index: false } };

// Shown for any address that doesn't exist in the app.
export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <SearchX className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm font-bold text-primary">404</p>
        <h1 className="text-3xl font-bold tracking-tight">This page doesn&apos;t exist</h1>
        <p className="text-muted-foreground">
          The link may be old or mistyped. Head back home, or sign in to get to your dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button>Go to Home</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Organisation Sign In</Button>
          </Link>
          <Link href="/member-login">
            <Button variant="outline">Employee Sign In</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
