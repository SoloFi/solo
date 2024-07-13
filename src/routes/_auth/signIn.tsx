import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth";
import { useForm } from "@tanstack/react-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Logo } from "@/components/logo";
import { alreadyAuthenticated } from "../-utils";

export const Route = createFileRoute("/_auth/signIn")({
  component: SignIn,
  beforeLoad: alreadyAuthenticated,
});

function SignIn() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const email = value.email;
      const password = value.password;
      try {
        await signIn(email, password);
        navigate({
          to: "/",
        });
      } catch (error) {
        setError((error as Error).message);
      }
    },
  });
  const { Field } = form;

  return (
    <div className="flex flex-col gap-8 items-center">
      <Logo className="text-3xl" />
      <Card className="w-full max-w-md bg-muted/40">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <Field
              name="email"
              children={({ state, handleChange, handleBlur }) => (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    value={state.value}
                    onChange={(e) => handleChange(e.target.value)}
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    onBlur={handleBlur}
                    autoComplete="email"
                    required
                  />
                </div>
              )}
            />
            <Field
              name="password"
              children={({ state, handleChange, handleBlur }) => (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    value={state.value}
                    onChange={(e) => handleChange(e.target.value)}
                    id="password"
                    type="password"
                    onBlur={handleBlur}
                    required
                    autoComplete="password"
                  />
                </div>
              )}
            />
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  className="w-full mt-2"
                  type="submit"
                  disabled={!canSubmit}
                  loading={isSubmitting}
                >
                  Sign in
                </Button>
              )}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
