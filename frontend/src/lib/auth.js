import { jwtDecode } from "jwt-decode";

const storeUser = (token) => {
  localStorage.setItem("token", token);
};

const getUser = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      console.warn("Token expired");
      removeUser();
      return null;
    }
    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    removeUser();
    return null;
  }
};

const getToken = () => {
  return localStorage.getItem("token") || false;
};

const removeUser = () => {
  localStorage.removeItem("token");
};

export { storeUser, getUser, getToken, removeUser };
