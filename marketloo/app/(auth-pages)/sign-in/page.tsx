import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-gray-400">
          Don't have an account?{" "}
          <Link className="text-blue-400 hover:text-blue-300" href="/sign-up">
            Sign up
          </Link>
        </p>
      </div>

      <form className="space-y-4">
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
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-xs text-gray-400 hover:text-gray-300"
              href="/forgot-password"
            >
              Forgot Password?
            </Link>
          </div>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            required
            className="bg-[#1C2127] border-gray-700 focus:border-blue-500"
          />
        </div>

        <SubmitButton
          pendingText="Signing In..."
          formAction={signInAction}
          className="w-full bg-white hover:bg-gray-100 text-black font-medium"
        >
          Sign in
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>
    </>
  );
}
