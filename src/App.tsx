import { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from 'next-themes';
import {
  Home, BarChart2, Bell, LogOut, User as UserIcon, Moon, Sun, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { BreathingMode, UserProfile, SessionRecord } from './types';
import HomeScreen from './components/HomeScreen';
import SessionScreen from './components/SessionScreen';
import ProgressScreen from './components/ProgressScreen';
import AuthScreen from './components/AuthScreen';
import OnboardingModal from './components/OnboardingModal';
import { isSameDay, subDays } from 'date-fns';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'progress' | 'settings'>('home');
  const [activeSession, setActiveSession] = useState<BreathingMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | undefined>();
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { theme, setTheme } = useTheme();

  // Debounce ref for custom breathing config changes
  const breathingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth Listener — reduced safety timeout to 3s
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setSessions([]);
        setLoading(false);
      }
    });

    // Safety fallback if Firebase doesn't respond in 3s
    const timer = setTimeout(() => setLoading(false), 3000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Profile and Sessions Listener
  useEffect(() => {
    if (!user || !db) return;

    const profileRef = doc(db, 'users', user.uid);
    const sessionsQuery = query(collection(db, 'sessions'), where('uid', '==', user.uid));

    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        setShowOnboarding(!data.onboardingCompleted);
        setLoading(false);
      } else {
        // Create initial profile for new users
        const initialProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || '',
          totalSessions: 0,
          currentStreak: 0,
          lastSessionDate: new Date().toISOString(),
        };
        setDoc(profileRef, initialProfile)
          .catch(e => handleFirestoreError(e, OperationType.WRITE, 'users'))
          .finally(() => setLoading(false));
      }
    }, (e) => {
      console.error('Profile Snapshot Error:', e);
      toast.error('Failed to load profile. Check your connection.');
      setLoading(false);
      handleFirestoreError(e, OperationType.GET, 'users');
    });

    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionRecord));
      setSessions(docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, (e) => {
      console.error('Sessions Snapshot Error:', e);
      handleFirestoreError(e, OperationType.GET, 'sessions');
    });

    return () => {
      unsubProfile();
      unsubSessions();
    };
  }, [user]);

  const handleLogin = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Welcome back!');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        toast.info('Login cancelled.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked! Allow popups for this site to sign in with Google.');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized for Google Sign-In.');
      } else {
        toast.error('Login failed: ' + error.message);
      }
    }
  }, []);

  const handleLogout = useCallback(() => auth.signOut(), []);

  const handleUpdateName = useCallback(async (newName: string) => {
    if (!user || !newName.trim()) return;
    try {
      await updateProfile(user, { displayName: newName });
      await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
      toast.success('Name updated!');
    } catch (e) {
      toast.error('Failed to update name');
    }
  }, [user]);

  const handleUpdateHealthDetails = useCallback(async (field: string, value: string) => {
    if (!user || !profile) return;
    try {
      const updatedHealth = { ...(profile.healthDetails || {}), [field]: value };
      await updateDoc(doc(db, 'users', user.uid), { healthDetails: updatedHealth });
      toast.success('Health details updated');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  }, [user, profile]);

  // Debounced custom breathing update — prevents a Firestore write on every keystroke
  const handleUpdateCustomBreathing = useCallback((field: string, value: number) => {
    if (!user || !profile) return;
    const currentConfig = profile.customBreathingConfig || { inhale: 4, hold: 4, exhale: 4, holdPost: 4 };
    const updatedConfig = { ...currentConfig, [field]: value };

    // Optimistically update local profile so sliders feel instant
    setProfile(prev => prev ? { ...prev, customBreathingConfig: updatedConfig } : prev);

    if (breathingDebounceRef.current) clearTimeout(breathingDebounceRef.current);
    breathingDebounceRef.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', user.uid), { customBreathingConfig: updatedConfig });
        toast.success('Breathing cycle updated');
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'users');
      }
    }, 800);
  }, [user, profile]);

  const handleUpdateFullBreathingConfig = useCallback(async (config: { inhale: number; hold: number; exhale: number; holdPost: number }) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { customBreathingConfig: config });
      toast.success('Breathing cycle updated');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  }, [user]);

  const handleAddHabit = useCallback(async (name: string) => {
    if (!user || !profile) return;
    const newHabit = {
      id: crypto.randomUUID(),
      name,
      streak: 0,
      createdAt: new Date().toISOString()
    };
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        habits: [...(profile.habits || []), newHabit]
      });
      toast.success('Habit added!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  }, [user, profile]);

  const handleToggleHabit = useCallback(async (habitId: string) => {
    if (!user || !profile?.habits) return;
    const now = new Date();
    const updatedHabits = profile.habits.map(h => {
      if (h.id !== habitId) return h;
      const lastDate = h.lastCompletedDate ? new Date(h.lastCompletedDate) : null;
      if (lastDate && isSameDay(lastDate, now)) return h; // Already done today

      const newStreak = (lastDate && isSameDay(lastDate, subDays(now, 1))) ? h.streak + 1 : 1;
      return { ...h, streak: newStreak, lastCompletedDate: now.toISOString() };
    });
    try {
      await updateDoc(doc(db, 'users', user.uid), { habits: updatedHabits });
      toast.success('Habit updated!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  }, [user, profile]);

  const handleDeleteHabit = useCallback(async (habitId: string) => {
    if (!user || !profile?.habits) return;
    const updatedHabits = profile.habits.filter(h => h.id !== habitId);
    try {
      await updateDoc(doc(db, 'users', user.uid), { habits: updatedHabits });
      toast.success('Habit removed');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  }, [user, profile]);

  const handleOnboardingComplete = useCallback(async (data: { reminderTime: string; customBreathing: { inhale: number; hold: number; exhale: number; holdPost: number } }) => {
    if (!user) return;
    setShowOnboarding(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        reminderTime: data.reminderTime,
        customBreathingConfig: data.customBreathing,
        onboardingCompleted: true
      });
      toast.success('Preferences saved! Welcome to Serenity 🌿');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  }, [user]);

  const calculateBMI = useCallback(() => {
    const weight = parseFloat(profile?.healthDetails?.weight || '0');
    const height = parseFloat(profile?.healthDetails?.height || '0');
    if (weight > 0 && height > 0) {
      const bmi = weight / ((height / 100) ** 2);
      let status = '';
      let color = '';
      if (bmi < 18.5) { status = 'Nourishment Needed'; color = 'text-blue-500'; }
      else if (bmi < 25) { status = 'Pure Serenity'; color = 'text-soft-sage'; }
      else if (bmi < 30) { status = 'Self-care Goal'; color = 'text-amber-500'; }
      else { status = 'Health Priority'; color = 'text-rose-500'; }

      return {
        value: bmi.toFixed(1),
        status,
        color
      };
    }
    return null;
  }, [profile?.healthDetails]);

  const startSession = useCallback((mode: BreathingMode) => {
    setActiveSession(mode);
  }, []);

  const endSession = useCallback(async (duration: number, moodAfter?: string) => {
    if (!user || !activeSession) return;
    setActiveSession(null);

    const now = new Date();
    const sessionData: any = {
      uid: user.uid,
      mode: activeSession,
      duration,
      timestamp: now.toISOString(),
    };
    if (selectedMood) sessionData.moodBefore = selectedMood;
    if (moodAfter) sessionData.moodAfter = moodAfter;

    try {
      await addDoc(collection(db, 'sessions'), sessionData);

      if (profile) {
        const lastDate = profile.lastSessionDate ? new Date(profile.lastSessionDate) : null;
        let newStreak = profile.currentStreak;
        if (!lastDate || !isSameDay(lastDate, now)) {
          newStreak = (lastDate && isSameDay(lastDate, subDays(now, 1))) ? newStreak + 1 : 1;
        }

        await updateDoc(doc(db, 'users', user.uid), {
          totalSessions: profile.totalSessions + 1,
          currentStreak: newStreak,
          lastSessionDate: now.toISOString(),
        });
      }

      toast.success('Session completed! Well done. 🌿');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sessions');
      toast.error('Could not save session. Check your connection.');
    }
  }, [user, activeSession, profile, selectedMood]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg-page gap-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-soft-sage rounded-full blur-xl"
        />
        <p className="text-xs font-bold text-accent-green uppercase tracking-widest animate-pulse">Loading Serenity...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <AuthScreen onGoogleLogin={handleLogin} />
      </>
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
            <h1 className="text-2xl font-serif text-deep-forest">Serenity</h1>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'progress', label: 'Progress', icon: BarChart2 },
              { id: 'settings', label: 'Profile', icon: UserIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === id ? 'bg-white text-accent-green shadow-sm' : 'text-cream hover:bg-white/50'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-bold uppercase tracking-[1px] text-xs">{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-cream hover:text-rose-500 hover:bg-rose-50 rounded-2xl p-4 h-auto">
              <LogOut className="w-5 h-5 mr-4" />
              <span className="font-bold uppercase tracking-[1px] text-xs">Sign Out</span>
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 lg:p-12 pb-24 lg:pb-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <HomeScreen
                  userProfile={profile}
                  onStart={startSession}
                  onMoodSelect={setSelectedMood}
                  selectedMood={selectedMood}
                  onDurationChange={setSelectedDuration}
                  selectedDuration={selectedDuration}
                />
              </motion.div>
            )}
            {activeTab === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto"
              >
                <ProgressScreen
                  userProfile={profile}
                  sessions={sessions}
                  onAddHabit={handleAddHabit}
                  onToggleHabit={handleToggleHabit}
                  onDeleteHabit={handleDeleteHabit}
                />
              </motion.div>
            )}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto flex flex-col gap-8"
              >
                <div className="flex justify-between items-end">
                  <h1 className="text-4xl font-light text-deep-forest">Profile</h1>
                  <p className="text-xs text-accent-green opacity-50 font-bold uppercase tracking-widest">Settings & Account</p>
                </div>

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
                          type="text"
                          defaultValue={user.displayName || ''}
                          onBlur={(e) => handleUpdateName(e.target.value)}
                          className="text-2xl font-bold text-deep-forest bg-transparent border-none focus:ring-0 p-0 w-full sm:w-auto outline-none"
                          placeholder="Your Name"
                        />
                        <p className="text-sm text-accent-green opacity-60">{user.email}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-cream/50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-accent-green uppercase tracking-[2px] opacity-50">Health Details</h3>
                        {calculateBMI() && (
                          <div className="flex items-center gap-2 bg-bg-page/50 px-3 py-1 rounded-full border border-cream/30">
                            <span className="text-[10px] font-bold text-accent-green opacity-40 uppercase tracking-widest">BMI</span>
                            <span className={`text-sm font-bold ${calculateBMI()?.color}`}>{calculateBMI()?.value}</span>
                            <span className="text-[10px] text-accent-green opacity-60">•</span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${calculateBMI()?.color}`}>{calculateBMI()?.status}</span>
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
                            <Label className="text-[10px] uppercase opacity-50">{label}</Label>
                            <Input
                              placeholder="--"
                              defaultValue={(profile?.healthDetails as any)?.[key] || ''}
                              onBlur={(e) => handleUpdateHealthDetails(key, e.target.value)}
                              className="h-10 rounded-xl border-cream bg-bg-page/30"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-cream/50">
                      <Button variant="outline" onClick={handleLogout} className="w-full border-cream text-accent-green hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 rounded-2xl h-12">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Preferences */}
                  <Card className="border border-cream shadow-none bg-card rounded-[32px]">
                    <CardContent className="p-6 flex flex-col gap-6">
                      <h3 className="text-xs font-bold text-accent-green uppercase tracking-[2px] opacity-50">Preferences</h3>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-bg-page flex items-center justify-center">
                            {theme === 'dark' ? <Moon className="w-5 h-5 text-soft-sage" /> : <Sun className="w-5 h-5 text-soft-sage" />}
                          </div>
                          <span className="font-medium text-deep-forest">Dark Mode</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          className={`rounded-full px-4 ${theme === 'dark' ? 'bg-accent-green text-white' : 'bg-cream/20 text-accent-green'}`}
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
                          type="time"
                          defaultValue={profile?.reminderTime || '08:00'}
                          onBlur={async (e) => {
                            if (!user) return;
                            try {
                              await updateDoc(doc(db, 'users', user.uid), { reminderTime: e.target.value });
                              toast.success(`Reminder set for ${e.target.value}`);
                            } catch (err) {
                              handleFirestoreError(err, OperationType.UPDATE, 'users');
                            }
                          }}
                          className="w-32 h-10 rounded-xl border-cream bg-bg-page/30 font-bold text-accent-green"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Custom Breathing Cycle */}
                  <Card className="border border-cream shadow-none bg-card rounded-[32px]">
                    <CardContent className="p-6 flex flex-col gap-6">
                      <h3 className="text-xs font-bold text-accent-green uppercase tracking-[2px] opacity-50">Custom Cycle</h3>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'Box', inhale: 4, hold: 4, exhale: 4, holdPost: 4 },
                          { label: '4-7-8', inhale: 4, hold: 7, exhale: 8, holdPost: 0 },
                          { label: '5-5', inhale: 5, hold: 0, exhale: 5, holdPost: 0 },
                        ].map((rec) => (
                          <button
                            key={rec.label}
                            onClick={() => handleUpdateFullBreathingConfig({ inhale: rec.inhale, hold: rec.hold, exhale: rec.exhale, holdPost: rec.holdPost })}
                            className="px-3 py-1 rounded-full border border-cream text-[10px] font-bold text-accent-green hover:bg-bg-page transition-colors"
                          >
                            {rec.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'inhale', label: 'Inhale' },
                          { key: 'hold', label: 'Hold' },
                          { key: 'exhale', label: 'Exhale' },
                          { key: 'holdPost', label: 'Hold Post' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-[10px] uppercase opacity-50">{label}</Label>
                            <Input
                              type="number"
                              min={0}
                              max={30}
                              value={(profile?.customBreathingConfig as any)?.[key] ?? 4}
                              onChange={(e) => handleUpdateCustomBreathing(key, Number(e.target.value))}
                              className="h-10 rounded-xl border-cream bg-bg-page/30"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-accent-green opacity-40 italic">
                        Recommended: 4-4-4-4 (Box), 4-7-8 (Sleep), 5-0-5-0 (Coherence)
                      </p>
                    </CardContent>
                  </Card>

                  {/* App Info */}
                  <Card className="border border-cream shadow-none bg-card rounded-[32px] overflow-hidden sm:col-span-2">
                    <CardContent className="p-8 flex flex-col gap-8">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-accent-green uppercase tracking-[3px] opacity-50">App Information</h3>
                        <div className="h-px flex-1 bg-cream/30 ml-4" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                        {[
                          { label: 'Developer', content: <a href="https://hareramkushwaha.com.np/" target="_blank" rel="noopener noreferrer" className="text-xl font-serif text-deep-forest hover:text-accent-green transition-colors leading-tight">Hareram Kushwaha</a> },
                          { label: 'Contact', content: <a href="mailto:hareramkushwaha054@gmail.com" className="text-sm font-medium text-deep-forest hover:text-accent-green transition-colors break-all">hareramkushwaha054@gmail.com</a> },
                          { label: 'GitHub', content: <a href="https://github.com/ha-re-ram" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-deep-forest hover:text-accent-green transition-colors">@ha-re-ram</a> },
                          { label: 'License', content: <span className="text-sm font-medium text-deep-forest">MIT License</span> },
                          { label: 'Built With', content: <span className="text-sm font-medium text-deep-forest">React, Tailwind, Firebase</span> },
                          { label: 'Version', content: <span className="text-sm font-bold text-deep-forest">1.1.0 Stable</span> },
                        ].map(({ label, content }) => (
                          <div key={label} className="flex flex-col gap-2 group">
                            <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-opacity">{label}</span>
                            {content}
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-cream/50">
                        <p className="text-xs text-accent-green opacity-60 leading-relaxed font-light italic">
                          "Breathing is the bridge which connects life to consciousness, which unites your body to your thoughts."
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-cream px-8 py-4 flex justify-between items-center z-40">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'progress', label: 'Stats', icon: BarChart2 },
          { id: 'settings', label: 'Profile', icon: UserIcon },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === id ? 'text-accent-green scale-110' : 'text-cream'}`}
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
              onEnd={endSession}
              onCancel={() => setActiveSession(null)}
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
    </div>
  );
}
