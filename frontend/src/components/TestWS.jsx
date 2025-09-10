import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

// Connect to the Socket.IO server from the previous step
const socket = io("http://localhost:3000");

const TestWS = () => {
  // State for the input fields
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  // State for storing received chat messages
  const [chat, setChat] = useState([]);

  useEffect(() => {
    // Listener for incoming messages
    socket.on("chat message", (payload) => {
      // Update the chat state with the new message
      setChat((prevChat) => [...prevChat, payload]);
    });

    // Cleanup on component unmount
    return () => {
      socket.off("chat message");
    };
  }, []);

  // Function to handle form submission
  const sendMessage = (e) => {
    // Prevent the default form submission (which reloads the page)
    e.preventDefault();

    if (username && message) {
      // Create the payload to send
      const payload = {
        username: username,
        message: message,
      };
      // Emit the 'chat message' event to the server
      socket.emit("chat message", payload);
      // Clear the message input field after sending
      setMessage("");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>Real-time Chat</h2>

      {/* Form for sending messages */}
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          required
          style={{ padding: "8px", marginRight: "10px" }}
        />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          required
          style={{ padding: "8px", marginRight: "10px", width: "300px" }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>
          Send
        </button>
      </form>

      {/* Display area for chat messages */}
      <div style={{ marginTop: "20px" }}>
        <h3>Messages:</h3>
        {chat.map((payload, index) => (
          <p key={index}>
            <strong style={{ color: "#007BFF" }}>{payload.username}:</strong>{" "}
            {payload.message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default TestWS;
