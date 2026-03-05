export default function Loading() {
  return (
    <div className="flex h-screen items-center justify-center fixed inset-0 bg-black/40 bg-opacity-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white"></div>
    </div>
  );
}
