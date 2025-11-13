import styles from "@/app/Home.module.css";
import { StoryBar } from "@/components/Stories/StoryBar";
import { PostList } from "@/components/Posts/PostList";

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      <div className={styles["stories-wrapper"]}>
        <StoryBar />
      </div>

      <div className={styles.feed}>
        <PostList />
      </div>
    </div>
  );
}
