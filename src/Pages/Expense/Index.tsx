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
  AutoComplete,
} from "antd";
import {
  PlusCircleOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  DownOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  addExpense,
  deleteExpense,
  getExpense,
  getSingleExpense,
  updateExpense,
} from "../../Utils/Api";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface Expense {
  _id: string;
  date: string;
  desc: string;
  amount: number;
}

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [grandTotal, setGrandTotal] = useState(0);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [searchValue, setSearchValue] = useState("");
  //   const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<
    [string, string] | null
  >(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<Expense[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: Expense[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedRows(newSelectedRows);
    },
  };

  const fetchExpenses = async (filters: any = {}) => {
    setLoading(true);
    try {
      const res = await getExpense(filters);
      const data = res.data || res;

      setExpenses(data);

      // Calculate total dynamically
      const total = data.reduce(
        (sum: number, item: Expense) => sum + Number(item.amount || 0),
        0
      );
      setGrandTotal(total);
    } catch (error) {
      message.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");

    // set initial range so RangePicker also knows current month
    setSelectedDateRange([startOfMonth, endOfMonth]);

    fetchExpenses({
      startDate: startOfMonth,
      endDate: endOfMonth,
    });
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        date: values.date?.format("YYYY-MM-DD"),
        desc: values.desc,
        amount: values.amount,
      };

      if (isEditMode && selectedExpense) {
        await updateExpense(selectedExpense._id, payload);
        message.success("Expense updated successfully");
      } else {
        await addExpense(payload);
        message.success("Expense added successfully");
      }

      form.resetFields();
      setGrandTotal(0);
      setIsModalOpen(false);
      setIsEditMode(false);
      setSelectedExpense(null);
      fetchExpenses();
    } catch (error) {
      message.error(
        isEditMode ? "Failed to update expense" : "Failed to add expense"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      message.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error) {
      message.error("Failed to delete expense");
    }
  };
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleEdit = async (expenseId: string) => {
    try {
      setLoading(true);
      const res = await getSingleExpense(expenseId);

      // FIX: adjust based on API response
      const expense = res.data?.data || res.data;

      if (!expense) {
        message.error("Expense not found");
        return;
      }

      form.setFieldsValue({
        ...expense,
        date: expense.date ? dayjs(expense.date) : null,
      });

      setSelectedExpense(expense);
      setIsEditMode(true);
      setIsModalOpen(true);
    } catch (err) {
      message.error("Failed to load expense details");
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
      render: (_text: any, _record: any, index: number) => index + 1,
    },
    {
      title: "Date",
      dataIndex: "date",
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
    { title: "Description", dataIndex: "desc" },
    { title: "Total", dataIndex: "amount" },
    {
      title: "Action",
      render: (_: any, record: Expense) => (
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
              Expenses
            </Title>

            <Input.Search
              // placeholder="Search by customer, phone, area..."
              allowClear
              onSearch={(value) => {
                const [startDate, endDate] = selectedDateRange || [];
                fetchExpenses({
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
                fetchExpenses({
                  search: searchValue,
                  startDate,
                  endDate,
                });
              }}
            />
          </Space>
        </Col>
        <Col>
          <div
            style={{
              background: "linear-gradient(135deg, #36d1dc, #5b86e5)",
              padding: "10px 18px",
              borderRadius: "12px",
              color: "#fff",
              fontWeight: 500,
              fontSize: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <span>Total Expenses</span>
            <span>₹ {grandTotal.toLocaleString()}</span>
          </div>
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
        dataSource={expenses}
        loading={loading}
        pagination={false}
        rowSelection={rowSelection}
      />
      {/* </Card> */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0, color: "#00695c" }}>
            {isEditMode ? "Edit Expense" : "Add New Expense"}
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
            date: dayjs(), // set today's date as initial value
          }}
        >
          {/* Customer Info */}
          <Row gutter={14}>
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
              <Form.Item
                label="Description"
                name="desc"
                rules={[
                  {
                    required: true,
                    message: "Please enter or select description",
                  },
                ]}
              >
                <AutoComplete
                  options={[
                    { value: "Fuel" },
                    { value: "Salary" },
                    { value: "Transport" },
                  ]}
                  style={{ width: "100%", height: 40 }}
                  filterOption={(inputValue, option) =>
                    option && option.value
                      ? option.value
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      : false
                  }
                >
                  <Input
                    style={{ borderRadius: 8, height: 40 }}
                    suffix={<DownOutlined />} // dropdown arrow
                  />
                </AutoComplete>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                label="Total Amount"
                name="amount"
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
                // Delete all selected expenses
                for (const expense of selectedRows) {
                  await handleDelete(expense._id);
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
          <p>Are you sure you want to delete this expense?</p>
        ) : selectedRows.length > 1 ? (
          <p>
            Are you sure you want to delete <b>{selectedRows.length}</b>{" "}
            selected expenses?
          </p>
        ) : (
          <p>No expenses selected to delete.</p>
        )}
      </Modal>
    </div>
  );
};

export default Expenses;
