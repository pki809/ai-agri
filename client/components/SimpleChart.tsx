interface SimpleChartProps {
  data?: number[];
  color?: string;
  months?: string[];
  className?: string;
}

export default function SimpleChart({
  data = [60, 20, 40, 80, 30, 90, 50, 100, 25, 85, 75, 45],
  color = "#45A180",
  months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  className = "",
}: SimpleChartProps) {
  const width = 380;
  const height = 148;
  const padding = 20;

  // Normalize data to fit chart height
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (width - 2 * padding) + padding;
      const y =
        height - padding - ((value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  const pathData = `M ${points.split(" ").join(" L ")}`;

  // Create area fill path
  const firstPoint = points.split(" ")[0];
  const lastPoint = points.split(" ")[points.split(" ").length - 1];
  const lastX = lastPoint.split(",")[0];
  const firstX = firstPoint.split(",")[0];
  const areaPath = `${pathData} L ${lastX},${height - padding} L ${firstX},${height - padding} Z`;

  return (
    <div className={`w-full ${className}`}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6F5F0" />
            <stop offset="50%" stopColor="#E6F5F0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          fillRule="evenodd"
          clipRule="evenodd"
        />

        {/* Line */}
        <path d={pathData} stroke={color} strokeWidth="3" fill="none" />
      </svg>

      {/* Month labels */}
      <div className="flex justify-between items-start mt-8">
        {months.map((month, index) => (
          <div key={index} className="flex flex-col items-start">
            <div className="text-[#45A180] text-xs font-bold font-['Lexend']">
              {month}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
