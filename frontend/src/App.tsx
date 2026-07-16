import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate, Outlet, useLocation, useNavigation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import UserLayout from './layouts/UserLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import { userLayoutLoader, landingLoader, productsLoader, productDetailLoader, offersLoader } from './lib/loaders';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const LoginOtp = lazy(() => import('./pages/LoginOtp'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const LensSelection = lazy(() => import('./pages/LensSelection'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const SavedPowers = lazy(() => import('./pages/SavedPowers'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Membership = lazy(() => import('./pages/Membership'));
const Offers = lazy(() => import('./pages/Offers'));
const About = lazy(() => import('./pages/About'));
const Blogs = lazy(() => import('./pages/Blogs'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));

const Payments = lazy(() => import('./pages/Payments'));
const Wallet = lazy(() => import('./pages/Wallet'));
const SupportQuestions = lazy(() => import('./pages/SupportQuestions'));
const SupportContact = lazy(() => import('./pages/SupportContact'));
const AboutEyeglaze = lazy(() => import('./pages/AboutEyeglaze'));
const RateUs = lazy(() => import('./pages/RateUs'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminAddProductWizard = lazy(() => import('./pages/admin/AddProductWizard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminTickets = lazy(() => import('./pages/admin/Tickets'));
const AdminLenses = lazy(() => import('./pages/admin/Lenses'));
const AdminCategoriesList = lazy(() => import('./pages/admin/categories/index'));
const AdminCategoryWizard = lazy(() => import('./pages/admin/categories/Wizard'));
const AdminCategoryTreeView = lazy(() => import('./pages/admin/categories/tree'));
const AdminNavigationMenuBuilder = lazy(() => import('./pages/admin/categories/menu-builder'));
const AdminHomepageVideos = lazy(() => import('./pages/admin/HomepageVideos'));
const AdminReels = lazy(() => import('./pages/admin/Reels'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const AdminBanners = lazy(() => import('./pages/admin/Banners'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center bg-[#0c0c0e]">
      <div className="w-8 h-8 rounded-full border-2 border-[#D4A04D]/20 border-t-[#D4A04D] animate-spin mb-4" />
      <span className="text-[#A7A7A7] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
        Loading...
      </span>
    </div>
  );
}

function TopLoadingBar() {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  return (
    <div
      className={`fixed top-0 left-0 right-0 h-0.5 bg-[#D4A04D] z-[9999] transition-transform origin-left`}
      style={{
        transform: isLoading ? 'scaleX(1)' : 'scaleX(0)',
        transition: isLoading 
          ? 'transform 12s cubic-bezier(0.05, 0.8, 0.1, 1.0)' 
          : 'transform 0.3s ease-out',
      }}
    />
  );
}

function RootElement() {
  return (
    <>
      <TopLoadingBar />
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootElement />}>
      <Route element={<UserLayout />} loader={userLayoutLoader} id="user-layout">
        <Route path="/" element={<Landing />} loader={landingLoader} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/otp" element={<LoginOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/products" element={<Products />} loader={productsLoader} />
        <Route path="/products/:id" element={<ProductDetail />} loader={productDetailLoader} />
        <Route path="/lens" element={<LensSelection />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/offers" element={<Offers />} loader={offersLoader} />
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

        {/* Customer Routes with Sidebar */}
        <Route element={<CustomerLayout />}>
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
            path="/saved-powers"
            element={
              <ProtectedRoute>
                <SavedPowers />
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
          path="/admin/lenses"
          element={
            <ProtectedRoute adminOnly>
              <AdminLenses />
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
        <Route
          path="/admin/reels"
          element={
            <ProtectedRoute adminOnly>
              <AdminReels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <ProtectedRoute adminOnly>
              <AdminCoupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/banners"
          element={
            <ProtectedRoute adminOnly>
              <AdminBanners />
            </ProtectedRoute>
          }
        />
      </Route>
    </Route>
  )
);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
