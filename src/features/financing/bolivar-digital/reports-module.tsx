
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from "recharts"

const chartData = [
    { month: 'Ene', "Flujo Neto": 4000, "Morosidad": 2400 },
    { month: 'Feb', "Flujo Neto": 3000, "Morosidad": 1398 },
    { month: 'Mar', "Flujo Neto": 2000, "Morosidad": 9800 },
    { month: 'Abr', "Flujo Neto": 2780, "Morosidad": 3908 },
    { month: 'May', "Flujo Neto": 1890, "Morosidad": 4800 },
    { month: 'Jun', "Flujo Neto": 2390, "Morosidad": 3800 },
    { month: 'Jul', "Flujo Neto": 3490, "Morosidad": 4300 },
];

const chartConfig = {
    "Flujo Neto": {
        label: "Flujo Neto",
        color: "hsl(var(--primary))",
    },
    "Morosidad": {
        label: "Morosidad",
        color: "hsl(var(--destructive))",
    },
}

export default function ReportsModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes & KPIs</CardTitle>
        <CardDescription>
          Visualización de métricas clave como flujo neto de caja y morosidad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="min-h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis 
                tickFormatter={(value) => `Bs. ${Number(value).toLocaleString()}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend />
            <Area
              dataKey="Flujo Neto"
              type="natural"
              fill="#3b82f6"
              fillOpacity={0.3}
              stroke="#3b82f6"
              stackId="a"
            />
            <Area
              dataKey="Morosidad"
              type="natural"
              fill="#ef4444"
              fillOpacity={0.3}
              stroke="#ef4444"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
