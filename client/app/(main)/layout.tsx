import Sidebar from "@/components/layout/Sidebar";
import AuthProvider from "@/components/providers/AuthProvider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </AuthProvider>
  );
}
