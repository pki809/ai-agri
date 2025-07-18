import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function MetricCard({
  title,
  value,
  change,
  isPositive = true,
  className = "",
  children,
}: MetricCardProps) {
  return (
    <div
      className={`min-w-[158px] p-6 flex flex-col gap-2 flex-1 rounded-xl bg-[#E5F5F0] ${className}`}
    >
      <div className="text-[#0D1C17] text-base font-normal font-['Lexend']">
        {title}
      </div>
      <div className="text-[#0D1C17] text-2xl font-bold font-['Lexend']">
        {value}
      </div>
      <div
        className={`text-base font-normal font-['Lexend'] ${
          isPositive ? "text-[#08872E]" : "text-[#E82E08]"
        }`}
      >
        {change}
      </div>
      {children}
    </div>
  );
}
