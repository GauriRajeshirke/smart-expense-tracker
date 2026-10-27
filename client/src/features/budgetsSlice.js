// Budgets for one month, each already combined with how much was really spent
// (the server calculates "spent" from the user's transactions in MongoDB).
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api/client";
import { getErrorMessage } from "../api/errors";
import { logout } from "./authSlice";

export const fetchBudgets = createAsyncThunk(
  "budgets/fetch",
  async (month, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/budgets/progress", { params: { month } });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Create or update a budget, then reload the list so "spent" and "percent" are fresh
export const saveBudget = createAsyncThunk(
  "budgets/save",
  async ({ category, month, limit }, { dispatch, rejectWithValue }) => {
    try {
      await api.post("/budgets", { category, month, limit });
      await dispatch(fetchBudgets(month));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteBudget = createAsyncThunk(
  "budgets/delete",
  async ({ id, month }, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/budgets/${id}`);
      await dispatch(fetchBudgets(month));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = { items: [], status: "idle", error: null };

const budgetsSlice = createSlice({
  name: "budgets",
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.status = "ready";
        state.items = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Could not load budgets";
      })
      .addCase(logout, () => initialState);
  },
});

export default budgetsSlice.reducer;
