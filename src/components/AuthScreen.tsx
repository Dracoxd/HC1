import React, { FormEvent, useState } from 'react';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, signInAnonymously, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ArrowRight, LockKeyhole, UserRound } from 'lucide-react';
import centerPhoto from '../assets/images/MR FLORES.png';
import { auth } from '../firebase';

export const AuthScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const usernameToEmail = (value: string) => {
    const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
    return `${normalized}@healthcenter.local`;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !password) {
      setError('Enter your name and password.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    try {
      const identifier = name.trim();
      if (identifier.includes('@')) {
        const email = identifier.toLowerCase();
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (signInError) {
          const code = signInError instanceof Error && 'code' in signInError
            ? String((signInError as { code: string }).code)
            : '';
          if (code !== 'auth/user-not-found' && code !== 'auth/invalid-credential') {
            throw signInError;
          }

          try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const displayName = email.slice(0, email.indexOf('@')).replace(/[._-]+/g, ' ').trim();
            await updateProfile(credential.user, { displayName });
          } catch (createError) {
            const createCode = createError instanceof Error && 'code' in createError
              ? String((createError as { code: string }).code)
              : '';
            if (createCode === 'auth/email-already-in-use') throw signInError;
            throw createError;
          }
        }
      } else {
        let createdOrSignedIn = false;
        let lastInvalidError: unknown = null;

        for (let suffix = 0; suffix < 1000 && !createdOrSignedIn; suffix += 1) {
          const candidateName = suffix === 0 ? identifier : `${identifier}${suffix}`;
          const email = usernameToEmail(candidateName);

          try {
            await signInWithEmailAndPassword(auth, email, password);
            createdOrSignedIn = true;
          } catch (signInError) {
            lastInvalidError = signInError;
            const code = signInError instanceof Error && 'code' in signInError ? String((signInError as { code: string }).code) : '';

            if (code === 'auth/user-not-found') {
              const credential = await createUserWithEmailAndPassword(auth, email, password);
              await updateProfile(credential.user, { displayName: candidateName });
              createdOrSignedIn = true;
            } else if (code === 'auth/invalid-credential') {
              const methods = await fetchSignInMethodsForEmail(auth, email);
              if (methods.length === 0) {
                const credential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(credential.user, { displayName: candidateName });
                createdOrSignedIn = true;
              }
            } else {
              throw signInError;
            }
          }
        }

        if (!createdOrSignedIn) throw lastInvalidError;
      }
    } catch (caught) {
      const code = caught instanceof Error && 'code' in caught ? String((caught as { code: string }).code) : '';
      if (code === 'auth/operation-not-allowed') setError('Enable Email/Password and Anonymous sign-in in Firebase Console.');
      else if (code === 'auth/email-already-in-use') setError('An account already uses this email. Sign in with its password.');
      else if (code === 'auth/invalid-email') setError('Enter a valid email address.');
      else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') setError('Name or password is incorrect.');

      else setError('Authentication could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const continueAnonymous = async () => {
    setError('');
    setBusy(true);
    try {
      await signInAnonymously(auth);
    } catch (caught) {
      const code = caught instanceof Error && 'code' in caught ? String((caught as { code: string }).code) : '';
      setError(code === 'auth/operation-not-allowed' ? 'Enable Anonymous sign-in in Firebase Console.' : 'Anonymous sign-in could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#eef2ee] px-4 py-8 text-[#17312e] sm:flex sm:items-center sm:justify-center sm:py-12">
      <section className="mx-auto w-full max-w-md border border-[#d9e1dc] bg-[#fbfcfa] shadow-[0_18px_50px_rgba(23,58,55,0.12)]">
        <div className="border-b border-[#dfe6e1] px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <img src={centerPhoto} alt="Mayor Moises R. Flores Health Center" className="h-12 w-12 rounded-full border border-[#dfe6e1] object-cover" />
            <div>
              <div className="text-sm font-bold">Mayor Moises R. Flores</div>
              <div className="mt-0.5 text-xs text-[#66736f]">Health Center</div>
            </div>
          </div>
        </div>

        <div className="px-6 py-7 sm:px-8">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#66736f]">
            Enter your name and password, or sign in with your email account.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#17312e]">Name or email</span>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736f]" />
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="username" placeholder="Enter your name or email" className="h-11 w-full border border-[#cfd8d2] bg-white pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#17645c] focus:ring-2 focus:ring-[#17645c]/15" />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-[#17312e]">Password</span>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#66736f]" />
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="At least 6 characters" className="h-11 w-full border border-[#cfd8d2] bg-white pl-10 pr-3 text-sm outline-none transition-colors focus:border-[#17645c] focus:ring-2 focus:ring-[#17645c]/15" />
              </div>
            </label>

            {error && <div role="alert" className="border-l-2 border-rose-600 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-900">{error}</div>}

            <button type="submit" disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 bg-[#17645c] text-sm font-bold text-white transition-colors hover:bg-[#104f49] disabled:opacity-60">
              Sign in <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 border-t border-[#dfe6e1] pt-5">
            <button type="button" disabled={busy} onClick={continueAnonymous} className="h-11 w-full border border-[#b9c7be] text-sm font-bold text-[#173a37] transition-colors hover:bg-[#edf3ef] disabled:opacity-60">
              Continue anonymously
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
