import type { ReactNode } from "react";

export function FieldBox({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label
      className={`relative flex h-16 min-w-0 flex-col justify-center rounded-control border border-gray-300 bg-white px-3 focus-within:z-10 focus-within:border-azure-blue focus-within:ring-1 focus-within:ring-azure-blue has-[:disabled]:bg-gray-50 ${className}`}
    >
      <span className="truncate text-[11px] font-semibold tracking-widest text-gray-500 uppercase">{label}</span>
      {children}
    </label>
  );
}

export const fieldControlClass =
  "w-full min-w-0 border-0 bg-transparent p-0 text-[15px] font-semibold text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-400 disabled:cursor-not-allowed disabled:text-gray-400";
