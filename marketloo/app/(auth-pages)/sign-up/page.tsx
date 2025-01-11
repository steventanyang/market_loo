import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

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
          <Link className="text-blue-400 hover:text-blue-300" href="/sign-in">
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
            className="bg-[#1C2127] border-gray-700 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            name="email"
            placeholder="you@example.com"
            required
            className="bg-[#1C2127] border-gray-700 focus:border-blue-500"
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
            className="bg-[#1C2127] border-gray-700 focus:border-blue-500"
          />
        </div>

        <SubmitButton
          formAction={signUpAction}
          pendingText="Signing up..."
          className="w-full bg-white hover:bg-gray-100 text-black font-medium"
        >
          Sign up
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>

      <SmtpMessage />
    </>
  );
}
