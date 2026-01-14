export const NoteRow = ({ note }) => {
  return (
    <div className="flex items-start space-x-2">
      <img
        src={note.user_image_url}
        alt={note.user_name}
        className="flex-shrink-0 rounded-full w-6 h-6"
      />
      <div className="flex flex-col">
        <span className="text-stone-500 text-xs">
          {note.user_name} · {note.created_at_relative}
        </span>
        <p className="break-words">{note.body}</p>
      </div>
    </div>
  );
};
