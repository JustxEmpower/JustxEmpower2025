import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function CustomerLogin() {
  const [, go] = useLocation();
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const login = trpc.customer.login.useMutation({ onSuccess: d => { localStorage.setItem('customerToken', d.token); toast.success('Welcome back'); go('/account'); }, onError: e => { toast.error(e.message); setBusy(false); } });
  const reg = trpc.customer.register.useMutation({ onSuccess: d => { localStorage.setItem('customerToken', d.token); toast.success('Account created'); go('/account'); }, onError: e => { toast.error(e.message); setBusy(false); } });
  const sub = (e: React.FormEvent) => { e.preventDefault(); setBusy(true); mode==='login' ? login.mutate({email,password:pw}) : reg.mutate({email,password:pw,firstName:fn,lastName:ln}); };
  return (<div className="min-h-screen flex items-center justify-center bg-background py-20 px-4"><div className="w-full max-w-md"><div className="text-center mb-10"><h1 className="text-3xl font-serif tracking-wide text-foreground">{mode==='login'?'Welcome Back':'Create Account'}</h1><p className="text-sm text-muted-foreground mt-3 font-light">{mode==='login'?'Sign in to your account':'Join us for a personalized experience'}</p></div><form onSubmit={sub}><div className="bg-card rounded-xl p-8 shadow-sm border border-border space-y-4">{mode==='register'&&(<div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">First Name</label><Input value={fn} onChange={e=>setFn(e.target.value)} required disabled={busy} className="h-11"/></div><div><label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Last Name</label><Input value={ln} onChange={e=>setLn(e.target.value)} required disabled={busy} className="h-11"/></div></div>)}<div><label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Email</label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required disabled={busy} className="h-11"/></div><div><label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Password</label><Input type="password" value={pw} onChange={e=>setPw(e.target.value)} required minLength={mode==='register'?8:1} disabled={busy} className="h-11"/></div><Button type="submit" disabled={busy} className="w-full h-12 mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium">{busy?'Please wait...':mode==='login'?'Sign In':'Create Account'}</Button></div></form><p className="text-center text-sm text-muted-foreground mt-6">{mode==='login'?<>Don&apos;t have an account? <button onClick={()=>setMode('register')} className="text-foreground underline underline-offset-4 font-medium">Create one</button></>:<>Already have an account? <button onClick={()=>setMode('login')} className="text-foreground underline underline-offset-4 font-medium">Sign in</button></>}</p></div></div>);
}
