import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, LogIn, UserPlus, ChevronLeft, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

interface AuthScreenProps {
  onGoogleLogin: () => void;
}

export default function AuthScreen({ onGoogleLogin }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Silent background connection check
    getDocFromServer(doc(db, '_connection_test_', 'ping')).catch(() => {});
  }, []);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      return toast.error('Please fill in all fields');
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      toast.success('Welcome to Serenity!', {
        description: 'Your account has been created successfully.',
      });
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Registration is currently unavailable', {
          description: 'Please contact support or try again later.',
        });
      } else {
        toast.error('Could not create account', {
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please enter your email and password');
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Login is currently unavailable', {
          description: 'Please contact support or try again later.',
        });
      } else {
        toast.error('Login failed', {
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email address first.');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Reset link sent! Please check your inbox.', {
        description: 'If you don\'t see it, check your spam folder.',
      });
      setIsResetting(false);
    } catch (error: any) {
      console.error("Reset Error:", error.message || error);
      toast.error('Could not send reset link', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isResetting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-page p-8 text-center">
        <button 
          onClick={() => setIsResetting(false)}
          className="absolute top-12 left-8 text-accent-green flex items-center gap-2 font-medium"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-3xl font-serif text-deep-forest mb-4">Reset Password</h1>
        <p className="text-accent-green mb-8 opacity-70">Enter your email to receive a reset link.</p>
        <form onSubmit={handleResetPassword} className="w-full space-y-4">
          <div className="space-y-2 text-left">
            <Label htmlFor="reset-email">Email</Label>
            <Input 
              id="reset-email" 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border-cream"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-accent-green text-white font-bold shadow-lg shadow-accent-green/20">
            {loading ? 'Sending link...' : 'Send Reset Link'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-page p-8 text-center">
      <div className="w-20 h-20 bg-white rounded-[40px] flex items-center justify-center mb-6 border border-cream shadow-sm">
        <div className="w-10 h-10 bg-accent-green rounded-full animate-pulse" />
      </div>
      <h1 className="text-4xl font-serif text-deep-forest mb-2">Serenity</h1>
      <p className="text-accent-green mb-12 opacity-70">Find your calm, anywhere.</p>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-cream/20 rounded-full p-1">
          <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-accent-green">Login</TabsTrigger>
          <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-accent-green">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-cream"
              />
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <button 
                  type="button" 
                  onClick={() => setIsResetting(true)}
                  className="text-xs font-bold text-accent-green opacity-60 hover:opacity-100"
                >
                  Forgot?
                </button>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-cream"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-accent-green text-white font-bold">
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-cream"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="signup-email">Email</Label>
              <Input 
                id="signup-email" 
                type="email" 
                placeholder="name@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-cream"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="signup-password">Password</Label>
              <Input 
                id="signup-password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-cream"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-accent-green text-white font-bold">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      <div className="relative w-full my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-cream"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-bg-page px-2 text-accent-green opacity-40">Or continue with</span>
        </div>
      </div>

      <Button 
        variant="outline" 
        onClick={onGoogleLogin}
        className="w-full h-12 rounded-full border-cream text-accent-green font-bold flex gap-3"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
        Google
      </Button>
    </div>
  );
}
