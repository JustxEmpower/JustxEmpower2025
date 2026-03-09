import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react';

function W({children}:{children:React.ReactNode}) {
  return <div className="min-h-screen bg-background py-20 px-4"><div className="max-w-4xl mx-auto">{children}</div></div>;
}

export default function CustomerWishlist() {
  const [,go]=useLocation();
  const {isAuthenticated,isChecking}=useCustomerAuth();
  const u=trpc.useUtils();
  const {data,isLoading}=trpc.customer.wishlist.useQuery(undefined,{enabled:isAuthenticated});
  const rm=trpc.customer.removeFromWishlist.useMutation({onSuccess:()=>{toast.success('Removed');u.customer.wishlist.invalidate();}});

  if(isChecking) return <W><p>Loading...</p></W>;
  if(!isAuthenticated){go('/login');return null;}

  const items=data||[];
  return <W>
    <div className="flex items-center gap-3 mb-8">
      <button onClick={()=>go('/account')}><ArrowLeft className="h-5 w-5"/></button>
      <h1 className="text-2xl font-serif">Wishlist</h1>
      <span className="text-sm text-muted-foreground">({items.length})</span>
    </div>
    {isLoading?<p className="text-muted-foreground">Loading...</p>
    :items.length===0?<div className="bg-card rounded-xl p-12 text-center border border-border shadow-sm">
      <Heart className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4"/>
      <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
      <Button onClick={()=>go('/shop')} className="bg-neutral-900 text-white">Browse Shop</Button>
    </div>
    :<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map((item:any)=>{
      const p=item.product;
      if(!p) return null;
      const img=p.images?JSON.parse(p.images)[0]:null;
      const price=p.price?(p.price/100).toFixed(2):'0.00';
      return <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden group">
        <div className="aspect-square bg-muted relative cursor-pointer" onClick={()=>go(`/shop/${p.slug}`)}>
          {img?<img src={img} alt={p.name} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-muted-foreground/40"><ShoppingBag className="h-12 w-12"/></div>}
          <button onClick={e=>{e.stopPropagation();rm.mutate({productId:p.id});}} className="absolute top-3 right-3 bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
            <Trash2 className="h-4 w-4 text-red-500"/>
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm font-medium truncate">{p.name}</p>
          <p className="text-sm text-foreground mt-1">${price}</p>
        </div>
      </div>;
    })}</div>}
  </W>;
}
