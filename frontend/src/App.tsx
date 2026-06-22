import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import LoginOtp from './pages/LoginOtp';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import LensSelection from './pages/LensSelection';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Membership from './pages/Membership';
//ejfn
import Offers from './pages/Offers';
import About from './pages/About';
import Blogs from './pages/Blogs';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import CategoriesPage from './pages/CategoriesPage';

import Payments from './pages/Payments';
import Wallet from './pages/Wallet';
import SupportQuestions from './pages/SupportQuestions';
import SupportContact from './pages/SupportContact';
import AboutEyeglaze from './pages/AboutEyeglaze';
import RateUs from './pages/RateUs';

import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminAddProductWizard from './pages/admin/AddProductWizard';
import AdminOrders from './pages/admin/Orders';
import AdminInventory from './pages/admin/Inventory';
import AdminUsers from './pages/admin/Users';
import AdminTickets from './pages/admin/Tickets';
import AdminCategoriesList from './pages/admin/categories/index';
import AdminCategoryWizard from './pages/admin/categories/Wizard';
import AdminCategoryTreeView from './pages/admin/categories/tree';
import AdminNavigationMenuBuilder from './pages/admin/categories/menu-builder';
import AdminHomepageVideos from './pages/admin/HomepageVideos';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route element={<UserLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/login/otp" element={<LoginOtp />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/lens" element={<LensSelection />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/about" element={<About />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route path="/cart" element={<Cart />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes inside UserLayout (no sidebar) */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={<Navigate to="/profile" replace />}
            />
            <Route
              path="/membership"
              element={
                <ProtectedRoute>
                  <Membership />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support/questions"
              element={
                <ProtectedRoute>
                  <SupportQuestions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support/contact"
              element={
                <ProtectedRoute>
                  <SupportContact />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about-eyeglaze"
              element={
                <ProtectedRoute>
                  <AboutEyeglaze />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rate-us"
              element={
                <ProtectedRoute>
                  <RateUs />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route element={<AdminLayout />}>
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute adminOnly>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCategoriesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/add"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCategoryWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/edit/:type/:id"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCategoryWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/tree"
              element={
                <ProtectedRoute adminOnly>
                  <AdminCategoryTreeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories/menu-builder"
              element={
                <ProtectedRoute adminOnly>
                  <AdminNavigationMenuBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/add"
              element={
                <ProtectedRoute adminOnly>
                  <AdminAddProductWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/edit/:id"
              element={
                <ProtectedRoute adminOnly>
                  <AdminAddProductWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute adminOnly>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <ProtectedRoute adminOnly>
                  <AdminInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tickets"
              element={
                <ProtectedRoute adminOnly>
                  <AdminTickets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/homepage-videos"
              element={
                <ProtectedRoute adminOnly>
                  <AdminHomepageVideos />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
