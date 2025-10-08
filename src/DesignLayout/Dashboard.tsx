import React, { useEffect, useState } from "react";
import { Card, Typography, Select, Row, Spin, Layout } from "antd";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  PieChart, // New Import for Donut Chart
  Pie, // New Import
  Legend, // New Import
} from "recharts";
import dayjs from "dayjs";
// Assuming these utility functions are defined elsewhere in the user's project
import { getOnlineOrderDetail, getAllSales } from "../Utils/Api";

const { Title, Text } = Typography;
const { Option } = Select;
const { Content } = Layout;

// Interface definitions remain the same
interface Order {
  _id: string;
  orderDate: string;
  totalAmount: number;
  customerName: string;
  products: {
    productName: string;
    productPrice: number;
    quantity: number;
    total: number;
    _id: string;
  }[];
}

interface Sale {
  _id: string;
  date: string;
  dealer: { dealerName: string };
  totalAmount: number;
  products: {
    productName: string;
    productPrice: number;
    quantity: number;
    total: number;
    _id: string;
  }[];
}

// Custom Tooltip for better formatting - Now handles both Area/Bar and Pie charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Check if the payload is from a Pie Chart (which embeds the full data object)
    const isPieChart = payload[0].payload && payload[0].payload.dealer;
    let salesAmount,
      itemLabel,
      percentage = "";

    if (isPieChart) {
      const data = payload[0].payload;
      salesAmount = data.sales;
      itemLabel = data.dealer;
      percentage = data.percentage ? `(${data.percentage.toFixed(1)}%)` : "";
    } else {
      // Handle Area/Bar charts
      salesAmount = payload[0].value;
      itemLabel = label;
    }

    // Format sales value as currency for better readability using INR (Rupee)
    const salesValue = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR", // Rupee symbol
      minimumFractionDigits: 0,
    }).format(salesAmount);

    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: "#fff",
          padding: "10px 15px",
          border: "1px solid #e0e0e0",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Text strong style={{ color: "#333" }}>
          {itemLabel} {percentage}
        </Text>
        <p style={{ margin: 0, color: payload[0].color || "#007bff" }}>
          Sales: <span style={{ fontWeight: "bold" }}>{salesValue}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom Legend Content for the Donut Chart
const CustomLegend = ({ payload }: any) => {
  return (
    <div style={{ marginTop: 20, textAlign: "center" }}>
      {payload.map((entry: any, index: number) => {
        const data = entry.payload;
        // Ensure data has the required fields before rendering
        if (!data || data.percentage === undefined) return null;

        return (
          <div
            key={`item-${index}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              margin: "0 10px 5px 0",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: entry.color,
                marginRight: 5,
              }}
            ></span>
            <Text style={{ fontSize: "12px" }}>
              {data.dealer} ({data.percentage.toFixed(1)}%)
            </Text>
          </div>
        );
      })}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [monthlyOrders, setMonthlyOrders] = useState<Order[]>([]);
  const [dealerSales, setDealerSales] = useState<Sale[]>([]);

  const [monthlySalesData, setMonthlySalesData] = useState<any[]>([]);
  // Dealer data now includes 'percentage' field
  const [dealerSalesData, setDealerSalesData] = useState<any[]>([]);
  const [loadingDealer, setLoadingDealer] = useState(false);

  // Initialize month and year to the current month/year
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("MM"));
  const [selectedYear, setSelectedYear] = useState(dayjs().format("YYYY"));

  // Updated modern, professional color palette
  const colors = [
    "#007bff", // Primary Blue
    "#28a745", // Green
    "#ffc107", // Yellow
    "#dc3545", // Red
    "#6f42c1", // Purple
    "#fd7e14", // Orange
  ];

  // Fetch data (using mock functions for runnable example)
  const fetchMonthlyOrders = async () => {
    try {
      const res: any = await getOnlineOrderDetail();
      setMonthlyOrders(res.data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const fetchDealerSales = async () => {
    setLoadingDealer(true);
    try {
      const res = await getAllSales(); // Original
      // const res: any = await mockGetAllSales(); // Mock
      setDealerSales(res || []);
    } catch (err) {
      console.error("Failed to fetch dealer sales:", err);
    } finally {
      setLoadingDealer(false);
    }
  };

  // Effect to group monthly orders for the first chart (Area Chart - Trend)
  useEffect(() => {
    const monthMap: Record<string, number> = {};
    monthlyOrders.forEach((order) => {
      // Use YYYY-MM format for correct sorting before extracting month name
      const monthKey = dayjs(order.orderDate).format("YYYY-MM");
      monthMap[monthKey] = (monthMap[monthKey] || 0) + order.totalAmount;
    });

    // Convert to array and sort by date key
    const formatted = Object.keys(monthMap)
      .sort()
      .map((key) => ({
        month: dayjs(key).format("MMM YYYY"), // Display short month name and year
        sales: monthMap[key],
      }));
    setMonthlySalesData(formatted);
  }, [monthlyOrders]);

  // Effect to filter and aggregate dealer sales for the second chart (Donut Chart - Comparison)
  useEffect(() => {
    let totalSales = 0; // Calculate total sales for percentage breakdown

    const filteredData = (dealerSales || [])
      .filter(
        (sale) =>
          dayjs(sale.date).format("MM") === selectedMonth &&
          dayjs(sale.date).format("YYYY") === selectedYear
      )
      .reduce((acc: Record<string, number>, sale) => {
        const dealerName = sale.dealer?.dealerName || "Unknown Dealer";
        const amount = sale.totalAmount || 0;
        acc[dealerName] = (acc[dealerName] || 0) + amount;
        totalSales += amount; // Accumulate total sales
        return acc;
      }, {});

    const formattedDealerData = Object.keys(filteredData).map((dealer) => ({
      dealer,
      sales: filteredData[dealer],
      // Calculate percentage contribution
      percentage:
        totalSales > 0 ? (filteredData[dealer] / totalSales) * 100 : 0,
    }));

    setDealerSalesData(formattedDealerData.sort((a, b) => b.sales - a.sales)); // Sort by sales for visual impact
  }, [dealerSales, selectedMonth, selectedYear]);

  // Initial data fetch
  useEffect(() => {
    fetchMonthlyOrders();
    fetchDealerSales();
  }, []);

  // Month options for Select
  const monthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ].map((m, i) => (
    <Option key={i + 1} value={(i + 1).toString().padStart(2, "0")}>
      {m}
    </Option>
  ));

  // Generate year options (current year and the past 4 years)
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i).map(
    (y) => (
      <Option key={y} value={y.toString()}>
        {y}
      </Option>
    )
  );

  // Custom Y-Axis tick formatter for currency (K for thousands), using Indian locale
  const formatCurrency = (tick: number): string => {
    // Uses 'en-IN' for correct grouping/separators. Retains compact notation for large numbers.
    if (tick >= 1000) {
      return new Intl.NumberFormat("en-IN", {
        notation: "compact",
        minimumFractionDigits: 0,
      }).format(tick);
    }
    return tick.toString();
  };

  return (
    <Content
      style={{
        padding: "24px",
        background: "#f5f7fa",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "24px",
        minHeight: "100vh", // Full viewport height
        maxHeight: "100vh", // Ensure it doesn’t shrink
        overflowY: "auto", // Enable vertical scrolling
        boxSizing: "border-box", // Ensure padding is included in height
      }}
    >
      {/* Monthly Sales Chart (Area Chart for Trend) */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)", // Deeper, softer shadow
          background: "#ffffff",
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <Title
          level={4}
          style={{ marginBottom: 20, color: "#1f2937", fontWeight: 600 }}
        >
          Overall Online Sales Trend
        </Title>

        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={monthlySalesData}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e0e7ee" // Lighter, more subtle grid lines
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              style={{ fontSize: "12px", fill: "#6b7280" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCurrency}
              style={{ fontSize: "12px", fill: "#6b7280" }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Define the gradient for the Area fill */}
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>

            <Area
              type="monotone" // Creates a smooth curve
              dataKey="sales"
              stroke={colors[0]} // Primary color for the line
              strokeWidth={3}
              fill="url(#colorSales)" // Gradient fill
              dot={{ stroke: colors[0], strokeWidth: 2, r: 4 }} // Dots for visual emphasis
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Dealer-wise Monthly Sales Chart (Now a Design-Focused Donut Chart) */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          background: "#ffffff",
          marginBottom: 50,
        }}
        bodyStyle={{ padding: "24px" }}
      >
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 20 }}
        >
          <Title
            level={4}
            style={{ color: "#1f2937", fontWeight: 600, margin: 0 }}
          >
            Dealer Contribution Breakdown
          </Title>
          <div style={{ display: "flex", gap: 12 }}>
            <Select
              value={selectedMonth}
              onChange={(val) => setSelectedMonth(val)}
              style={{ width: 140 }}
              placeholder="Select Month"
            >
              {monthOptions}
            </Select>
            <Select
              value={selectedYear}
              onChange={(val) => setSelectedYear(val)}
              style={{ width: 100 }}
              placeholder="Select Year"
            >
              {yearOptions}
            </Select>
          </div>
        </Row>

        {loadingDealer ? (
          <div
            style={{
              height: 350,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spin size="large" tip="Loading Dealer Data..." />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {dealerSalesData.length > 0 ? (
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={dealerSalesData}
                  dataKey="sales"
                  nameKey="dealer"
                  cx="50%" // Center X
                  cy="50%" // Center Y
                  innerRadius={80} // Donut hole size
                  outerRadius={140} // Outer size
                  paddingAngle={3} // Small gap between slices for visual separation
                  stroke="none"
                  labelLine={false}
                >
                  {dealerSalesData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                      }} // Added drop shadow for design
                    />
                  ))}
                </Pie>
                {/* Use a CustomLegend for clear percentage display */}
                <Legend
                  content={<CustomLegend />}
                  layout="horizontal"
                  align="center"
                  verticalAlign="bottom"
                />
              </PieChart>
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text type="secondary">
                  No dealer sales data available for the selected period.
                </Text>
              </div>
            )}
          </ResponsiveContainer>
        )}
      </Card>
    </Content>
  );
};

export default Dashboard;
