"use client"

import { useEffect } from "react"
import styles from "./storymodal.module.css"

interface StoryMedia {
  type: "image" | "video"
  url: string
}

interface StoryUser {
  id: number
  username: string
  avatar: string
}

interface Props {
  user: StoryUser
  media: StoryMedia[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export default function StoryModal({ user, media, currentIndex, onClose, onNext, onPrev }: Props) {
  const current = media[currentIndex]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <img src={user.avatar} className={styles.avatar} />
          <span className={styles.username}>{user.username}</span>
        </header>

        <div className={styles.mediaWrapper}>
          {current.type === "image" && (
            <img src={current.url} className={styles.media} />
          )}

          {current.type === "video" && (
            <video src={current.url} className={styles.media} autoPlay loop />
          )}
        </div>

        <div className={styles.controls}>
          <button className={styles.prev} onClick={onPrev} />
          <button className={styles.next} onClick={onNext} />
        </div>

        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>
    </div>
  )
}
