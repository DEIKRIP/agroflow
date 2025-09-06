import React from 'react';
import { cn } from '../../utils/cn';

type ChartContainerProps = {
  className?: string;
  children: React.ReactNode;
};

export function ChartContainer({ className, children, ...props }: ChartContainerProps) {
  return (
    <div className={cn('w-full h-[300px]', className)} {...props}>
      {children}
    </div>
  );
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
};

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
        <p className="font-medium">{label}</p>
        <div className="space-y-1 mt-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">
                {item.name}: <span className="font-medium">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

type ChartTooltipContentProps = {
  className?: string;
  children: React.ReactNode;
};

export function ChartTooltipContent({ className, children, ...props }: ChartTooltipContentProps) {
  return (
    <div className={cn('p-2 bg-white border rounded shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}
