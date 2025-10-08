import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Table,
  DatePicker,
  Typography,
  message,
  Row,
  Card,
  Space,
  Tooltip,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FileDoneOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import {
  addSales,
  deleteSales,
  exportToexcelSales,
  getAllDealer,
  getAllSales,
  getSingleSales,
  updateSales,
} from "../../Utils/Api"; // your API
// import moment from "moment";
import { PlusCircleOutlined } from "@ant-design/icons";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;

const SalesPage: React.FC = () => {
  const [form] = Form.useForm();
  const [dealers, setDealers] = useState<any[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]); // table data
  const [totalAmount, setTotalAmount] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const showToast = (
    text: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    const toast = document.createElement("div");

    // Set icon based on type
    let icon = "✅";
    if (type === "error") icon = "❌";
    else if (type === "warning") icon = "⚠️";

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
        : type === "error"
        ? "linear-gradient(135deg, #ff4e50, #f9d423)"
        : "linear-gradient(135deg, #fbc2eb, #a6c1ee)"; // warning
    toast.style.color = "#fff";
    toast.style.fontWeight = "500";
    toast.style.fontSize = "14px";
    toast.style.borderRadius = "12px";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.style.zIndex = "9999";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.marginTop = "8px";
    toast.style.transition = "transform 0.3s ease, opacity 0.3s ease";
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";

    // Create a container for multiple toasts
    let container = document.getElementById("custom-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "custom-toast-container";
      container.style.position = "fixed";
      container.style.top = "20px";
      container.style.right = "20px";
      container.style.zIndex = "9999";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "8px";
      document.body.appendChild(container);
    }

    container.appendChild(toast);

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

  const toggleExpand = (key: string) => {
    setExpandedRowKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const openModal = async (saleId?: string) => {
    try {
      const res = await getAllDealer();
      setDealers(res);

      if (saleId) {
        // Edit mode
        setEditMode(true);
        setEditingSaleId(saleId);

        const sale = await getSingleSales(saleId);

        // Pre-fill form
        form.setFieldsValue({
          date: moment(sale.date),
          dealerId: sale.dealer._id,
        });

        setSelectedDealer(sale.dealer);

        const initialProducts = (sale.products || []).map((p: any) => ({
          ...p,
          total: p.productPrice * p.quantity,
        }));

        setProducts(initialProducts);
        calculateTotal(initialProducts);
      } else {
        // Add mode
        setEditMode(false);
        setEditingSaleId(null);
        form.resetFields();
        setProducts([]);
        setTotalAmount(0);
      }

      setVisible(true);
    } catch (err) {
      message.error("Failed to fetch data");
    }
  };

  const fetchSales = async () => {
    try {
      const sales = await getAllSales();
      setSalesData(
        sales.map((sale: any) => ({
          key: sale._id,
          date: moment(sale.date).format("YYYY-MM-DD"),
          dealer: sale.dealer,
          dealerName: sale.dealer?.dealerName || "Unknown",
          products: sale.products || [],
          totalAmount: sale.totalAmount,
        }))
      );
    } catch (err) {
      message.error("Failed to fetch sales");
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleDealerChange = (dealerId: string) => {
    const dealer = dealers.find((d) => d._id === dealerId);
    setSelectedDealer(dealer);

    const initialProducts = (dealer.products || []).map((product: any) => ({
      ...product,
      quantity: 0,
      total: 0,
    }));

    setProducts(initialProducts);
    calculateTotal(initialProducts);
  };

  const handleQuantityChange = (value: number, index: number) => {
    const updated = [...products];
    updated[index].quantity = value;
    updated[index].total = value * updated[index].productPrice;
    setProducts(updated);
    calculateTotal(updated);
  };

  const calculateTotal = (items: any[]) => {
    const total = items.reduce((acc, item) => acc + item.total, 0);
    setTotalAmount(total);
  };

  const handleDeleteSale = async (saleId: string) => {
    try {
      setLoading(true);
      await deleteSales(saleId);
      message.success("Sale deleted successfully!");
      fetchSales(); // Refresh table
    } catch (err) {
      message.error("Failed to delete sale");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const payload = {
        date: values.date.format("YYYY-MM-DD"),
        dealerId: values.dealerId,
        products: products
          .filter((p) => p.quantity > 0)
          .map((p) => ({
            productName: p.productName,
            productPrice: p.productPrice,
            quantity: p.quantity,
            total: p.total,
          })),
        totalAmount,
      };

      if (editMode && editingSaleId) {
        await updateSales(editingSaleId, payload);
        message.success("Sale updated successfully!");
      } else {
        await addSales(payload);
        message.success("Sale created successfully!");
      }

      fetchSales(); // Refresh table
      setVisible(false);
      form.resetFields();
      setProducts([]);
      setTotalAmount(0);
    } catch (err) {
      message.error(
        editMode ? "Failed to update sale" : "Failed to create sale"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = salesData.filter((item) => {
    const search = searchText.toLowerCase();
    return (
      item.dealerName?.toLowerCase().includes(search) ||
      item.date?.toLowerCase().includes(search) ||
      item.totalAmount?.toString().includes(search)
    );
  });

  const generateBillImage = async (sale: any) => {
    if (!sale) {
      showToast("Please select a sale to generate image", "warning");
      return;
    }

    setSelectedSale(sale); // set the selected sale

    await new Promise((resolve) => setTimeout(resolve, 100));

    const billElement = document.getElementById("bill-to-capture");
    if (!billElement) return;

    try {
      const canvas = await html2canvas(billElement, { scale: 2 });
      const dataURL = canvas.toDataURL("image/png");

      const blob = await (await fetch(dataURL)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);

      showToast("Bill image copied to clipboard!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate image", "error");
    }
  };

  const generateTopBillImage = async () => {
    if (!selectedRows || selectedRows.length === 0) {
      showToast(
        "Please select at least one sale to generate bill image",
        "warning"
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const billElement = document.getElementById("bill-to-capture-top");
    if (!billElement) return;

    try {
      const canvas = await html2canvas(billElement, { scale: 2 });
      const dataURL = canvas.toDataURL("image/png");

      const blob = await (await fetch(dataURL)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);

      showToast("Selected bill(s) copied to clipboard!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate bill image", "error");
    }
  };

  const selectedTotalAmount = selectedRows.reduce(
    (acc, sale) => acc + (sale.totalAmount || 0),
    0
  );

  const productColumns = [
    {
      title: "Product Name",
      dataIndex: "productName",
    },
    {
      title: "Price",
      dataIndex: "productPrice",
      render: (price: number) => `₹ ${price}`,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      render: (_: any, record: any, index: number) => (
        <InputNumber
          min={0}
          value={record.quantity}
          onChange={(value) => handleQuantityChange(value || 0, index)}
        />
      ),
    },
    {
      title: "Total",
      dataIndex: "total",
      render: (total: number) => `₹ ${total}`,
    },
  ];

  const salesTableColumns = [
    {
      title: "#",
      dataIndex: "serial",
      key: "serial",
      align: "center" as "center",
      width: 70,
      render: (_text: any, _record: any, index: number) => index + 1,
    },

    {
      title: "Date",
      dataIndex: "date",
      sorter: (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (date: string) =>
        date ? moment(date).format("DD/MM/YYYY") : "N/A",
    },
    {
      title: "Dealer Name",
      dataIndex: "dealerName",
      sorter: (a: any, b: any) =>
        (a.dealerName || "").localeCompare(b.dealerName || ""),
      render: (name: string) => name || "Unknown",
    },
    {
      title: "Total Amount (₹)",
      dataIndex: "totalAmount",
      sorter: (a: any, b: any) => (a.totalAmount || 0) - (b.totalAmount || 0),
      render: (amount: number | undefined) => {
        const safeAmount = amount || 0;
        return `₹ ${safeAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;
      },
    },
    {
      title: "Action",
      key: "action",
      align: "center" as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Products">
            <Button
              shape="circle"
              icon={
                expandedRowKeys.includes(record.key) ? (
                  <EyeInvisibleOutlined
                    style={{ color: "#fff", fontSize: 16 }}
                  />
                ) : (
                  <EyeOutlined style={{ color: "#fff", fontSize: 16 }} />
                )
              }
              onClick={() => toggleExpand(record.key)}
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
                border: "none",
                outline: "none",
              }}
            />
          </Tooltip>
          {/* Generate Bill Image Button */}
          <Tooltip title="Generate Bill Image">
            <Button
              type="primary"
              icon={<FileImageOutlined />}
              onClick={() => {
                setSelectedSale(record); // set the sale for bill capture
                generateBillImage(record);
              }}
              style={{
                cursor: "pointer",
                width: 30,
                height: 30,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #4b6cb7, #182848)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
                border: "none",
                outline: "none",
              }}
            ></Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              shape="circle"
              icon={<EditOutlined style={{ color: "#fff", fontSize: 16 }} />}
              onClick={() => openModal(record.key)}
              style={{
                cursor: "pointer",
                width: 30,
                height: 30,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #36d1dc, #5b86e5)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                border: "none",
              }}
            />
          </Tooltip>
        </Space>
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
      <Row justify="space-between" align="middle">
        <Title level={3} style={{ margin: 0 }}>
          Sales
        </Title>
        <Space>
          <Input.Search
            placeholder="Search dealer"
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: 300,
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              alignItems: "end",
            }}
          />
          <Tooltip title="Add New Bill">
            <Button
              type="primary"
              icon={<PlusCircleOutlined size={18} />}
              onClick={() => openModal()}
              style={{
                background: "#4b6cb7",
                borderColor: "#4b6cb7",
                padding: "6px 16px",
                borderRadius: "8px",
              }}
            ></Button>
          </Tooltip>

          {/* Export Excel Button */}
          <Tooltip title="Export to Excel">
            <Button
              type="default"
              icon={<ExportOutlined size={18} />}
              onClick={async () => {
                try {
                  const dataToExport =
                    selectedRows.length > 0 ? selectedRows : salesData; // ✅ check selection
                  const payload = { payload: dataToExport };
                  const blob = await exportToexcelSales(payload);

                  const url = window.URL.createObjectURL(new Blob([blob]));
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", "Sales.xlsx");
                  document.body.appendChild(link);
                  link.click();
                  link.remove();

                  message.success(
                    selectedRows.length > 0
                      ? "Selected rows exported successfully!"
                      : "All sales exported successfully!"
                  );
                } catch (err) {
                  message.error("Failed to export Excel");
                  console.error(err);
                }
              }}
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
            ></Button>
          </Tooltip>

          <Tooltip title="Generate Statement">
            <Button
              type="default"
              icon={<FileDoneOutlined size={18} />}
              onClick={generateTopBillImage}
              disabled={selectedRows.length === 0}
              style={{
                background:
                  selectedRows.length === 0
                    ? "linear-gradient(135deg, #d9d9d9 0%, #f0f0f0 100%)"
                    : "linear-gradient(135deg, #ff9800 0%, #ffc107 100%)",
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
                    : "0 3px 6px rgba(0,0,0,0.1)",
                cursor: selectedRows.length === 0 ? "not-allowed" : "pointer",
              }}
            ></Button>
          </Tooltip>

          {/* Delete Button for Selected Rows */}
          <Tooltip title="Delete Selected">
            <Button
              danger
              type="primary"
              disabled={selectedRows.length === 0}
              onClick={() => setDeleteModalVisible(true)}
            >
              <DeleteOutlined style={{ fontSize: 16 }} />
            </Button>
          </Tooltip>
        </Space>
      </Row>

      {/* Sale Modal */}
      <Modal
        title={
          <span style={{ fontSize: "20px", fontWeight: "bold" }}>
            {editMode ? "Edit Bill" : "Add New Bill"}
          </span>
        }
        open={visible}
        onCancel={() => {
          setVisible(false);
          form.resetFields();
          setProducts([]);
          setTotalAmount(0);
        }}
        onOk={() => form.submit()}
        width={900}
        okText={<span>{editMode ? "Update Bill" : "Submit Bill"}</span>}
        cancelText="Cancel"
        confirmLoading={loading}
        bodyStyle={{ padding: "24px" }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <Form.Item
              label={<span style={{ fontWeight: "500" }}>Sale Date</span>}
              name="date"
              rules={[{ required: true, message: "Please select date" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) =>
                  current && current > moment().endOf("day")
                }
                format="DD/MM/YYYY"
              />
            </Form.Item>

            <Form.Item
              label={<span style={{ fontWeight: "500" }}>Select Dealer</span>}
              name="dealerId"
              rules={[{ required: true, message: "Please select dealer" }]}
            >
              <Select placeholder="Choose Dealer" onChange={handleDealerChange}>
                {dealers.map((dealer) => (
                  <Option key={dealer._id} value={dealer._id}>
                    {dealer.dealerName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          {/* Products Table */}
          {products.length > 0 && (
            <div style={{ margin: "24px 0" }}>
              <Table
                dataSource={products.map((p, i) => ({ ...p, key: i }))}
                columns={productColumns}
                pagination={false}
                bordered
                size="middle"
                // scroll={{ y: 240 }}

                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3} align="right">
                        <strong>Grand Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>₹ {totalAmount.toLocaleString("en-IN")}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </div>
          )}

          {products.length === 0 && selectedDealer && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                border: "1px dashed #d9d9d9",
                borderRadius: "4px",
                margin: "16px 0",
              }}
            >
              <p style={{ color: "#999" }}>
                No products available for selected dealer
              </p>
            </div>
          )}

          {!selectedDealer && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                border: "1px dashed #d9d9d9",
                borderRadius: "4px",
                margin: "16px 0",
              }}
            >
              <p style={{ color: "#999" }}>
                Please select a dealer to view products
              </p>
            </div>
          )}
        </Form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={null}
        centered
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <ExclamationCircleOutlined
            style={{ color: "#ff4d4f", fontSize: 20 }}
          />
          <span style={{ fontWeight: 600, fontSize: 16, color: "#ff4d4f" }}>
            Confirm Delete
          </span>
        </div>

        <div style={{ fontSize: 14, marginBottom: 20 }}>
          {selectedRows.length === 1 ? (
            <>
              Are you sure you want to delete order of{" "}
              <b>{selectedRows[0]?.dealer?.dealerName}</b>?
            </>
          ) : (
            <>
              Are you sure you want to delete <b>{selectedRows.length}</b>{" "}
              selected sales?
            </>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={() => setDeleteModalVisible(false)}>Cancel</Button>
          <Button
            danger
            type="primary"
            onClick={async () => {
              try {
                for (let sale of selectedRows) {
                  if (sale.key) {
                    await handleDeleteSale(sale.key);
                  }
                }
                message.success("Selected sales deleted");
                fetchSales();
              } catch (err) {
                message.error("Failed to delete sales");
              } finally {
                setDeleteModalVisible(false);
              }
            }}
          >
            Yes, Delete
          </Button>
        </div>
      </Modal>

      {/* Sales History Table */}
      <Card
        style={{
          borderRadius: "20px",
          // padding: "32px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          background: "#ffffff",
          marginTop: "28px",
          height: "100%",
        }}
      >
        <Table
          dataSource={filteredData}
          columns={salesTableColumns}
          pagination={{ pageSize: 5 }}
          scroll={{ x: 1000, y: 450 }}
          rowSelection={{
            selectedRowKeys: selectedRows.map((r) => r.key),
            onChange: (_selectedKeys, selectedRecords) => {
              setSelectedRows(selectedRecords);
            },
          }}
          expandable={{
            expandedRowKeys,
            expandIconColumnIndex: -1,
            onExpand: (expanded, record) => toggleExpand(record.key),
            expandedRowRender: (record: any) => {
              const sale = salesData.find((s) => s.key === record.key);

              return (
                <AnimatePresence initial={false}>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    {/* ✅ Only one nested table here */}
                    <Table
                      dataSource={sale?.products || []}
                      pagination={false}
                      size="small"
                      rowKey={(_item: any, index?: number) =>
                        index !== undefined ? index.toString() : ""
                      }
                      columns={[
                        {
                          title: "Product",
                          dataIndex: "productName",
                          key: "productName",
                        },
                        {
                          title: "Quantity",
                          dataIndex: "quantity",
                          key: "quantity",
                        },
                        {
                          title: "Price (₹)",
                          dataIndex: "productPrice",
                          key: "productPrice",
                          render: (price: number) =>
                            `₹ ${Math.floor(price).toLocaleString("en-IN")}`,
                        },
                        {
                          title: "Total (₹)",
                          dataIndex: "total",
                          key: "total",
                          render: (total: number) =>
                            `₹ ${Math.floor(total).toLocaleString("en-IN")}`,
                        },
                      ]}
                      style={{
                        fontSize: 12, // 🔹 smaller text
                        maxWidth: "800px",
                      }}
                      className="compact-table"
                    />
                  </motion.div>
                </AnimatePresence>
              );
            },
          }}
        />
      </Card>
      <div
        id="bill-to-capture"
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          width: "400px",
          padding: "16px",
          backgroundColor: "#fff",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 8 }}>Bill</h3>
        <p style={{ marginBottom: 8 }}>
          Date: {dayjs(selectedSale?.date).format("DD-MM-YYYY")}
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>
                Product
              </th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>Qty</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>
                Price
              </th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {selectedSale?.products?.map((p: any, index: number) => (
              <tr key={index}>
                <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                  {p.productName}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                  {p.quantity}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                  ₹ {Math.floor(p.productPrice)}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                  ₹ {Math.floor(p.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ textAlign: "right", marginTop: 8, fontWeight: 600 }}>
          Total: ₹ {Math.floor(selectedSale?.totalAmount)}
        </p>
      </div>
      <div
        id="bill-to-capture-top"
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          padding: "16px",
          backgroundColor: "#fff",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 8 }}>Bill</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "center", // horizontal center
            verticalAlign: "middle",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>#</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>Date</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>
                Total (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {selectedRows.map((sale, index) => (
              <tr key={sale.key}>
                <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                  {dayjs(sale.date).format("DD-MM-YYYY")}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "4px" }}>
                  ₹ {Math.floor(sale.totalAmount)}
                </td>
              </tr>
            ))}
            <tr>
              <td
                colSpan={2}
                style={{
                  border: "1px solid #ccc",
                  padding: "4px",
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                Grand Total
              </td>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "4px",
                  fontWeight: 600,
                }}
              >
                ₹ {Math.floor(selectedTotalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesPage;
