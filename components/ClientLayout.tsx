"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import BottomTabBar from "./BottomTabBar";

const AUTH_PATHS = ["/login", "/register"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.includes(pathname);

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="md:ml-60 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <BottomTabBar />
    </>
  );
}
