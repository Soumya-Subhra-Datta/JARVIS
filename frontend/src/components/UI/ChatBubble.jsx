import ReactMarkdown from 'react-markdown';

export default function ChatBubble({ role, content, timestamp }) {
  let displayContent = content;
  try {
    const parsed = JSON.parse(content);
    if (parsed.text) displayContent = parsed.text;
  } catch (e) {}

  const time = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={`chat-bubble ${role}`}>
      <div className="markdown-content">
        <ReactMarkdown>{displayContent}</ReactMarkdown>
      </div>
      {time && <div className="timestamp">{time}</div>}
    </div>
  );
}
