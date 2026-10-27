import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

// Shows the page only if the user is logged in; otherwise sends them to /login.
export default function ProtectedRoute() {
  const { user, token } = useSelector((state) => state.auth);
  return user && token ? <Outlet /> : <Navigate to="/login" replace />;
}
