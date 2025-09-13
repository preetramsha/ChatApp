import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { getUser, removeUser, storeUser } from "../lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    username: "",
    password: "",
  });
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);

  const handleLogin = async () => {
    if (!data.username || !data.password) {
      toast.error("Please enter a username and password");
      return;
    }
    const resp = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
      data,
      {
        validateStatus: () => true,
      }
    );
    if (resp.data.ok) {
      toast.success("Login successful");
      storeUser(resp.data.token);
      navigate("/chats");
    } else {
      toast.error(resp.data.error);
    }
  };

  useEffect(() => {
    const user = getUser();
    if (user) {
      setUser(user);
    } else {
      removeUser();
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    removeUser();
    setUser(null);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen ">
        Loading...
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen ">
        You are logged in as {user.name} <br />
        <button
          className="text-blue-500 hover:text-blue-600 mt-2"
          onClick={handleLogout}
        >
          Logout?
        </button>
        <div className="text-center text-gray-500 mt-2">
          <Link to="/chats" className="text-blue-500 hover:text-blue-600">
            Back to Chats
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="bg-zinc-900 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2" htmlFor="username">
            Username
          </label>
          <input
            className="w-full px-3 py-2 border placeholder:text-gray-400 rounded focus:outline-none focus:ring focus:border-blue-300"
            type="text"
            id="username"
            name="username"
            placeholder="johndoe"
            autoComplete="username"
            value={data.username}
            onChange={(e) => setData({ ...data, username: e.target.value })}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="w-full px-3 py-2 border placeholder:text-gray-400 rounded focus:outline-none focus:ring focus:border-blue-300"
            type="password"
            id="password"
            name="password"
            placeholder="********"
            autoComplete="current-password"
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
        </div>
        <button
          onClick={handleLogin}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleLogin();
            }
          }}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Login
        </button>
        <div className="text-center text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-500">
            Sign up
          </Link>
        </div>
        <div
          className="text-center  mt-4 cursor-pointer text-blue-500"
          onClick={handleLogout}
        >
          Logout
        </div>
      </div>
    </div>
  );
};

export default Login;
