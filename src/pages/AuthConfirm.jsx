import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";

export default function AuthConfirm() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function confirm() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type      = params.get("type");

      // Supabase v2 PKCE flow — token_hash + type are in the query string
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          setErrorMsg(error.message);
          setStatus("error");
        } else {
          setStatus("success");
          // Give the auth state change a moment to propagate, then redirect
          setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
        }
        return;
      }

      // Fallback: hash-fragment flow (#access_token=...) — Supabase handles this
      // automatically via onAuthStateChange. Just wait for the session.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus("success");
        setTimeout(() => navigate("/dashboard", { replace: true }), 2500);
      } else {
        setErrorMsg("Confirmation link is invalid or has already been used.");
        setStatus("error");
      }
    }

    confirm();
  }, [navigate]);

  if (status === "loading") {
    return (
      <AuthLayout
        icon={Loader2}
        title="Confirming your account…"
        subtitle="This will only take a moment"
      >
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  if (status === "success") {
    return (
      <AuthLayout
        icon={CheckCircle}
        title="Email confirmed!"
        subtitle="Your account is now active"
        footer={
          <>
            Taking you to your dashboard…{" "}
            <Link to="/dashboard" className="font-medium text-primary hover:underline">
              Go now
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Welcome aboard. Your account has no plan yet — an admin will assign
            one after reviewing your registration.
          </p>
        </div>
      </AuthLayout>
    );
  }

  // error
  return (
    <AuthLayout
      icon={XCircle}
      title="Confirmation failed"
      subtitle="We couldn't verify your email"
      footer={
        <>
          Need help?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Sign up again
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
          <XCircle className="h-8 w-8 text-red-400" />
        </div>
        {errorMsg && (
          <p className="text-center text-sm text-destructive">{errorMsg}</p>
        )}
        <p className="text-center text-sm text-muted-foreground">
          Confirmation links expire after 24 hours or after they've been clicked once.
          Try signing up again or request a new confirmation email.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Go to login</Link>
        </Button>
      </div>
    </AuthLayout>
  );
}
