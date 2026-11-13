import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import AnalyticsPage from "../pages/Analytics";
import CustomerPage from "../pages/users/CustomerPage.jsx";
import WorkerPage from "../pages/users/WorkerPage.jsx";
import Alljobspage from "../pages/jobs/Alljobspage.jsx";
import Jobcategoriespage from "../pages/jobs/Jobcategoriespage.jsx";
import Productpage from "../pages/shop/Productspage.jsx";
import Allcategoriespage from "../pages/shop/Allcategoriespage.jsx";
import Allorderspage  from "../pages/shop/Allorderspage.jsx";
import Allinventorypage   from "../pages/shop/Allinventorypage.jsx";
// import JobsListPage from '../pages/jobs/JobsListPage';
// import ProductsPage from '../pages/shop/ProductsPage';
// import OrdersPage from '../pages/shop/OrdersPage';
// import NotFoundPage from '../pages/NotFoundPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Layout eka athule thiyena routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/customers" element={<CustomerPage />} />
          <Route path="/workers" element={<WorkerPage />} />
          <Route path="/jobs" element={<Alljobspage />} />
          <Route path="/jobcategories" element={<Jobcategoriespage />} />
          <Route path="/products" element={<Productpage />} />
          <Route path="/categories" element={<Allcategoriespage />} />
          <Route path="/orders" element={<Allorderspage />} />
          <Route path="/inventory" element={<Allinventorypage />} />
          {/* <Route path="/customers" element={<CustomersPage />} />
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/jobs" element={<JobsListPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/orders" element={<OrdersPage />} /> */}
        </Route>

        {/* 404 Page */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
