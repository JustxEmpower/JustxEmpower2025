import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { User, Package, MapPin, Heart, LogOut, Settings } from 'lucide-react';

export default function CustomerAccount() {
  const [, go] = useLocation();
  const { isAuthenticated, isChecking, customer, logout } = useCustomerAuth();
  const [tab, setTab] = useState('overview');
  if (isChecking) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  if (!isAuthenticated) { go('/login'); return null; }
  const links = [
    { k:'overview', l:'Overview', i:User },
    { k:'orders', l:'My Orders', i:Package, h:'/account/orders' },
    { k:'addresses', l:'Addresses', i:MapPin, h:'/account/addresses' },
    { k:'wishlist', l:'Wishlist', i:Heart, h:'/account/wishlist' },
    { k:'settings', l:'Settings', i:Settings },
  ];
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-serif mb-2">My Account</h1>
        <p className="text-muted-foreground text-sm mb-10">Welcome, {customer?.firstName}</p>
        <div className="grid md:grid-cols-4 gap-8">
          <nav className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {links.map(n=><button key={n.k} onClick={()=>n.h?go(n.h):setTab(n.k)} className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm text-left hover:bg-muted ${tab===n.k&&!n.h?'bg-muted font-medium':''}`}><n.i className="h-4 w-4"/>{n.l}</button>)}
            <button onClick={logout} className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border-t border-border"><LogOut className="h-4 w-4"/>Sign Out</button>
          </nav>
          <div className="md:col-span-3">
            {tab==='overview'&&<Overview c={customer}/>}
            {tab==='settings'&&<ProfileSettings/>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Overview({c}:{c:any}) {
  return <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
    <h2 className="text-lg font-serif mb-4">Account Details</h2>
    <div className="grid grid-cols-2 gap-6 text-sm">
      <div><p className="text-muted-foreground">Name</p><p className="mt-1">{c?.firstName} {c?.lastName}</p></div>
      <div><p className="text-muted-foreground">Email</p><p className="mt-1">{c?.email}</p></div>
      <div><p className="text-muted-foreground">Member Since</p><p className="mt-1">{c?.createdAt?new Date(c.createdAt).toLocaleDateString():'-'}</p></div>
      <div><p className="text-muted-foreground">Tier</p><p className="mt-1 capitalize">{c?.tier||'Customer'}</p></div>
    </div>
  </div>;
}

function ProfileSettings() {
  const [fn,setFn]=useState('');const [ln,setLn]=useState('');
  const [cp,setCp]=useState('');const [np,setNp]=useState('');
  const up=trpc.customer.updateProfile.useMutation({onSuccess:()=>toast.success('Updated'),onError:e=>toast.error(e.message)});
  const pw=trpc.customer.changePassword.useMutation({onSuccess:()=>{toast.success('Password changed');setCp('');setNp('');},onError:e=>toast.error(e.message)});
  return <div className="space-y-6">
    <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
      <h2 className="text-lg font-serif mb-4">Edit Profile</h2>
      <form onSubmit={e=>{e.preventDefault();up.mutate({firstName:fn||undefined,lastName:ln||undefined})}} className="space-y-3">
        <Input placeholder="First Name" value={fn} onChange={e=>setFn(e.target.value)} className="h-11"/>
        <Input placeholder="Last Name" value={ln} onChange={e=>setLn(e.target.value)} className="h-11"/>
        <Button type="submit" className="bg-neutral-900 text-white">Save Changes</Button>
      </form>
    </div>
    <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
      <h2 className="text-lg font-serif mb-4">Change Password</h2>
      <form onSubmit={e=>{e.preventDefault();pw.mutate({currentPassword:cp,newPassword:np})}} className="space-y-3">
        <Input type="password" placeholder="Current Password" value={cp} onChange={e=>setCp(e.target.value)} required className="h-11"/>
        <Input type="password" placeholder="New Password (min 8)" value={np} onChange={e=>setNp(e.target.value)} required minLength={8} className="h-11"/>
        <Button type="submit" className="bg-neutral-900 text-white">Update Password</Button>
      </form>
    </div>
  </div>;
}
