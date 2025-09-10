import React from "react";

const Login = () => {
  const handleLogin = () => {
    console.log("Login");
  };

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
            placeholder="Enter your username"
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
            name="password"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
