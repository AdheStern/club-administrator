// src/components/system/dashboard/chart-tooltip.tsx
interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
  labelFormatter?: (label: string) => string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border-2 shadow-xl p-3 bg-background backdrop-blur-sm">
      {label && (
        <p className="font-semibold text-sm mb-2 text-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const [formattedValue, formattedName] = formatter
            ? formatter(entry.value, entry.name)
            : [entry.value, entry.name];

          return (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-xs text-muted-foreground">
                {formattedName}:
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
