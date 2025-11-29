"use client";

import React, { useState, useEffect } from "react";
import styles from "./Search.module.css";
import { users } from "@/data/users";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState(""); // 👈 задержанный текст
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(users);

  // ⏳ Делаем задержку 250 мс
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounced(query);
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  // Поиск
  useEffect(() => {
    setLoading(true);

    const timeout = setTimeout(() => {
      const filtered = users.filter((u) =>
        u.username.toLowerCase().includes(debounced.toLowerCase())
      );
      setResults(filtered);
      setLoading(false);
    }, 200); // небольшая имитация запроса

    return () => clearTimeout(timeout);
  }, [debounced]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Поиск..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.results}>
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : results.length === 0 ? (
          <div className={styles.noUsers}>Ничего не найдено</div>
        ) : (
          results.map((user) => (
            <div key={user.id} className={styles.user}>
              <img src={user.avatar} alt={user.username} />
              <div className={styles.username}>{user.username}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
