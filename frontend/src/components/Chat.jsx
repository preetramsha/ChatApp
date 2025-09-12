import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io as socketIOClient } from "socket.io-client";
import { getUser, removeUser } from "../lib/auth";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

const Chat = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");

  const socketRef = useRef(null);
  const listEndRef = useRef(null);

  useEffect(() => {
    const u = getUser();
    if (!u) {
      removeUser();
      navigate("/login");
      return;
    }
    setUser(u);
  }, [navigate]);

  useEffect(() => {
    if (!sessionId || !user) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${SOCKET_URL}/site/messages`, {
          params: { sessionId },
          timeout: 10000,
        });
        if (!isMounted) return;
        const list = Array.isArray(res?.data?.messages)
          ? res.data.messages
          : [];
        setMessages(list);
      } catch (e) {
        if (!isMounted) return;
        setError(e?.message || "Failed to load messages");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [sessionId, user]);

  // Fetch session title (do not display raw session id in UI)
  useEffect(() => {
    if (!sessionId || !user) return;
    let isMounted = true;
    const fetchTitle = async () => {
      try {
        const res = await axios.get(`${SOCKET_URL}/site/chat-sessions`, {
          params: { userId: user.id },
          timeout: 10000,
        });
        if (!isMounted) return;
        const sessions = Array.isArray(res?.data?.sessions)
          ? res.data.sessions
          : [];
        const match = sessions.find((s) => s.sessionId === sessionId);
        setSessionTitle(match?.displayTitle || "");
      } catch (e) {
        if (!isMounted) return;
        setSessionTitle("");
      }
    };
    fetchTitle();
    return () => {
      isMounted = false;
    };
  }, [sessionId, user]);

  useEffect(() => {
    if (!sessionId || !user) return;

    const socket =
      socketRef.current ||
      socketIOClient(SOCKET_URL, {
        transports: ["websocket"],
        withCredentials: false,
      });
    socketRef.current = socket;

    socket.emit("join-room", sessionId);

    const onIncoming = (payload) => {
      // payload: { userId, message, chatSessionId }
      if (!payload) return;
      if (payload.chatSessionId !== sessionId) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          senderId: payload.userId,
          userId: payload.userId,
          content: payload.message,
          senderUsername:
            payload.senderUsername ||
            (String(payload.userId) === String(user.id)
              ? user.username
              : undefined),
          chatSessionId: payload.chatSessionId,
          createdAt: new Date().toISOString(),
        },
      ]);
    };

    const onError = (msg) => {
      // non-fatal; show ephemeral error
      // Optionally could toast; for now, set error briefly
      setError(String(msg || "Socket error"));
      setTimeout(() => setError(null), 3000);
    };

    socket.on("chat-message", onIncoming);
    socket.on("error", onError);

    return () => {
      socket.off("chat-message", onIncoming);
      socket.off("error", onError);
      // Do not disconnect globally if other pages reuse socket; here we created it, so we leave it connected
    };
  }, [sessionId, user]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const normalizedMessages = useMemo(() => {
    return messages.map((m, idx) => {
      const text = m?.content || m?.message || m?.text || "";
      const uid = m?.userId || m?.senderId || m?.fromUserId || m?.user_id;
      const created = m?.createdAt || m?.created_at || m?.timestamp || null;
      const mid = m?.id || m?._id || `${idx}-${uid}-${created || "t"}`;
      const username = m?.senderUsername || m?.username || null;
      return { id: mid, text, userId: uid, createdAt: created, username };
    });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !sessionId) return;
    if (!socketRef.current) return;

    const text = input.trim();
    setIsSending(true);
    try {
      socketRef.current.emit("chat-message", {
        chatSessionId: sessionId,
        userId: user.id,
        message: text,
      });
      setInput("");
    } catch (e) {
      setError(e?.message || "Failed to send message");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-black text-gray-100" />;
  }

  return (
    <div className="h-screen bg-black text-gray-100 flex flex-col">
      <header className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/60 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-400">Chat</div>
            <div className="text-lg font-semibold text-white truncate">
              {sessionTitle || "Chat"}
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="rounded-md border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-3 py-1.5 text-sm"
          >
            Back
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {isLoading && (
            <div className="text-zinc-400">Loading messages...</div>
          )}
          {error && !isLoading && (
            <div className="text-red-400 mb-2">{error}</div>
          )}

          {!isLoading && normalizedMessages.length === 0 && (
            <div className="text-zinc-500">No messages yet. Say hello!</div>
          )}

          <ul className="space-y-3">
            {normalizedMessages.map((m) => {
              const isMine = m.username
                ? String(m.username) === String(user.username)
                : String(m.userId) === String(user.id);
              return (
                <li
                  key={m.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm border ${
                      isMine
                        ? "bg-zinc-200 text-zinc-900 border-zinc-300"
                        : "bg-zinc-900 text-zinc-100 border-zinc-800"
                    }`}
                  >
                    {!isMine && m.username && (
                      <div className="text-xs text-zinc-400 mb-0.5">
                        {m.username}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">
                      {m.text}
                    </div>
                  </div>
                </li>
              );
            })}
            <li ref={listEndRef} />
          </ul>
        </div>
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-950 p-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            className="flex-1 resize-none rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={`rounded-md px-3 py-2 text-sm min-w-20 ${
              input.trim() && !isSending
                ? "bg-white text-black hover:opacity-90"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            }`}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
