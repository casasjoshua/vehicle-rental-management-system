interface LoadingProps {
  message?: string;
}

export default function Loading({
  message = "Loading vehicles...",
}: LoadingProps) {
  return (
    <div
      role="status"
      className="flex min-h-56 flex-col items-center justify-center gap-4"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      <p className="text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}