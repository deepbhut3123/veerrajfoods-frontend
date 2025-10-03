import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Collapse,
  Tooltip,
} from "antd";
import { motion, AnimatePresence } from "framer-motion";
import {
  addDealer,
  deleteDealer,
  getAllDealer,
  getSingleDealer,
  updateDealer,
} from "../../Utils/Api";
import {
  DeleteOutlined,
  PlusCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Panel } = Collapse;

const DealerManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [dealers, setDealers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);

  // Fetch dealers from API
  const fetchDealers = async () => {
    try {
      setLoading(true);
      const response = await getAllDealer();
      const formatted = response.map((dealer: any) => ({
        ...dealer, // ✅ keeps _id intact
        key: dealer._id, // ✅ key should just be the backend id
      }));
      setDealers(formatted);
    } catch (error) {
      message.error("Failed to fetch dealers");
      console.error("Fetch dealers error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedDealer(null);
    form.resetFields();
  };

  const handleDeleteDealer = async (saleId: string) => {
    try {
      setLoading(true);
      await deleteDealer(saleId);
      message.success("Dealer deleted successfully!");
      fetchDealers(); // Refresh table
    } catch (err) {
      message.error("Failed to delete dealer");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to open delete modal
  const openDeleteModal = (dealer: any) => {
    setSelectedDealer(dealer);
    setDeleteModalVisible(true);
  };

  // Function to confirm delete
  const confirmDelete = async () => {
    if (selectedDealer) {
      await handleDeleteDealer(selectedDealer._id);
      setDeleteModalVisible(false);
      setSelectedDealer(null);
    }
  };

  const handleAddDealer = async (values: any) => {
    try {
      const payload = {
        dealerName: values.dealerName,
        products: values.products,
      };

      await addDealer(payload); // send JSON object instead of FormData
      message.success("Dealer added successfully");

      setIsModalOpen(false);
      form.resetFields();
      fetchDealers(); // Fetch fresh data from backend only
    } catch (error) {
      console.error("Add dealer error:", error);
      message.error("Failed to add dealer");
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const res = await getSingleDealer(id);
      setSelectedDealer(res.data);
      form.setFieldsValue({
        dealerName: res.data.dealerName,
        products: res.data.products?.map((p: any) => ({
          productName: p.productName,
          productPrice: p.productPrice,
        })),
      });
      setIsModalOpen(true);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  // 🔹 Submit form to update dealer
  const handleUpdate = async (values: any) => {
  try {
    setLoading(true);
    if (!selectedDealer) return;

    await updateDealer(selectedDealer._id, values);

    message.success("Dealer updated successfully!");
    setIsModalOpen(false);
    setSelectedDealer(null); // ✅ reset after update
    form.resetFields();
    fetchDealers();
  } catch (error: any) {
    message.error(error.message);
  } finally {
    setLoading(false);
  }
};


  const filteredDealers = dealers.filter((dealer) =>
    dealer.dealerName?.toLowerCase().includes(searchText.toLowerCase())
  );

  // const columns = [
  //   {
  //     title: "Dealer Name",
  //     dataIndex: "dealerName",
  //     key: "dealerName",
  //   },
  // ];

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
          Dealers
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
        </Space>
        <Button
          type="primary"
          icon={<PlusCircleOutlined size={18} />}
          onClick={showModal}
          style={{
            background: "#4b6cb7",
            borderColor: "#4b6cb7",
            padding: "6px 16px",
            borderRadius: "8px",
          }}
        >
          Add Dealer
        </Button>
      </Row>
      <Card
        style={{
          borderRadius: "20px",
          padding: "14px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          background: "#ffffff",
          marginTop: "28px",
          height: "100%",
        }}
      >
        <div>
          <Collapse
            accordion
            bordered={false}
            style={{
              background: "transparent",
            }}
            expandIconPosition="start"
          >
            {filteredDealers.map((dealer) => (
              <Panel
                key={dealer._id}
                header={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* Dealer Name */}
                    <span
                      style={{ fontWeight: 600, fontSize: 16, color: "#333" }}
                    >
                      {dealer.dealerName}
                    </span>

                    {/* Action Buttons */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10, // space between buttons
                      }}
                    >
                      <Tooltip title="Edit">
                        <div
                          onClick={(e) => {
                            e.stopPropagation(); // prevent accordion toggle
                            handleEdit(dealer._id);
                          }}
                          style={{
                            cursor: "pointer",
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              "linear-gradient(135deg, #36d1dc, #5b86e5)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            transition: "all 0.3s",
                          }}
                        >
                          <EditOutlined
                            style={{ fontSize: 16, color: "#fff" }}
                          />
                        </div>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(dealer);
                          }}
                          style={{
                            cursor: "pointer",
                            width: 30,
                            height: 30,
                            borderRadius: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background:
                              "linear-gradient(135deg, #ff4e50, #f9d423)",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            transition: "all 0.3s",
                          }}
                        >
                          <DeleteOutlined
                            style={{ fontSize: 16, color: "#fff" }}
                          />
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                }
                style={{
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                  backgroundColor: "#ffffff",
                }}
              >
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    padding: 12,
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  {dealer.products?.length > 0 ? (
                    <table style={{ width: "100%" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f5f5f5" }}>
                          <th
                            style={{
                              padding: "8px",
                              textAlign: "left",
                              fontWeight: "bold",
                              color: "#4b6cb7",
                            }}
                          >
                            Product Name
                          </th>
                          <th
                            style={{
                              padding: "8px",
                              textAlign: "left",
                              fontWeight: "bold",
                              color: "#4b6cb7",
                            }}
                          >
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dealer.products.map((product: any, index: number) => (
                          <tr key={index}>
                            <td style={{ padding: "8px" }}>
                              {product.productName}
                            </td>
                            <td style={{ padding: "8px" }}>
                              ₹ {product.productPrice}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ color: "#999", padding: "8px" }}>
                      No products found.
                    </div>
                  )}
                </div>
              </Panel>
            ))}
          </Collapse>
        </div>
      </Card>

      {/* Modal for Add Dealer */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0, color: "#4b6cb7" }}>
            Add New Dealer
          </Title>
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={700}
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
          onFinish={selectedDealer ? handleUpdate : handleAddDealer} // ✅ check mode
          style={{ gap: "24px", display: "flex", flexDirection: "column" }}
        >
          {/* Dealer Name */}
          <Form.Item
            label="Dealer Name"
            name="dealerName"
            rules={[{ required: true, message: "Please enter dealer name" }]}
          >
            <Input
              placeholder="Enter dealer name"
              style={{
                borderRadius: 8,
                height: 40,
              }}
            />
          </Form.Item>

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
                            // padding: "10px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                          }}
                        >
                          <Row gutter={16} align="middle">
                            <Col span={11}>
                              <Form.Item
                                {...restField}
                                name={[name, "productName"]}
                                rules={[
                                  {
                                    required: true,
                                    message: "Enter product name",
                                  },
                                ]}
                                label="Product Name"
                              >
                                <Input
                                  placeholder="e.g. Samsung AC"
                                  style={{ borderRadius: 6 }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={11}>
                              <Form.Item
                                {...restField}
                                name={[name, "productPrice"]}
                                rules={[
                                  {
                                    required: true,
                                    message: "Enter product price",
                                  },
                                ]}
                                label="Product Price"
                              >
                                <Input
                                  type="number"
                                  placeholder="e.g. 29999"
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
                                style={{
                                  marginTop: 10,
                                }}
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
              Submit Dealer
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
          <Button key="delete" type="primary" danger onClick={confirmDelete}>
            Yes, Delete
          </Button>,
        ]}
      >
        <p>
          Are you sure you want to delete dealer{" "}
          <b>{selectedDealer?.dealerName}</b>?
        </p>
      </Modal>
    </div>
  );
};

export default DealerManagement;
