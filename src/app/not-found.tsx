import Link from "next/link"
import styles from "./not-found.module.css"

export default function NotFound() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <h2 className={styles.subtitle}>Страница не найдена</h2>
      <p className={styles.text}>
        Похоже, этой страницы не существует или она была удалена.
      </p>
      <Link href="/" className={styles.link}>
        Вернуться на главную
      </Link>
    </div>
  )
}
