import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  onQuickLogin: (email: string, password: string) => Promise<void>;
}

export default function DevQuickLogin({ onQuickLogin }: Props) {
  const isDev = import.meta.env.DEV &&
    ["localhost","127.0.0.1"].includes(window.location.hostname);
  if (!isDev) return null;

  const ACCOUNTS = [
    { label: "Demo", email: "demo.auto@email.com", tint: "primary" },
    { label: "Alpha", email: "test.alpha@network.test", tint: "muted" },
    { label: "Beta", email: "test.beta@network.test", tint: "muted" },
    { label: "Gamma", email: "test.gamma@network.test", tint: "muted" },
  ];

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginClick = async (email: string) => {
    setPendingEmail(email);
    setErrorMsg(null);
    try {
      await onQuickLogin(email, "Test1234!");
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setPendingEmail(null);
    }
  };

  return (
    <div className="border-t border-dashed border-border mt-6 pt-4">
      <div className="text-[12px] text-muted-foreground uppercase tracking-wide mb-2">
        DEV — login rapid
      </div>
      <div className="flex flex-wrap gap-2">
        {ACCOUNTS.map((acc) => {
          const isPending = pendingEmail === acc.email;
          const isAnyPending = pendingEmail !== null;
          const btnClass =
            acc.tint === "primary"
              ? "bg-primary text-primary-foreground hover:bg-primary/95"
              : "bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground";

          return (
            <button
              key={acc.email}
              type="button"
              disabled={isAnyPending}
              onClick={() => handleLoginClick(acc.email)}
              className={`min-h-[44px] px-4 rounded-lg text-[14px] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${btnClass}`}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {acc.label}
            </button>
          );
        })}
      </div>
      {errorMsg && (
        <div className="text-[12px] text-destructive mt-2">{errorMsg}</div>
      )}
    </div>
  );
}
