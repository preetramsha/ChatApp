import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { storeUser } from "../lib/auth";

const Signup = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    username: "",
    password: "",
  });
  const handleSignup = async () => {
    if (!data.name || !data.username || !data.password) {
      toast.error("Please enter a name, username and password");
      return;
    }
    const resp = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/auth/signup`,
      data,
      {
        validateStatus: () => true,
      }
    );
    if (resp.data.ok) {
      toast.success("Signup successful");
      storeUser(resp.data.token);
      navigate("/chats");
    } else {
      toast.error(resp.data.error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <div className="bg-zinc-900 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Signup</h2>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2" htmlFor="name">
            Name
          </label>
          <input
            className="w-full px-3 py-2 placeholder:text-gray-400 border rounded focus:outline-none focus:ring focus:border-blue-300"
            type="text"
            id="name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            name="name"
            placeholder="John Doe"
            autoComplete="off"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300 mb-2" htmlFor="username">
            Username
          </label>
          <input
            className="w-full px-3 py-2 border placeholder:text-gray-400 rounded focus:outline-none focus:ring focus:border-blue-300"
            type="text"
            id="username"
            value={data.username}
            onChange={(e) => setData({ ...data, username: e.target.value })}
            name="username"
            placeholder="johndoe"
            autoComplete="username"
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
            value={data.password}
            onChange={(e) => setData({ ...data, password: e.target.value })}
            name="password"
            placeholder="********"
            autoComplete="current-password"
          />
        </div>
        <button
          onClick={handleSignup}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSignup();
            }
          }}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Signup
        </button>
        <div className="text-center text-gray-500 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
