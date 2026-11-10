import React from 'react';

interface KaenGreenLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export const KaenGreenLogo: React.FC<KaenGreenLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  className = ''
}) => {
  const sizeMap = {
    sm: { logo: 'w-11 h-11', title: 'text-base', sub: 'text-[10px]' },
    md: { logo: 'w-14 h-14', title: 'text-lg', sub: 'text-[11px]' },
    lg: { logo: 'w-20 h-20', title: 'text-xl', sub: 'text-xs' },
    xl: { logo: 'w-28 h-28', title: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official KAEN GREEN Logo Image from user attachment */}
      <div
        className={`${currentSize.logo} shrink-0 relative flex items-center justify-center rounded-xl overflow-hidden bg-white border border-[#E6E2D6] p-0.5 shadow-2xs`}
      >
        <img
          src="/assets/aistudio/______KAEN_GREEN_Official_16671970.png"
          alt="KAEN GREEN Official Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain scale-110"
        />
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-display font-bold tracking-wider text-[#263E1A] whitespace-nowrap ${currentSize.title}`}>
            KAEN GREEN
          </span>
          {showSubtitle && (
            <span className={`font-body font-medium text-[#8B5E34] tracking-wide whitespace-nowrap ${currentSize.sub}`}>
              ผักปลอดภัยจากไทขอนแก่น
            </span>
          )}
        </div>
      )}
    </div>
  );
};
