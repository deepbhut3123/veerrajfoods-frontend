import NotFound from "./Components/NotFound";
import Dashboard from "./DesignLayout/Dashboard";
import DealerManagement from "./Pages/Dealer/Index";
import SalesPage from "./Pages/Sale/Index";
import OnlineOrders from "./Pages/Online-Order/Index"
import Payments from "./Pages/Payment/Index"
import Expenses from "./Pages/Expense/Index"

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

  {
    path: "/payments",
    name: "Payments",
    component: Payments,
  },

  {
    path: "/expenses",
    name: "Expenses",
    component: Expenses,
  },

  { path: "*", name: 'Not Found', component: NotFound },
  ];

export { AdminRoutes };