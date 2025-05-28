import React, { useState, useEffect, useRef } from 'react';

const PromptChannel = ({ activeTasks, onSendPrompt }) => {
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [promptText, setPromptText] = useState('');
  const [conversation, setConversation] = useState([]);
  const conversationEndRef = useRef(null);

  // Handle task selection change
  useEffect(() => {
    if (activeTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(activeTasks[0].id);

      // Load conversation history for this task
      const taskHistory = activeTasks[0].promptHistory || [];
      setConversation(taskHistory);
    }
  }, [activeTasks, selectedTaskId]);

  // Handle task selection change
  const handleTaskChange = (taskId) => {
    setSelectedTaskId(taskId);

    // Find task and load its conversation history
    const task = activeTasks.find(t => t.id === taskId);
    if (task) {
      setConversation(task.promptHistory || []);
    } else {
      setConversation([]);
    }
  };

  // Scroll to bottom of conversation when it updates
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Handle prompt submission
  const handleSendPrompt = () => {
    if (!promptText.trim() || !selectedTaskId) return;

    // Create message object
    const message = {
      id: Date.now(),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toISOString()
    };

    // Add to conversation
    const updatedConversation = [...conversation, message];
    setConversation(updatedConversation);

    // Send to agent via callback
    onSendPrompt(selectedTaskId, promptText, updatedConversation);

    // Clear input
    setPromptText('');
  };

  // Quick action buttons
  const quickActions = [
    { label: "Stop Task", prompt: "Stop processing this task immediately." },
    { label: "Pause Task", prompt: "Pause this task and wait for further instructions." },
    { label: "Explain Progress", prompt: "Explain what you've done so far and what's next." },
    { label: "Change Priority", prompt: "This task is now high priority, please focus on it." }
  ];

  return (
    <div className="prompt-channel">
      <div className="task-selector">
        <label htmlFor="task-select">Select active task:</label>
        <select
          id="task-select"
          value={selectedTaskId}
          onChange={(e) => handleTaskChange(e.target.value)}
          className="task-select"
        >
          {activeTasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.title} ({task.agent})
            </option>
          ))}
        </select>
      </div>

      <div className="quick-actions">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="quick-action-btn"
            onClick={() => {
              setPromptText(action.prompt);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="conversation-container">
        {conversation.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'agent-message'}`}
          >
            <div className="message-header">
              <span className="sender">{message.sender === 'user' ? 'You' : 'Agent'}</span>
              <span className="timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {message.text}
            </div>
          </div>
        ))}
        <div ref={conversationEndRef} />
      </div>

      <div className="prompt-input">
        <textarea
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Type your instructions or questions here..."
          className="prompt-textarea"
        />
        <button
          onClick={handleSendPrompt}
          disabled={!promptText.trim() || !selectedTaskId}
          className="send-prompt-btn"
        >
          Send Prompt
        </button>
      </div>
    </div>
  );
};

export default PromptChannel;