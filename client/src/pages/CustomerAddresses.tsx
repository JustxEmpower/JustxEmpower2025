import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';

function W({children}:{children:React.ReactNode}) {
  return <div className="min-h-screen bg-background py-20 px-4"><div className="max-w-3xl mx-auto">{children}</div></div>;
}

export default function CustomerAddresses() {
  const [,go]=useLocation();
  const {isAuthenticated,isChecking}=useCustomerAuth();
  const [ed,setEd]=useState<number|'new'|null>(null);
  if(isChecking) return <W><p>Loading...</p></W>;
  if(!isAuthenticated){go('/login');return null;}
  return ed!==null?<Form id={ed} done={()=>setEd(null)}/>:<List onEdit={setEd}/>;
}

function List({onEdit}:{onEdit:(v:number|'new')=>void}) {
  const [,go]=useLocation();
  const u=trpc.useUtils();
  const {data,isLoading}=trpc.customer.addresses.useQuery();
  const del=trpc.customer.deleteAddress.useMutation({onSuccess:()=>{toast.success('Deleted');u.customer.addresses.invalidate();}});
  return <W>
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3"><button onClick={()=>go('/account')}><ArrowLeft className="h-5 w-5"/></button><h1 className="text-2xl font-serif">Address Book</h1></div>
      <Button onClick={()=>onEdit('new')} size="sm" className="bg-neutral-900 text-white"><Plus className="h-4 w-4 mr-1"/>Add</Button>
    </div>
    {isLoading?<p>Loading...</p>:(data||[]).length===0?<div className="bg-card rounded-xl p-12 text-center border border-border"><p className="text-muted-foreground">No saved addresses</p></div>
    :<div className="grid sm:grid-cols-2 gap-4">{(data||[]).map((a:any)=><div key={a.id} className="bg-card rounded-xl p-5 border border-border shadow-sm">
      {a.label&&<p className="text-xs text-muted-foreground uppercase mb-1">{a.label}</p>}
      <p className="text-sm font-medium">{a.firstName} {a.lastName}</p>
      <p className="text-sm text-muted-foreground">{a.address1}</p>
      <p className="text-sm text-muted-foreground">{a.city}, {a.state} {a.postalCode}</p>
      <div className="flex gap-2 mt-3">
        <button onClick={()=>onEdit(a.id)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Pencil className="h-3 w-3"/>Edit</button>
        <button onClick={()=>del.mutate({id:a.id})} className="text-xs text-red-500 flex items-center gap-1"><Trash2 className="h-3 w-3"/>Delete</button>
      </div>
    </div>)}</div>}
  </W>;
}

function Form({id,done}:{id:number|'new';done:()=>void}) {
  const u=trpc.useUtils();
  const {data}=trpc.customer.addresses.useQuery();
  const ex=id!=='new'?data?.find((a:any)=>a.id===id):null;
  const [f,s]=useState({label:ex?.label||'',firstName:ex?.firstName||'',lastName:ex?.lastName||'',address1:ex?.address1||'',address2:ex?.address2||'',city:ex?.city||'',state:ex?.state||'',postalCode:ex?.postalCode||'',phone:ex?.phone||'',isDefaultShipping:!!ex?.isDefaultShipping,isDefaultBilling:!!ex?.isDefaultBilling});
  const add=trpc.customer.addAddress.useMutation({onSuccess:()=>{toast.success('Saved');u.customer.addresses.invalidate();done();}});
  const upd=trpc.customer.updateAddress.useMutation({onSuccess:()=>{toast.success('Updated');u.customer.addresses.invalidate();done();}});
  const go=(e:React.FormEvent)=>{e.preventDefault();id==='new'?add.mutate(f):upd.mutate({id,...f});};
  const c="h-11 text-sm";
  return <W>
    <div className="flex items-center gap-3 mb-8"><button onClick={done}><ArrowLeft className="h-5 w-5"/></button><h1 className="text-2xl font-serif">{id==='new'?'Add':'Edit'} Address</h1></div>
    <form onSubmit={go} className="bg-card rounded-xl p-6 border border-border shadow-sm space-y-4">
      <Input placeholder="Label (Home, Work)" value={f.label} onChange={e=>s({...f,label:e.target.value})} className={c}/>
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="First Name" value={f.firstName} onChange={e=>s({...f,firstName:e.target.value})} required className={c}/>
        <Input placeholder="Last Name" value={f.lastName} onChange={e=>s({...f,lastName:e.target.value})} required className={c}/>
      </div>
      <Input placeholder="Address" value={f.address1} onChange={e=>s({...f,address1:e.target.value})} required className={c}/>
      <Input placeholder="Apt/Suite" value={f.address2} onChange={e=>s({...f,address2:e.target.value})} className={c}/>
      <div className="grid grid-cols-3 gap-3">
        <Input placeholder="City" value={f.city} onChange={e=>s({...f,city:e.target.value})} required className={c}/>
        <Input placeholder="State" value={f.state} onChange={e=>s({...f,state:e.target.value})} required className={c}/>
        <Input placeholder="ZIP" value={f.postalCode} onChange={e=>s({...f,postalCode:e.target.value})} required className={c}/>
      </div>
      <Input placeholder="Phone" value={f.phone} onChange={e=>s({...f,phone:e.target.value})} className={c}/>
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="bg-neutral-900 text-white">Save</Button>
        <Button type="button" variant="outline" onClick={done}>Cancel</Button>
      </div>
    </form>
  </W>;
}
