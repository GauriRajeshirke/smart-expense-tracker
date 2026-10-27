// Dashboard numbers. The server adds them up from the database, so the
// totals shown on screen always match the saved records.
// summary = { totals: {income, expenses, balance, savingsRate}, monthly: [...], categories: [...] }
import { createSlice } from "@reduxjs/toolkit";
import api from "../api/client";
import { apiThunk } from "../api/apiThunk";
import { logout } from "./authSlice";

export const fetchSummary = apiThunk("reports/fetchSummary", async () => {
  const { data } = await api.get("/reports/summary");
  return data;
});

const initialState = { summary: null, status: "idle", error: null };

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(logout, () => initialState);
  },
});

export default reportsSlice.reducer;
