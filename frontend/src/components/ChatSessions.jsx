import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";

const ChatSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const MASTER_USER_ID = "ybejd4k4vo76xo6wpcjls864";

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/site/chat-sessions",
          {
            params: { userId: "ybejd4k4vo76xo6wpcjls864" },
            timeout: 10000,
          }
        );

        if (!isMounted) return;
        const data = response.data;
        if (data && data.ok && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        } else {
          setError("Unexpected response from server");
        }
      } catch (err) {
        setError(err?.message || "Failed to load chat sessions");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSessions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenSession = (sessionId) => {
    navigate(`/chat/${sessionId}`);
  };

  // Open modal and load recent users
  const openModal = async () => {
    setIsModalOpen(true);
    setSearchTerm("");
    setSearchResults([]);
    setTitle("");
    try {
      const res = await axios.get("http://localhost:3000/site/recent-users");
      if (res?.data?.ok && Array.isArray(res.data.users)) {
        const filteredUsers = res.data.users.filter(
          (u) => u.id !== MASTER_USER_ID
        );
        setRecentUsers(filteredUsers);
      } else {
        setRecentUsers([]);
      }
    } catch {
      setRecentUsers([]);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUsers([]);
    setSearchTerm("");
    setSearchResults([]);
    setTitle("");
    setIsCreating(false);
  };

  // Debounced user search
  useEffect(() => {
    if (!isModalOpen) return;
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await axios.get("http://localhost:3000/site/search-users", {
          params: { searchTerm },
          timeout: 10000,
          signal: controller.signal,
        });
        if (res?.data?.ok && Array.isArray(res.data.users)) {
          //remove master user from search results
          const filteredUsers = res.data.users.filter(
            (u) => u.id !== MASTER_USER_ID
          );
          setSearchResults(filteredUsers);
        } else {
          setSearchResults([]);
        }
      } catch (e) {
        if (!axios.isCancel(e)) {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 600);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [searchTerm, isModalOpen]);

  const resolveUserId = (u) => u?.userId || u?.id || u?._id;
  const resolveUserLabel = (u) => u?.username || u?.name || resolveUserId(u);

  const isSelected = (user) => {
    const uid = resolveUserId(user);
    return selectedUsers.some((u) => resolveUserId(u) === uid);
  };

  const toggleSelectUser = (user) => {
    const uid = resolveUserId(user);
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => resolveUserId(u) === uid);
      if (exists) {
        return prev.filter((u) => resolveUserId(u) !== uid);
      }
      return [...prev, user];
    });
  };

  const removeSelectedUser = (uid) => {
    setSelectedUsers((prev) => prev.filter((u) => resolveUserId(u) !== uid));
  };

  const selectedCount = selectedUsers.length; // number excluding master
  const isGroup = selectedCount >= 2; // total participants > 2 including master
  const canStart = selectedCount === 1 && !isCreating;
  const canCreateGroup = isGroup && !isCreating;

  const allUserIdsForCreate = useMemo(() => {
    const ids = [MASTER_USER_ID, ...selectedUsers.map((u) => resolveUserId(u))];
    return Array.from(new Set(ids));
  }, [selectedUsers]);

  const refreshSessions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:3000/site/chat-sessions",
        {
          params: { userId: MASTER_USER_ID },
          timeout: 10000,
        }
      );
      const data = response.data;
      if (data && data.ok && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    if (!selectedCount) return;
    if (isGroup && !title.trim()) return;
    setIsCreating(true);
    try {
      const res = await axios.post(
        "http://localhost:3000/site/chat-session",
        {
          masterUserId: MASTER_USER_ID,
          userIds: allUserIdsForCreate,
          title: isGroup ? title.trim() : undefined,
        },
        { timeout: 15000 }
      );
      const sessionId = res?.data?.session?.sessionId;
      if (sessionId) {
        closeModal();
        await refreshSessions();
        handleOpenSession(sessionId);
      }
    } catch (e) {
      // Optionally show error
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Chat Sessions</h1>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 px-3 py-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>

        {isLoading && <div className="text-gray-400">Loading sessions...</div>}
        {error && <div className="text-red-400">{error}</div>}

        {!isLoading &&
          !error &&
          (sessions.length === 0 ? (
            <div className="text-gray-400">No sessions found.</div>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li
                  key={s.sessionId}
                  className="border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 rounded-lg p-4 cursor-pointer transition-colors"
                  onClick={() => handleOpenSession(s.sessionId)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white">
                      {s.displayTitle || s.sessionId}
                    </span>
                    <svg
                      className="h-4 w-4 text-zinc-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707A1 1 0 118.707 5.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 text-gray-100 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold">Start a new chat</h2>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-md hover:bg-zinc-900 text-zinc-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((u) => {
                      const uid = resolveUserId(u);
                      const label = resolveUserLabel(u);
                      return (
                        <span
                          key={uid}
                          className="inline-flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-sm"
                        >
                          {label}
                          <button
                            className="rounded-full p-0.5 hover:bg-zinc-800"
                            onClick={() => removeSelectedUser(uid)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or username"
                    className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                  />
                </div>

                {searchTerm ? (
                  <div>
                    <div className="text-xs uppercase text-zinc-500 mb-2">
                      Search results
                    </div>
                    {isSearching ? (
                      <div className="text-zinc-400 text-sm">Searching...</div>
                    ) : (
                      <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-md overflow-hidden">
                        {searchResults.length === 0 ? (
                          <li className="p-3 text-sm text-zinc-400">
                            No users found
                          </li>
                        ) : (
                          searchResults.map((u) => {
                            const uid = resolveUserId(u);
                            const label = resolveUserLabel(u);
                            const selected = isSelected(u);
                            return (
                              <li
                                key={uid}
                                className="flex items-center justify-between p-3 hover:bg-zinc-900 cursor-pointer"
                                onClick={() => toggleSelectUser(u)}
                              >
                                <div>
                                  <div className="text-sm text-white">
                                    {label}
                                  </div>
                                  {u?.name && u?.username && (
                                    <div className="text-xs text-zinc-500">
                                      {u.name} · {u.username}
                                    </div>
                                  )}
                                </div>
                                <div
                                  className={`h-4 w-4 rounded-sm border flex items-center justify-center ${
                                    selected
                                      ? "bg-zinc-200 border-zinc-600"
                                      : "border-zinc-700"
                                  }`}
                                >
                                  {selected && (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3 text-zinc-900"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-xs uppercase text-zinc-500 mb-2">
                      Recent users
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {recentUsers.map((u) => {
                        const uid = resolveUserId(u);
                        const label = resolveUserLabel(u);
                        const selected = isSelected(u);
                        return (
                          <button
                            key={uid}
                            onClick={() => toggleSelectUser(u)}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 text-left ${
                              selected
                                ? "border-zinc-600 bg-zinc-900"
                                : "border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                            }`}
                          >
                            <div>
                              <div className="text-sm text-white">{label}</div>
                              {u?.name && u?.username && (
                                <div className="text-xs text-zinc-500">
                                  {u.name} · {u.username}
                                </div>
                              )}
                            </div>
                            <div
                              className={`h-4 w-4 rounded-sm border flex items-center justify-center ${
                                selected
                                  ? "bg-zinc-700 border-zinc-600"
                                  : "border-zinc-700"
                              }`}
                            >
                              {selected && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3 w-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isGroup && (
                  <div>
                    <label className="block text-sm text-zinc-300 mb-1">
                      Group title
                    </label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a group title"
                      className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="text-xs text-zinc-500">
                  {1 + selectedCount} participant
                  {1 + selectedCount === 1 ? "" : "s"}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={closeModal}
                    className="rounded-md border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-3 py-2 text-sm"
                  >
                    Cancel
                  </button>
                  {selectedCount === 1 && (
                    <button
                      onClick={createSession}
                      disabled={!canStart}
                      className={`rounded-md px-3 py-2 text-sm ${
                        canStart
                          ? "bg-white text-black hover:opacity-90"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {isCreating ? "Starting..." : "Start chat"}
                    </button>
                  )}
                  {isGroup && (
                    <button
                      onClick={createSession}
                      disabled={!canCreateGroup || !title.trim()}
                      className={`rounded-md px-3 py-2 text-sm ${
                        canCreateGroup && title.trim()
                          ? "bg-white text-black hover:opacity-90"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {isCreating ? "Creating..." : "Create group chat"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSessions;
