"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./Messages.module.css";
import { users, User } from "@/data/users";

interface Message {
  from: "me" | "them";
  text: string;
}

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (!input.trim() || !selectedChat) return;

    setMessages(prev => {
      const chatMessages = prev[selectedChat] || [];
      return {
        ...prev,
        [selectedChat]: [...chatMessages, { from: "me", text: input }],
      };
    });
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChat]);

  const selectedUser = users.find(u => u.id === selectedChat);

  return (
    <div className={styles.wrapper}>
      {/* LEFT PANEL */}
      <div className={styles.sidebar}>
        <div className={styles.header}>Direct</div>
        <div className={styles.chatList}>
          {users.map(user => (
            <div
              key={user.id}
              className={`${styles.chatItem} ${
                selectedChat === user.id ? styles.active : ""
              }`}
              onClick={() => setSelectedChat(user.id)}
            >
              <img src={user.avatar} className={styles.avatar} />
              <div className={styles.chatText}>
                <div className={styles.username}>{user.username}</div>
                <div className={styles.lastMessage}>
                  {messages[user.id]?.slice(-1)[0]?.text || "Написать сообщение..."}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className={styles.right}>
        {!selectedChat ? (
          <div className={styles.empty}>
            <div className={styles.icon}>💬</div>
            <h2>Ваши сообщения</h2>
            <p>Отправляйте личные фото и сообщения друзьям.</p>
          </div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <img
                src={selectedUser?.avatar}
                className={styles.chatHeaderAvatar}
              />
              <p className={styles.chatHeaderUsername}>{selectedUser?.username}</p>
            </div>

            <div className={styles.chatMessages}>
              {(messages[selectedChat] || []).map((msg, index) => (
                <div
                  key={index}
                  className={`${styles.message} ${
                    msg.from === "me" ? styles.fromMe : styles.fromThem
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.chatInputArea}>
              <input
                type="text"
                placeholder="Написать сообщение..."
                className={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
              />
              <button className={styles.sendButton} onClick={handleSend}>
                Отправить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
