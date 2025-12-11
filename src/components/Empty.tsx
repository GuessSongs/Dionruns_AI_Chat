// 暂时保留Empty组件，以备后用
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Empty() {
  return (
    <div className={cn("flex h-full items-center justify-center")} onClick={() => toast('Coming soon')}>Empty</div>
  );
}