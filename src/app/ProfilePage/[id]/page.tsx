import { users } from "@/data/users";
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
      {/* Декоративные фигуры */}
      <div className={styles.decorCircle}></div>
      <div className={styles.decorSquare}></div>

      {/* Заголовок */}
      <div className={styles.header}>
        <div className={styles.avatarWrapper}>
          <img src={user.avatar} alt={user.username} className={styles.avatar} />
        </div>
        <div className={styles.info}>
          <div className={styles.username}>{user.username}</div>
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
      </div>

      {/* Биография */}
      {user.bio && <div className={styles.bio}>{user.bio}</div>}

      {/* Активность */}
      <div className={styles.activityCard}>
        <h3>Активность</h3>
        <p>Вы опубликовали {user.postsCount} постов, получили {user.followers} подписчиков и следите за {user.following} пользователями.</p>
      </div>

      {/* Галерея */}
      <div className={styles.gallery}>
        {userPosts.map((post) => (
          <div key={post.id} className={styles.postWrapper}>
            <img src={post.image} alt="" className={styles.post} />
          </div>
        ))}
      </div>
    </div>
  );
}
