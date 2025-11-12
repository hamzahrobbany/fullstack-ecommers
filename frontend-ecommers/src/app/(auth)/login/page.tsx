"use client";

import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";

export default function LoginPage() {
  const { handleLogin, error, isLoading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", tenantCode: "salwa" });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleLogin(form);
  };

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-center text-2xl font-semibold">Masuk</h1>
      <form className="space-y-4" onSubmit={submit}>
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <input
          type="password"
          className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="Password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
          placeholder="Tenant Code (contoh: salwa)"
          value={form.tenantCode}
          onChange={(event) => setForm({ ...form, tenantCode: event.target.value })}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </form>
      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
