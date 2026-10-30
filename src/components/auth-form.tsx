"use client";

import Link from "next/link";
import { useActionState } from "react";
import { adminAccessAction, loginAction, signUpAction } from "@/app/actions";
import { Brand } from "@/components/brand";

type Mode = "login" | "signup" | "admin";

export function AuthForm({ mode, checkEmail = false }: { mode: Mode; checkEmail?: boolean }) {
  const action = mode === "admin" ? adminAccessAction : mode === "signup" ? signUpAction : loginAction;
  const [state, formAction, pending] = useActionState(action, {});
  const title = mode === "signup" ? "Create your account" : mode === "admin" ? "Admin access" : "Welcome back";
  const description = mode === "signup" ? "Register to view secure payment instructions." : mode === "admin" ? "Sign in or initialize the administrator account." : "Sign in to continue to your payment dashboard.";

  return (
    <main className="auth-shell">
      <section className="auth-art">
        <Brand />
        <div className="auth-art-copy">
          <h1>Payments, made clear.</h1>
          <p>A straightforward place to find your payment details and keep every transaction moving.</p>
        </div>
        <div className="auth-art-foot">A considered way to pay.</div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <h2>{checkEmail ? "Check your inbox" : title}</h2>
          <p className="auth-subtitle">{checkEmail ? "A confirmation link is on its way. Verify your email, then sign in." : description}</p>
          {!checkEmail && (
            <form action={formAction}>
              <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
              <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} /></div>
              {mode === "admin" && <div className="field"><label htmlFor="secretKey">Secret key</label><input id="secretKey" name="secretKey" type="password" autoComplete="off" required /></div>}
              <button className="primary-button" type="submit" disabled={pending}>{pending ? "Please wait…" : mode === "signup" ? "Create account" : "Continue"}</button>
              {state.error && <p role="alert" className="form-message error">{state.error}</p>}
            </form>
          )}
          {checkEmail && <Link className="primary-button" href="/login">Go to sign in</Link>}
          {mode === "login" && <p className="auth-switch">New here? <Link href="/signup">Create an account</Link></p>}
          {mode === "signup" && <p className="auth-switch">Already registered? <Link href="/login">Sign in</Link></p>}
        </div>
      </section>
    </main>
  );
}