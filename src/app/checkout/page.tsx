"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  menuItemId: number;
  quantity: number;
  menuItem: {
    id: number;
    name: string;
    price: number;
  };
};

const PICKUP_LOCATIONS = ["Main Canteen", "Library Cafe", "Hostel Canteen"];

export default function CheckoutPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(PICKUP_LOCATIONS[0]);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    } else if (session?.user) {
      fetchCartItems();
    }
  }, [session, isPending]);

  const fetchCartItems = async () => {
    try {
      const response = await fetch(`/api/cart?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length === 0) {
          router.push("/cart");
        }
        setCartItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
  };

  const placeOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const orderItems = cartItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      }));

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          pickupLocation,
          items: orderItems,
        }),
      });

      if (response.ok) {
        const newOrder = await response.json();
        
        // Clear cart items
        await Promise.all(
          cartItems.map((item) =>
            fetch(`/api/cart/${item.id}`, { method: "DELETE" })
          )
        );

        // Redirect to order confirmation page with orderId
        router.push(`/order-confirmation?orderId=${newOrder.id}`);
      }
    } catch (error) {
      console.error("Failed to place order:", error);
      setIsPlacingOrder(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Location</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={pickupLocation} onValueChange={setPickupLocation}>
                  {PICKUP_LOCATIONS.map((location) => (
                    <div key={location} className="flex items-center space-x-2 mb-3">
                      <RadioGroupItem value={location} id={location} />
                      <Label htmlFor={location} className="cursor-pointer">
                        {location}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.menuItem.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ₹{item.menuItem.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pickup</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">₹{calculateTotal()}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={placeOrder}
                  disabled={isPlacingOrder}
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By placing this order, you agree to our terms and conditions
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}