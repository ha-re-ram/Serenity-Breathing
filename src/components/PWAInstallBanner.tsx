import { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { PWAInstallState } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  pwaState: PWAInstallState;
  variant?: 'sidebar' | 'header' | 'card' | 'pill';
  className?: string;
}

export default function PWAInstallButton({ pwaState, variant = 'sidebar', className = '' }: PWAInstallButtonProps) {
  const { isInstalled, canInstall, isIOS, install } = pwaState;
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed, never show the install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    const outcome = await install();
    if (outcome === 'manual' || isIOS) {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' && (
        <button
          onClick={handleClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-xs font-bold uppercase tracking-wider text-accent-green bg-soft-sage/10 hover:bg-soft-sage/20 border border-soft-sage/30 mt-auto ${className}`}
          title="Install Serenity for instant offline access"
        >
          <Download className="w-4 h-4 text-accent-green" />
          <span>Install App</span>
        </button>
      )}

      {variant === 'header' && (
        <button
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-accent-green bg-soft-sage/15 hover:bg-soft-sage/25 border border-soft-sage/30 transition-all ${className}`}
          title="Install Serenity App"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
      )}

      {variant === 'pill' && (
        <button
          onClick={handleClick}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-accent-green bg-card hover:bg-muted border border-cream shadow-sm transition-all ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-soft-sage" />
          <span>Install App</span>
        </button>
      )}

      {variant === 'card' && (
        <div className={`p-5 rounded-[28px] border border-soft-sage/40 bg-soft-sage/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-accent-green text-white flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-deep-forest">Install Serenity App</h4>
              <p className="text-xs text-accent-green/80 mt-0.5">
                Enjoy instant &lt;50ms launch, zero latency, and 100% offline access.
              </p>
            </div>
          </div>
          <Button
            onClick={handleClick}
            className="rounded-full bg-accent-green hover:bg-deep-forest text-white dark:text-zinc-950 px-5 text-xs font-bold uppercase tracking-wider h-10 w-full sm:w-auto flex-shrink-0"
          >
            Install Now
          </Button>
        </div>
      )}

      {/* iOS Safari Step-by-Step Installation Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card text-card-foreground rounded-[32px] p-6 max-w-sm w-full border border-cream shadow-2xl flex flex-col gap-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-soft-sage/20 text-accent-green flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-accent-green" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-deep-forest">Install on iOS</h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-accent-green/70">
                      Safari Home Screen
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 rounded-full text-accent-green/60 hover:text-accent-green hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-deep-forest">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-bg-page border border-cream/50">
                  <div className="w-6 h-6 rounded-lg bg-soft-sage/20 flex items-center justify-center font-bold text-accent-green flex-shrink-0 text-xs">
                    1
                  </div>
                  <p className="leading-relaxed">
                    Tap the <strong className="text-accent-green inline-flex items-center gap-1 font-bold">Share <Share2 className="w-3.5 h-3.5 inline" /></strong> button in Safari's bottom toolbar.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-bg-page border border-cream/50">
                  <div className="w-6 h-6 rounded-lg bg-soft-sage/20 flex items-center justify-center font-bold text-accent-green flex-shrink-0 text-xs">
                    2
                  </div>
                  <p className="leading-relaxed">
                    Scroll down and tap <strong className="text-accent-green inline-flex items-center gap-1 font-bold">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline" /></strong>.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-accent-green hover:bg-deep-forest text-white dark:text-zinc-950 rounded-full text-xs font-bold uppercase tracking-wider h-11"
              >
                Got it
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
