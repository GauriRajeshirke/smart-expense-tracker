// Transactions now live in MongoDB. Each thunk calls the Express API and the
// store is updated with whatever the server sends back.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api/client";
import { getErrorMessage } from "../api/errors";
import { logout } from "./authSlice";

export const fetchTransactions = createAsyncThunk(
  "transactions/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/transactions");
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addTransaction = createAsyncThunk(
  "transactions/add",
  async (form, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/transactions", form);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateTransaction = createAsyncThunk(
  "transactions/update",
  async ({ id, form }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/transactions/${id}`, form);
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  "transactions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = { items: [], status: "idle", error: null };

const transactionsSlice = createSlice({
  name: "transactions",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = "ready";
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Could not load transactions";
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.items.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
      })
      // Log out = forget everything, so the next user never sees old data
      .addCase(logout, () => initialState);
  },
});

export default transactionsSlice.reducer;
