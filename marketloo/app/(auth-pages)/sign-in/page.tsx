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
          <Link
            className="text-gray-300 hover:text-white transition-colors"
            href="/sign-up"
          >
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
            className="bg-[#161920]/80 border-gray-700/50 hover:border-gray-600 focus:border-gray-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-xs text-gray-400 hover:text-white transition-colors"
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
            className="bg-[#161920]/80 border-gray-700/50 hover:border-gray-600 focus:border-gray-500 transition-colors"
          />
        </div>

        <SubmitButton
          pendingText="Signing In..."
          formAction={signInAction}
          className="w-full bg-texture hover-card text-white font-medium border border-gray-700/50 hover:border-gray-500 transition-all"
        >
          Sign in
        </SubmitButton>

        <FormMessage message={searchParams} />
      </form>
    </>
  );
}
