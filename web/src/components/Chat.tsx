import React, { useState, useEffect, useRef } from 'react';

interface ChatProps {
  messages: { user: string, text: string }[];
  onSendMessage: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col h-full">
      <h3 className="font-bold text-base text-brand-cyan mb-3 uppercase tracking-wider flex items-center gap-2">
        <span>💬</span> Chat
      </h3>
      <div className="flex-1 space-y-2 overflow-y-auto mb-3 text-sm custom-scrollbar pr-2">
        {messages.length === 0 ? (
          <p className="text-brand-text-dark text-xs">// No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            // Assign colors based on seat number (extracted from username like "Player_1", "Seat 2", etc.)
            const seatMatch = msg.user.match(/(\d+)/);
            const seatNum = seatMatch ? parseInt(seatMatch[1]) : 0;
            const seatColors = [
              { border: 'border-cyan-400', text: 'text-cyan-400', bg: 'bg-cyan-400/10' },      // Seat 0/default
              { border: 'border-blue-400', text: 'text-blue-400', bg: 'bg-blue-400/10' },      // Seat 1
              { border: 'border-purple-400', text: 'text-purple-400', bg: 'bg-purple-400/10' }, // Seat 2
              { border: 'border-pink-400', text: 'text-pink-400', bg: 'bg-pink-400/10' },      // Seat 3
              { border: 'border-orange-400', text: 'text-orange-400', bg: 'bg-orange-400/10' }, // Seat 4
              { border: 'border-green-400', text: 'text-green-400', bg: 'bg-green-400/10' },   // Seat 5
              { border: 'border-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-400/10' }, // Seat 6
            ];
            const colorScheme = seatColors[seatNum % seatColors.length];
            
            return (
              <div key={i} className={`border-l-2 ${colorScheme.border} ${colorScheme.bg} pl-2 py-1 rounded-r`}>
                <span className={`font-semibold ${colorScheme.text}`}>{msg.user}: </span>
                <span className="text-brand-text">{msg.text}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-black/50 border border-brand-cyan/30 rounded px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-cyan"
          placeholder="Type message..."
        />
        <button onClick={handleSend} className="btn btn-primary text-sm px-4">SEND</button>
      </div>
    </div>
  );
};

export default Chat;
