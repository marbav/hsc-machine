import { useState } from "react";
import { useGame } from "@/lib/gameState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Check, Palette, Sparkles, Zap, Award } from "lucide-react";

type Tab = "themes" | "animations" | "titles";

export default function StorePage() {
  const [tab, setTab] = useState<Tab>("themes");
  const {
    level, activeTheme, unlockedThemes, setTheme, allThemes,
    activeAnimation, unlockedAnimations, setAnimation, allAnimations,
    activeTitle, unlockedTitles, setTitle, allTitles,
  } = useGame();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Store
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unlock themes and animations by leveling up. You're level {level}.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1">
        <button
          onClick={() => setTab("themes")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "themes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="w-4 h-4" /> Themes ({allThemes.length})
        </button>
        <button
          onClick={() => setTab("animations")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "animations" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Zap className="w-4 h-4" /> Animations ({allAnimations.length})
        </button>
        <button
          onClick={() => setTab("titles")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "titles" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="w-4 h-4" /> Titles ({allTitles.length})
        </button>
      </div>

      {/* Themes Grid */}
      {tab === "themes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allThemes.map((theme) => {
            const isUnlocked = unlockedThemes.includes(theme.id);
            const isActive = activeTheme.id === theme.id;

            return (
              <Card
                key={theme.id}
                className={`border shadow-sm transition-all duration-200 overflow-hidden ${
                  isActive ? "border-primary ring-2 ring-primary/20"
                    : isUnlocked ? "border-border hover:border-foreground/20 hover:shadow-md cursor-pointer"
                    : "border-border opacity-70"
                }`}
                onClick={() => isUnlocked && !isActive && setTheme(theme.id)}
              >
                <div className="h-14 relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: `hsl(${theme.colors.background})` }} />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 px-4">
                    <div className="w-7 h-7 rounded-full border-2 border-white/30 shadow-md" style={{ background: `hsl(${theme.colors.primary})` }} />
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 shadow" style={{ background: `hsl(${theme.colors.accent})` }} />
                    <div className="w-4 h-4 rounded-full border-2 border-white/10" style={{ background: `hsl(${theme.colors.foreground})` }} />
                  </div>
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <Lock className="w-4 h-4 text-white/70" />
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5">
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 gap-1">
                        <Check className="w-3 h-3" /> Active
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-xs font-semibold flex items-center gap-1.5">
                      <span>{theme.emoji}</span> {theme.name}
                    </h3>
                    {!isUnlocked && (
                      <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5">
                        <Sparkles className="w-2.5 h-2.5" /> Lvl {theme.unlockLevel}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{theme.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Animations Grid */}
      {tab === "animations" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allAnimations.map((anim) => {
            const isUnlocked = unlockedAnimations.includes(anim.id);
            const isActive = activeAnimation.id === anim.id;

            return (
              <Card
                key={anim.id}
                className={`border shadow-sm transition-all duration-200 ${
                  isActive ? "border-primary ring-2 ring-primary/20"
                    : isUnlocked ? "border-border hover:border-foreground/20 hover:shadow-md cursor-pointer"
                    : "border-border opacity-70"
                }`}
                onClick={() => isUnlocked && !isActive && setAnimation(anim.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    isActive ? "bg-primary/10 ring-2 ring-primary/20" : "bg-muted"
                  }`}>
                    {anim.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        {anim.name}
                        {isActive && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 gap-0.5 ml-1">
                            <Check className="w-3 h-3" /> Active
                          </Badge>
                        )}
                      </h3>
                      {!isUnlocked && (
                        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 shrink-0">
                          <Lock className="w-2.5 h-2.5" /> Lvl {anim.unlockLevel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{anim.description}</p>
                    {isUnlocked && !isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs h-7"
                        onClick={(e) => { e.stopPropagation(); setAnimation(anim.id); }}
                      >
                        Equip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Titles Grid */}
      {tab === "titles" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allTitles.map((title) => {
            const isUnlocked = unlockedTitles.includes(title.id);
            const isActive = activeTitle.id === title.id;

            return (
              <Card
                key={title.id}
                className={`border shadow-sm transition-all duration-200 ${
                  isActive ? "border-primary ring-2 ring-primary/20"
                    : isUnlocked ? "border-border hover:border-foreground/20 hover:shadow-md cursor-pointer"
                    : "border-border opacity-70"
                }`}
                onClick={() => isUnlocked && !isActive && setTitle(title.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                    isActive ? "bg-primary/10 ring-2 ring-primary/20" : "bg-muted"
                  }`}>
                    {title.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-sm font-bold flex items-center gap-1.5">
                        {title.name}
                        {isActive && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 gap-0.5 ml-1">
                            <Check className="w-3 h-3" /> Equipped
                          </Badge>
                        )}
                      </h3>
                      {!isUnlocked && (
                        <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 shrink-0">
                          <Lock className="w-2.5 h-2.5" /> Lvl {title.unlockLevel === 999 ? "???" : title.unlockLevel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{title.description}</p>
                    {isUnlocked && !isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs h-7"
                        onClick={(e) => { e.stopPropagation(); setTitle(title.id); }}
                      >
                        Equip
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
