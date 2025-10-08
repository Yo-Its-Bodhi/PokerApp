import React, { useState, useEffect, useRef } from 'react';

interface ChatProps {
  messages: { user: string, text: string }[];
  onSendMessage: (message: string) => void;
  isOverlay?: boolean;
  isMobile?: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isOverlay = false, isMobile = false }) => {
  const [input, setInput] = useState('');
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick access emojis for poker chat
  const quickEmojis = [
    { emoji: '🔥', name: 'fire' },
    { emoji: '🤡', name: 'clown' },
    { emoji: '👍', name: 'thumbs_up' },
    { emoji: '👎', name: 'thumbs_down' },
    { emoji: '😎', name: 'cool' },
    { emoji: '💀', name: 'skull' },
    { emoji: '🎯', name: 'target' },
    { emoji: '💎', name: 'diamond' },
    { emoji: '🚀', name: 'rocket' },
    { emoji: '⚡', name: 'lightning' },
    { emoji: '🎰', name: 'slot_machine' },
    { emoji: '💰', name: 'money' }
  ];

  // GIF keywords mapping - converts text to GIF URLs
  const gifKeywords = {
    'fire': 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
    'clown': 'https://media.giphy.com/media/x0npYExCGOZeo/giphy.gif', 
    'thumbs_up': 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    'thumbs_down': 'https://media.giphy.com/media/iJxHzcuNcCJXi/giphy.gif',
    'cool': 'https://media.giphy.com/media/ZVik7pBtu9dNS/giphy.gif',
    'skull': 'https://media.giphy.com/media/l46CyJmS9KUbokzsI/giphy.gif',
    'rocket': 'https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif',
    'lightning': 'https://media.giphy.com/media/3o7qDVHln5s9aZqs2k/giphy.gif',
    'money': 'https://media.giphy.com/media/67ThRZlYBvibtdF9JH/giphy.gif',
    'poker': 'https://media.giphy.com/media/l0HlEqOKxc6oJLdyE/giphy.gif',
    'win': 'https://media.giphy.com/media/26u4exjBuWbsqgb3W/giphy.gif',
    'lose': 'https://media.giphy.com/media/l2JIdnF6aJnAqzDgY/giphy.gif'
  };

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
      setShowEmojiPanel(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
  };

  const addGif = (keyword: string) => {
    setInput(prev => prev + ` /gif ${keyword} `);
  };

  // Process message text to render GIFs and emojis
  const renderMessageContent = (text: string) => {
    // Check for GIF commands like "/gif fire" or "/gif clown"
    const gifMatch = text.match(/\/gif\s+(\w+)/g);
    if (gifMatch) {
      return gifMatch.map((gifCommand, index) => {
        const keyword = gifCommand.replace('/gif ', '').trim().toLowerCase();
        const gifUrl = gifKeywords[keyword as keyof typeof gifKeywords];
        
        if (gifUrl) {
          return (
            <div key={index} className="inline-block">
              <img 
                src={gifUrl} 
                alt={keyword}
                className="max-w-32 max-h-24 rounded border border-purple-400/30 shadow-lg inline-block"
                style={{ verticalAlign: 'middle' }}
              />
            </div>
          );
        }
        return <span key={index} className="text-purple-300">GIF:{keyword}</span>;
      });
    }
    
    // Regular text with emoji support
    return <span>{text}</span>;
  };

  // Professional Overlay mode - clean chat for table overlay
  if (isOverlay) {
    return (
      <div 
        className="backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(15, 23, 42, 0.1) 50%, rgba(0, 0, 0, 0.9) 100%)',
          ...(isMinimized ? { height: 'auto' } : { height: '18rem' })
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
            <span className="text-slate-400">💬</span> Chat
          </h3>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-white/10"
            title={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>
        
        {!isMinimized && (
          <div className="p-4 flex flex-col" style={{ height: '15rem' }}>
            <div className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden mb-3 text-sm custom-scrollbar pr-2">
          {messages.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No messages yet</p>
          ) : (
            messages.slice(-5).map((msg, i) => { // Show only last 5 messages for overlay
              const seatMatch = msg.user.match(/(\d+)/);
              const seatNum = seatMatch ? parseInt(seatMatch[1]) : 0;
              const seatColors = [
                { text: 'text-slate-300' },      // Seat 0/default
                { text: 'text-blue-300' },       // Seat 1
                { text: 'text-emerald-300' },    // Seat 2
                { text: 'text-amber-300' },      // Seat 3
                { text: 'text-rose-300' },       // Seat 4
                { text: 'text-violet-300' },     // Seat 5
                { text: 'text-orange-300' },     // Seat 6
              ];
              const colorScheme = seatColors[seatNum % seatColors.length];
              
              return (
                <div key={i} className="py-1">
                  <div className="flex items-start gap-2">
                    <span className={`${colorScheme.text} font-medium text-sm flex-shrink-0`}>
                      {msg.user}:
                    </span>
                    <div className={`${colorScheme.text} text-sm break-words overflow-x-hidden`}>
                      {renderMessageContent(msg.text)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Emoji Panel */}
        {showEmojiPanel && (
          <div className="mb-1 p-2 rounded border border-slate-600 bg-slate-800/80 backdrop-blur-sm">
            <div className="flex flex-wrap gap-1 mb-2">
              {quickEmojis.map((item, i) => (
                <button
                  key={i}
                  onClick={() => addEmoji(item.emoji)}
                  className="text-xl hover:bg-slate-700 transition-colors p-1 rounded"
                  title={item.name}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400 mb-1">Quick reactions:</div>
            <div className="flex flex-wrap gap-1">
              {Object.keys(gifKeywords).slice(0, 6).map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => addGif(keyword)}
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowEmojiPanel(!showEmojiPanel)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-300 rounded px-3 py-2 text-sm transition-colors border border-slate-600"
            title="Emojis & reactions"
          >
            😀
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 min-w-0 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 focus:bg-slate-750 transition-all"
            placeholder="Type message..."
          />
          <button 
            onClick={handleSend} 
            className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
          </div>
        )}
      </div>
    );
  }

  // Mobile collapsed button
  if (isMobile && !isMobileExpanded) {
    return (
      <button
        onClick={() => setIsMobileExpanded(true)}
        className="poker-chat-mobile-collapsed"
        title="Open chat"
      >
        <span className="text-2xl">💬</span>
      </button>
    );
  }

  // Professional panel mode (or mobile expanded)
  return (
    <div 
      className={`poker-chat backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col h-full ${isMobile && isMobileExpanded ? 'poker-chat-mobile-expanded' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(15, 23, 42, 0.1) 50%, rgba(0, 0, 0, 0.9) 100%)'
      }}
    >
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <h3 className="font-semibold text-lg text-slate-200 flex items-center gap-2">
          <span className="text-slate-400">💬</span> Chat
        </h3>
        <div className="flex gap-2">
          {isMobile && (
            <button
              onClick={() => setIsMobileExpanded(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-white/10"
              title="Close chat"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-white/10"
            title={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="flex flex-col flex-1 p-6">
      <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden mb-4 text-sm custom-scrollbar pr-2">
        {messages.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No messages yet</p>
        ) : (
          messages.map((msg, i) => {
            // Assign colors based on seat number (extracted from username like "Player_1", "Seat 2", etc.)
            const seatMatch = msg.user.match(/(\d+)/);
            const seatNum = seatMatch ? parseInt(seatMatch[1]) : 0;
            const seatColors = [
              { border: 'border-l-slate-400', text: 'text-slate-300', bg: 'bg-slate-800/50' },      // Seat 0/default
              { border: 'border-l-blue-400', text: 'text-blue-300', bg: 'bg-blue-900/20' },        // Seat 1
              { border: 'border-l-emerald-400', text: 'text-emerald-300', bg: 'bg-emerald-900/20' }, // Seat 2
              { border: 'border-l-amber-400', text: 'text-amber-300', bg: 'bg-amber-900/20' },      // Seat 3
              { border: 'border-l-rose-400', text: 'text-rose-300', bg: 'bg-rose-900/20' },         // Seat 4
              { border: 'border-l-violet-400', text: 'text-violet-300', bg: 'bg-violet-900/20' },   // Seat 5
              { border: 'border-l-orange-400', text: 'text-orange-300', bg: 'bg-orange-900/20' },   // Seat 6
            ];
            const colorScheme = seatColors[seatNum % seatColors.length];
            
            return (
              <div key={i} className={`p-3 rounded border-l-4 ${colorScheme.border} ${colorScheme.bg} border border-slate-700/50`}>
                <div className="flex items-start gap-2">
                  <span className={`${colorScheme.text} font-medium text-sm flex-shrink-0`}>
                    {msg.user}:
                  </span>
                  <div className={`${colorScheme.text} text-sm break-words overflow-x-hidden`}>{renderMessageContent(msg.text)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Emoji Panel for Regular Mode */}
      {showEmojiPanel && (
        <div className="mb-4 p-3 rounded border border-slate-600 bg-slate-800/80 backdrop-blur-sm">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickEmojis.map((item, i) => (
              <button
                key={i}
                onClick={() => addEmoji(item.emoji)}
                className="text-2xl hover:bg-slate-700 transition-colors p-2 rounded"
                title={item.name}
              >
                {item.emoji}
              </button>
            ))}
          </div>
          <div className="text-sm text-slate-400 mb-2">Quick reactions:</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(gifKeywords).map((keyword) => (
              <button
                key={keyword}
                onClick={() => addGif(keyword)}
                className="text-sm px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                {keyword}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={() => setShowEmojiPanel(!showEmojiPanel)}
          className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-3 rounded border border-slate-600 transition-colors"
          title="Emojis & reactions"
        >
          😀
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-800 border border-slate-600 rounded px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-500 focus:bg-slate-750 transition-all"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded font-medium transition-colors"
        >
          Send
        </button>
      </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
