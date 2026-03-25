import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-zinc-200" />,
  error: <AlertCircle className="w-5 h-5 text-zinc-200" />,
  info: <Info className="w-5 h-5 text-zinc-200" />
};

const bgColors = {
  success: 'bg-white/[0.04] border-white/10',
  error: 'bg-white/[0.04] border-white/10',
  info: 'bg-white/[0.04] border-white/10'
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md min-w-[300px] ${bgColors[toast.type]}`}
          >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium text-zinc-200">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
