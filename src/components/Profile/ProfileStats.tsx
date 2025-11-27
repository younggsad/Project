interface Props {
  user: any;
}

export default function ProfileStats({ user }: Props) {
  return (
    <div className="flex justify-around px-4 py-2">
      <div className="flex flex-col items-center">
        <span className="font-semibold">{user.postsCount}</span>
        <span className="text-sm opacity-75">посты</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-semibold">{user.followers}</span>
        <span className="text-sm opacity-75">подписчики</span>
      </div>

      <div className="flex flex-col items-center">
        <span className="font-semibold">{user.following}</span>
        <span className="text-sm opacity-75">подписки</span>
      </div>
    </div>
  );
}
