import type { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import ReloadGuard from "@/components/ReloadGuard";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:py-14">
      <ReloadGuard />
      <div className="site-frame flex flex-1 flex-col">
        <div className="site-frame-trim" />
        <NavBar />
        <main className="site-frame-inner">{children}</main>
        <div className="site-frame-trim" />
      </div>
    </div>
  );
}
