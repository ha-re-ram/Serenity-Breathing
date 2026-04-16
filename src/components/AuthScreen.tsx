import { useState, FormEvent } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, ChevronLeft, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
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
      toast.success('Welcome to Serenity!');
    } catch (error: any) {
      toast.error('Could not create account: ' + error.message);
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
      toast.error('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email.');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Reset link sent!');
      setIsResetting(false);
    } catch (error: any) {
      toast.error('Reset failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!auth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDFCF8] p-6">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-[#344E41]">Connection Error</h2>
          <p className="text-[#5A5A40] opacity-70">Please check your Firebase configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FDFCF8] p-6">
      <div className="w-full max-w-[400px]">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-[#5A5A40] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#5A5A40]/10">
            <div className="w-4 h-4 bg-white rounded-full" />
          </div>
          <h1 className="text-3xl font-serif text-[#344E41] mb-1">Serenity</h1>
          <p className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-[3px] opacity-40">Mindfulness & Balance</p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white p-8 rounded-[40px] border border-[#DAD7CD] shadow-sm">
          {isResetting ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-serif text-[#344E41]">Reset Password</h2>
                <p className="text-xs text-[#5A5A40] opacity-60 mt-1">We'll send a recovery link to your email.</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="reset-email" className="text-[10px] uppercase tracking-wider opacity-60 ml-1">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-2xl border-[#DAD7CD] focus:border-[#5A5A40] focus:ring-0"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-[#5A5A40] hover:bg-[#344E41] text-white font-bold transition-colors">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsResetting(false)}
                  className="w-full text-xs font-bold text-[#5A5A40] opacity-40 hover:opacity-100 transition-opacity"
                >
                  Back to Login
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-serif text-[#344E41]">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                <p className="text-xs text-[#5A5A40] opacity-60 mt-1">
                  {isLogin ? 'Enter your details to find your calm.' : 'Start your mindfulness journey today.'}
                </p>
              </div>

              <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-[10px] uppercase tracking-wider opacity-60 ml-1">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-2xl border-[#DAD7CD]"
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[10px] uppercase tracking-wider opacity-60 ml-1">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-2xl border-[#DAD7CD]"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-[10px] uppercase tracking-wider opacity-60">Password</Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsResetting(true)}
                        className="text-[10px] font-bold text-[#5A5A40] opacity-40 hover:opacity-100"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-2xl border-[#DAD7CD]"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-[#5A5A40] hover:bg-[#344E41] text-white font-bold transition-colors mt-2">
                  {loading ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Log In' : 'Sign Up')}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-[#DAD7CD]/30 text-center">
                <p className="text-xs text-[#5A5A40] opacity-60">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="ml-2 font-bold text-[#5A5A40] hover:text-[#344E41]"
                  >
                    {isLogin ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-8 text-[10px] text-[#5A5A40] opacity-40 text-center uppercase tracking-[2px]">
          Professional Mindfulness App
        </p>
      </div>
    </div>
  );
}

