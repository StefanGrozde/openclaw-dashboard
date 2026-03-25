import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import ErrorBanner from '../components/ui/ErrorBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { ApiError } from '../types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { authState, login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authState.isAuthenticated, navigate]);

  const onSubmit = handleSubmit(async ({ username, password }) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setSubmitError((error as ApiError).message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080b12] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1a2236] bg-[#0e1320] p-8 shadow-2xl shadow-black/30">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-600">
            <Zap size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="block text-lg font-bold uppercase tracking-widest text-white">Openclaw</span>
            <span className="inline-block rounded border border-blue-800 bg-blue-950 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              ADMIN
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to access the Openclaw control dashboard.</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          {submitError ? <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} /> : null}

          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-200">
              Username
            </label>
            <input
              id="username"
              type="text"
              {...register('username')}
              className="w-full rounded-md border border-[#1a2236] bg-[#080b12] px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700/50"
              placeholder="admin"
            />
            {errors.username ? <p className="mt-2 text-sm text-red-400">{errors.username.message}</p> : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="w-full rounded-md border border-[#1a2236] bg-[#080b12] px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700/50"
              placeholder="Enter your password"
            />
            {errors.password ? <p className="mt-2 text-sm text-red-400">{errors.password.message}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
