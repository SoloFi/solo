import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { mustBeAuthenticated } from "../-utils";

export const Route = createFileRoute("/_app/")({
  component: Index,
  beforeLoad: mustBeAuthenticated,
});

function Index() {
  return (
    <div className="w-full h-full">
      <Card className="min-h-full">
        <CardHeader className="flex flex-row items-center w-full h-max pb-4 space-y-0 space-x-2"></CardHeader>
        <CardContent></CardContent>
      </Card>
    </div>
  );
}
