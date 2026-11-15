import { FormEvent } from 'react';
import { WifiOff, X } from 'lucide-react';
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
import { useAuthFormMachine } from '../machines/authFormMachine';

export interface AuthScreenProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function AuthScreen({ onClose, onSuccess }: AuthScreenProps = {}) {
  const {
    state,
    switchMode,
    setField,
    startSubmit,
    succeedSubmit,
    failSubmit,
  } = useAuthFormMachine();

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!state.email || !state.password || !state.name) {
      return toast.error('Please fill in all fields');
    }
    startSubmit();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, state.email, state.password);
      await updateProfile(userCredential.user, { displayName: state.name });
      succeedSubmit();
      toast.success('Welcome to Serenity Cloud!');
      onSuccess?.();
    } catch (error: any) {
      failSubmit(error.message);
      toast.error('Could not create account: ' + error.message);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!state.email || !state.password) {
      return toast.error('Please enter your email and password');
    }
    startSubmit();
    try {
      await signInWithEmailAndPassword(auth, state.email, state.password);
      succeedSubmit();
      toast.success('Welcome back to Serenity!');
      onSuccess?.();
    } catch (error: any) {
      failSubmit(error.message);
      toast.error('Login failed: ' + error.message);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!state.email) return toast.error('Please enter your email.');
    startSubmit();
    try {
      await sendPasswordResetEmail(auth, state.email);
      succeedSubmit();
      toast.success('Reset link sent!');
      switchMode('signIn');
    } catch (error: any) {
      failSubmit(error.message);
      toast.error('Reset failed: ' + error.message);
    }
  };

  if (!auth) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-deep-forest">Connection Error</h2>
          <p className="text-accent-green opacity-70">Please check your Firebase configuration.</p>
          {onClose && (
            <Button onClick={onClose} variant="outline" className="mt-4 rounded-full border-cream">
              Continue Offline
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isSubmitting = state.status === 'submitting';

  return (
    <div className="flex items-center justify-center p-4 sm:p-6 w-full">
      <div className="w-full max-w-[420px] relative">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-accent-green rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-accent-green/10">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
          </div>
          <h1 className="text-3xl font-serif text-deep-forest mb-1">Serenity Sanctuary</h1>
          <p className="text-[10px] font-bold text-accent-green/80 uppercase tracking-[3px]">
            Cloud Sync & Backup
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-card text-card-foreground p-6 sm:p-8 rounded-[40px] border border-cream shadow-xl relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 p-1.5 rounded-full text-accent-green/70 hover:text-accent-green hover:bg-muted transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {state.mode === 'forgotPassword' ? (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-serif text-deep-forest">Reset Password</h2>
                <p className="text-xs text-accent-green/80 mt-1">We'll send a recovery link to your email.</p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="reset-email" className="text-[10px] font-bold text-accent-green/80 uppercase tracking-wider ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={state.email}
                    onChange={(e) => setField('email', e.target.value)}
                    placeholder="Enter your email"
                    className="h-12 rounded-2xl border-cream bg-bg-page/40 text-deep-forest focus:border-accent-green focus:ring-0"
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl bg-accent-green hover:bg-deep-forest text-white dark:text-zinc-950 font-bold transition-colors"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
                <button
                  type="button"
                  onClick={() => switchMode('signIn')}
                  className="w-full text-xs font-bold text-accent-green/80 hover:text-accent-green transition-opacity"
                >
                  Back to Login
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-serif text-deep-forest">
                  {state.mode === 'signIn' ? 'Sign In' : 'Create Free Account'}
                </h2>
                <p className="text-xs text-accent-green/80 mt-1">
                  {state.mode === 'signIn'
                    ? 'Sync your progress and habits across all devices.'
                    : 'Save your mindfulness streaks and records safely.'}
                </p>
              </div>

              <form onSubmit={state.mode === 'signIn' ? handleLogin : handleSignUp} className="space-y-4">
                {state.mode === 'signUp' && (
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-[10px] font-bold text-accent-green/80 uppercase tracking-wider ml-1">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={state.name}
                      onChange={(e) => setField('name', e.target.value)}
                      className="h-12 rounded-2xl border-cream bg-bg-page/40 text-deep-forest"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[10px] font-bold text-accent-green/80 uppercase tracking-wider ml-1">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={state.email}
                    onChange={(e) => setField('email', e.target.value)}
                    className="h-12 rounded-2xl border-cream bg-bg-page/40 text-deep-forest"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-[10px] font-bold text-accent-green/80 uppercase tracking-wider">
                      Password
                    </Label>
                    {state.mode === 'signIn' && (
                      <button
                        type="button"
                        onClick={() => switchMode('forgotPassword')}
                        className="text-[10px] font-bold text-accent-green/80 hover:text-accent-green"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={state.password}
                    onChange={(e) => setField('password', e.target.value)}
                    className="h-12 rounded-2xl border-cream bg-bg-page/40 text-deep-forest"
                    disabled={isSubmitting}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl bg-accent-green hover:bg-deep-forest text-white dark:text-zinc-950 font-bold transition-colors mt-2"
                >
                  {isSubmitting
                    ? state.mode === 'signIn'
                      ? 'Logging in...'
                      : 'Creating Account...'
                    : state.mode === 'signIn'
                    ? 'Sign In to Cloud'
                    : 'Create Free Account'}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-cream/50 text-center">
                <p className="text-xs text-accent-green/80">
                  {state.mode === 'signIn' ? "Don't have an account yet?" : 'Already have an account?'}
                  <button
                    onClick={() => switchMode(state.mode === 'signIn' ? 'signUp' : 'signIn')}
                    className="ml-2 font-bold text-accent-green hover:text-deep-forest underline decoration-dotted"
                  >
                    {state.mode === 'signIn' ? 'Register' : 'Log In'}
                  </button>
                </p>
              </div>
            </>
          )}

          {onClose && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-accent-green opacity-50 hover:opacity-100"
              >
                Continue practicing as guest (local only)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
