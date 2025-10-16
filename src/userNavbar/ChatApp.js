import React, { useState, useEffect, useRef } from "react";
import {
  FaSearch,
  FaTimes,
  FaPaperPlane,
  FaEllipsisV,
  FaTrash,
  FaEyeSlash,
} from "react-icons/fa";
import { Link, useParams } from "react-router-dom";

const ChatApp = () => {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [allAlumni, setAllAlumni] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeMsgMenu, setActiveMsgMenu] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [hiddenChats, setHiddenChats] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { id } = useParams();
  const currentUser = user;

  // Fetch current user
  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/api/session")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(console.error);
  }, []);

  // Fetch all alumni
  useEffect(() => {
    if (!currentUser?.id) return;

    fetch("https://server-1-gjvd.onrender.com/api/users")
      .then((res) => res.json())
      .then((data) =>
        setAllAlumni(data.filter((a) => a.id !== currentUser.id))
      )
      .catch(console.error);
  }, [currentUser]);

  // Load conversations
  const loadConversations = () => {
    if (!currentUser?.id) return;

    fetch(`https://server-1-gjvd.onrender.com/api/messages/${currentUser.id}/conversations`)
      .then((res) => res.json())
      .then((data) => {
        const updated = (Array.isArray(data) ? data : []).map((conv) => ({
          ...conv,
          unseen_count: conv.unseen_count || 0,
        }));
        setConversations(updated);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  // Auto refresh unseen counts
  useEffect(() => {
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Load messages
  useEffect(() => {
    if (!selectedUser || !currentUser?.id) return;

    fetch(`https://server-1-gjvd.onrender.com/api/messages/${currentUser.id}/${selectedUser.partner_id}`)
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch(() => setMessages([]));
  }, [selectedUser, currentUser]);

  // Scroll to latest
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !selectedUser) return;

    const newMsg = {
      sender_id: currentUser.id,
      receiver_id: selectedUser.partner_id,
      message: input.trim(),
    };

    try {
      const res = await fetch("https://server-1-gjvd.onrender.com/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMsg),
      });

      const savedMsg = await res.json();
      setMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        {
          ...savedMsg,
          id: savedMsg.id || Date.now(),
          created_at: new Date(),
          is_seen: false,
        },
      ]);
      setInput("");
      inputRef.current?.focus();
      loadConversations();
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  // Hide conversation
  const handleHideConversation = async (partnerId) => {
    try {
      await fetch(`https://server-1-gjvd.onrender.com/api/messages/${currentUser.id}/${partnerId}/hide`, {
        method: "PATCH",
      });
      loadConversations();
      setActiveMenu(null);
    } catch (err) {
      console.error("Hide failed:", err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (partnerId) => {
    try {
      await fetch(`https://server-1-gjvd.onrender.com/api/messages/${currentUser.id}/${partnerId}/delete`, {
        method: "DELETE",
      });
      loadConversations();
      if (selectedUser?.partner_id === partnerId) setSelectedUser(null);
      setActiveMenu(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Unsend message
  const handleUnsendMessage = async (id) => {
    try {
      await fetch(`https://server-1-gjvd.onrender.com/api/messages/${id}`, { method: "DELETE" });
      setMessages((prev) =>
        (Array.isArray(prev) ? prev : []).filter((m) => m.id !== id)
      );
      setActiveMsgMenu(null);
    } catch (err) {
      console.error("Unsend failed", err);
    }
  };

  // Select user + mark seen
  const handleSelectUser = async (user) => {
    const partnerId = user.partner_id || user.id;
    setSelectedUser({
      partner_id: partnerId,
      first_name: user.first_name,
      last_name: user.last_name,
      profile: user.profile || null,
    });
    setActiveMenu(null);

    // Mark all messages from partner as seen
    try {
      await fetch(`https://server-1-gjvd.onrender.com/api/messages/${currentUser.id}/${partnerId}/seen`, {
        method: "PATCH",
      });
      loadConversations();
    } catch (err) {
      console.error("Mark seen failed:", err);
    }
  };

  const isSearch = searchTerm.trim() !== "";


  // Filter conversations
  const filteredConversations = (() => {
    if (!searchTerm) {
      return conversations.filter((c) => !hiddenChats.includes(c.partner_id));
    }

    const term = searchTerm.toLowerCase();
    const matched = allAlumni.filter((a) =>
      `${a.first_name} ${a.last_name}`.toLowerCase().includes(term)
    );

    const chattedIds = new Set(conversations.map((c) => c.partner_id));
    const chatted = matched.filter((a) => chattedIds.has(a.id));
    const notChatted = matched.filter((a) => !chattedIds.has(a.id));

    return [...chatted, ...notChatted];
  })();

  // Close menus when clicking outside
  useEffect(() => {
    const closeMenus = () => {
      setActiveMenu(null);
      setActiveMsgMenu(null);
    };
    window.addEventListener("click", closeMenus);
    return () => window.removeEventListener("click", closeMenus);
  }, []);


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-semibold tracking-wide">Messages</h1>
      </div>

      {/* Search */}
      <div className="p-4 border-b bg-white flex items-center rounded-md shadow-sm mx-3 mt-3 mb-2">
        <FaSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search alumni..."
          className="flex-1 outline-none bg-transparent text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

{/* Conversations List */}
<div className="flex-1 overflow-y-auto px-3 pb-4">
  {filteredConversations.length > 0 ? (
    filteredConversations.map((user) => (
      <div
        key={user.partner_id || user.id}
        className="bg-white p-3 mb-2 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 relative"
      >
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => handleSelectUser(user)}
        >
          {user.profile ? (
            <img
              src={user.profile}
              alt="profile"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white text-lg font-bold">
              {user.first_name ? user.first_name[0].toUpperCase() : "U"}
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 truncate max-w-[60%]">
                {user.first_name} {user.last_name}
              </p>

              {user.unseen_count > 0 && (
                <span className="shrink-0 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {user.unseen_count}
                </span>
              )}
            </div>

            <p
              className={`text-sm truncate ${
                user.unseen_count > 0
                  ? "font-semibold text-gray-900"
                  : "font-normal text-gray-500"
              }`}
            >
              {user.last_message || "Tap to chat"}
            </p>
          </div>
        </div>

        {/* 🔹 Menu only visible when NOT searching */}
        {!isSearch && (
          <>
            <div
              className="absolute top-3 right-3 text-gray-500 cursor-pointer hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(
                  activeMenu === user.partner_id ? null : user.partner_id
                );
              }}
            >
              <FaEllipsisV />
            </div>

            {activeMenu === user.partner_id && (
              <div className="absolute right-3 top-10 bg-white border rounded-md shadow-md text-sm text-gray-700 z-10">
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                  onClick={() => handleHideConversation(user.partner_id)}
                >
                  <FaEyeSlash /> Hide
                </button>
                <button
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-red-500"
                  onClick={() =>
                    setConfirmAction({
                      type: "delete",
                      partnerId: user.partner_id,
                    })
                  }
                >
                  <FaTrash /> Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    ))
  ) : (
    <p className="text-gray-500 text-center mt-8 text-sm">
      No conversations yet.
    </p>
  )}
</div>


      {/* Chat Modal */}
      {selectedUser && (
        <div className="fixed inset-0 flex items-end md:items-center justify-center bg-black bg-opacity-40 z-50 transition-all">
          <div className="bg-white w-full md:w-3/5 lg:w-1/2 h-full md:h-[80vh] flex flex-col rounded-t-lg md:rounded-lg shadow-2xl overflow-hidden">
            {/* Header with profile */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                to={
                  user?.id === selectedUser.partner_id
                    ? "/userprofile"
                    : `/profiles/${selectedUser.partner_id}`
                }
                className="flex items-center gap-3"
              >

                  {selectedUser.profile ? (
                    <img
                      src={selectedUser.profile}
                      alt="profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
                      {selectedUser.first_name
                        ? selectedUser.first_name[0].toUpperCase()
                        : "U"}
                    </div>
                  )}

                  <h2 className="font-semibold text-lg text-white">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </h2>
                </Link>
              </div>


              <FaTimes
                className="cursor-pointer hover:text-gray-200 transition"
                onClick={() => setSelectedUser(null)}
              />
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
              {messages.length ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${
                      msg.sender_id === currentUser.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {msg.sender_id === currentUser.id && (
                      <div className="relative flex items-center">
                        <FaEllipsisV
                          className="text-gray-400 hover:text-gray-600 cursor-pointer mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMsgMenu(
                              activeMsgMenu === msg.id ? null : msg.id
                            );
                          }}
                        />
                        {activeMsgMenu === msg.id && (
                          <div className="absolute right-5 top-0 bg-white border rounded shadow text-sm z-50">
                            <button
                              className="block w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500"
                              onClick={() =>
                                setConfirmAction({ type: "unsend", msgId: msg.id })
                              }
                            >
                              Unsend
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`relative px-4 py-2 rounded-2xl text-sm max-w-[70%] shadow ${
                        msg.sender_id === currentUser.id
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p>{msg.message}</p>
                      <span className="block text-xs mt-1 opacity-70 text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {msg.sender_id === currentUser.id && msg.is_seen && (
                        <span className="block text-[10px] mt-0.5 text-gray-400 text-right">
                          Seen
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center text-sm mt-4">
                  No messages yet.
                </p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-white flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 p-2 border rounded-full focus:ring-2 focus:ring-blue-400 outline-none transition"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                className="bg-blue-600 text-white p-2 px-3 rounded-full hover:bg-blue-700 transition"
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80 text-center">
            <p className="text-gray-800 mb-4 text-sm">
              {confirmAction.type === "delete"
                ? "Are you sure you want to delete this conversation?"
                : "Are you sure you want to unsend this message?"}
            </p>
            <div className="flex justify-around mt-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === "delete")
                    handleDeleteConversation(confirmAction.partnerId);
                  if (confirmAction.type === "unsend")
                    handleUnsendMessage(confirmAction.msgId);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
