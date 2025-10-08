import { message } from "antd";
import axios from "axios";

export const API = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401 && error.response.status === 404) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      message.error("Session expired. Please log in again.");
    }
    else if (error.response.status === 403) {
      window.location.href = "/login";
      message.error("You are not authorized to access this page.");
    }
    return Promise.reject(error);
  }
);

export const registerUser = async (data: {
  username: string;
  email: string;
  password: string;
  mobileNo: string;
}) => {
  try {
    const response = await API.post("/register", data);
    return response.data;
  } catch (error: any) {
    // Preserve the full error response
    throw error; // Instead of throwing just the message
  }
};

export const loginuser = async (data: {
  employeeId: string;
  password: string;
}) => {
  try {
    const response = await API.post("/login", data);
    return response.data;
  } catch (error: any) {
    throw error.response.data.message;
  }
};

// Api.ts
export const addDealer = async (payload: any) => {
  try {
    const response = await API.post("/backend/dealers", payload); // send as JSON
    return response;
  } catch (error) {
    throw error;
  }
};


export const getAllDealer = async () => {
  try {
    const response = await API.get("/backend/dealers");
    return response.data; // assumed structure
  } catch (error) {
    throw error;
  }
};

export const getSingleDealer = async (id: string) => {
  try {
    const response = await API.get(`/backend/dealers/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch order");
  }
};

// ✅ Update order by ID
export const updateDealer = async (id: string, orderData: any) => {
  try {
    const response = await API.put(`backend/dealers/${id}/edit`, orderData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update order");
  }
};

export const deleteDealer = async (id: string) => {
  try {
    const response = await API.delete(`/backend/dealers/${id}/delete`);
    return response;
  } catch (error) {
    console.error(error);
  }
};

export const addSales = async (payload: any) => {
  try {
    const response = await API.post("/backend/sales", payload); // send as JSON
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllSales = async () => {
  try {
    const response = await API.get("/backend/sales");
    return response.data; // assumed structure
  } catch (error) {
    throw error;
  }
};

export const getSingleSales = async (id: string) => {
  try {
    const response = await API.get(`/backend/sales/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch sales");
  }
};

// ✅ Update order by ID
export const updateSales = async (id: string, salesData: any) => {
  try {
    const response = await API.put(`backend/sales/${id}/edit`, salesData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update sales");
  }
};

export const deleteSales = async (id: string) => {
  try {
    const response = await API.delete(`/backend/sales/${id}/delete`);
    return response;
  } catch (error) {
    console.error(error);
  }
};

export const exportToexcelSales = async (payload: any = {}) => {
  try {
    const response = await API.post("/backend/sales/export", payload, {
      responseType: "blob", // important for Excel
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addOnlineOrderDetail = async (payload: any) => {
  try {
    const response = await API.post("/backend/online-order", payload); // send as JSON
    return response;
  } catch (error) {
    throw error;
  }
};

export const getOnlineOrderDetail = async (params: any = {}) => {
  try {
    const response = await API.get("/backend/online-order", { params });
    return response.data; // assumed structure
  } catch (error) {
    throw error;
  }
};

export const getSingleOrderDetail = async (id: string) => {
  try {
    const response = await API.get(`/backend/online-order/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch order");
  }
};

// ✅ Update order by ID
export const updateOrderDetail = async (id: string, orderData: any) => {
  try {
    const response = await API.put(`backend/online-order/${id}/edit`, orderData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update order");
  }
};

export const deleteOnlineOrderDetail = async (id: string) => {
  try {
    const response = await API.delete(`/backend/online-order/${id}/delete`);
    return response;
  } catch (error) {
    console.error(error);
  }
};

export const exportToexcelOnline = async (payload: any = {}) => {
  try {
    const response = await API.post("/backend/online-order/export", payload, {
      responseType: "blob", // important for Excel
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addPaymentDetail = async (payload: any) => {
  try {
    const response = await API.post("/backend/payment", payload); // send as JSON
    return response;
  } catch (error) {
    throw error;
  }
};

export const getPaymentDetail = async (params: any = {}) => {
  try {
    const response = await API.get("/backend/payment", { params });
    return response.data; // assumed structure
  } catch (error) {
    throw error;
  }
};

export const getSinglepaymentDetail = async (id: string) => {
  try {
    const response = await API.get(`/backend/payment/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch payment");
  }
};

// ✅ Update order by ID
export const updatePaymentDetail = async (id: string, orderData: any) => {
  try {
    const response = await API.put(`backend/payment/${id}/edit`, orderData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update payment");
  }
};

export const deletePaymentDetail = async (id: string) => {
  try {
    const response = await API.delete(`/backend/payment/${id}/delete`);
    return response;
  } catch (error) {
    console.error(error);
  }
};

export const exportToexcelPayment = async (payload: any = {}) => {
  try {
    const response = await API.post("/backend/payment/export", payload, {
      responseType: "blob", // important for Excel
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addExpense = async (payload: any) => {
  try {
    const response = await API.post("/backend/expense", payload); // send as JSON
    return response;
  } catch (error) {
    throw error;
  }
};

export const getExpense = async (params: any = {}) => {
  try {
    const response = await API.get("/backend/expense", { params });
    return response.data; // assumed structure
  } catch (error) {
    throw error;
  }
};

export const getSingleExpense = async (id: string) => {
  try {
    const response = await API.get(`/backend/expense/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch expense");
  }
};

// ✅ Update order by ID
export const updateExpense = async (id: string, expenseData: any) => {
  try {
    const response = await API.put(`backend/expense/${id}/edit`, expenseData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update expense");
  }
};

export const deleteExpense = async (id: string) => {
  try {
    const response = await API.delete(`/backend/expense/${id}/delete`);
    return response;
  } catch (error) {
    console.error(error);
  }
};