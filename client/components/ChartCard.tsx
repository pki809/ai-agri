import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  value: string;
  subtitle: string;
  change: string;
  isPositive?: boolean;
  className?: string;
  children?: ReactNode;
}

export default function ChartCard({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  className = "",
  children,
}: ChartCardProps) {
  return (
    <div
      className={`min-w-72 p-6 flex flex-col gap-2 flex-1 rounded-xl border border-[#CCE8DE] ${className}`}
    >
      <div className="text-[#0D1C17] text-base font-medium font-['Lexend']">
        {title}
      </div>
      <div className="text-[#0D1C17] text-3xl font-bold font-['Lexend'] truncate">
        {value}
      </div>
      <div className="flex items-start gap-1">
        <div className="text-[#45A180] text-base font-normal font-['Lexend']">
          {subtitle}
        </div>
        <div
          className={`text-base font-medium font-['Lexend'] ${
            isPositive ? "text-[#08872E]" : "text-[#E82E08]"
          }`}
        >
          {change}
        </div>
      </div>
      <div className="min-h-[180px] py-4 flex flex-col gap-8 flex-1">
        {children}
      </div>
    </div>
  );
}
