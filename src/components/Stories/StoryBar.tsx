import { stories, getStoryWithUser } from "@/data/stories";
import styles from "./StoryBar.module.css";

const storyData = stories.map(getStoryWithUser);

export const StoryBar = () => (
    <div className={styles.storyBar}>
        {storyData.map((story) => (
            <div key={story.id} className={styles.story}>
                <img src={story.avatar} alt={story.username} />
                <span>{story.username}</span>
            </div>
        ))}
    </div>
);
