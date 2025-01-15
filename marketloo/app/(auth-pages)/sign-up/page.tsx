import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoIcon } from "lucide-react";
import Link from "next/link";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  if ("message" in searchParams) {
    return (
      <div className="flex items-center justify-center p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            className="text-gray-300 hover:text-white transition-colors"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            name="username"
            placeholder="cooltrader123"
            required
            className="bg-[#161920]/80 border-gray-700/50 hover:border-gray-600 focus:border-gray-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            name="email"
            placeholder="you@example.com"
            required
            className="bg-[#161920]/80 border-gray-700/50 hover:border-gray-600 focus:border-gray-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
            className="bg-[#161920]/80 border-gray-700/50 hover:border-gray-600 focus:border-gray-500 transition-colors"
          />
        </div>

        <SubmitButton
          formAction={signUpAction}
          pendingText="Signing up..."
          className="w-full bg-texture hover-card text-white font-medium border border-gray-700/50 hover:border-gray-500 transition-all"
        >
          Sign up
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>

      <div className="bg-muted/50 px-5 py-3 border rounded-md flex gap-4 mb-4">
        <InfoIcon size={16} className="mt-0.5" />
        <div>
          <small className="text-sm text-secondary-foreground">
            After signing up, you'll receive a confirmation email. Please note
            that it may take a minute to arrive.
          </small>
        </div>
      </div>
    </>
  );
}
