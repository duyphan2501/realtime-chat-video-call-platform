import MainAppShell from "@/components/layout/MainAppShell";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainAppShell>{children}</MainAppShell>;
}
