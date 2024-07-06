import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/signIn")({
  component: SignIn,
});

function SignIn() {
  const { signIn } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.email.value;
    const password = form.password.value;
    try {
      await signIn(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto my-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required autoComplete="password" />
          </div>
          <div>
            <Button className="w-full mt-2" formAction="submit">
              Sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
