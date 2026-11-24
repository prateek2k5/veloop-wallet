import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const tokenKey = "veloop_demo_token";

async function api(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("demo@veloop.test");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const data = await api("/api/auth/login", null, {
        method: "POST", body: JSON.stringify({ email, password }),
      });
      onLogin(data.token, data.user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <main className="login-shell">
    <form className="login-card" onSubmit={submit}>
      <div className="brand-mark">V</div>
      <p className="eyebrow">VELOOP REWARDS</p>
      <h1>Welcome back</h1>
      <p className="muted">Sign in to view your demo wallet.</p>
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
      {error && <p className="error">{error}</p>}
      <button className="primary full" disabled={busy}>{busy ? "Signing in…" : "Login"}</button>
      <p className="hint">Use the demo credentials configured in your backend environment.</p>
    </form>
  </main>;
}

function App() {
  const [token, setToken] = useState(localStorage.getItem(tokenKey) || "");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(window.location.pathname === "/payout" ? "payout" : "wallet");

  useEffect(() => {
    const onPop = () => setPage(window.location.pathname === "/payout" ? "payout" : "wallet");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(next) {
    const path = next === "payout" ? "/payout" : "/wallet";
    window.history.pushState({}, "", path);
    setPage(next);
  }

  function login(jwt, profile) {
    localStorage.setItem(tokenKey, jwt);
    setToken(jwt);
    setUser(profile);
  }

  function logout() {
    localStorage.removeItem(tokenKey);
    setToken("");
    setUser(null);
    navigate("wallet");
  }

  if (!token) return <Login onLogin={login} />;
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark small">V</span><span>VELOop <b>Wallet</b></span></div>
      <div className="top-actions"><span className="user-label">{user?.name || "Demo account"}</span><button className="ghost" onClick={logout}>Log out</button></div>
    </header>
    <nav className="tabs">
      <button className={page === "wallet" ? "tab active" : "tab"} onClick={() => navigate("wallet")}>Wallet</button>
      <button className={page === "payout" ? "tab active" : "tab"} onClick={() => navigate("payout")}>Payout</button>
    </nav>
    {page === "payout"
      ? <Payout token={token} onDone={() => navigate("wallet")} />
      : <Wallet token={token} onPayout={() => navigate("payout")} />}
  </div>;
}

function Wallet({ token, onPayout }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try {
      const [w, t] = await Promise.all([
        api("/api/wallet", token),
        api("/api/wallet/transactions?page=1&limit=10", token),
      ]);
      setWallet(w.wallet);
      setTransactions(t.transactions || []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [token]);

  const balances = [
    ["VEs", wallet?.ves, "Primary redemption balance", "gold"],
    ["SVEs", wallet?.sves, "Special VEs", "blue"],
    ["Gems", wallet?.gems, "Reward currency", "purple"],
    ["Tokens", wallet?.tokens, "Platform tokens", "green"],
    ["Spins", wallet?.spins, "Available spins", "orange"],
  ];

  return <main className="content">
    <section className="page-heading"><div><p className="eyebrow">YOUR REWARDS</p><h1>Wallet overview</h1><p className="muted">Your balances and recent wallet activity.</p></div><button className="primary" onClick={onPayout}>Redeem rewards <span>→</span></button></section>
    {error && <div className="alert error">{error} <button className="text-button" onClick={load}>Retry</button></div>}
    {loading ? <div className="loading">Loading wallet…</div> : <section className="balance-grid">
      {balances.map(([name, value, note, tone]) => <article className={`balance-card ${tone}`} key={name}>
        <div className="balance-top"><span>{name}</span><span className="coin-dot">{name[0]}</span></div>
        <strong>{Number(value || 0).toLocaleString("en-IN")}</strong><small>{note}</small>
      </article>)}
    </section>}
    <section className="panel">
      <div className="panel-heading"><div><h2>Recent transactions</h2><p className="muted">Your latest wallet activity</p></div><button className="text-button" onClick={load}>Refresh ↻</button></div>
      {loading ? <div className="loading">Loading transactions…</div> : transactions.length === 0 ? <p className="empty">No transactions yet.</p> :
        <div className="transaction-list">{transactions.map(tx => <div className="transaction" key={tx.transactionId}>
          <div className="tx-icon">{tx.type === "CREDIT" ? "+" : "−"}</div>
          <div className="tx-main"><b>{tx.description || tx.source}</b><small>{new Date(tx.createdAt).toLocaleString()}</small></div>
          <div className="tx-amount"><b className={tx.type === "CREDIT" ? "positive" : "negative"}>{tx.type === "CREDIT" ? "+" : "−"}{Number(tx.amount).toLocaleString("en-IN")} {tx.currency}</b><small>{tx.status}</small></div>
        </div>)}</div>}
    </section>
  </main>;
}

function Payout({ token, onDone }) {
  const [methods, setMethods] = useState([]);
  const [method, setMethod] = useState("");
  const [options, setOptions] = useState([]);
  const [optionId, setOptionId] = useState("");
  const [upiId, setUpiId] = useState("");
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/payout/methods", token)
      .then(data => setMethods(data.methods || []))
      .catch(err => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (!method) { setOptions([]); setOptionId(""); return; }
    api(`/api/payout/options/${method}`, token)
      .then(data => { setOptions(data.options || []); setOptionId(""); })
      .catch(err => setError(err.message));
  }, [method, token]);

  const selected = options.find(option => option.optionId === optionId);

  async function submit() {
    if (!selected) return;
    setBusy(true); setError(""); setSuccess("");
    const payoutDetails = {};
    if (selected.requiredDetails.includes("upiId")) payoutDetails.upiId = upiId;
    if (selected.requiredDetails.includes("email")) payoutDetails.email = email;
    try {
      const data = await api("/api/withdrawals", token, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ optionId, payoutDetails }),
      });
      setSuccess(`Withdrawal submitted. Status: ${data.withdrawal.status}`);
      setConfirm(false);
      setTimeout(onDone, 1200);
    } catch (err) { setError(err.message); setConfirm(false); }
    finally { setBusy(false); }
  }

  return <main className="content narrow">
    <section className="page-heading"><div><p className="eyebrow">REDEEM YOUR REWARDS</p><h1>Payout</h1><p className="muted">Choose a payout method and available reward option.</p></div></section>
    {error && <div className="alert error">{error}</div>}
    {success && <div className="alert success">{success}</div>}
    <section className="panel form-panel">
      <label>Payout method<select value={method} onChange={e => setMethod(e.target.value)}><option value="">Select a method</option>{methods.map(item => <option value={item.method} key={item.method}>{item.name}</option>)}</select></label>
      {method && options.length === 0 && <p className="hint">No active denominations are currently configured for this method.</p>}
      {options.length > 0 && <label>Choose payout amount<select value={optionId} onChange={e => setOptionId(e.target.value)}><option value="">Select an amount</option>{options.map(option => <option key={option.optionId} value={option.optionId}>{option.name} — {Number(option.requiredAmount).toLocaleString("en-IN")} VEs</option>)}</select></label>}
      {selected?.requiredDetails.includes("upiId") && <label>UPI ID<input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="name@bank" /></label>}
      {selected?.requiredDetails.includes("email") && <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>}
      {selected && <div className="payout-summary"><span>You'll receive</span><b>₹{Number(selected.payoutAmount).toLocaleString("en-IN")}</b><span>Required balance</span><b>{Number(selected.requiredAmount).toLocaleString("en-IN")} VEs</b></div>}
      <button className="primary full" disabled={!selected || busy || (selected.requiredDetails.includes("upiId") && !upiId.trim()) || (selected.requiredDetails.includes("email") && !email.trim())} onClick={() => { setIdempotencyKey(crypto.randomUUID()); setConfirm(true); }}>Continue</button>
    </section>
    {confirm && <div className="modal-backdrop"><div className="modal"><h2>Confirm withdrawal</h2><p>Redeem ₹{selected?.payoutAmount} for {Number(selected?.requiredAmount).toLocaleString("en-IN")} VEs?</p><p className="muted">The required VEs will be deducted when this request is submitted. Rejected requests are refunded.</p><div className="modal-actions"><button className="ghost" onClick={() => setConfirm(false)}>Cancel</button><button className="primary" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Confirm withdrawal"}</button></div></div></div>}
  </main>;
}

export default App;
