// AI insights: unusual-spending results from the Python ML service.
// The browser asks Express, and Express asks the ML service.
// data = { analyzed, anomalies: [...], skippedCategories: [...], generatedAt }
import { createSlice } from "@reduxjs/toolkit";
import api from "../api/client";
import { apiThunk } from "../api/apiThunk";
import { logout } from "./authSlice";

export const fetchInsights = apiThunk("insights/fetch", async () => {
  const { data } = await api.get("/insights");
  return data;
});

const initialState = { data: null, status: "idle", error: null };

const insightsSlice = createSlice({
  name: "insights",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInsights.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchInsights.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Could not run the analysis";
      })
      // Log out = forget everything, so the next user never sees old results
      .addCase(logout, () => initialState);
  },
});

export default insightsSlice.reducer;
