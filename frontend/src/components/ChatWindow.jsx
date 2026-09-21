import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { Send, Paperclip, FileText, Download } from 'lucide-react';

export default function ChatWindow({ projectId, receiverId, receiverName }) {
  const { token, user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();

    // Listen to real-time socket events
    if (socket) {
      // Join project room
      socket.emit('join_project', projectId);

      // Listen for incoming messages
      socket.on('receive_message', (message) => {
        setMessages((prev) => [...prev, message]);
      });
    }

    return () => {
      if (socket) {
        socket.emit('leave_project', projectId);
        socket.off('receive_message');
      }
    };
  }, [projectId, socket]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/chat/history/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load chat history.');
      setMessages(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;

    try {
      // Use FormData to support text + file attachment uploads
      const formData = new FormData();
      formData.append('message_text', inputText);
      formData.append('receiver_id', receiverId);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch(`http://localhost:5000/api/chat/send/${projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send message.');

      // Clear input fields
      setInputText('');
      setSelectedFile(null);
      
      // Note: socket room broadcast will emit the message back to us, 
      // but to ensure instant local response we only rely on socket event which is handled globally
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '450px',
      borderRadius: '15px',
      overflow: 'hidden',
      border: '1px solid var(--glass-border)'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chat Workspace</span>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold' }}>Contractor: {receiverName}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
          <span style={{ fontSize: '11px', color: 'var(--success)' }}>Live Chat Active</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {error && (
          <div style={{ padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '12px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
            No messages yet. Send a message to start collaboration!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  backgroundColor: isMe ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  border: isMe ? 'none' : '1px solid var(--glass-border)',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopRightRadius: isMe ? '2px' : '12px',
                  borderTopLeftRadius: isMe ? '12px' : '2px',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                  {msg.message_text}
                  
                  {/* File Attachment */}
                  {msg.file_url && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isMe ? 'rgba(0,0,0,0.15)' : 'var(--bg-primary)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FileText size={18} color="var(--accent-secondary)" />
                      <div style={{ fontSize: '11px', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {msg.file_url.split('/').pop()}
                      </div>
                      <a href={`http://localhost:5000${msg.file_url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
                        <Download size={14} />
                      </a>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 4px' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSend} style={{
        padding: '12px 18px',
        borderTop: '1px solid var(--glass-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.01)'
      }}>
        {/* Attachment Upload Button */}
        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: selectedFile ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}>
          <Paperclip size={18} />
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </label>

        {/* Text Input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={selectedFile ? `Attachment selected: ${selectedFile.name}` : 'Write a message...'}
            style={{
              padding: '10px 14px',
              borderRadius: '25px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--glass-border)',
              fontSize: '13px'
            }}
          />
        </div>

        {/* Send Button */}
        <button type="submit" className="btn btn-primary" style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
