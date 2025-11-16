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
  DatePicker,
  Tooltip,
  Select,
} from "antd";
import {
  PlusCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  addPaymentDetail,
  deletePaymentDetail,
  exportToexcelPayment,
  getAllDealer,
  getPaymentDetail,
  getSinglepaymentDetail,
  updatePaymentDetail,
} from "../../Utils/Api";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Payment {
  _id: string;
  orderDate: string;
  dealerName: string;
  totalAmount: number;
}

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchValue, setSearchValue] = useState("");
  //   const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<
    [string, string] | null
  >(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<Payment[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dealers, setDealers] = useState<any[]>([]);

  //   const showToast = (text: string, type: "success" | "error" = "success") => {
  //     const toast = document.createElement("div");

  //     // Set icon based on type
  //     const icon = type === "success" ? "✅" : "❌";

  //     toast.innerHTML = `
  //     <span style="margin-right:8px;">${icon}</span>
  //     <span>${text}</span>
  //   `;

  //     // Style
  //     toast.style.position = "fixed";
  //     toast.style.top = "20px";
  //     toast.style.right = "20px";
  //     toast.style.padding = "12px 20px";
  //     toast.style.background =
  //       type === "success"
  //         ? "linear-gradient(135deg, #43e97b, #38f9d7)"
  //         : "linear-gradient(135deg, #ff4e50, #f9d423)";
  //     toast.style.color = "#fff";
  //     toast.style.fontWeight = "500";
  //     toast.style.fontSize = "14px";
  //     toast.style.borderRadius = "12px";
  //     toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  //     toast.style.zIndex = "9999";
  //     toast.style.display = "flex";
  //     toast.style.alignItems = "center";
  //     toast.style.transition = "transform 0.3s ease, opacity 0.3s ease";
  //     toast.style.transform = "translateX(120%)";
  //     toast.style.opacity = "0";

  //     document.body.appendChild(toast);

  //     // Animate in
  //     requestAnimationFrame(() => {
  //       toast.style.transform = "translateX(0)";
  //       toast.style.opacity = "1";
  //     });

  //     // Animate out and remove after 2 seconds
  //     setTimeout(() => {
  //       toast.style.transform = "translateX(120%)";
  //       toast.style.opacity = "0";
  //       setTimeout(() => toast.remove(), 300);
  //     }, 2000);
  //   };

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: Payment[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
  };

  const fetchPayments = async (filters: any = {}) => {
    setLoading(true);
    try {
      const res = await getPaymentDetail(filters);
      setPayments(res.data || res);
    } catch (error) {
      message.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchDealers();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        dealerId: values.dealerName, // This holds _id of dealer from dropdown
        totalAmount: values.totalAmount, // Payment amount
        orderDate: values.orderDate?.format("YYYY-MM-DD") || undefined,
      };

      if (isEditMode && selectedPayment) {
        await updatePaymentDetail(selectedPayment._id, payload);
        message.success("Payment updated successfully");
      } else {
        await addPaymentDetail(payload);
        message.success("Payment added successfully");
      }

      form.resetFields();
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (error) {
      message.error(
        isEditMode ? "Failed to update payment" : "Failed to add payment"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentDetail(id);
      message.success("Payment deleted successfully");
      fetchPayments();
    } catch (error) {
      message.error("Failed to delete payment");
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
      // calculate total
      const grandTotal = selectedRows.reduce(
        (sum, row) => sum + Number(row.totalAmount || 0),
        0
      );

      // clone rows and add total row
      const rowsWithTotal = [
        ...selectedRows,
        {
          _id: "total_row",
          orderDate: "",
          dealerName: "Grand Total",
          totalAmount: grandTotal,
        },
      ];

      const res = await exportToexcelPayment({ payload: rowsWithTotal });

      const blob = new Blob([res], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Payments.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error("Failed to export payments to Excel");
    }
  };

  const handleEdit = async (paymentId: string) => {
    try {
      setLoading(true);
      const res = await getSinglepaymentDetail(paymentId);

      // FIX: adjust based on API response
      const payments = res.data?.data || res.data;

      if (!payments) {
        message.error("Payment not found");
        return;
      }

      form.setFieldsValue({
        ...payments,
        orderDate: payments.orderDate ? dayjs(payments.orderDate) : null,
        dealerName: payments.dealerName,
        totalAmount: payments.totalAmount,
      });

      setSelectedPayment(payments);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (err) {
      message.error("Failed to load payment details");
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const res = await getAllDealer();
      setDealers(res);
    } catch (err) {
      message.error("Failed to fetch dealers");
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
      title: "Date",
      dataIndex: "orderDate",
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
    {
      title: "Name",
      dataIndex: "dealerId",
      render: (dealer: any) => dealer?.dealerName || "—",
    },
    { title: "Total", dataIndex: "totalAmount" },
    {
      title: "Action",
      width: 100,
      render: (_: any, record: Payment) => (
        <>
          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
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
              Payments
            </Title>

            <Input.Search
              // placeholder="Search by customer, phone, area..."
              allowClear
              onSearch={(value) => {
                const [startDate, endDate] = selectedDateRange || [];
                fetchPayments({
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
                fetchPayments({
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
        dataSource={payments}
        loading={loading}
        pagination={false}
        rowSelection={rowSelection}
        // scroll={{ x: 1300, y: 650 }}
        // style={{ scrollbarWidth: "thin" }}
      />
      {/* </Card> */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0, color: "#00695c" }}>
            {isEditMode ? "Edit Payment" : "Add New Payment"}
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
          style={{ display: "flex", flexDirection: "column" }}
          initialValues={{
            orderDate: dayjs(), // set today's date as initial value
          }}
        >
          {/* Customer Info */}
          <Row gutter={14}>
            <Col span={8}>
              <Form.Item
                name="orderDate"
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
              <Form.Item
                label="Dealer Name"
                name="dealerName"
                rules={[{ required: true, message: "Select dealer name" }]}
              >
                <Select placeholder="Select Dealer">
                  {dealers.map((dealer) => (
                    <Select.Option key={dealer._id} value={dealer._id}>
                      {dealer.dealerName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Total Amount"
                name="totalAmount"
                rules={[{ required: true, message: "Enter total amount" }]}
              >
                <Input
                  // placeholder="e.g. Downtown"
                  style={{ borderRadius: 8, height: 40 }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Submit Button */}
          <Form.Item style={{ marginTop: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{
                height: 45,
                width: "30%",
                alignItems: "center",
                fontWeight: 600,
                borderRadius: 8,
                background: "#4b6cb7",
                borderColor: "#4b6cb7",
              }}
            >
              Submit Payment
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
            Are you sure you want to delete payment of{" "}
            <b>{selectedRows[0].dealerName}</b>?
          </p>
        ) : selectedRows.length > 1 ? (
          <p>
            Are you sure you want to delete <b>{selectedRows.length}</b>{" "}
            selected payments?
          </p>
        ) : (
          <p>No payments selected to delete.</p>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
