import type { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
}

export function MobileFrame({ children }: MobileFrameProps) {
  return (
    <div className="w-full h-dvh flex items-center justify-center bg-[#E8E6E1]">
      <div className="relative w-full max-w-[390px] h-full max-h-[915px] bg-[#FAFAF8] overflow-hidden shadow-2xl md:rounded-[2rem] md:border md:border-black/5">
        {/* Content area */}
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>

        {/* Home indicator - Galaxy style */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[3px] bg-black/30 rounded-full z-50" />
      </div>
    </div>
  );
}
