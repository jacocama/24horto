"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  return (
    <form
      className="card max-w-sm mx-auto space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        const res = await signIn("credentials", { email, password, redirect: false });
        setBusy(false);
        if (res?.ok) router.push("/diretta/admin");
        else setErr("Credenziali non valide");
      }}
    >
      <h1 className="text-xl font-black">Admin login</h1>
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full bg-black/40 rounded-lg px-3 py-2 border border-white/10" />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full bg-black/40 rounded-lg px-3 py-2 border border-white/10" />
      {err && <div className="text-destructive text-sm">{err}</div>}
      <button disabled={busy} className="w-full bg-accent text-pitchDark font-bold rounded-lg py-2">
        {busy ? "..." : "Entra"}
      </button>
    </form>
  );
}
