"use client";

interface DayData {
  day: string;
  value: number;
}

interface ImpressionsChartProps {
  data?: DayData[];
}

const defaultData: DayData[] = [
  { day: "S", value: 45 },
  { day: "M", value: 80 },
  { day: "T", value: 65 },
  { day: "W", value: 90 },
  { day: "T", value: 55 },
  { day: "F", value: 70 },
  { day: "S", value: 60 },
];

export default function ImpressionsChart({ data = defaultData }: ImpressionsChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white rounded-2xl p-6 h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-base font-medium text-gray-900">Total Impressions in last week</h3>
        <span className="text-sm text-gray-900 font-medium">Last 7 days</span>
      </div>

      {/* Chart */}
      <div className="flex items-end justify-between gap-4 h-48 w-full px-2">
        {data.map((item, index) => {
          const isSolid = item.value > 80; // Logic for solid vs striped bars based on visual

          return (
            <div key={index} className="flex flex-col items-center gap-3 flex-1 h-full justify-end">
              {/* Bar */}
              <div className="w-full max-w-[48px] flex justify-center h-full items-end">
                <div
                  className={`w-full rounded-[2rem] relative overflow-hidden transition-all duration-500 hover:opacity-90 ${
                    isSolid ? "bg-[#318D62]" : "bg-transparent"
                  }`}
                  style={{
                    height: `${(item.value / maxValue) * 100}%`,
                    minHeight: "20px",
                  }}
                >
                  {/* Striped pattern overlay for non-solid bars */}
                  {!isSolid && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M-1 1 l2 -2 M0 8 l8 -8 M7 9 l2 -2' stroke='%23318D62' stroke-width='1.5' stroke-opacity='0.6' stroke-linecap='round' /%3E%3C/svg%3E")`,
                        backgroundSize: "8px 8px",
                      }}
                    />
                  )}
                </div>
              </div>
              {/* Day label */}
              <span className="text-sm font-medium text-[#318D62]">{item.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
