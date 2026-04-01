import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-20">
      <Card className="border border-border shadow-sm max-w-md w-full">
        <CardContent className="flex flex-col items-center text-center py-12 px-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h1 className="text-lg font-semibold">Page not found</h1>
          <p className="text-sm text-muted-foreground mt-2">
            This page doesn't exist in HSC Machine.
          </p>
          <Link href="/">
            <Button className="mt-6">Back to Practice</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
