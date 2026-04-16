import { useState, FormEvent } from 'react';
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
import { auth } from '../firebase';


interface AuthScreenProps {
  onGoogleLogin: () => void;
}

export default function AuthScreen({ onGoogleLogin }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);



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

  if (!auth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-page p-8 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
          <WifiOff className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif text-deep-forest mb-2">Connection Error</h2>
        <p className="text-accent-green opacity-70 max-w-xs mb-8">
          The application could not connect to the backend. This is usually due to missing environment variables.
        </p>
        <div className="bg-white p-6 rounded-[32px] border border-cream shadow-sm text-left w-full max-w-sm">
          <p className="text-xs font-bold text-accent-green uppercase tracking-widest mb-4 opacity-50">How to Fix</p>
          <ul className="space-y-3 text-sm text-deep-forest">
            <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-soft-sage flex-shrink-0" /> <span>Create a <b>.env</b> file in the root</span></li>
            <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-soft-sage flex-shrink-0" /> <span>Add your <b>Firebase Keys</b> to it</span></li>
            <li className="flex gap-3"><CheckCircle2 className="w-4 h-4 text-soft-sage flex-shrink-0" /> <span>Restart the <b>dev server</b></span></li>
          </ul>
        </div>
      </div>
    );
  }

  if (isResetting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-page p-8">
        <div className="w-full max-w-md flex flex-col items-center text-center relative">
          <button 
            onClick={() => setIsResetting(false)}
            className="absolute -top-12 left-0 text-accent-green flex items-center gap-2 font-medium"
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
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-page p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center border border-cream shadow-sm">
            <div className="w-4 h-4 bg-accent-green rounded-full animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-serif text-deep-forest">Serenity</h1>
            <p className="text-[10px] font-bold text-accent-green uppercase tracking-[2px] opacity-50">Find your calm</p>
          </div>
        </div>

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
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </Button>

      <p className="mt-8 text-[10px] text-accent-green opacity-40 text-center leading-relaxed">
        Having trouble signing in? Ensure your deployment domain is whitelisted in 
        <br />
        <span className="font-bold">Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</span>.
      </p>
    </div>
  </div>
);

}
