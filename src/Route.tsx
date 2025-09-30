import NotFound from "./Components/NotFound";
import Dashboard from "./DesignLayout/Dashboard";
import DealerManagement from "./Pages/Dealer/Index";
import SalesPage from "./Pages/Sale/Index";
import OnlineOrders from "./Pages/Online-Order/Index"

const AdminRoutes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
  },

  {
    path: "/dealer",
    name: "Dealer",
    component: DealerManagement,
  },

  {
    path: "/sales",
    name: "Sales",
    component: SalesPage,
  },

  {
    path: "/online-order",
    name: "Online Order",
    component: OnlineOrders,
  },

  { path: "*", name: 'Not Found', component: NotFound },
  ];

export { AdminRoutes };