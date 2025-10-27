"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  children: React.ReactNode;
  className?: string;
}

export function HelpTooltip({ children, className }: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className={cn("cursor-help focus:outline-none", className)}>
            <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            <span className="sr-only">Ayuda</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs text-center">
          <p>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
