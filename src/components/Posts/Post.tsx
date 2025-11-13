import styles from "./Post.module.css";

interface PostProps {
  username?: string;
  avatar?: string;
  image: string;
  caption: string;
  createdAt: string;
}

export const Post = ({ username, avatar, image, caption, createdAt }: PostProps) => {
  const date = new Date(createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div className={styles.post}>
      <div className={styles.header}>
        <img src={avatar} alt={username} />
        <span>{username}</span>
        <span className={styles.date}>{date}</span>
      </div>
      <img className={styles.postImage} src={image} alt="post" />
      <p className={styles.caption}><strong>{username}</strong> {caption}</p>
    </div>
  );
};
