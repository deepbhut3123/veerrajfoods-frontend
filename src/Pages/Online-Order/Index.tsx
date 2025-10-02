import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  message,
  Typography,
  Row,
  Col,
  Card,
  List,
  Tag,
  DatePicker,
  Tooltip,
  Select,
} from "antd";
import {
  addOnlineOrderDetail,
  getOnlineOrderDetail,
  deleteOnlineOrderDetail,
  exportToexcelOnline,
  getSingleOrderDetail,
  updateOrderDetail,
} from "../../Utils/Api";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircleOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  PrinterOutlined,
  CopyOutlined,
  ExportOutlined,
  TruckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title } = Typography;
const { Text } = Typography;
const { RangePicker } = DatePicker;

interface Product {
  productName: string;
  productPrice: number;
  quantity: number;
  total: number;
}

interface Order {
  _id: string;
  orderDate: string;
  customerName: string;
  phoneNo: string;
  area: string;
  products: Product[];
  totalAmount: number;
  weight: string;
  courier: string;
  trackingNumber: string;
  orderSource: string;
  createdAt: string;
}

const OnlineOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [grandTotal, setGrandTotal] = useState(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchValue, setSearchValue] = useState("");
  //   const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<
    [string, string] | null
  >(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<Order[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const logo = require("../../Assets/VEERRAJLOGOR.jpg");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    const toast = document.createElement("div");

    // Set icon based on type
    const icon = type === "success" ? "✅" : "❌";

    toast.innerHTML = `
    <span style="margin-right:8px;">${icon}</span>
    <span>${text}</span>
  `;

    // Style
    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 20px";
    toast.style.background =
      type === "success"
        ? "linear-gradient(135deg, #43e97b, #38f9d7)"
        : "linear-gradient(135deg, #ff4e50, #f9d423)";
    toast.style.color = "#fff";
    toast.style.fontWeight = "500";
    toast.style.fontSize = "14px";
    toast.style.borderRadius = "12px";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.style.zIndex = "9999";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    });

    // Animate out and remove after 2 seconds
    setTimeout(() => {
      toast.style.transform = "translateX(120%)";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: Order[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
  };

  const handleToggle = (id: string) => {
    setExpandedRowKeys((prev) =>
      prev.includes(id) ? prev.filter((key) => key !== id) : [...prev, id]
    );
  };

  const fetchOrders = async (filters: any = {}) => {
    setLoading(true);
    try {
      const res = await getOnlineOrderDetail(filters);
      setOrders(res.data || res);
    } catch (error) {
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      const products = values.products.map((p: any) => ({
        ...p,
        total: p.productPrice * p.quantity,
      }));
      const totalAmount = products.reduce(
        (sum: number, p: any) => sum + p.total,
        0
      );

      const payload = {
        ...values,
        orderDate: values.orderDate?.format("YYYY-MM-DD"),
        products,
        totalAmount,
      };

      if (isEditMode && selectedOrder) {
        await updateOrderDetail(selectedOrder._id, payload);
        message.success("Order updated successfully");
      } else {
        await addOnlineOrderDetail(payload);
        message.success("Order added successfully");
      }

      form.resetFields();
      setGrandTotal(0);
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      message.error(
        isEditMode ? "Failed to update order" : "Failed to add order"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOnlineOrderDetail(id);
      message.success("Order deleted successfully");
      fetchOrders();
    } catch (error) {
      message.error("Failed to delete order");
    }
  };
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleExportExcel = async () => {
    if (selectedRows.length === 0) {
      message.warning("Please select at least one order to export.");
      return;
    }

    try {
      const res = await exportToexcelOnline({ payload: selectedRows });

      // backend should return file (Buffer/Blob), so handle it here
      const blob = new Blob([res], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Orders.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error("Failed to export orders");
    }
  };

  const handleEdit = async (orderId: string) => {
    try {
      setLoading(true);
      const res = await getSingleOrderDetail(orderId);

      // FIX: adjust based on API response
      const order = res.data?.data || res.data;

      if (!order) {
        message.error("Order not found");
        return;
      }

      form.setFieldsValue({
        ...order,
        orderDate: order.orderDate ? dayjs(order.orderDate) : null,
        products: order.products?.map((p: any) => ({
          productName: p.productName,
          productPrice: p.productPrice,
          quantity: p.quantity,
          total: p.total,
        })),
      });

      setSelectedOrder(order);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (err) {
      message.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  // live grand total calculation
  const updateTotals = () => {
    const products = form.getFieldValue("products") || [];

    // recalc each product total
    const updatedProducts = products.map((p: any) => ({
      ...p,
      total: (p?.productPrice || 0) * (p?.quantity || 0),
    }));

    const total = updatedProducts.reduce(
      (sum: number, p: any) => sum + (p.total || 0),
      0
    );

    // update fields
    form.setFieldsValue({ products: updatedProducts, totalAmount: total });
    setGrandTotal(total);
  };

  const handlePrintSelected = () => {
    if (selectedRows.length === 0) {
      message.warning("Please select at least one order to print.");
      return;
    }

    const printWindow = window.open("", "", "width=900,height=650");
    if (!printWindow) return;

    const companyLogo = logo;
    const companyName = "VEERRAAJ FOODS";
    const companyContact = "AHMEDABAD - 90994 00116";

    let htmlContent = `
    <html>
      <head>
        <title>Customer Info</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .page { 
            display: grid;
            grid-template-columns: 1fr 1fr; /* 2 columns */
            gap: 12px 20px; /* row gap, column gap */
          }
          .record {
            border: 1px solid #ccc;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 13px;
            line-height: 1.4;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 200px; /* enough height for logo/footer */
            box-sizing: border-box;
            break-inside: avoid; /* prevent splitting across pages */
            page-break-inside: avoid; /* older browsers */
          }
          .record h3 {
            margin: 0 0 6px 0;
            font-size: 14px;
            color: #333;
          }
          .record p {
            margin: 2px 0;
          }
          .company-footer {
            display: flex;
            align-items: center;
            margin-top: 8px;
            border-top: 1px solid #ccc;
            padding-top: 5px;
            gap: 12px;
            font-size: 12px;
          }
          .company-footer img {
            height: 30px;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="page">
  `;

    selectedRows.forEach((record) => {
      htmlContent += `
      <div class="record">
        <div>
          <h3>${record.customerName || "N/A"}</h3>
          <p><strong>Mobile:</strong> ${record.phoneNo || "-"}</p>
          <p><strong>Address:</strong> ${record.area || "-"}</p>
        </div>
        <div class="company-footer">
          <img src="${companyLogo}" alt="Company Logo" />
          <div>
            <div><strong>From:</strong> ${companyName}</div>
            <div>${companyContact}</div>
          </div>
        </div>
      </div>
    `;
    });

    htmlContent += `</div></body></html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const columns = [
    {
      title: "#",
      dataIndex: "serial",
      key: "serial",
      align: "center" as "center",
      width: 80,
      render: (_text: any, _record: any, index: number) => index + 1,
    },
    {
      title: "Date",
      dataIndex: "orderDate",
      width: 110,
      render: (date: string) => {
        if (!date) return "-";
        const d = new Date(date);
        return d
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          })
          .replace(/\//g, " - "); // dd-mm-yyyy
      },
    },
    { title: "Name", dataIndex: "customerName", width: 150 },
    {
      title: "Phone No",
      dataIndex: "phoneNo",
      width: 130,
      render: (text: string) => {
        if (!text) return "";

        // Remove all spaces first
        const cleaned = text.replace(/\s+/g, "");

        // Insert a space after 5 digits if not already formatted
        if (cleaned.length === 10) {
          return cleaned.replace(/(\d{5})(\d{5})/, "$1 $2");
        }

        return text; // fallback
      },
    },
    { title: "Address", dataIndex: "area" },
    { title: "Total", dataIndex: "totalAmount", width: 100 },
    {
      title: "Action",
      width: 150,
      render: (_: any, record: Order) => (
        <>
          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
            <Tooltip title="View Products">
              <div
                onClick={() => handleToggle(record._id)}
                style={{
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #a18cd1, #fbc2eb)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
                }}
              >
                {expandedRowKeys.includes(record._id) ? (
                  <EyeInvisibleOutlined
                    style={{ fontSize: 16, color: "#fff" }}
                  />
                ) : (
                  <EyeOutlined style={{ fontSize: 16, color: "#fff" }} />
                )}
              </div>
            </Tooltip>
            <Tooltip title="Copy Tracking No">
              <div
                onClick={() => {
                  const msg = `Good news! 🎉 

Hello, ${record.customerName}
Your order has been shipped.

🔍 Tracking ID: ${record.trackingNumber}
🌐 Track your order here: [Tracking Link]

Thank you for shopping with us! 😊

- VEERRAAJ FOODS - Ahmedabad`;

                  navigator.clipboard
                    .writeText(msg)
                    .then(() => showToast("Customer tracking message copied!", "success"))
                    .catch(() =>
                      showToast("Failed to copy tracking number", "error")
                    );
                }}
                style={{
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #ff9966, #ff5e62)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
                }}
              >
                <TruckOutlined style={{ fontSize: 16, color: "#fff" }} />
              </div>
            </Tooltip>
            <Tooltip title="Copy Customer Detail">
              <div
                onClick={() => {
                  const msg = `Customer Name:- ${record.customerName}
                  Contact Number:- ${record.phoneNo}`

                  navigator.clipboard
                    .writeText(msg)
                    .then(() => showToast("Customer details copied!", "success"))
                    .catch(() =>
                      showToast("Failed to copy tracking number", "error")
                    );
                }}
                style={{
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #43e97b, #38f9d7)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
                }}
              >
                <CopyOutlined style={{ fontSize: 16, color: "#fff" }} />
              </div>
            </Tooltip>
            <Tooltip title="Edit">
              <div
                onClick={() => handleEdit(record._id)}
                style={{
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #36d1dc, #5b86e5)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
                }}
              >
                <EditOutlined style={{ fontSize: 16, color: "#fff" }} />
              </div>
            </Tooltip>
          </div>
        </>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(135deg, #f0f2f5 0%, #e8ecf3 100%)",
        height: "41rem",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Row
        gutter={[16, 16]}
        align="middle"
        justify="space-between"
        style={{ marginBottom: 16 }}
        wrap={false} // prevent wrapping to new line
      >
        {/* Left side: Title + Search + RangePicker */}
        <Col flex="auto">
          <Space
            align="center"
            wrap={false}
            style={{ width: "100%", flexWrap: "nowrap" }}
          >
            <Title
              level={3}
              style={{
                margin: 0,
                minWidth: 180,
                textAlign: window.innerWidth < 768 ? "center" : "left",
              }}
            >
              Order Details
            </Title>

            <Input.Search
              // placeholder="Search by customer, phone, area..."
              allowClear
              onSearch={(value) => {
                const [startDate, endDate] = selectedDateRange || [];
                fetchOrders({
                  search: value,
                  ...(startDate && endDate ? { startDate, endDate } : {}),
                });
              }}
              style={{ flex: 1, minWidth: 200, maxWidth: 240 }}
            />

            <RangePicker
              style={{ flex: 1, minWidth: 220, maxWidth: 260 }}
              onChange={(dates, dateStrings) => {
                const [startDate, endDate] = dateStrings;
                setSelectedDateRange(dateStrings);
                fetchOrders({
                  search: searchValue,
                  startDate,
                  endDate,
                });
              }}
            />
          </Space>
        </Col>

        {/* Right side: Buttons */}
        <Col>
          <Space wrap={false}>
            <Tooltip title="Add Details">
            <Button
              type="primary"
              icon={<PlusCircleOutlined size={18} />}
              onClick={() => setIsModalOpen(true)}
              style={{
                background: "#4b6cb7",
                borderColor: "#4b6cb7",
                padding: "6px 16px",
                borderRadius: "8px",
              }}
            ></Button>
            </Tooltip>

              <Tooltip title="Export Excel">
            <Button
              type="default"
              icon={<ExportOutlined size={18} />}
              onClick={handleExportExcel}
              disabled={selectedRows.length === 0}
              style={{
                background:
                  selectedRows.length === 0
                    ? "linear-gradient(135deg, #d9d9d9 0%, #f0f0f0 100%)"
                    : "linear-gradient(135deg, #28a745 0%, #85d96b 100%)",
                border: "none",
                color: selectedRows.length === 0 ? "#888" : "#fff",
                borderRadius: "8px",
                padding: "6px 16px",
              }}
            ></Button>
            </Tooltip>

            <Tooltip title="Print">
            <Button
              type="default"
              onClick={handlePrintSelected}
              disabled={selectedRows.length === 0}
              style={{
                background:
                  selectedRows.length === 0
                    ? "linear-gradient(135deg, #d9d9d9 0%, #f0f0f0 100%)"
                    : "linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)",
                border: "none",
                color: selectedRows.length === 0 ? "#888" : "#fff",
                borderRadius: "8px",
                padding: "6px 16px",
              }}
            >
              <PrinterOutlined style={{ fontSize: 16 }} />
            </Button>
</Tooltip>
<Tooltip title="Delete">
            <Button
              type="default"
              danger
              onClick={() => setDeleteModalVisible(true)}
              disabled={selectedRows.length === 0}
              style={{
                background:
                  selectedRows.length === 0
                    ? "linear-gradient(135deg, #d9d9d9 0%, #f0f0f0 100%)"
                    : "linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)",
                border: "none",
                color: selectedRows.length === 0 ? "#888" : "#fff",
                borderRadius: "8px",
                padding: "6px 16px",
              }}
            >
              <DeleteOutlined style={{ fontSize: 16 }} />
            </Button>
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {/* <Card
        style={{
          borderRadius: "20px",
          //   padding: "14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          background: "#ffffff",
          marginTop: "28px",
          height: "100%",
        }}
      > */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={false}
        rowSelection={rowSelection}
        scroll={{ x: 1300, y: 650 }}
        // style={{ scrollbarWidth: "thin" }}
        expandable={{
          expandedRowKeys,
          expandIcon: () => null, // remove default plus
          expandIconColumnIndex: -1,
          expandedRowRender: (record) => (
            <AnimatePresence initial={false}>
              {expandedRowKeys.includes(record._id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden", padding: "8px 0" }}
                >
                  {/* Products List */}
                  <List
                    dataSource={record.products}
                    renderItem={(item) => (
                      <List.Item
                        style={{
                          background: "#fff",
                          borderRadius: 8,
                          padding: "8px 16px",
                          marginBottom: 6,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        {/* Product name */}
                        <Text strong style={{ fontSize: 14, flex: 1 }}>
                          {item.productName}
                        </Text>

                        {/* Price / Qty / Total */}
                        <div style={{ display: "flex", gap: 12, flex: 1 }}>
                          <Tag
                            color="blue"
                            style={{ fontSize: 12, padding: "2px 6px" }}
                          >
                            ₹{item.productPrice}
                          </Tag>
                          <Tag
                            color="green"
                            style={{ fontSize: 12, padding: "2px 6px" }}
                          >
                            Qty: {item.quantity}
                          </Tag>
                          <Tag
                            color="purple"
                            style={{ fontSize: 12, padding: "2px 6px" }}
                          >
                            ₹{item.total}
                          </Tag>
                        </div>
                      </List.Item>
                    )}
                  />

                  {/* Courier & Tracking - shown only once */}
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 12,
                      padding: "8px 16px",
                      background: "#fafafa",
                      borderRadius: 8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Tag
                      color="cyan"
                      style={{ fontSize: 12, padding: "2px 6px" }}
                    >
                      Courier: {record.courier || "N/A"}
                    </Tag>
                    <Tag
                      color="geekblue"
                      style={{ fontSize: 12, padding: "2px 6px" }}
                    >
                      Tracking: {record.trackingNumber || "N/A"}
                    </Tag>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ),
        }}
      />
      {/* </Card> */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0, color: "#00695c" }}>
            {isEditMode ? "Edit Order" : "Add New Order"}
          </Title>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={1200}
        centered
        bodyStyle={{
          padding: "32px",
          backgroundColor: "#E0F7F6",
          borderRadius: "16px",
        }}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit} // ✅ unified submit
          onValuesChange={updateTotals}
          style={{ display: "flex", flexDirection: "column" }}
        >
          {/* Customer Info */}
          <Row gutter={14}>
            <Col span={8}>
              <Form.Item
                label="Customer Name"
                name="customerName"
                rules={[{ required: true, message: "Enter customer name" }]}
              >
                <Input
                  // placeholder="e.g. John Doe"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Phone No"
                name="phoneNo"
                rules={[
                  { required: true, message: "Phone number is required" },
                  {
                    pattern: /^[0-9]{10}$/,
                    message: "Phone number must be exactly 10 digits",
                  },
                ]}
              >
                <Input
                  // placeholder="e.g. 9876543210"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Address"
                name="area"
                rules={[{ required: true, message: "Enter address" }]}
              >
                <Input
                  // placeholder="e.g. Downtown"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Dynamic Product List */}
          <Form.List name="products">
            {(fields, { add, remove }) => (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    maxHeight: "300px",
                    overflowY: "auto",
                    paddingRight: "6px",
                  }}
                >
                  <AnimatePresence initial={false}>
                    {fields.map(({ key, name, ...restField }) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card
                          type="inner"
                          size="small"
                          style={{
                            background: "#fff",
                            border: "1px solid #e4eaf3",
                            borderRadius: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          }}
                        >
                          <Row gutter={16} align="middle">
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                name={[name, "productName"]}
                                label="Product Name"
                                rules={[
                                  {
                                    required: true,
                                    message: "Enter product name",
                                  },
                                ]}
                              >
                                <Input
                                  // placeholder="e.g. Samsung AC"
                                  style={{ borderRadius: 6 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                name={[name, "productPrice"]}
                                label="Price"
                                rules={[
                                  { required: true, message: "Enter price" },
                                ]}
                              >
                                <Input
                                  type="number"
                                  // placeholder="e.g. 29999"
                                  style={{ borderRadius: 6 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item
                                {...restField}
                                name={[name, "quantity"]}
                                label="Qty"
                                rules={[
                                  { required: true, message: "Enter quantity" },
                                ]}
                              >
                                <Input
                                  // type="number"
                                  // placeholder="e.g. 2"
                                  style={{ borderRadius: 6 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item
                                {...restField}
                                name={[name, "total"]}
                                label="Total"
                              >
                                <Input
                                  type="number"
                                  disabled
                                  style={{ borderRadius: 6 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={2}>
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(name)}
                                style={{ marginTop: 5 }}
                              />
                            </Col>
                          </Row>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusCircleOutlined />}
                    block
                    style={{
                      borderStyle: "dashed",
                      borderRadius: 8,
                      padding: "8px 0",
                    }}
                  >
                    Add Product
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Courier & Tracking */}
          <Row gutter={14}>
            <Col span={8}>
              <Form.Item
                label="Courier"
                name="courier"
                // rules={[{ required: true, message: "Enter courier name" }]}
              >
                <Input
                  // placeholder="e.g. Blue Dart"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Tracking Number"
                name="trackingNumber"
                // rules={[{ required: true, message: "Enter tracking no." }]}
              >
                <Input
                  // placeholder="e.g. TRK12345"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Weight"
                name="weight"
                // rules={[{ required: true, message: "Enter weight" }]}
              >
                <Input
                  // placeholder="e.g. 2kg"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={<span style={{ fontWeight: "500" }}>Order Source</span>}
                name="orderSource"
                rules={
                  [
                    // { required: true, message: "Please select order source" },
                  ]
                }
              >
                <Select
                  // placeholder="Choose Source"
                  options={[
                    { label: "🌐 Website", value: "Website" },
                    { label: "💬 WhatsApp", value: "WhatsApp" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: "Please select a date" }]}
              >
                <DatePicker
                  defaultValue={dayjs()}
                  format="DD-MM-YYYY"
                  style={{ width: "100%", borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              {/* Total Amount */}
              <Form.Item label="Total Amount" name="totalAmount">
                <Input
                  type="number"
                  disabled
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            {/* <Col span={12}>
              <Form.Item label="Total Amount" name="totalAmount">
                <Input
                  type="number"
                  disabled
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col> */}
          </Row>

          {/* Submit Button */}
          <Form.Item style={{ marginTop: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{
                height: 45,
                width: "40%",
                alignItems: "center",
                fontWeight: 600,
                borderRadius: 8,
                background: "#4b6cb7",
                borderColor: "#4b6cb7",
              }}
            >
              Submit Order
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={
          <span style={{ color: "#ff4d4f", fontWeight: 600 }}>
            <ExclamationCircleOutlined style={{ marginRight: 8 }} />
            Confirm Delete
          </span>
        }
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={async () => {
              if (selectedRows.length > 0) {
                // Delete all selected orders
                for (const order of selectedRows) {
                  await handleDelete(order._id);
                }
                setSelectedRows([]); // clear selection after deletion
              }
              setDeleteModalVisible(false);
            }}
          >
            Yes, Delete Selected
          </Button>,
        ]}
      >
        {selectedRows.length === 1 ? (
          <p>
            Are you sure you want to delete order of{" "}
            <b>{selectedRows[0].customerName}</b>?
          </p>
        ) : selectedRows.length > 1 ? (
          <p>
            Are you sure you want to delete <b>{selectedRows.length}</b>{" "}
            selected orders?
          </p>
        ) : (
          <p>No orders selected to delete.</p>
        )}
      </Modal>
    </div>
  );
};

export default OnlineOrders;
