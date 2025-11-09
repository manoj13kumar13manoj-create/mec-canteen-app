"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { CheckCircle2, Clock, MapPin, Package, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Order = {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  pickupLocation: string;
  createdAt: string;
  items: {
    id: number;
    menuItemId: number;
    quantity: number;
    price: number;
    menuItem: {
      id: number;
      name: string;
      imageUrl: string;
    };
  }[];
};

export default function OrderConfirmationPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    } else if (session?.user && orderId) {
      fetchOrder();
    } else if (!orderId) {
      router.push("/");
    }
  }, [session, isPending, orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        router.push("/orders");
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
      router.push("/orders");
    } finally {
      setIsLoading(false);
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

  if (!session?.user || !order) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8 max-w-3xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground text-lg">
            Your order has been placed successfully
          </p>
        </div>

        {/* Order Details Card */}
        <Card className="mb-6">
          <CardHeader className="bg-muted/50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Order #{order.id}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Pickup Location */}
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg mb-6">
              <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Pickup Location</p>
                <p className="text-lg font-bold text-orange-700">{order.pickupLocation}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Estimated preparation time: 15-20 minutes
                </p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items
              </h3>
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <img
                      src={item.menuItem.imageUrl}
                      alt={item.menuItem.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.menuItem.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <p className="font-semibold text-lg">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{order.totalAmount}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Pickup Fee</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <div className="border-t pt-3 mt-3 flex justify-between items-center">
                <span className="text-xl font-bold">Total Amount</span>
                <span className="text-3xl font-bold text-orange-600">
                  ₹{order.totalAmount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button asChild className="flex-1" size="lg">
            <Link href="/orders">
              <Package className="mr-2 h-4 w-4" />
              View All Orders
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>

        {/* Info Message */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>What's next?</strong> You'll receive updates as your order is being prepared. 
            Head to the {order.pickupLocation} when your order is ready for pickup.
          </p>
        </div>
      </div>
    </div>
  );
}
