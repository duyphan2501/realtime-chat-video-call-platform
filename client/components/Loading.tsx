export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center fixed inset-0 bg-background bg-opacity-50">
      <div className="animate-spin rounded-full size-18 border-t-3 border-b-3 border-primary"></div>
    </div>
  );
}
