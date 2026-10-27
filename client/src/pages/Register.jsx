import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { clearError, registerUser } from "../features/authSlice";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  if (user && token) return <Navigate to="/" replace />;

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = "Enter your name (at least 2 characters)";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = "Enter a valid email address";
    if (form.password.length < 8) found.password = "Password must be at least 8 characters";
    if (form.password.length > 72) found.password = "Password must be 72 characters or fewer";
    if (form.confirm !== form.password) found.confirm = "Passwords do not match";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const result = await dispatch(
      registerUser({ name: form.name.trim(), email: form.email.trim(), password: form.password })
    );
    if (registerUser.fulfilled.match(result)) navigate("/");
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking your money in a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
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
        <FormField label="Name" error={errors.name}>
          <input
            type="text"
            className="input"
            placeholder="Your name"
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
          />
        </FormField>
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
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={form.password}
            onChange={update("password")}
          />
        </FormField>
        <FormField label="Confirm password" error={errors.confirm}>
          <input
            type="password"
            className="input"
            placeholder="Type it again"
            autoComplete="new-password"
            value={form.confirm}
            onChange={update("confirm")}
          />
        </FormField>
        <button type="submit" className="btn-primary w-full" disabled={status === "loading"}>
          {status === "loading" ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
