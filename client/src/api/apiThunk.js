// A small helper that wraps an API call as a Redux async action ("thunk").
// If the call fails, the action is "rejected" with a readable message.
//
//   export const fetchThings = apiThunk("things/fetch", async (arg, dispatch) => {
//     const { data } = await api.get("/things");
//     return data;            // becomes action.payload when it succeeds
//   });
import { createAsyncThunk } from "@reduxjs/toolkit";
import { getErrorMessage } from "./errors";

export const apiThunk = (type, request) =>
  createAsyncThunk(type, async (arg, { rejectWithValue, dispatch }) => {
    try {
      return await request(arg, dispatch);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  });
