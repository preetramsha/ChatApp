import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Landing from "./Landing";
import Login from "./Login";
import TestWS from "./TestWS";
import Signup from "./Signup";
import ChatSessions from "./ChatSessions";
import Chat from "./Chat";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/testws" element={<TestWS />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chats" element={<ChatSessions />} />
        <Route path="/chat/:id" element={<Chat />} />
      </Routes>
      <ToastContainer closeOnClick={true} />
    </BrowserRouter>
  );
};

export default AppRouter;
