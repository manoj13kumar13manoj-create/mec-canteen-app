"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CartItem = {
  id: number;
  userId: number;
  menuItemId: number;
  quantity: number;
  menuItem: {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    available: boolean;
  };
};

export default function CartPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

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
        setCartItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItem(itemId);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        setCartItems((items) =>
          items.map((item) =>
            item.id === itemId ? { ...item, quantity: newQuantity } : item
          )
        );
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (itemId: number) => {
    setUpdatingItem(itemId);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCartItems((items) => items.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setUpdatingItem(null);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.menuItem.price * item.quantity,
      0
    );
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
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some delicious items from our menu
              </p>
              <Button asChild>
                <Link href="/">Browse Menu</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.menuItem.imageUrl}
                        alt={item.menuItem.name}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {item.menuItem.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {item.menuItem.description}
                        </p>
                        <p className="text-lg font-bold text-orange-600">
                          ₹{item.menuItem.price}
                        </p>
                      </div>
                      <div className="flex flex-col justify-between items-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={updatingItem === item.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="flex items-center gap-2 border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updatingItem === item.id || item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={updatingItem === item.id}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">₹{calculateTotal()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">₹0</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-orange-600">₹{calculateTotal()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/checkout">Proceed to Checkout</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
