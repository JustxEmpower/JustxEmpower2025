import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/AdminSidebar";
import {
  ShoppingBag,
  Package,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Link } from "wouter";

export default function AdminShop() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isChecking } = useAdminAuth();

  // Fetch shop statistics
  const productsQuery = trpc.admin.products.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const ordersQuery = trpc.admin.orders.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [isAuthenticated, isChecking, setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const productsData = productsQuery.data;
  const products = productsData?.products || [];
  const ordersData = ordersQuery.data;
  const orders = ordersData?.orders || [];

  // Calculate statistics
  const totalProducts = products.length as number;
  const publishedProducts = products.filter((p: any) => p.published).length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar variant="dark" />

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-serif text-stone-900 mb-2">Shop Management</h1>
              <p className="text-stone-600">Manage your products, orders, and shop settings</p>
            </div>
            <Link href="/admin/products">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Total Products</CardTitle>
                <Package className="w-4 h-4 text-stone-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-stone-900">{totalProducts}</div>
                <p className="text-xs text-stone-500 mt-1">{publishedProducts} published</p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Total Orders</CardTitle>
                <ShoppingBag className="w-4 h-4 text-stone-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-stone-900">{totalOrders}</div>
                <p className="text-xs text-stone-500 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-stone-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-stone-900">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-stone-500 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-stone-600">Avg Order Value</CardTitle>
                <TrendingUp className="w-4 h-4 text-stone-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-stone-900">
                  ${totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00'}
                </div>
                <p className="text-xs text-stone-500 mt-1">Per order</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link href="/admin/products">
              <Card className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    Products
                  </CardTitle>
                  <CardDescription>Manage your product catalog</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600">
                    Add, edit, and organize your products. Set prices, descriptions, and images.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/orders">
              <Card className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                    Orders
                  </CardTitle>
                  <CardDescription>View and manage orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600">
                    Track order status, process refunds, and view customer details.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/events">
              <Card className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    Events
                  </CardTitle>
                  <CardDescription>Manage events and tickets</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-stone-600">
                    Create events, set ticket prices, and manage registrations.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Products */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>Your latest product additions</CardDescription>
            </CardHeader>
            <CardContent>
              {(!products || products.length === 0) ? (
                <div className="text-center py-8 text-stone-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No products yet. Add your first product!</p>
                  <Link href="/admin/products">
                    <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.slice(0, 5).map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-stone-200 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-stone-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-stone-900">{product.name}</h3>
                          <p className="text-sm text-stone-500">${product.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          product.published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {product.published ? 'Published' : 'Draft'}
                        </span>
                        <Link href={`/shop/${product.slug}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href="/admin/products">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
