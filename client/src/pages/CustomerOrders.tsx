import { useLocation, useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Truck } from 'lucide-react';

const fmt = (c:number) => '$'+(c/100).toFixed(2);
const SB = ({s}:{s:string}) => {
  const m:Record<string,string> = {pending:'bg-amber-50 text-amber-700',processing:'bg-blue-50 text-blue-700',shipped:'bg-indigo-50 text-indigo-700',delivered:'bg-green-50 text-green-700',cancelled:'bg-red-50 text-red-700'};
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${m[s]||'bg-neutral-100 text-neutral-600'}`}>{s}</span>;
};

export default function CustomerOrders() {
  const [,go] = useLocation();
  const {isAuthenticated,isChecking} = useCustomerAuth();
  const [,p] = useRoute('/account/orders/:on');
  if (isChecking) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated) { go('/login'); return null; }
  return p?.on ? <Detail on={p.on}/> : <List/>;
}

function List() {
  const [,go] = useLocation();
  const {data,isLoading} = trpc.customer.orders.useQuery();
  if (isLoading) return <Wrap><p className="text-center text-muted-foreground">Loading...</p></Wrap>;
  const o = data||[];
  return <Wrap>
    <div className="flex items-center gap-3 mb-8"><button onClick={()=>go('/account')}><ArrowLeft className="h-5 w-5"/></button><h1 className="text-2xl font-serif">My Orders</h1></div>
    {o.length===0?<div className="bg-card rounded-xl p-12 text-center border border-border shadow-sm"><Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4"/><p className="text-muted-foreground">No orders yet</p><Button onClick={()=>go('/shop')} className="mt-4 bg-neutral-900 text-white">Shop Now</Button></div>
    :<div className="space-y-4">{o.map((x:any)=><button key={x.id} onClick={()=>go(`/account/orders/${x.orderNumber}`)} className="w-full bg-card rounded-xl p-5 border border-border shadow-sm text-left hover:border-foreground/30">
      <div className="flex justify-between mb-2"><span className="text-sm font-medium">{x.orderNumber}</span><SB s={x.status}/></div>
      <div className="flex justify-between text-sm text-neutral-500"><span className="text-muted-foreground">{new Date(x.createdAt).toLocaleDateString()}</span><span className="font-medium text-foreground">{fmt(x.total)}</span></div>
      {x.trackingNumber&&<p className="text-xs text-muted-foreground/60 mt-2 flex items-center gap-1"><Truck className="h-3 w-3"/>{x.trackingNumber}</p>}
    </button>)}</div>}
  </Wrap>;
}

function Detail({on}:{on:string}) {
  const [,go] = useLocation();
  const {data:o,isLoading,error} = trpc.customer.orderDetail.useQuery({orderNumber:on});
  if (isLoading) return <Wrap><p className="text-center text-muted-foreground">Loading...</p></Wrap>;
  if (error||!o) return <Wrap><p className="text-center text-red-600">{error?.message||'Not found'}</p></Wrap>;
  return <Wrap>
    <div className="flex items-center gap-3 mb-8"><button onClick={()=>go('/account/orders')}><ArrowLeft className="h-5 w-5"/></button><h1 className="text-2xl font-serif">Order {o.orderNumber}</h1><SB s={o.status}/></div>
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm mb-6">
      <h2 className="text-sm font-medium mb-3">Items</h2>
      <div className="divide-y">{(o.items||[]).map((it:any,i:number)=><div key={i} className="py-3 flex justify-between text-sm"><div><p>{it.productName||it.name||'Item'}</p><p className="text-muted-foreground">Qty: {it.quantity}</p></div><p className="font-medium">{fmt(it.price*it.quantity)}</p></div>)}</div>
      <div className="border-t mt-3 pt-3 text-sm flex justify-between font-medium"><span>Total</span><span>{fmt(o.total)}</span></div>
    </div>
    {o.tracking&&<div className="bg-card rounded-xl p-6 border border-border shadow-sm">
      <h2 className="text-sm font-medium mb-3">Tracking</h2>
      <p className="text-sm mb-2">Status: <span className="font-medium">{o.tracking.status}</span></p>
      {o.tracking.estimatedDelivery&&<p className="text-sm mb-3">Est. Delivery: {o.tracking.estimatedDelivery}</p>}
      {o.tracking.trackingEvents?.map((ev:any,i:number)=><div key={i} className="flex gap-3 text-sm py-1"><div className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0"/><div><p>{ev.description||ev.eventDescription}</p><p className="text-xs text-muted-foreground">{ev.date||ev.eventDate}</p></div></div>)}
    </div>}
  </Wrap>;
}

function Wrap({children}:{children:React.ReactNode}) {
  return <div className="min-h-screen bg-background py-20 px-4"><div className="max-w-3xl mx-auto">{children}</div></div>;
}
