"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";
import { Clock, CheckCircle2, Package, XCircle, Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  userId: number;
  totalAmount: number;
  status: string;
  pickupLocation: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: {
    id: number;
    quantity: number;
    price: number;
    menuItem: {
      id: number;
      name: string;
      imageUrl: string;
    };
  }[];
};

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
};

const statusOptions = ["pending", "preparing", "ready", "completed", "cancelled"];

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  preparing: { icon: Package, color: "bg-blue-100 text-blue-800" },
  ready: { icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  completed: { icon: CheckCircle2, color: "bg-gray-100 text-gray-800" },
  cancelled: { icon: XCircle, color: "bg-red-100 text-red-800" },
};

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("orders");
  
  // Menu item form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "snacks",
    imageUrl: "",
    available: true,
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    } else if (session?.user) {
      fetchOrders();
      fetchMenuItems();
    }
  }, [session, isPending]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders/all");
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

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu");
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders((orders) =>
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleAddMenuItem = async () => {
    try {
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      if (response.ok) {
        fetchMenuItems();
        setIsAddDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to add menu item:", error);
    }
  };

  const handleEditMenuItem = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/menu/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
        }),
      });

      if (response.ok) {
        fetchMenuItems();
        setIsEditDialogOpen(false);
        setEditingItem(null);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to edit menu item:", error);
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`/api/menu/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error("Failed to delete menu item:", error);
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category,
      imageUrl: item.imageUrl || "",
      available: item.available,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "snacks",
      imageUrl: "",
      available: true,
    });
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
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Orders Management</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="space-y-6">
              {orders.length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => {
                  const status = statusConfig[order.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;

                  return (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Customer: {order.user.name} ({order.user.email})
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {order.status}
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
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 text-sm">
                                  <img
                                    src={item.menuItem.imageUrl}
                                    alt={item.menuItem.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium">{item.menuItem.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Qty: {item.quantity}
                                    </p>
                                  </div>
                                  <p className="font-semibold">₹{item.price * item.quantity}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="border-t pt-4 flex justify-between items-center">
                            <div>
                              <span className="font-semibold text-lg">Total: </span>
                              <span className="text-xl font-bold text-orange-600">
                                ₹{order.totalAmount}
                              </span>
                            </div>
                            <Select
                              value={order.status}
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                              disabled={updatingOrder === order.id}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="menu">
            <div className="mb-6">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Menu Item</DialogTitle>
                    <DialogDescription>
                      Create a new item for the menu
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="snacks">Snacks</SelectItem>
                            <SelectItem value="meals">Meals</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="desserts">Desserts</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="available"
                        checked={formData.available}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, available: checked })
                        }
                      />
                      <Label htmlFor="available">Available</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMenuItem}>Add Item</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <Card key={item.id}>
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge variant={item.available ? "default" : "secondary"}>
                        {item.available ? "Available" : "Out of Stock"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-orange-600">₹{item.price}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteMenuItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Menu Item</DialogTitle>
                  <DialogDescription>
                    Update the menu item details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-price">Price (₹)</Label>
                      <Input
                        id="edit-price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="snacks">Snacks</SelectItem>
                          <SelectItem value="meals">Meals</SelectItem>
                          <SelectItem value="beverages">Beverages</SelectItem>
                          <SelectItem value="desserts">Desserts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-imageUrl">Image URL</Label>
                    <Input
                      id="edit-imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-available"
                      checked={formData.available}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, available: checked })
                      }
                    />
                    <Label htmlFor="edit-available">Available</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingItem(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditMenuItem}>Update Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
