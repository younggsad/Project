import { users } from "@/data/user";
import { posts } from "@/data/posts";
import styles from "./ProfilePage.module.css";

export default async function ProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const userId = Number(id);

  const user = users.find((u) => u.id === userId);

  if (!user) return <div className="p-4">Пользователь не найден</div>;

  const userPosts = posts.filter((p) => p.userId === userId);

  return (
    <div className={styles.profilePage}>
    <div className={styles.username}>{user.username}</div>
    <div className={styles.header}>
        <img src={user.avatar} className={styles.avatar} />

        <div className={styles.stats}>
        <div className={styles.statItem}>
            <div className={styles.statNumber}>{user.postsCount}</div>
            <div className={styles.statLabel}>Посты</div>
        </div>
        <div className={styles.statItem}>
            <div className={styles.statNumber}>{user.followers}</div>
            <div className={styles.statLabel}>Подписчики</div>
        </div>
        <div className={styles.statItem}>
            <div className={styles.statNumber}>{user.following}</div>
            <div className={styles.statLabel}>Подписки</div>
        </div>
        </div>
    </div>

    <div className={styles.bio}>{user.bio}</div>
    <a className={styles.link} href={user.link}>{user.link}</a>

    <div className={styles.gallery}>
        {userPosts.map((post) => (
        <img key={post.id} src={post.image} className={styles.post} />
        ))}
    </div>
    </div>
  );
}
