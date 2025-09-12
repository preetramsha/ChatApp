import React from "react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16 sm:py-20">
        <div className="w-full">
          <div className="mb-8 flex items-center gap-3">
            <img
              src="/images/icon.webp"
              alt="ChatApp icon"
              className="h-10 w-10 rounded-md ring-1 ring-white/10"
            />
            <span className="text-sm font-medium text-zinc-400">
              Open source chat
            </span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Talk to any registered user.
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            A minimal, dark, and fast chat app. Runs on the developer's old mini
            PC via Cloudflare Tunnels. No fluff—just real-time messaging.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-white text-black px-4 py-2 text-sm font-medium transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              Log in
            </Link>
          </div>

          <div className="mt-10">
            <ul className="flex flex-wrap gap-2 text-xs text-zinc-400">
              {[
                "nodejs",
                "socket.io",
                "sqlite",
                "drizzle orm",
                "react",
                "tailwind",
                "hono.js",
              ].map((item) => (
                <li
                  key={item}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-xs text-zinc-500">
            Built with websockets and minimalism.
          </p>
        </div>
      </div>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} ChatApp
      </footer>
    </main>
  );
};

export default Landing;
