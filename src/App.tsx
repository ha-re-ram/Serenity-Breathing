import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
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
import { Home, BarChart2, Bell, LogOut, User as UserIcon, Moon, Sun, Mail, Lock, UserPlus, LogIn, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setSessions([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Profile and Sessions Listener
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    const sessionsQuery = query(collection(db, 'sessions'), where('uid', '==', user.uid));

    const unsubProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(data);
        // Show onboarding if not completed
        if (!data.onboardingCompleted) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
        setLoading(false);
      } else {
        // Create initial profile
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
    }, (e) => handleFirestoreError(e, OperationType.GET, 'users'));

    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SessionRecord));
      setSessions(docs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }, (e) => handleFirestoreError(e, OperationType.GET, 'sessions'));

    return () => {
      unsubProfile();
      unsubSessions();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error("Login Error:", error.message || error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Login cancelled. Please keep the popup open to sign in.');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized. Please open the app in a new tab using the button in the top right.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked! Please allow popups for this site to sign in with Google.');
      } else {
        toast.error('Failed to login: ' + error.message);
      }
    }
  };

  const handleLogout = () => auth.signOut();

  const handleUpdateName = async (newName: string) => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: newName });
      await updateDoc(doc(db, 'users', user.uid), { displayName: newName });
      toast.success('Name updated!');
    } catch (e) {
      toast.error('Failed to update name');
    }
  };

  const handleUpdateHealthDetails = async (field: string, value: string) => {
    if (!user || !profile) return;
    try {
      const updatedHealth = {
        ...(profile.healthDetails || {}),
        [field]: value
      };
      await updateDoc(doc(db, 'users', user.uid), { healthDetails: updatedHealth });
      toast.success('Health details updated');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  const handleUpdateCustomBreathing = async (field: string, value: number) => {
    if (!user || !profile) return;
    try {
      const currentConfig = profile.customBreathingConfig || { inhale: 4, hold: 4, exhale: 4, holdPost: 4 };
      const updatedConfig = {
        ...currentConfig,
        [field]: value
      };
      await updateDoc(doc(db, 'users', user.uid), { customBreathingConfig: updatedConfig });
      toast.success('Breathing cycle updated');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  const handleUpdateFullBreathingConfig = async (config: { inhale: number; hold: number; exhale: number; holdPost: number }) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { customBreathingConfig: config });
      toast.success('Breathing cycle updated');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  const handleAddHabit = async (name: string) => {
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
  };

  const handleToggleHabit = async (habitId: string) => {
    if (!user || !profile || !profile.habits) return;
    const now = new Date();
    const updatedHabits = profile.habits.map(h => {
      if (h.id === habitId) {
        const lastDate = h.lastCompletedDate ? new Date(h.lastCompletedDate) : null;
        
        // If already completed today, do nothing or toggle off (for simplicity we just allow one completion per day)
        if (lastDate && isSameDay(lastDate, now)) {
          return h;
        }

        let newStreak = h.streak;
        if (lastDate && isSameDay(lastDate, subDays(now, 1))) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }

        return { ...h, streak: newStreak, lastCompletedDate: now.toISOString() };
      }
      return h;
    });

    try {
      await updateDoc(doc(db, 'users', user.uid), { habits: updatedHabits });
      toast.success('Habit updated!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user || !profile || !profile.habits) return;
    const updatedHabits = profile.habits.filter(h => h.id !== habitId);
    try {
      await updateDoc(doc(db, 'users', user.uid), { habits: updatedHabits });
      toast.success('Habit removed');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    }
  };

  const handleOnboardingComplete = async (data: { reminderTime: string; customBreathing: { inhale: number; hold: number; exhale: number; holdPost: number } }) => {
    if (!user) return;
    // Close UI immediately
    setShowOnboarding(false);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        reminderTime: data.reminderTime,
        customBreathingConfig: data.customBreathing,
        onboardingCompleted: true
      });
      toast.success('Preferences saved!');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
      // If it failed, we might want to show it again, but usually better to let them try later
    }
  };

  const startSession = (mode: BreathingMode) => {
    setActiveSession(mode);
  };

  const endSession = async (duration: number, moodAfter?: string) => {
    if (!user || !activeSession) return;

    // Close session immediately for snappy feel
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
      // Save session
      await addDoc(collection(db, 'sessions'), sessionData);

      // Update profile stats
      if (profile) {
        let newStreak = profile.currentStreak;
        const lastDate = profile.lastSessionDate ? new Date(profile.lastSessionDate) : null;
        
        if (!lastDate || !isSameDay(lastDate, now)) {
          if (lastDate && isSameDay(lastDate, subDays(now, 1))) {
            newStreak += 1;
          } else if (!lastDate || !isSameDay(lastDate, now)) {
            newStreak = 1;
          }
        }

        await updateDoc(doc(db, 'users', user.uid), {
          totalSessions: profile.totalSessions + 1,
          currentStreak: newStreak,
          lastSessionDate: now.toISOString(),
        });
      }

      toast.success('Session completed! Well done.');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sessions');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-page">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 bg-soft-sage rounded-full blur-xl"
        />
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
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-white text-accent-green shadow-sm' : 'text-cream hover:bg-white/50'}`}
            >
              <Home className="w-5 h-5" />
              <span className="font-bold uppercase tracking-[1px] text-xs">Home</span>
            </button>
            <button 
              onClick={() => setActiveTab('progress')}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'progress' ? 'bg-white text-accent-green shadow-sm' : 'text-cream hover:bg-white/50'}`}
            >
              <BarChart2 className="w-5 h-5" />
              <span className="font-bold uppercase tracking-[1px] text-xs">Progress</span>
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-white text-accent-green shadow-sm' : 'text-cream hover:bg-white/50'}`}
            >
              <UserIcon className="w-5 h-5" />
              <span className="font-bold uppercase tracking-[1px] text-xs">Profile</span>
            </button>
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <input 
                            type="text" 
                            defaultValue={user.displayName || ''} 
                            onBlur={(e) => handleUpdateName(e.target.value)}
                            className="text-2xl font-bold text-deep-forest bg-transparent border-none focus:ring-0 p-0 w-full sm:w-auto"
                            placeholder="Your Name"
                          />
                        </div>
                        <p className="text-sm text-accent-green opacity-60">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-cream/50">
                      <h3 className="text-xs font-bold text-accent-green uppercase tracking-[2px] opacity-50 mb-4">Health Details</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Age</Label>
                          <Input 
                            placeholder="--" 
                            defaultValue={profile?.healthDetails?.age || ''} 
                            onBlur={(e) => handleUpdateHealthDetails('age', e.target.value)}
                            className="h-10 rounded-xl border-cream bg-bg-page/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Gender</Label>
                          <Input 
                            placeholder="--" 
                            defaultValue={profile?.healthDetails?.gender || ''} 
                            onBlur={(e) => handleUpdateHealthDetails('gender', e.target.value)}
                            className="h-10 rounded-xl border-cream bg-bg-page/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Weight</Label>
                          <Input 
                            placeholder="--" 
                            defaultValue={profile?.healthDetails?.weight || ''} 
                            onBlur={(e) => handleUpdateHealthDetails('weight', e.target.value)}
                            className="h-10 rounded-xl border-cream bg-bg-page/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Height</Label>
                          <Input 
                            placeholder="--" 
                            defaultValue={profile?.healthDetails?.height || ''} 
                            onBlur={(e) => handleUpdateHealthDetails('height', e.target.value)}
                            className="h-10 rounded-xl border-cream bg-bg-page/30"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-6 border-t border-cream/50">
                      <Button variant="outline" onClick={handleLogout} className="w-full border-cream text-accent-green hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 rounded-2xl h-12">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

                  <Card className="border border-cream shadow-none bg-card rounded-[32px]">
                    <CardContent className="p-6 flex flex-col gap-6">
                      <h3 className="text-xs font-bold text-accent-green uppercase tracking-[2px] opacity-50">Custom Cycle</h3>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {[
                          { label: 'Box', inhale: 4, hold: 4, exhale: 4, holdPost: 4 },
                          { label: '4-7-8', inhale: 4, hold: 7, exhale: 8, holdPost: 0 },
                          { label: '5-5', inhale: 5, hold: 0, exhale: 5, holdPost: 0 },
                        ].map((rec) => (
                          <button
                            key={rec.label}
                            onClick={() => {
                              handleUpdateFullBreathingConfig({
                                inhale: rec.inhale,
                                hold: rec.hold,
                                exhale: rec.exhale,
                                holdPost: rec.holdPost
                              });
                            }}
                            className="px-3 py-1 rounded-full border border-cream text-[10px] font-bold text-accent-green hover:bg-bg-page transition-colors"
                          >
                            {rec.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Inhale</Label>
                          <Input 
                            type="number" 
                            value={profile?.customBreathingConfig?.inhale || 4} 
                            onChange={(e) => handleUpdateCustomBreathing('inhale', Number(e.target.value))}
                            className="h-10 rounded-xl border-cream bg-bg-page/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Hold</Label>
                          <Input 
                            type="number" 
                            value={profile?.customBreathingConfig?.hold || 4} 
                            onChange={(e) => handleUpdateCustomBreathing('hold', Number(e.target.value))}
                            className="h-10 rounded-xl border-cream bg-bg-page/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Exhale</Label>
                          <Input 
                            type="number" 
                            value={profile?.customBreathingConfig?.exhale || 4} 
                            onChange={(e) => handleUpdateCustomBreathing('exhale', Number(e.target.value))}
                            className="h-10 rounded-xl border-cream bg-bg-page/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase opacity-50">Hold Post</Label>
                          <Input 
                            type="number" 
                            value={profile?.customBreathingConfig?.holdPost || 4} 
                            onChange={(e) => handleUpdateCustomBreathing('holdPost', Number(e.target.value))}
                            className="h-10 rounded-xl border-cream bg-bg-page/30"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-accent-green opacity-40 italic">
                        Recommended: 4-4-4-4 (Box), 4-7-8 (Sleep), 5-0-5-0 (Coherence)
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-cream shadow-none bg-card rounded-[32px] overflow-hidden sm:col-span-2">
                    <CardContent className="p-8 flex flex-col gap-8">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-accent-green uppercase tracking-[3px] opacity-50">App Information</h3>
                        <div className="h-px flex-1 bg-cream/30 ml-4" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                        <div className="flex flex-col gap-2 group">
                          <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-opacity">Developer</span>
                          <a 
                            href="https://hareramkushwaha.com.np/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xl font-serif text-deep-forest hover:text-accent-green transition-colors leading-tight"
                          >
                            Hareram Kushwaha
                          </a>
                        </div>

                        <div className="flex flex-col gap-2 group sm:col-span-2 lg:col-span-1">
                          <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-opacity">Contact</span>
                          <a href="mailto:hareramkushwaha054@gmail.com" className="text-sm font-medium text-deep-forest hover:text-accent-green transition-colors break-all">
                            hareramkushwaha054@gmail.com
                          </a>
                        </div>

                        <div className="flex flex-col gap-2 group">
                          <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-opacity">GitHub</span>
                          <a href="https://github.com/ha-re-ram" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-deep-forest hover:text-accent-green transition-colors">
                            @ha-re-ram
                          </a>
                        </div>

                        <div className="flex flex-col gap-2 group">
                          <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-opacity">License</span>
                          <span className="text-sm font-medium text-deep-forest">MIT License</span>
                        </div>

                        <div className="flex flex-col gap-2 group">
                          <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-opacity">Built With</span>
                          <span className="text-sm font-medium text-deep-forest">React, Tailwind, Firebase</span>
                        </div>

                        <div className="flex flex-col gap-2 group">
                          <span className="text-[10px] font-bold text-accent-green uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-opacity">Version</span>
                          <span className="text-sm font-bold text-deep-forest">1.0.6 Stable</span>
                        </div>
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
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-accent-green scale-110' : 'text-cream'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-[1px]">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('progress')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'progress' ? 'text-accent-green scale-110' : 'text-cream'}`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-[1px]">Stats</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-accent-green scale-110' : 'text-cream'}`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-[1px]">Profile</span>
        </button>
      </nav>

      {/* Active Session Overlay */}
      <AnimatePresence>
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white"
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
