import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout } from "../features/authSlice";
import transactionsReducer from "../features/transactionsSlice";
import budgetsReducer from "../features/budgetsSlice";
import reportsReducer from "../features/reportsSlice";
import insightsReducer from "../features/insightsSlice";
import { setUnauthorizedHandler } from "../api/client";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionsReducer,
    budgets: budgetsReducer,
    reports: reportsReducer,
    insights: insightsReducer,
  },
});

// If the server rejects our token (for example it expired), log the user out
setUnauthorizedHandler(() => store.dispatch(logout()));
