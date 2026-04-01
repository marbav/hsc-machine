import { useState, useCallback } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import PracticePage from "@/pages/practice";
import AnalyticsPage from "@/pages/analytics";
import FlaggedPage from "@/pages/flagged";
import ThemesPage from "@/pages/themes";
import MockExamPage from "@/pages/mock-exam";
import AppLayout from "@/components/AppLayout";
import SplashScreen from "@/components/SplashScreen";
import UpdateBanner from "@/components/UpdateBanner";
import AchievementToast from "@/components/AchievementToast";
import LevelUpCelebration from "@/components/LevelUpCelebration";
import { GameProvider } from "@/lib/gameState";
import { useButtonSheen } from "@/hooks/use-sheen";

function AppRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={PracticePage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/flagged" component={FlaggedPage} />
        <Route path="/themes" component={ThemesPage} />
        <Route path="/mock-exam" component={MockExamPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showUpdate, setShowUpdate] = useState(false);
  useButtonSheen();

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    // Show update banner after splash
    setShowUpdate(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GameProvider>
          <Toaster />
          <AchievementToast />
          <LevelUpCelebration />
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
          {showUpdate && <UpdateBanner onDismiss={() => setShowUpdate(false)} />}
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </GameProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
