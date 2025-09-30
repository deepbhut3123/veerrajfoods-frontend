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
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  addSales,
  deleteSales,
  exportToexcelSales,
  getAllDealer,
  getAllSales,
} from "../../Utils/Api"; // your API
// import moment from "moment";
import { PlusCircleOutlined } from "@ant-design/icons";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";

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

  const toggleExpand = (key: string) => {
    setExpandedRowKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const openModal = async () => {
    setVisible(true);
    try {
      const res = await getAllDealer();
      setDealers(res);
    } catch (err) {
      message.error("Failed to fetch dealers");
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

      const response = await addSales(payload);

      // Refresh sales data after successful creation
      const salesResponse = await getAllSales();
      setSalesData(
        salesResponse.map((sale: any) => ({
          key: sale._id,
          date: moment(sale.date).format("YYYY-MM-DD"),
          dealerName: sale.dealer?.dealerName || "Unknown",
          totalAmount: sale.totalAmount,
        }))
      );

      message.success("Sale created successfully!");
      setVisible(false);
      form.resetFields();
      setProducts([]);
      setTotalAmount(0);
    } catch (err) {
      message.error("Failed to create sale");
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
        // Handle undefined/null and provide default value
        const safeAmount = amount || 0;
        return `₹ ${safeAmount.toLocaleString()}`;
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
          <Tooltip title="Delete">
            <Button
              style={{
                cursor: "pointer",
                width: 30,
                height: 30,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #ff4e50, #f9d423)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                transition: "all 0.3s",
                border: "none",
                outline: "none",
              }}
              onClick={() => {
                setSelectedSale(record); // store current sale
                setDeleteModalVisible(true);
              }}
            >
              <DeleteOutlined style={{ color: "#fff", fontSize: 16 }} />
            </Button>
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

          <Button
            type="primary"
            icon={<PlusCircleOutlined size={18} />}
            onClick={openModal}
            style={{
              background: "#4b6cb7",
              borderColor: "#4b6cb7",
              padding: "6px 16px",
              borderRadius: "8px",
            }}
          >
            Add Bill
          </Button>

          {/* Export Excel Button */}
          <Button
            type="default"
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
          >
            Export Excel
          </Button>
        </Space>
      </Row>

      {/* Sale Modal */}
      <Modal
        title={
          <span style={{ fontSize: "20px", fontWeight: "bold" }}>
            Add New Bill
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
        okText={<span>Submit Bill</span>}
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
          Are you sure you want to delete order of{" "}
          <b>{selectedSale?.dealer?.dealerName}</b>?
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={() => setDeleteModalVisible(false)}>Cancel</Button>
          <Button
            danger
            type="primary"
            onClick={() => {
              // console.log("Clicked delete", selectedSale);
              if (selectedSale?.key) {
                handleDeleteSale(selectedSale.key);
              } else {
                console.warn("No sale ID found!");
              }
              setDeleteModalVisible(false);
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
                  <div style={{ display: "grid", gap: "6px" }}>
                    {sale?.products?.map((p: any, i: number) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                            borderRadius: "8px",
                            padding: "6px 12px",
                            maxWidth: "600px", // ✅ reduce row width
                          }}
                        >
                          {/* Product Name */}
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              flexShrink: 0,
                            }}
                          >
                            {p.productName}
                          </span>

                          {/* Info badges */}
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                background: "#e6f4ff",
                                color: "#1677ff",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "12px",
                              }}
                            >
                              ₹{p.productPrice}
                            </span>
                            <span
                              style={{
                                background: "#f6ffed",
                                color: "#389e0d",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "12px",
                              }}
                            >
                              Qty: {p.quantity}
                            </span>
                            <span
                              style={{
                                background: "#f9f0ff",
                                color: "#722ed1",
                                borderRadius: "4px",
                                padding: "2px 8px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              ₹{p.total}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              );
            },
          }}
        />
      </Card>
    </div>
  );
};

export default SalesPage;
