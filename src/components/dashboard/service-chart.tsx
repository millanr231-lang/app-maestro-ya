"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart";

export type MonthlyServices = {
  month: string;
  services: number;
};

const chartConfig = {
  services: {
    label: "Servicios",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface ServiceChartProps {
    data?: MonthlyServices[];
}

export function ServiceChart({ data = [] }: ServiceChartProps) {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-[350px]">
        <BarChart data={data} accessibilityLayer margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
            allowDecimals={false}
          />
          <ChartTooltip 
            cursor={false} 
            content={
                <ChartTooltipContent 
                    formatter={(value) => `${value} servicios`}
                />
            }
          />
          <Bar dataKey="services" fill="var(--color-services)" radius={4} />
        </BarChart>
    </ChartContainer>
  );
}
