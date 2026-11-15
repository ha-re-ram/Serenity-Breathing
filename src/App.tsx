import { useCallback, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import {
  Home,
  BarChart2,
  Bell,
  LogOut,
  User as UserIcon,
  Moon,
  Sun,
  Sparkles,
  Cloud,
  CheckCircle2,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import HomeScreen from './components/HomeScreen';
import SessionScreen from './components/SessionScreen';
import ProgressScreen from './components/ProgressScreen';
import AuthScreen from './components/AuthScreen';
import OnboardingModal from './components/OnboardingModal';
import {
  useAuthSyncMachine,
  useAppNavigationMachine,
  useDebouncedSync,
  evaluateHealthMetrics,
  calculateNextSessionStreak,
  toggleHabitCompletion,
  DEFAULT_GUEST_PROFILE,
} from './machines';

interface CustomCycleCardProps {
  initialConfig: { inhale: number; hold: number; exhale: number; holdPost: number };
  onSave: (config: { inhale: number; hold: number; exhale: number; holdPost: number }) => Promise<void>;
}

function CustomCycleCard({ initialConfig, onSave }: CustomCycleCardProps) {
  const { value, status, updateValue } = useDebouncedSync(initialConfig, {
    delayMs: 800,
    onSave,
    onSuccess: () => toast.success('Breathing cycle updated 🌿'),
    onError: (err) => handleFirestoreError(err, OperationType.UPDATE, 'users'),
  });

  const handleFieldChange = (field: 'inhale' | 'hold' | 'exhale' | 'holdPost', val: number) => {
    const clamped = Math.max(0, Math.min(30, val || 0));
    updateValue((prev) => ({ ...prev, [field]: clamped }));
  };

  const handleApplyPreset = (preset: { inhale: number; hold: number; exhale: number; holdPost: number }) => {
    updateValue(preset);
  };

  return (
    <Card className="border border-cream shadow-none bg-card rounded-[32px]">
      <CardContent className="p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-accent-green/80 uppercase tracking-[2px]">
            Custom Cycle
          </h3>
          <div className="text-[10px] font-bold tracking-wider">
            {status === 'debouncing' || status === 'saving' ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Saving...
              </span>
            ) : status === 'error' ? (
              <span className="text-rose-500 font-bold">Sync Error</span>
            ) : (
              <span className="text-soft-sage font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Box', inhale: 4, hold: 4, exhale: 4, holdPost: 4 },
            { label: '4-7-8', inhale: 4, hold: 7, exhale: 8, holdPost: 0 },
            { label: '5-5', inhale: 5, hold: 0, exhale: 5, holdPost: 0 },
          ].map((rec) => (
            <button
              key={rec.label}
              type="button"
              onClick={() => handleApplyPreset({ inhale: rec.inhale, hold: rec.hold, exhale: rec.exhale, holdPost: rec.holdPost })}
              className="px-3 py-1 rounded-full border border-cream/70 text-[10px] font-bold text-accent-green hover:bg-muted transition-colors"
            >
              {rec.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'inhale' as const, label: 'Inhale' },
            { key: 'hold' as const, label: 'Hold' },
            { key: 'exhale' as const, label: 'Exhale' },
            { key: 'holdPost' as const, label: 'Hold Post' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-[10px] font-bold text-accent-green/80 uppercase">{label}</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={value[key]}
                onChange={(e) => handleFieldChange(key, Number(e.target.value))}
                className="h-10 rounded-xl border-cream bg-bg-page/40"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-accent-green/75 italic">
          Recommended: 4-4-4-4 (Box), 4-7-8 (Sleep), 5-0-5-0 (Coherence)
        </p>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const { theme, setTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 1. Auth & Data Sync State Machine (supports Guest & Cloud Sync)
  const {
    state: authSyncState,
    isGuest,
    isInitializing,
    updateLocalProfile,
    recordGuestSession,
    dismissOnboarding,
    handleSignOut,
  } = useAuthSyncMachine({
    authInstance: auth,
    dbInstance: db,
    onError: (err) => handleFirestoreError(err, OperationType.GET, 'users'),
  });

  const { user, profile, sessions, showOnboarding } = authSyncState;

  // 2. Navigation & Modal Hierarchy State Machine
  const {
    activeTab,
    activeSession,
    selectedMood,
    selectedDuration,
    switchTab,
    startSession,
    dismissSession,
    selectMood,
    setDuration,
  } = useAppNavigationMachine();

  const handleUpdateName = useCallback(async (newName: string) => {
    if (!newName.trim()) return;
    updateLocalProfile((prev) => (prev ? { ...prev, displayName: newName } : prev));

    if (user && db) {
      try {
        await updateProfile(user, { displayName: newName });
        await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
        toast.success('Name updated!');
      } catch {
        toast.error('Failed to update name in cloud');
      }
    } else {
      toast.success('Name saved locally 🌿');
    }
  }, [user, updateLocalProfile]);

  const handleUpdateHealthDetails = useCallback(async (field: string, value: string) => {
    const updatedHealth = { ...(profile?.healthDetails || {}), [field]: value };
    updateLocalProfile((prev) => (prev ? { ...prev, healthDetails: updatedHealth } : prev));

    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { healthDetails: updatedHealth });
        toast.success('Health details updated in cloud');
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'users');
      }
    }
  }, [user, profile, updateLocalProfile]);

  const handleSaveCustomBreathing = useCallback(async (config: {
    inhale: number;
    hold: number;
    exhale: number;
    holdPost: number;
  }) => {
    updateLocalProfile((prev) => (prev ? { ...prev, customBreathingConfig: config } : prev));
    if (user && db) {
      await updateDoc(doc(db, 'users', user.uid), { customBreathingConfig: config });
    }
  }, [user, updateLocalProfile]);

  const handleAddHabit = useCallback(async (name: string) => {
    const newHabit = {
      id: crypto.randomUUID(),
      name,
      streak: 0,
      createdAt: new Date().toISOString(),
    };
    const nextHabits = [...(profile?.habits || []), newHabit];
    updateLocalProfile((prev) => (prev ? { ...prev, habits: nextHabits } : prev));

    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { habits: nextHabits });
        toast.success('Habit added & synced!');
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'users');
      }
    } else {
      toast.success('Habit added locally!');
    }
  }, [user, profile, updateLocalProfile]);

  const handleToggleHabit = useCallback(async (habitId: string) => {
    const now = new Date();
    const updatedHabits = (profile?.habits || []).map((h) => {
      if (h.id !== habitId) return h;
      return toggleHabitCompletion(h, now);
    });
    updateLocalProfile((prev) => (prev ? { ...prev, habits: updatedHabits } : prev));

    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { habits: updatedHabits });
        toast.success('Habit updated!');
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'users');
      }
    } else {
      toast.success('Habit completed! 🌿');
    }
  }, [user, profile, updateLocalProfile]);

  const handleDeleteHabit = useCallback(async (habitId: string) => {
    const updatedHabits = (profile?.habits || []).filter((h) => h.id !== habitId);
    updateLocalProfile((prev) => (prev ? { ...prev, habits: updatedHabits } : prev));

    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { habits: updatedHabits });
        toast.success('Habit removed');
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'users');
      }
    } else {
      toast.success('Habit removed');
    }
  }, [user, profile, updateLocalProfile]);

  const handleOnboardingComplete = useCallback(async (data: {
    reminderTime: string;
    customBreathing: { inhale: number; hold: number; exhale: number; holdPost: number };
  }) => {
    dismissOnboarding();
    updateLocalProfile((prev) =>
      prev
        ? {
            ...prev,
            reminderTime: data.reminderTime,
            customBreathingConfig: data.customBreathing,
            onboardingCompleted: true,
          }
        : prev
    );

    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          reminderTime: data.reminderTime,
          customBreathingConfig: data.customBreathing,
          onboardingCompleted: true,
        });
        toast.success('Preferences saved to cloud! Welcome to Serenity 🌿');
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'users');
      }
    } else {
      toast.success('Preferences saved locally! Welcome to Serenity 🌿');
    }
  }, [user, dismissOnboarding, updateLocalProfile]);

  const endSession = useCallback(async (duration: number, moodAfter?: string) => {
    if (!activeSession) return;
    dismissSession();

    const now = new Date();
    const sessionData = {
      uid: user?.uid || 'guest',
      mode: activeSession,
      duration,
      timestamp: now.toISOString(),
      ...(selectedMood ? { moodBefore: selectedMood } : {}),
      ...(moodAfter ? { moodAfter } : {}),
    };

    const streakUpdate = calculateNextSessionStreak(
      profile?.currentStreak || 0,
      profile?.lastSessionDate,
      now
    );

    const updatedProfile = {
      ...(profile || DEFAULT_GUEST_PROFILE),
      totalSessions: (profile?.totalSessions || 0) + 1,
      currentStreak: streakUpdate.newStreak,
      lastSessionDate: now.toISOString(),
    };

    updateLocalProfile(() => updatedProfile);

    if (user && db) {
      try {
        await addDoc(collection(db, 'sessions'), sessionData);
        await updateDoc(doc(db, 'users', user.uid), {
          totalSessions: updatedProfile.totalSessions,
          currentStreak: updatedProfile.currentStreak,
          lastSessionDate: updatedProfile.lastSessionDate,
        });
        toast.success('Session completed & backed up to cloud! 🌿');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'sessions');
        toast.error('Could not sync to cloud, saved locally on device.');
      }
    } else {
      recordGuestSession({
        id: crypto.randomUUID(),
        ...sessionData,
      });
      toast.success('Session completed! Well done. 🌿');
    }
  }, [user, activeSession, profile, selectedMood, dismissSession, updateLocalProfile, recordGuestSession]);

  const healthMetric = evaluateHealthMetrics(profile?.healthDetails);

  // Initial Boot Splash (only on first render before profile is ready)
  if (isInitializing && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg-page gap-4">
        <div className="w-12 h-12 bg-accent-green rounded-2xl flex items-center justify-center shadow-lg shadow-accent-green/10">
          <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
        </div>
        <p className="text-xs font-bold text-accent-green uppercase tracking-widest opacity-60">
          Serenity Breathing
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page font-sans text-deep-forest relative overflow-x-hidden">
      <Toaster position="top-center" richColors />

      <div className="flex flex-col lg:flex-row max-w-6xl mx-auto min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 p-8 border-r border-cream sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-accent-green rounded-2xl flex items-center justify-center shadow-lg shadow-accent-green/20">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-serif text-deep-forest leading-none">Serenity</h1>
              <span className="text-[9px] font-bold text-accent-green opacity-60 uppercase tracking-widest">
                Breathwork
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {[
              { id: 'home' as const, label: 'Home', icon: Home },
              { id: 'progress' as const, label: 'Progress', icon: BarChart2 },
              { id: 'settings' as const, label: 'Profile', icon: UserIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  activeTab === id
                    ? 'bg-card text-deep-forest dark:text-soft-sage shadow-sm font-bold border border-cream/70'
                    : 'text-deep-forest/60 hover:text-deep-forest hover:bg-black/5 dark:text-deep-forest/60 dark:hover:text-deep-forest dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-bold uppercase tracking-[1px] text-xs">{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            {user ? (
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="w-full justify-start text-deep-forest/60 hover:text-rose-500 hover:bg-rose-500/10 dark:text-deep-forest/60 dark:hover:text-rose-400 rounded-2xl p-4 h-auto"
              >
                <LogOut className="w-5 h-5 mr-4" />
                <span className="font-bold uppercase tracking-[1px] text-xs">Sign Out</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAuthModal(true)}
                className="w-full justify-start border-cream text-accent-green hover:bg-card rounded-2xl p-4 h-auto shadow-sm"
              >
                <LogIn className="w-5 h-5 mr-3 text-accent-green" />
                <span className="font-bold uppercase tracking-[1px] text-xs">Sign In (Sync)</span>
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-12 pb-[max(7rem,calc(6rem+env(safe-area-inset-bottom)))] lg:pb-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <div className="max-w-2xl mx-auto">
                <HomeScreen
                  userProfile={profile}
                  onStart={startSession}
                  onMoodSelect={selectMood}
                  selectedMood={selectedMood}
                  onDurationChange={setDuration}
                  selectedDuration={selectedDuration}
                />
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="max-w-2xl mx-auto">
                <ProgressScreen
                  userProfile={profile}
                  sessions={sessions}
                  onAddHabit={handleAddHabit}
                  onToggleHabit={handleToggleHabit}
                  onDeleteHabit={handleDeleteHabit}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto flex flex-col gap-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-light text-deep-forest">Profile</h1>
                    <p className="text-xs text-accent-green/80 font-bold uppercase tracking-widest mt-1">
                      Account & Preferences
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-cream/70 bg-card">
                    {user ? (
                      <>
                        <Cloud className="w-3.5 h-3.5 text-soft-sage" />
                        <span className="text-soft-sage">Cloud Synced</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-accent-green" />
                        <span className="text-accent-green/90">Guest (Local)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Cloud Sync Status / Sign-in Banner for Guests */}
                {!user && (
                  <Card className="border border-soft-sage/40 bg-soft-sage/5 shadow-none rounded-[32px] overflow-hidden">
                    <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-soft-sage/20 text-accent-green flex items-center justify-center flex-shrink-0">
                          <Cloud className="w-6 h-6 text-accent-green" />
                        </div>
                        <div>
                          <h3 className="font-bold text-deep-forest text-base">Cloud Backup & Device Sync</h3>
                          <p className="text-xs text-accent-green/80 max-w-sm mt-0.5 leading-relaxed">
                            Your streaks and sessions are safe on this browser. Create a free account or sign in anytime to sync across mobile and desktop.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowAuthModal(true)}
                        className="rounded-full bg-accent-green hover:bg-deep-forest text-white dark:text-zinc-950 px-6 font-bold text-xs uppercase tracking-wider h-11 w-full sm:w-auto flex-shrink-0"
                      >
                        Sign In / Register
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Profile Card */}
                <Card className="border border-cream shadow-none bg-card rounded-[32px] overflow-hidden">
                  <CardContent className="p-8 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-[40px] bg-bg-page flex items-center justify-center border-2 border-cream relative group">
                        <UserIcon className="w-10 h-10 text-soft-sage" />
                        <div className="absolute inset-0 bg-accent-green/10 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Sparkles className="w-6 h-6 text-accent-green" />
                        </div>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <input
                          key={`name-${user?.displayName || profile?.displayName || 'guest'}`}
                          type="text"
                          defaultValue={user?.displayName || profile?.displayName || 'Mindful Friend'}
                          onBlur={(e) => handleUpdateName(e.target.value)}
                          className="text-2xl font-bold text-deep-forest bg-transparent border-none focus:ring-0 p-0 w-full sm:w-auto outline-none"
                          placeholder="Your Name"
                        />
                        <p className="text-sm text-accent-green/80">
                          {user?.email || 'Practicing as Guest (Offline Sanctuary)'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-cream/50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-accent-green/80 uppercase tracking-[2px]">
                          Health Details
                        </h3>
                        {healthMetric && (
                          <div className="flex items-center gap-2 bg-muted/60 px-3 py-1 rounded-full border border-cream/50">
                            <span className="text-[10px] font-bold text-accent-green/70 uppercase tracking-widest">
                              BMI
                            </span>
                            <span className={`text-sm font-bold ${healthMetric.color}`}>
                              {healthMetric.formattedBmi}
                            </span>
                            <span className="text-[10px] text-accent-green/60">•</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${healthMetric.color}`}>
                              {healthMetric.status}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { key: 'age', label: 'Age' },
                          { key: 'gender', label: 'Gender' },
                          { key: 'weight', label: 'Weight (kg)' },
                          { key: 'height', label: 'Height (cm)' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-[10px] font-bold text-accent-green/80 uppercase">{label}</Label>
                            <Input
                              key={`${key}-${(profile?.healthDetails as any)?.[key] || ''}`}
                              placeholder="--"
                              defaultValue={(profile?.healthDetails as any)?.[key] || ''}
                              onBlur={(e) => handleUpdateHealthDetails(key, e.target.value)}
                              className="h-10 rounded-xl border-cream bg-bg-page/40"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {user && (
                      <div className="pt-6 border-t border-cream/50">
                        <Button
                          variant="outline"
                          onClick={handleSignOut}
                          className="w-full border-cream text-accent-green hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 rounded-2xl h-12"
                        >
                          <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Preferences */}
                  <Card className="border border-cream shadow-none bg-card rounded-[32px]">
                    <CardContent className="p-6 flex flex-col gap-6">
                      <h3 className="text-xs font-bold text-accent-green/80 uppercase tracking-[2px]">
                        Preferences
                      </h3>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                            {theme === 'dark' ? (
                              <Moon className="w-5 h-5 text-soft-sage" />
                            ) : (
                              <Sun className="w-5 h-5 text-soft-sage" />
                            )}
                          </div>
                          <span className="font-medium text-deep-forest">Dark Mode</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className={`rounded-full px-4 font-bold ${
                            theme === 'dark' ? 'bg-accent-green text-white dark:text-zinc-950' : 'bg-muted text-accent-green'
                          }`}
                        >
                          {theme === 'dark' ? 'On' : 'Off'}
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-bg-page flex items-center justify-center">
                            <Bell className="w-5 h-5 text-soft-sage" />
                          </div>
                          <span className="font-medium text-deep-forest">Daily Reminder</span>
                        </div>
                        <Input
                          key={`reminder-${profile?.reminderTime || '08:00'}`}
                          type="time"
                          defaultValue={profile?.reminderTime || '08:00'}
                          onBlur={async (e) => {
                            const val = e.target.value;
                            updateLocalProfile((prev) => (prev ? { ...prev, reminderTime: val } : prev));
                            if (user && db) {
                              try {
                                await updateDoc(doc(db, 'users', user.uid), { reminderTime: val });
                                toast.success(`Reminder set for ${val}`);
                              } catch (err) {
                                handleFirestoreError(err, OperationType.UPDATE, 'users');
                              }
                            } else {
                              toast.success(`Reminder saved locally for ${val}`);
                            }
                          }}
                          className="w-32 h-10 rounded-xl border-cream bg-bg-page/30 font-bold text-accent-green"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Custom Breathing Cycle with Debounced Persistence */}
                  <CustomCycleCard
                    initialConfig={
                      profile?.customBreathingConfig || { inhale: 4, hold: 4, exhale: 4, holdPost: 4 }
                    }
                    onSave={handleSaveCustomBreathing}
                  />

                  {/* App Info & Scientific Breathwork Reference */}
                  <Card className="border border-cream shadow-none bg-card rounded-[32px] overflow-hidden sm:col-span-2">
                    <CardContent className="p-8 flex flex-col gap-8">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-accent-green/80 uppercase tracking-[3px]">
                          App Information
                        </h3>
                        <div className="h-px flex-1 bg-cream/40 ml-4" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                        {[
                          {
                            label: 'Developer',
                            content: (
                              <a
                                href="https://hareramkushwaha.com.np/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xl font-serif text-deep-forest hover:text-accent-green transition-colors leading-tight"
                              >
                                Hareram Kushwaha
                              </a>
                            ),
                          },
                          {
                            label: 'Contact',
                            content: (
                              <a
                                href="mailto:hareramkushwaha054@gmail.com"
                                className="text-sm font-medium text-deep-forest hover:text-accent-green transition-colors break-all"
                              >
                                hareramkushwaha054@gmail.com
                              </a>
                            ),
                          },
                          {
                            label: 'GitHub',
                            content: (
                              <a
                                href="https://github.com/ha-re-ram"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-deep-forest hover:text-accent-green transition-colors"
                              >
                                @ha-re-ram
                              </a>
                            ),
                          },
                          {
                            label: 'License',
                            content: <span className="text-sm font-medium text-deep-forest">MIT License (Open Source)</span>,
                          },
                          {
                            label: 'Sound Engine',
                            content: <span className="text-sm font-medium text-deep-forest">Web Audio API (432Hz & Voice)</span>,
                          },
                          {
                            label: 'Version',
                            content: <span className="text-sm font-bold text-deep-forest">1.3.1 Professional</span>,
                          },
                        ].map(({ label, content }) => (
                          <div key={label} className="flex flex-col gap-2 group">
                            <span className="text-[10px] font-bold text-accent-green/70 uppercase tracking-wider group-hover:text-accent-green transition-colors">
                              {label}
                            </span>
                            {content}
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-cream/50">
                        <p className="text-xs text-accent-green/80 leading-relaxed font-light italic">
                          "Breathing is the bridge which connects life to consciousness, which unites your body to your
                          thoughts."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-bg-page/95 dark:bg-card/95 backdrop-blur-lg border-t border-cream/50 px-6 sm:px-8 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] flex justify-between items-center z-40">
        {[
          { id: 'home' as const, label: 'Home', icon: Home },
          { id: 'progress' as const, label: 'Stats', icon: BarChart2 },
          { id: 'settings' as const, label: 'Profile', icon: UserIcon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === id
                ? 'text-accent-green dark:text-soft-sage scale-110 font-bold'
                : 'text-deep-forest/60 hover:text-deep-forest dark:text-deep-forest/60 dark:hover:text-deep-forest'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-[1px]">{label}</span>
          </button>
        ))}
      </nav>

      {/* Active Session Overlay */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-bg-page"
          >
            <SessionScreen
              mode={activeSession}
              customConfig={profile?.customBreathingConfig}
              targetDurationMinutes={selectedDuration}
              onEnd={endSession}
              onCancel={dismissSession}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
      </AnimatePresence>

      {/* Cloud Account Sign-in Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] bg-deep-forest/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md my-auto"
            >
              <AuthScreen
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => setShowAuthModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
