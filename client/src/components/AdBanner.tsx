// Generic ad container — swap the innerHTML for any ad provider's script
// Sizes: "banner" = 728x90, "rectangle" = 300x250, "leaderboard" = 970x90

interface AdBannerProps {
  size?: "banner" | "rectangle" | "leaderboard";
  className?: string;
}

export default function AdBanner({ size = "banner", className = "" }: AdBannerProps) {
  const dimensions = {
    banner: { w: "728px", h: "90px", label: "728×90" },
    rectangle: { w: "300px", h: "250px", label: "300×250" },
    leaderboard: { w: "100%", h: "90px", label: "Ad" },
  };

  const d = dimensions[size];

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="ad-container bg-muted/30 border border-border/50 rounded-lg flex items-center justify-center text-muted-foreground/40 text-xs overflow-hidden"
        style={{ width: d.w, maxWidth: "100%", minHeight: d.h }}
        data-ad-size={size}
      >
        {/* Replace this div's contents with your ad provider's script */}
        <span className="select-none">{d.label}</span>
      </div>
    </div>
  );
}
