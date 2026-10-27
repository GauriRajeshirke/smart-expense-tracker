// Real registration and login. The server returns { token, user }; we keep
// both in localStorage so the user stays logged in after a page refresh.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api/client";
import { getErrorMessage } from "../api/errors";

function loadSession() {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    return token && user ? { token, user } : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

function saveSession({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export const registerUser = createAsyncThunk("auth/register", async (form, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/register", form);
    saveSession(data);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const loginUser = createAsyncThunk("auth/login", async (form, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/auth/login", form);
    saveSession(data);
    return data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: { ...loadSession(), status: "idle", error: null },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    for (const thunk of [registerUser, loginUser]) {
      builder
        .addCase(thunk.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.status = "idle";
          state.user = action.payload.user;
          state.token = action.payload.token;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.status = "idle";
          state.error = action.payload || "Something went wrong";
        });
    }
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
