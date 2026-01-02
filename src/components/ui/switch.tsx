import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

const ControlSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    variant?: 'lamp' | 'ac';
    isLoading?: boolean;
  }
>(({ className, variant = 'lamp', isLoading, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=unchecked]:bg-muted",
      variant === 'lamp' && "data-[state=checked]:bg-warning/20 data-[state=checked]:border-warning data-[state=checked]:shadow-[0_0_15px_hsl(38_92%_50%_/_0.3)]",
      variant === 'ac' && "data-[state=checked]:bg-accent/20 data-[state=checked]:border-accent data-[state=checked]:shadow-[0_0_15px_hsl(187_92%_50%_/_0.3)]",
      isLoading && "opacity-70 pointer-events-none",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-6 w-6 rounded-full shadow-lg ring-0 transition-all duration-300 data-[state=unchecked]:translate-x-0.5 data-[state=checked]:translate-x-7",
        "data-[state=unchecked]:bg-muted-foreground",
        variant === 'lamp' && "data-[state=checked]:bg-warning",
        variant === 'ac' && "data-[state=checked]:bg-accent",
        isLoading && "animate-pulse"
      )}
    />
  </SwitchPrimitives.Root>
));
ControlSwitch.displayName = "ControlSwitch";

export { Switch, ControlSwitch };
