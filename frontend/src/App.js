import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import botLogo from "./images/bot.png";
import userLogo from "./images/userLogo.png"; // Add your user logo image
import vixrLogo from "./images/VixrLogo.png";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (message.trim() === "") return;

    const userMessage = { sender: "user", text: message };
    setChat([...chat, userMessage]);

    try {
      const res = await axios.post("http://localhost:3005/v1/bot/ask", {
        message,
      });
      const botMessage = { sender: "bot", text: res.data.response };
      setChat([...chat, userMessage, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        sender: "bot",
        text: "Error sending message. Please try again.",
      };
      setChat([...chat, userMessage, errorMessage]);
    }

    setMessage("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="bot-title" >
          <div className="bot-title-inner">
          <img src={vixrLogo} alt="vixrlogo" className="vixr-logo" />
          </div>
          <h1>ViXR Bot</h1>
        </div>
        <div className="chat-window">
          {chat.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.sender === "bot" && (
                <img src={botLogo} alt="bot logo" className="bot-logo" />
              )}
              {msg.sender === "user" && (
                <img src={userLogo} alt="user logo" className="user-logo" />
              )}
              <div className="message-text">{msg.text}</div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="message-form">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            required
          />
          <button type="submit">Send</button>
        </form>
      </header>
    </div>
  );
}

export default App;
