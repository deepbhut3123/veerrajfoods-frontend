import React, { useEffect, useMemo, useState } from "react";
import { Card, Typography, Select, Row, Col, Spin, Layout } from "antd";
import {
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
} from "recharts";
import dayjs from "dayjs";
// adjust the path to your API utils if required
import { getOnlineOrderDetail, getAllSales } from "../Utils/Api";

const { Title, Text } = Typography;
const { Option } = Select;
const { Content } = Layout;

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

/** Tooltip for Pie (Dealer) and Area-style payloads */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isPieChart = Boolean(payload[0].payload && payload[0].payload.dealer);
    let salesAmount: number = 0;
    let itemLabel = label ?? "Item";
    let percentage = "";

    if (isPieChart) {
      const data = payload[0].payload;
      salesAmount = data.sales || 0;
      itemLabel = data.dealer || itemLabel;
      percentage = data.percentage ? `(${data.percentage.toFixed(1)}%)` : "";
    } else {
      salesAmount = payload[0].value || 0;
      itemLabel = label ?? payload[0].name ?? "Value";
    }

    const salesValue = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(salesAmount);

    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: 12,
          borderRadius: 8,
          boxShadow: "0 4px 14px rgba(2,6,23,0.08)",
          border: "1px solid rgba(15,23,42,0.04)",
          minWidth: 160,
        }}
      >
        <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>
          {itemLabel} {percentage}
        </div>
        <div style={{ color: "#0f172a", fontWeight: 700 }}>{salesValue}</div>
      </div>
    );
  }
  return null;
};

/** Legend used by Pie chart (Dealer) */
const CustomLegend = ({ payload }: any) => {
  if (!payload || !payload.length) return null;
  return (
    <div style={{ marginTop: 10, textAlign: "center" }}>
      {payload.map((entry: any, idx: number) => {
        const data = entry.payload;
        if (!data || data.percentage === undefined) return null;
        return (
          <div
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              margin: "6px 8px",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: entry.color,
                display: "inline-block",
              }}
            />
            <Text style={{ fontSize: 12 }}>
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
  const [dealerSalesData, setDealerSalesData] = useState<any[]>([]);
  const [loadingDealer, setLoadingDealer] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("MM"));
  const [selectedYear, setSelectedYear] = useState(dayjs().format("YYYY"));
  const colors = [
    "#A3E4D7", // Mint Green
    "#76D7C4", // Aqua Green
    "#58D68D", // Fresh Lime
    "#2ECC71", // Classic Success Green
    "#28B463", // Emerald Green
    "#1D8348", // Woodland Green
    "#27AE60", // Vibrant Grass Green
    "#52BE80", // Soft Emerald
    "#239B56", // Leaf Green
    "#1B7742", // Forest Edge
    "#145A32", // Deep Jungle
    "#0B3D20", // Dark Moss
  ];

  // Fetch functions
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
      const res: any = await getAllSales();
      setDealerSales(res || []);
    } catch (err) {
      console.error("Failed to fetch dealer sales:", err);
    } finally {
      setLoadingDealer(false);
    }
  };

  // Build monthlySalesData from orders
  useEffect(() => {
    const monthMap: Record<string, number> = {};
    monthlyOrders.forEach((order) => {
      const monthKey = dayjs(order.orderDate).format("YYYY-MM");
      monthMap[monthKey] = (monthMap[monthKey] || 0) + (order.totalAmount || 0);
    });

    const formatted = Object.keys(monthMap)
      .sort()
      .map((key) => ({
        month: dayjs(key, "YYYY-MM").format("MMM YYYY"),
        sales: monthMap[key],
      }));

    setMonthlySalesData(formatted);
  }, [monthlyOrders]);

  // Build dealerSalesData with percentage for selected month/year
  useEffect(() => {
    let totalSales = 0;
    const grouped = (dealerSales || [])
      .filter(
        (sale) =>
          dayjs(sale.date).format("MM") === selectedMonth &&
          dayjs(sale.date).format("YYYY") === selectedYear
      )
      .reduce((acc: Record<string, number>, sale) => {
        const name = sale.dealer?.dealerName || "Unknown Dealer";
        const amount = sale.totalAmount || 0;
        acc[name] = (acc[name] || 0) + amount;
        totalSales += amount;
        return acc;
      }, {});

    const formatted = Object.keys(grouped).map((dealer) => ({
      dealer,
      sales: grouped[dealer],
      percentage: totalSales > 0 ? (grouped[dealer] / totalSales) * 100 : 0,
    }));

    setDealerSalesData(formatted.sort((a, b) => b.sales - a.sales));
  }, [dealerSales, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchMonthlyOrders();
    fetchDealerSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Month and Year options (Select dropdowns)
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

  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i).map(
    (y) => (
      <Option key={y} value={y.toString()}>
        {y}
      </Option>
    )
  );

  // Prepare sorted radial data and legend payload using useMemo
  const { sortedRadialData, legendPayload } = useMemo(() => {
    const copy = [...monthlySalesData];
    copy.sort((a, b) => {
      const ta = dayjs(a.month, "MMM YYYY", true).isValid()
        ? dayjs(a.month, "MMM YYYY").valueOf()
        : dayjs(a.month, "MMM").isValid()
        ? dayjs(a.month, "MMM").valueOf()
        : dayjs(a.month).valueOf();
      const tb = dayjs(b.month, "MMM YYYY", true).isValid()
        ? dayjs(b.month, "MMM YYYY").valueOf()
        : dayjs(b.month, "MMM").isValid()
        ? dayjs(b.month, "MMM").valueOf()
        : dayjs(b.month).valueOf();
      return ta - tb;
    });

    const mapped = copy.map((d, idx) => ({
      name: d.month,
      value: d.sales,
      fill: colors[idx % colors.length],
    }));

    const payload = mapped.map((d) => ({
      value: d.name,
      type: "square",
      color: d.fill,
      payload: d,
    }));

    return { sortedRadialData: mapped, legendPayload: payload };
  }, [monthlySalesData, colors]);

  // Radial tooltip (safe)
  const RadialCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const name = item.name ?? item.payload?.name ?? "N/A";
      const value = item.value ?? item.payload?.value ?? 0;
      const color = item.fill ?? item.color ?? colors[0];

      const salesValue = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(value);

      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: 12,
            borderRadius: 8,
            boxShadow: "0 6px 20px rgba(2,6,23,0.08)",
            border: "1px solid rgba(15,23,42,0.04)",
            minWidth: 160,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                background: color,
                display: "inline-block",
              }}
            />
            <Text strong style={{ color: "#0f172a" }}>
              {name}
            </Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: "#374151" }}>Sales</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{salesValue}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Content
      style={{
        padding: "24px",
        background: "#f5f7fa",
        boxSizing: "border-box",
        minHeight: "100vh",
      }}
    >
      <Row gutter={[24, 24]}>
        {/* Left column: Radial (Monthly) */}
        <Col xs={24} sm={24} md={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              background: "#ffffff",
              minHeight: 520, // ensure card is tall enough
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            bodyStyle={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div>
              <Title
                level={4}
                style={{ marginBottom: 20, color: "#1f2937", fontWeight: 600 }}
              >
                Overall Online Sales Trend
              </Title>
            </div>

            {/* Chart area grows to take available space */}
            <div
              style={{
                flex: 1,
                minHeight: 420,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ResponsiveContainer width="100%" height={420}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="18%"
                  outerRadius="88%"
                  barSize={18}
                  data={sortedRadialData}
                >
                  <Tooltip content={<RadialCustomTooltip />} />
                  <RadialBar background dataKey="value" cornerRadius={999} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>

            {/* Custom legend rendered under the chart (TypeScript-safe) */}
            <div style={{ marginTop: 12, textAlign: "center" }}>
              {legendPayload.map((entry: any, i: number) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    margin: "6px 8px",
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 4,
                      background: entry.color,
                      display: "inline-block",
                    }}
                  />
                  <Text style={{ fontSize: 13 }}>{entry.value}</Text>
                </span>
              ))}
            </div>
          </Card>
        </Col>

        {/* Right column: Dealer Donut */}
        <Col xs={24} sm={24} md={12}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              background: "#ffffff",
              minHeight: 540, // a bit taller so donut has breathing room
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
            bodyStyle={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Title
                level={4}
                style={{ margin: 0, color: "#1f2937", fontWeight: 600 }}
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
            </div>

            {loadingDealer ? (
              <div
                style={{
                  height: 420,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin size="large" tip="Loading Dealer Data..." />
              </div>
            ) : dealerSalesData.length > 0 ? (
              <div
                style={{
                  flex: 1,
                  minHeight: 420,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ResponsiveContainer width="100%" height={480}>
                  <PieChart>
                    <Tooltip content={<CustomTooltip />} />
                    <Pie
                      data={dealerSalesData}
                      dataKey="sales"
                      nameKey="dealer"
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={160}
                      paddingAngle={3}
                      stroke="none"
                      labelLine={false}
                    >
                      {dealerSalesData.map((_, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={colors[i % colors.length]}
                          style={{
                            filter: "drop-shadow(0 2px 8px rgba(2,6,23,0.07))",
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div
                style={{
                  height: 220,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text type="secondary">
                  No dealer sales data available for the selected period.
                </Text>
              </div>
            )}

            {/* Dealer legend (reuse CustomLegend by building payload similar to before) */}
            {dealerSalesData.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <CustomLegend
                  payload={dealerSalesData.map((d: any, i: number) => ({
                    payload: d,
                    color: colors[i % colors.length],
                  }))}
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Content>
  );
};

export default Dashboard;
