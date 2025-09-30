import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Divider,
  Typography,
  Row,
  Col,
  Card,
  Collapse,
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
} from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const { Title } = Typography;
const { Panel } = Collapse;
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
      title: "Order Date",
      dataIndex: "orderDate",
      width: 110,
      render: (date: string) => {
        if (!date) return "-";
        const d = new Date(date);
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }); // dd-mm-yyyy
      },
    },
    { title: "Customer Name", dataIndex: "customerName", width: 130 },
    { title: "Phone No", dataIndex: "phoneNo", width: 130 },
    { title: "Area", dataIndex: "area", width: 150 },
    { title: "Courier", dataIndex: "courier", width: 100 },
    { title: "Tracking No", dataIndex: "trackingNumber", width: 110 },
    { title: "Total Amount", dataIndex: "totalAmount", width: 130 },
    {
      title: "Source",
      dataIndex: "orderSource",
      width: 130,
      render: (source: string) => {
        if (!source) return "—";

        const colors: any = {
          Website: { bg: "#e6f4ff", color: "#1677ff" },
          WhatsApp: { bg: "#f6ffed", color: "#52c41a" },
          App: { bg: "#fff7e6", color: "#fa8c16" },
          Manual: { bg: "#fff0f6", color: "#eb2f96" },
        };

        const style = {
          background: colors[source]?.bg || "#f0f0f0",
          color: colors[source]?.color || "#000",
          borderRadius: "6px",
          padding: "2px 8px",
          fontSize: "12px",
          fontWeight: 500,
        };

        return <span style={style}>{source}</span>;
      },
    },

    {
      title: "Action",
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
            {/* Print */}
            <Tooltip title="Print">
              <div
                onClick={(e) => {
                  e.stopPropagation(); // prevent expand toggle
                  const printWindow = window.open(
                    "",
                    "",
                    "width=350,height=400"
                  );

                  if (printWindow) {
                    printWindow.document.write(`
        <html>
          <head>
            <title>Customer Info</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                margin: 0;
              }
              h2 { color: #333; margin-bottom: 12px; }
              p { font-size: 14px; margin: 6px 0; }

              /* Print styling */
              @media print {
                body {
                  width: 60mm;         /* ✅ restrict width */
                  margin: 0;
                  padding: 10px;
                }
              }
            </style>
          </head>
          <body>
            <h2>Customer Information</h2>
            <p><strong>Name:</strong> ${record.customerName}</p>
            <p><strong>Mobile:</strong> ${record.phoneNo}</p>
            <p><strong>Address:</strong> ${record.area}</p>
          </body>
        </html>
      `);

                    printWindow.document.close();

                    // Wait a tick so styles apply before printing
                    printWindow.onload = () => {
                      printWindow.print();
                      printWindow.close();
                    };
                  }
                }}
                style={{
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #00c6ff, #0072ff)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
                }}
              >
                <PrinterOutlined style={{ fontSize: 16, color: "#fff" }} />
              </div>
            </Tooltip>
            <Tooltip title="Copy Tracking No">
              <div
                onClick={() => {
                  const msg = `📦 Your order has been placed successfully!\n\n🆔 Tracking Number: ${record.trackingNumber}\n\nYou can use this tracking number to check the delivery status. 🚚`;

                  navigator.clipboard
                    .writeText(msg)
                    .then(() => showToast("Tracking number copied!", "success"))
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
            <Tooltip title="Delete">
              <div
                onClick={() => {
                  setSelectedOrder(record);
                  setDeleteModalVisible(true);
                }}
                style={{
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #ff4e50, #f9d423)",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
                }}
              >
                <DeleteOutlined style={{ fontSize: 16, color: "#fff" }} />
              </div>
            </Tooltip>
          </div>
        </>
      ),
    },
  ];

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

  return (
    <div
      style={{
        padding: "24px",
        background: "linear-gradient(135deg, #f0f2f5 0%, #e8ecf3 100%)",
        height: "41rem",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Row gutter={[16, 16]} align="middle" justify="space-between" wrap>
        {/* Title */}
        <Col xs={24} md={6}>
          <Title level={3} style={{ margin: 0 }}>
            Order Details
          </Title>
        </Col>

        {/* Search + RangePicker */}
        <Col xs={24} md={12}>
          <Space
            direction={window.innerWidth < 768 ? "vertical" : "horizontal"}
            style={{ width: "100%", justifyContent: "center" }}
          >
            <Input.Search
              placeholder="Search by customer, phone, area..."
              allowClear
              onSearch={(value) => {
                const [startDate, endDate] = selectedDateRange || [];
                fetchOrders({
                  search: value,
                  ...(startDate && endDate ? { startDate, endDate } : {}),
                });
              }}
              style={{ width: "100%", maxWidth: 250 }}
            />
            <RangePicker
              style={{ width: "100%", maxWidth: 300 }}
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

        {/* Buttons */}
        <Col
          xs={24}
          md={6}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
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
          >
            Add Details
          </Button>
          <Button
            type="default"
            onClick={handleExportExcel}
            disabled={selectedRows.length === 0}
            style={{
              background:
                selectedRows.length === 0
                  ? "linear-gradient(135deg, #d9d9d9 0%, #f0f0f0 100%)" // grey gradient for disabled
                  : "linear-gradient(135deg, #28a745 0%, #85d96b 100%)", // green gradient
              border: "none",
              color: selectedRows.length === 0 ? "#888" : "#fff",
              borderRadius: "8px",
              padding: "6px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow:
                selectedRows.length === 0
                  ? "none"
                  : "0 3px 6px rgba(0,0,0,0.1)", // remove shadow when disabled
              cursor: selectedRows.length === 0 ? "not-allowed" : "pointer", // show blocked cursor
            }}
          >
            <i
              className="fas fa-file-excel"
              style={{
                fontSize: 16,
                opacity: selectedRows.length === 0 ? 0.5 : 1,
              }}
            />
            Export Excel
          </Button>
        </Col>
      </Row>

      <Card
        style={{
          borderRadius: "20px",
          //   padding: "14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          background: "#ffffff",
          marginTop: "28px",
          height: "100%",
        }}
      >
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={false}
          rowSelection={rowSelection}
          scroll={{ x: 1300, y: 450 }}
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
                    style={{ overflow: "hidden" }}
                  >
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
                            maxWidth: "600px",
                            alignItems: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}
                        >
                          <Text strong style={{ fontSize: 14 }}>
                            {item.productName}
                          </Text>
                          <div style={{ display: "flex", gap: 12 }}>
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
                  </motion.div>
                )}
              </AnimatePresence>
            ),
          }}
        />
      </Card>
      <Modal
        title={
          <Title level={4} style={{ margin: 0, color: "#4b6cb7" }}>
            {isEditMode ? "Edit Online Order" : "Add New Online Order"}
          </Title>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
        centered
        bodyStyle={{
          padding: "32px",
          backgroundColor: "#f9fbff",
          borderRadius: "16px",
        }}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit} // ✅ unified submit
          onValuesChange={updateTotals}
          style={{ gap: "24px", display: "flex", flexDirection: "column" }}
        >
          {/* Customer Info */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Customer Name"
                name="customerName"
                rules={[{ required: true, message: "Enter customer name" }]}
              >
                <Input
                  placeholder="e.g. John Doe"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone No"
                name="phoneNo"
                rules={[{ required: true, message: "Enter phone number" }]}
              >
                <Input
                  placeholder="e.g. 9876543210"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Area"
                name="area"
                rules={[{ required: true, message: "Enter area" }]}
              >
                <Input
                  placeholder="e.g. Downtown"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Weight"
                name="weight"
                rules={[{ required: true, message: "Enter weight" }]}
              >
                <Input
                  placeholder="e.g. 2kg"
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
                            padding: "16px",
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
                                  placeholder="e.g. Samsung AC"
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
                                  placeholder="e.g. 29999"
                                  style={{ borderRadius: 6 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
                              <Form.Item
                                {...restField}
                                name={[name, "quantity"]}
                                label="Qty"
                                rules={[
                                  { required: true, message: "Enter qty" },
                                ]}
                              >
                                <Input
                                  type="number"
                                  placeholder="e.g. 2"
                                  style={{ borderRadius: 6 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={6}>
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
                                style={{ marginTop: 30 }}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Courier"
                name="courier"
                rules={[{ required: true, message: "Enter courier name" }]}
              >
                <Input
                  placeholder="e.g. Blue Dart"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tracking Number"
                name="trackingNumber"
                rules={[{ required: true, message: "Enter tracking no." }]}
              >
                <Input
                  placeholder="e.g. TRK12345"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Order Date"
                name="orderDate"
                rules={[{ required: true, message: "Select order date" }]}
              >
                <DatePicker
                  placeholder="e.g. YYYY-MM-DD"
                  style={{ width: "100%", borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item
                label={<span style={{ fontWeight: "500" }}>Order Source</span>}
                name="orderSource"
                rules={[
                  { required: true, message: "Please select order source" },
                ]}
              >
                <Select
                  placeholder="Choose Source"
                  options={[
                    { label: "🌐 Website", value: "Website" },
                    { label: "💬 WhatsApp", value: "WhatsApp" },
                    { label: "📱 Mobile App", value: "App" },
                    { label: "✍️ Manual", value: "Manual" },
                  ]}
                />
              </Form.Item>
            </Col>
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
              if (selectedOrder) {
                await handleDelete(selectedOrder._id);
              }
              setDeleteModalVisible(false);
              setSelectedOrder(null);
            }}
          >
            Yes, Delete
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to delete order of{" "}
          <b>{selectedOrder?.customerName}</b>?
        </p>
      </Modal>
    </div>
  );
};

export default OnlineOrders;
