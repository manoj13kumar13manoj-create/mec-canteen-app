"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { Clock, CheckCircle2, Package, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  pickupLocation: string;
  createdAt: string;
  updatedAt: string;
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

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  preparing: { label: "Preparing", icon: Package, color: "bg-blue-100 text-blue-800" },
  ready: { label: "Ready for Pickup", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", icon: CheckCircle2, color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-800" },
};

export default function OrdersPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    } else if (session?.user) {
      fetchOrders();
    }
  }, [session, isPending]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?userId=${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
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

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground">
                Your order history will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center text-sm">
                        <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">Pickup: </span>
                        <span className="ml-1 font-medium">{order.pickupLocation}</span>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold mb-3">Items:</h4>
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <img
                                src={item.menuItem.imageUrl}
                                alt={item.menuItem.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.menuItem.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} × ₹{item.price}
                                </p>
                              </div>
                              <p className="font-semibold">₹{item.price * item.quantity}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t pt-4 flex justify-between items-center">
                        <span className="font-semibold">Total Amount</span>
                        <span className="text-2xl font-bold text-orange-600">
                          ₹{order.totalAmount}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
