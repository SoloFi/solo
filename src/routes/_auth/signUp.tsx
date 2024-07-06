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

export const Route = createFileRoute("/_auth/signUp")({
  component: SignUp,
});

function SignUp() {
  const { signUp } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = form.email.value;
    const password = form.password.value;
    const accessKey = form.apiAccessKey.value;
    try {
      const successMsg = await signUp(email, password, accessKey);
      console.log(successMsg);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Sign up</CardTitle>
        <CardDescription>
          Enter your email, password and access key below to login to your account.
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
          <div className="grid gap-2">
            <Label htmlFor="apiAccessKey">Access key</Label>
            <Input
              id="apiAccessKey"
              type="apiAccessKey"
              required
              autoComplete="apiAccessKey"
            />
          </div>
          <div>
            <Button className="w-full mt-2" formAction="submit">
              Sign up
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
