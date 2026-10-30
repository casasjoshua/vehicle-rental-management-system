import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorMessage({
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
      <AlertCircle className="mx-auto text-red-600" size={36} />

      <h3 className="mt-4 text-lg font-bold text-slate-900">
        Unable to load vehicles
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
      >
        <RefreshCw size={17} />
        Try Again
      </button>
    </div>
  );
}