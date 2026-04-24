import { SignUp } from "@clerk/nextjs";
import { type JSX } from "react";

export default function SignUpPage(): JSX.Element {
  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
      <div className="rounded-[32px] bg-white p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
        <SignUp
          routing="hash"
          signInUrl="/login"
          fallbackRedirectUrl="/partner/apply"
        />
      </div>
    </div>
  );
}
