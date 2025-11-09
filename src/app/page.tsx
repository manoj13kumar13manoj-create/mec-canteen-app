"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Search, Plus, Loader2, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";

type MenuItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
};

const categories = [
  { id: "all", label: "All Items", color: "bg-slate-100 hover:bg-slate-200" },
  { id: "snacks", label: "Snacks", color: "bg-orange-100 hover:bg-orange-200" },
  { id: "meals", label: "Meals", color: "bg-green-100 hover:bg-green-200" },
  { id: "beverages", label: "Beverages", color: "bg-blue-100 hover:bg-blue-200" },
  { id: "desserts", label: "Desserts", color: "bg-pink-100 hover:bg-pink-200" },
];

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, searchQuery, menuItems]);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch("/api/menu");
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
        setFilteredItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let items = menuItems;

    if (selectedCategory !== "all") {
      items = items.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(items);
  };

  const addToCart = async (menuItemId: number) => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setAddingToCart(menuItemId);
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          menuItemId,
          quantity: 1,
        }),
      });

      if (response.ok) {
        // Show success feedback
        setTimeout(() => setAddingToCart(null), 500);
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="container py-12">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              MEC Canteen Food Ordering
            </h1>
            <p className="text-lg md:text-xl text-orange-50 mb-6">
              Order your favorite meals and snacks from anywhere on campus. Quick, easy, and delicious!
            </p>
            {!session?.user && (
              <div className="flex gap-3">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="search"
              placeholder="Search for dishes..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={selectedCategory === category.id ? "" : category.color}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Menu Items Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="object-cover w-full h-full"
                  />
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{item.name}</h3>
                    <Badge variant="secondary" className="capitalize">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-600">₹{item.price}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className="w-full"
                    onClick={() => addToCart(item.id)}
                    disabled={!item.available || addingToCart === item.id}
                  >
                    {addingToCart === item.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}