// Turns any error into a short message that is safe to show on screen.
export function getErrorMessage(error) {
  if (typeof error === "string") return error; // already a message (from rejectWithValue)
  if (error?.response?.data?.message) return error.response.data.message; // message from our API
  if (error?.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
  if (error?.request) return "Cannot reach the server. Check that the API is running on port 5000.";
  return "Something went wrong. Please try again.";
}
