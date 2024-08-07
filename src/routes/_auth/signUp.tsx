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
import { useUser } from "@/components/user";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { alreadyAuthenticated } from "../-utils";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/_auth/signUp")({
  component: SignUp,
  beforeLoad: alreadyAuthenticated,
});

function SignUp() {
  const { signUp } = useUser();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      apiAccessKey: "",
    },
    onSubmit: async ({ value }) => {
      const email = value.email;
      const password = value.password;
      const apiAccessKey = value.apiAccessKey;
      try {
        await signUp(email, password, apiAccessKey);
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
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>
            Enter your email, password and access key below to login to your account.
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
            <Field
              name="apiAccessKey"
              children={({ state, handleChange, handleBlur }) => (
                <div className="grid gap-2">
                  <Label htmlFor="apiAccessKey">Access key</Label>
                  <Input
                    value={state.value}
                    onChange={(e) => handleChange(e.target.value)}
                    id="apiAccessKey"
                    onBlur={handleBlur}
                    required
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
                  Sign up
                </Button>
              )}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
