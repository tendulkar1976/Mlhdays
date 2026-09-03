import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";
import { VerificationState } from "@/types/schema";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Verification State Variants (with clear textual and icon signifiers)
        verified:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
        needs_confirmation:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
        conflict:
          "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
        expert_review:
          "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-300",
        // Regime Variants (neutral distinction, non-prejudiced)
        regime_new:
          "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-700 dark:bg-teal-950/60 dark:text-teal-200 font-mono",
        regime_old:
          "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-200 font-mono",
        regime_recommended:
          "border-emerald-500 bg-emerald-600 text-white font-semibold shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/**
 * Accessible Verification Badge rendering both status text and accessible icon.
 */
export function VerificationBadge({ state, className }: { state: VerificationState; className?: string }) {
  switch (state) {
    case "VERIFIED":
      return (
        <Badge variant="verified" className={className} title="Status: Verified with statutory proof">
          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span>VERIFIED</span>
        </Badge>
      );
    case "NEEDS_CONFIRMATION":
      return (
        <Badge variant="needs_confirmation" className={className} title="Status: Needs user confirmation">
          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>NEEDS CONFIRMATION</span>
        </Badge>
      );
    case "CONFLICT":
      return (
        <Badge variant="conflict" className={className} title="Status: Conflict identified between documents">
          <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <span>CONFLICT</span>
        </Badge>
      );
    case "EXPERT_REVIEW":
      return (
        <Badge variant="expert_review" className={className} title="Status: Requires professional tax review">
          <HelpCircle className="w-3 h-3 text-purple-600 dark:text-purple-400" aria-hidden="true" />
          <span>EXPERT REVIEW</span>
        </Badge>
      );
    default:
      return <Badge variant="outline" className={className}>{state}</Badge>;
  }
}

export { Badge, badgeVariants };
