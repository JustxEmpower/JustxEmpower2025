import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { ChevronLeft, CreditCard, Loader2, CheckCircle, Shield, Gift, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface BillingInfo {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

function getSessionId(): string {
  let sessionId = localStorage.getItem("cart_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("cart_session_id", sessionId);
  }
  return sessionId;
}

function CheckoutForm() {
  const [, navigate] = useLocation();
  const { cart, getCartTotal, clearCart } = useCart();
  const stripe = useStripe();
  const elements = useElements();
  
  const [step, setStep] = useState<"shipping" | "payment" | "complete">("shipping");
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [orderNotes, setOrderNotes] = useState("");
  const [isGift, setIsGift] = useState(false);
  const [hideReceipt, setHideReceipt] = useState(false);

  const sessionId = getSessionId();
  
  // Sync cart to server
  const updateCart = trpc.shop.cart.update.useMutation();
  const createPaymentIntent = trpc.shop.checkout.createPaymentIntent.useMutation();
  const completeOrder = trpc.shop.checkout.completeOrder.useMutation();

  // Sync cart when component mounts
  useEffect(() => {
    if (cart.length > 0) {
      updateCart.mutate({
        sessionId,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          imageUrl: item.image,
        })),
      });
    }
  }, [cart, sessionId]);

  const subtotal = getCartTotal();
  const shipping = subtotal >= 10000 ? 0 : 1000;
  const tax = 0;
  const total = subtotal + shipping + tax;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingInfo.firstName || !shippingInfo.lastName || !shippingInfo.email || 
        !shippingInfo.address1 || !shippingInfo.city || !shippingInfo.state || !shippingInfo.postalCode) {
      toast.error("Please fill in all required fields");
      return;
    }
    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // Create payment intent
      const { clientSecret } = await createPaymentIntent.mutateAsync({
        sessionId,
        email: shippingInfo.email,
        shippingAddress: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          address1: shippingInfo.address1,
          address2: shippingInfo.address2,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postalCode: shippingInfo.postalCode,
          country: shippingInfo.country,
        },
      });

      if (!clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      // Use billing address for payment (fraud protection)
      const billing = billingSameAsShipping ? shippingInfo : billingInfo;
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${billing.firstName} ${billing.lastName}`,
            email: shippingInfo.email,
            phone: shippingInfo.phone,
            address: {
              line1: billing.address1,
              line2: billing.address2,
              city: billing.city,
              state: billing.state,
              postal_code: billing.postalCode,
              country: billing.country,
            },
          },
        },
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Complete the order
        const result = await completeOrder.mutateAsync({
          sessionId,
          paymentIntentId: paymentIntent.id,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          shippingAddress: {
            firstName: shippingInfo.firstName,
            lastName: shippingInfo.lastName,
            address1: shippingInfo.address1,
            address2: shippingInfo.address2,
            city: shippingInfo.city,
            state: shippingInfo.state,
            postalCode: shippingInfo.postalCode,
            country: shippingInfo.country,
          },
        });

        clearCart();
        setOrderNumber(result.orderNumber);
        setStep("complete");
        toast.success("Order placed successfully!");
      }
    } catch (err) {
      toast.error("Failed to process payment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && step !== "complete") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Your cart is empty</h1>
          <Link href="/shop">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground mb-2">Order Confirmed!</h1>
          {orderNumber && (
            <p className="text-lg font-medium text-foreground mb-2">Order #{orderNumber}</p>
          )}
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. You will receive a confirmation email shortly.
          </p>
          <Link href="/shop">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <Link href="/shop">
          <Button variant="outline" className="mb-8">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <div>
            <h1 className="text-3xl font-serif text-foreground mb-8">Checkout</h1>

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
              <div className={`flex items-center gap-2 ${step === "shipping" ? "text-foreground" : "text-muted-foreground"}`}>
                <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium">1</span>
                <span>Shipping</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className={`flex items-center gap-2 ${step === "payment" ? "text-foreground" : "text-muted-foreground"}`}>
                <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium">2</span>
                <span>Payment</span>
              </div>
            </div>

            {step === "shipping" && (
              <form onSubmit={handleShippingSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={shippingInfo.firstName}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={shippingInfo.lastName}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address1">Address *</Label>
                      <Input
                        id="address1"
                        value={shippingInfo.address1}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address1: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="address2">Apartment, suite, etc.</Label>
                      <Input
                        id="address2"
                        value={shippingInfo.address2}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, address2: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={shippingInfo.state}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postalCode">ZIP Code *</Label>
                        <Input
                          id="postalCode"
                          value={shippingInfo.postalCode}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={shippingInfo.country}
                          onChange={(e) => setShippingInfo({ ...shippingInfo, country: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Gift Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Gift Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isGift"
                        checked={isGift}
                        onCheckedChange={(checked) => setIsGift(checked as boolean)}
                      />
                      <Label htmlFor="isGift" className="text-sm font-normal cursor-pointer">
                        This is a gift
                      </Label>
                    </div>
                    {isGift && (
                      <div className="flex items-center space-x-2 ml-6">
                        <Checkbox
                          id="hideReceipt"
                          checked={hideReceipt}
                          onCheckedChange={(checked) => setHideReceipt(checked as boolean)}
                        />
                        <Label htmlFor="hideReceipt" className="text-sm font-normal cursor-pointer">
                          Hide prices/receipt from package
                        </Label>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes to Seller */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Notes to Seller
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add any special instructions or notes for your order..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" size="lg">
                  Continue to Payment
                </Button>
              </form>
            )}

            {step === "payment" && (
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border rounded-md">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: "16px",
                              color: "#424770",
                              "::placeholder": { color: "#aab7c4" },
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Billing Address
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Required for fraud protection</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="billingSame"
                        checked={billingSameAsShipping}
                        onCheckedChange={(checked) => setBillingSameAsShipping(checked as boolean)}
                      />
                      <Label htmlFor="billingSame" className="text-sm font-normal cursor-pointer">
                        Same as shipping address
                      </Label>
                    </div>

                    {!billingSameAsShipping && (
                      <div className="space-y-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="billingFirstName">First Name *</Label>
                            <Input
                              id="billingFirstName"
                              value={billingInfo.firstName}
                              onChange={(e) => setBillingInfo({ ...billingInfo, firstName: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="billingLastName">Last Name *</Label>
                            <Input
                              id="billingLastName"
                              value={billingInfo.lastName}
                              onChange={(e) => setBillingInfo({ ...billingInfo, lastName: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="billingAddress1">Address *</Label>
                          <Input
                            id="billingAddress1"
                            value={billingInfo.address1}
                            onChange={(e) => setBillingInfo({ ...billingInfo, address1: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingAddress2">Apartment, suite, etc.</Label>
                          <Input
                            id="billingAddress2"
                            value={billingInfo.address2}
                            onChange={(e) => setBillingInfo({ ...billingInfo, address2: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="billingCity">City *</Label>
                            <Input
                              id="billingCity"
                              value={billingInfo.city}
                              onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="billingState">State *</Label>
                            <Input
                              id="billingState"
                              value={billingInfo.state}
                              onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="billingPostalCode">ZIP Code *</Label>
                            <Input
                              id="billingPostalCode"
                              value={billingInfo.postalCode}
                              onChange={(e) => setBillingInfo({ ...billingInfo, postalCode: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="billingCountry">Country</Label>
                            <Input
                              id="billingCountry"
                              value={billingInfo.country}
                              onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep("shipping")} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" disabled={!stripe || loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay ${formatPrice(total)}`
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
