import * as React from "react"

const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative overflow-auto ${className}`}
    {...props}
  >
    <div className="h-full w-full rounded-[inherit]">{children}</div>
  </div>
))
ScrollArea.displayName = "ScrollArea"

const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    data-orientation={orientation}
    className={`flex touch-none select-none transition-colors ${
      orientation === "vertical"
        ? "h-full w-2.5 border-l border-l-transparent p-[1px]"
        : "h-2.5 flex-col border-t border-t-transparent p-[1px]"
    } ${className}`}
    {...props}
  />
))
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }