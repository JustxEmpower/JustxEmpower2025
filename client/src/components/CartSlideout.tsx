import { useLocation } from "wouter";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, CartItem } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

interface CartSlideoutProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSlideout({ open, onClose }: CartSlideoutProps) {
  const [, navigate] = useLocation();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  
  const subtotal = getCartTotal();
  const shipping = subtotal >= 10000 ? 0 : 1000;
  const total = subtotal + shipping;
  
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({cart.length})
          </SheetTitle>
        </SheetHeader>
        
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Button onClick={onClose}>Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {cart.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => removeFromCart(item.id)}
                  onUpdateQuantity={(qty) => updateQuantity(item.id, qty)}
                />
              ))}
            </div>
            
            <div className="border-t px-6 py-4 space-y-4 bg-background">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
                {subtotal < 10000 && (
                  <p className="text-xs text-muted-foreground">
                    Add {formatPrice(10000 - subtotal)} more for free shipping
                  </p>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              
              <div className="space-y-2 pb-2">
                <Button onClick={handleCheckout} className="w-full" size="lg">
                  Checkout
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">
                  Continue Shopping
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearCart}
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  size="sm"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

function CartItemRow({ item, onRemove, onUpdateQuantity }: CartItemRowProps) {
  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  
  return (
    <div className="flex gap-4 items-start">
      <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        <img
          src={item.image || `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="100%" height="100%" fill="#f8f8f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="8" fill="#c9a86c">JE</text></svg>')}`}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
        {item.variant && (
          <p className="text-xs text-muted-foreground mt-1">{item.variant}</p>
        )}
        <p className="text-sm font-semibold mt-2">{formatPrice(item.price)}</p>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdateQuantity(item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
