import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function TrackOrder() {
  const [mode, setMode] = useState<'tracking'|'order'>('tracking');
  const [tn, setTn] = useState('');
  const [on, setOn] = useState('');
  const [em, setEm] = useState('');
  const [go, setGo] = useState(false);
  const q = trpc.shop.orders.trackShipment.useQuery(
    mode==='tracking'?{trackingNumber:tn}:{orderNumber:on,email:em},
    {enabled:go&&(mode==='tracking'?!!tn:!!on&&!!em),retry:false,refetchInterval:go?60000:false}
  );
  const sub = (e: React.FormEvent) => { e.preventDefault(); setGo(true); };
  const sc = (s?:string) => {
    if(!s) return 'bg-neutral-100 text-neutral-700';
    const l=s.toLowerCase();
    if(l.includes('delivered')) return 'bg-green-50 text-green-700';
    if(l.includes('transit')) return 'bg-blue-50 text-blue-700';
    return 'bg-amber-50 text-amber-700';
  };
  return (
    <div className="min-h-screen bg-background py-20 px-4"><div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-serif tracking-wide text-foreground">Track Your Order</h1>
        <p className="text-sm text-muted-foreground mt-3">Enter your tracking number or order details</p>
      </div>
      <div className="flex justify-center gap-2 mb-6">
        {(['tracking','order'] as const).map(m=><button key={m} onClick={()=>{setMode(m);setGo(false);}} className={`px-4 py-2 text-sm rounded-full border ${mode===m?'bg-primary text-primary-foreground border-primary':'bg-card text-muted-foreground border-border'}`}>{m==='tracking'?'Tracking Number':'Order Number'}</button>)}
      </div>
      <form onSubmit={sub} className="bg-card rounded-xl p-6 shadow-sm border border-border mb-8">
        {mode==='tracking'?<div><label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">USPS Tracking Number</label><Input value={tn} onChange={e=>{setTn(e.target.value);setGo(false);}} placeholder="e.g. 9400111899223456789012" className="h-11"/></div>
        :<div className="space-y-3"><div><label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Order Number</label><Input value={on} onChange={e=>{setOn(e.target.value);setGo(false);}} placeholder="JXE-..." className="h-11"/></div><div><label className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Email</label><Input type="email" value={em} onChange={e=>{setEm(e.target.value);setGo(false);}} placeholder="your@email.com" className="h-11"/></div></div>}
        <Button type="submit" className="w-full h-11 mt-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">Track Shipment</Button>
      </form>
      {q.isLoading&&<div className="text-center text-muted-foreground py-8">Looking up tracking info...</div>}
      {q.error&&<div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm">{q.error.message}</div>}
      {q.data&&<div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p><span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${sc(q.data.status)}`}>{q.data.status||'Unknown'}</span></div>
          {q.data.estimatedDelivery&&<div className="text-right"><p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Delivery</p><p className="mt-1 text-sm font-medium">{q.data.estimatedDelivery}</p></div>}
        </div>
        {q.data.trackingEvents&&q.data.trackingEvents.length>0&&<div><h3 className="text-sm font-medium text-foreground mb-3">Tracking History</h3><div className="space-y-3">{q.data.trackingEvents.map((ev:any,i:number)=><div key={i} className="flex gap-3 text-sm"><div className="w-2 h-2 rounded-full bg-neutral-400 mt-1.5 shrink-0"/><div><p className="text-foreground">{ev.description||ev.eventDescription}</p><p className="text-muted-foreground text-xs">{ev.date||ev.eventDate} {ev.city&&`· ${ev.city}, ${ev.state}`}</p></div></div>)}</div></div>}
      </div>}
    </div></div>
  );
}
