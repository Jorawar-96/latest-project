import { AlertCircle, ExternalLink } from "lucide-react";

export function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <main className="setup-screen">
      <section className="setup-panel">
        <div className="setup-icon"><AlertCircle size={23} /></div>
        <p className="eyebrow">One-time setup</p>
        <h1>Connect your Supabase project</h1>
        <p className="setup-copy">The app is running, but it needs your project credentials before sign-in and payment pages can load.</p>
        <ol className="setup-steps">
          <li>Copy <code>.env.example</code> to <code>.env.local</code> in the project folder.</li>
          <li>Replace the placeholder values with your Supabase API URL, anon key, service role key, and a private admin secret.</li>
          <li>Save the file and restart the development server.</li>
        </ol>
        <div className="setup-missing">
          <span>Missing or placeholder values</span>
          <div>{missing.map((name) => <code key={name}>{name}</code>)}</div>
        </div>
        <a className="setup-link" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase dashboard <ExternalLink size={14} /></a>
      </section>
    </main>
  );
}