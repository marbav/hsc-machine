// Next Question animation definitions
export interface AnimationDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlockLevel: number;
  // CSS class applied to question card on transition
  cardClass: string;
  // Optional overlay element type
  overlayType?: "ripple" | "shatter" | "vortex" | "lightning" | "meteor" | "portal" | "glitch" | "flip3d" | "dissolve" | "bounce";
}

export const ANIMATIONS: AnimationDef[] = [
  {
    id: "default",
    name: "Ripple",
    emoji: "🌊",
    description: "The classic purple ripple shockwave",
    unlockLevel: 0,
    cardClass: "card-pop",
    overlayType: "ripple",
  },
  {
    id: "slide",
    name: "Slide",
    emoji: "➡️",
    description: "Cards slide out left, new one slides in right",
    unlockLevel: 2,
    cardClass: "anim-slide-in",
  },
  {
    id: "flip",
    name: "3D Flip",
    emoji: "🔄",
    description: "Card flips over in 3D to reveal the next question",
    unlockLevel: 3,
    cardClass: "anim-flip",
    overlayType: "flip3d",
  },
  {
    id: "bounce",
    name: "Bounce Drop",
    emoji: "⬇️",
    description: "Card drops in from above and bounces",
    unlockLevel: 4,
    cardClass: "anim-bounce-drop",
    overlayType: "bounce",
  },
  {
    id: "shatter",
    name: "Shatter",
    emoji: "💥",
    description: "Card shatters into pieces and reforms",
    unlockLevel: 6,
    cardClass: "anim-shatter",
    overlayType: "shatter",
  },
  {
    id: "vortex",
    name: "Vortex",
    emoji: "🌀",
    description: "Spiraling vortex swallows the old question",
    unlockLevel: 8,
    cardClass: "anim-vortex",
    overlayType: "vortex",
  },
  {
    id: "glitch",
    name: "Glitch",
    emoji: "📺",
    description: "Digital glitch distortion effect",
    unlockLevel: 10,
    cardClass: "anim-glitch",
    overlayType: "glitch",
  },
  {
    id: "lightning",
    name: "Lightning",
    emoji: "⚡",
    description: "Lightning bolt flash transition",
    unlockLevel: 12,
    cardClass: "anim-lightning",
    overlayType: "lightning",
  },
  {
    id: "meteor",
    name: "Meteor",
    emoji: "☄️",
    description: "Meteor streaks across, obliterating the question",
    unlockLevel: 14,
    cardClass: "anim-meteor",
    overlayType: "meteor",
  },
  {
    id: "portal",
    name: "Portal",
    emoji: "🌌",
    description: "Opens a portal that warps to the next question",
    unlockLevel: 16,
    cardClass: "anim-portal",
    overlayType: "portal",
  },
];
