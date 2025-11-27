interface Props {
  user: any;
}

export default function ProfileHeader({ user }: Props) {
  return (
    <div className="flex items-center gap-6 px-4 py-4">
      <img
        src={user.avatar}
        className="w-24 h-24 rounded-full object-cover"
      />

      <div className="flex flex-col">
        <h1 className="text-xl font-semibold">{user.username}</h1>
        <button className="mt-2 px-4 py-1 border rounded-lg text-sm dark:border-neutral-700">
          Редактировать профиль
        </button>
      </div>
    </div>
  );
}
