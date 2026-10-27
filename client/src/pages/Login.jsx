import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { clearError, loginUser } from "../features/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  // Forget any old server error when this page opens
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  if (user && token) return <Navigate to="/" replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = "Enter a valid email address";
    if (!form.password) found.password = "Enter your password";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const result = await dispatch(loginUser({ email: form.email.trim(), password: form.password }));
    if (loginUser.fulfilled.match(result)) navigate("/");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your finances."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
        <FormField label="Email" error={errors.email}>
          <input
            type="email"
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
          />
        </FormField>
        <FormField label="Password" error={errors.password}>
          <input
            type="password"
            className="input"
            placeholder="Your password"
            autoComplete="current-password"
            value={form.password}
            onChange={update("password")}
          />
        </FormField>
        <button type="submit" className="btn-primary w-full" disabled={status === "loading"}>
          {status === "loading" ? "Logging in..." : "Log in"}
        </button>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <strong>Demo account</strong> (fake sample data): demo@example.com / Demo@1234. Create it
          with <code>npm run seed</code> in the server folder.
        </p>
      </form>
    </AuthLayout>
  );
}
