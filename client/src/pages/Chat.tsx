import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SearchIcon, SendIcon, MoreVerticalIcon, ChevronLeftIcon, UserIcon, PhoneIcon, MessageSquareIcon } from 'lucide-react';
const Chat = () => {
  const {
    userId
  } = useParams<{
    userId?: string;
  }>();
  const [activeChat, setActiveChat] = useState<number | null>(userId ? parseInt(userId) : null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contacts = [{
    id: 1,
    name: 'John Doe',
    lastMessage: "I'm interested in your vintage camera",
    time: '10:30 AM',
    unread: 0,
    avatar: null,
    online: true
  }, {
    id: 2,
    name: 'Alice Smith',
    lastMessage: 'Is the price negotiable?',
    time: 'Yesterday',
    unread: 2,
    avatar: null,
    online: false
  }, {
    id: 3,
    name: 'Robert Johnson',
    lastMessage: 'Thanks for the quick response',
    time: 'Yesterday',
    unread: 0,
    avatar: null,
    online: true
  }, {
    id: 4,
    name: 'Emily Davis',
    lastMessage: 'When can we meet for the pickup?',
    time: '2 days ago',
    unread: 1,
    avatar: null,
    online: false
  }, {
    id: 5,
    name: 'Michael Wilson',
    lastMessage: 'Payment confirmed',
    time: '1 week ago',
    unread: 0,
    avatar: null,
    online: false
  }];
  const chatMessages = [{
    id: 1,
    contactId: 1,
    messages: [{
      id: 1,
      sender: 'other',
      text: "Hello, I'm interested in your vintage camera collection that you have listed.",
      time: '10:15 AM'
    }, {
      id: 2,
      sender: 'me',
      text: 'Hi there! Thanks for your interest. The collection is still available.',
      time: '10:18 AM'
    }, {
      id: 3,
      sender: 'other',
      text: 'Great! Could you tell me more about the condition of the Leica M3?',
      time: '10:20 AM'
    }, {
      id: 4,
      sender: 'me',
      text: 'Sure! The Leica M3 is in excellent condition. It has been carefully stored and maintained. The shutter works perfectly at all speeds, and the rangefinder is clear and accurate. There are some minor signs of use but no dents or major scratches.',
      time: '10:25 AM'
    }, {
      id: 5,
      sender: 'other',
      text: "That sounds perfect. I'm definitely interested. Would you be willing to meet in person so I can take a look at it?",
      time: '10:28 AM'
    }, {
      id: 6,
      sender: 'me',
      text: "Absolutely! I'm available this weekend if that works for you. We could meet at a public location of your choice.",
      time: '10:30 AM'
    }]
  }, {
    id: 2,
    contactId: 2,
    messages: [{
      id: 1,
      sender: 'other',
      text: 'Hi, I saw your listing for the antique desk. Is the price negotiable?',
      time: 'Yesterday'
    }, {
      id: 2,
      sender: 'me',
      text: 'Hello! I might be flexible on the price. What were you thinking?',
      time: 'Yesterday'
    }, {
      id: 3,
      sender: 'other',
      text: 'I was thinking around $750 instead of $850',
      time: 'Yesterday'
    }, {
      id: 4,
      sender: 'other',
      text: 'The desk looks beautiful but I noticed some wear on the top in the photos',
      time: 'Yesterday'
    }]
  }, {
    id: 3,
    contactId: 3,
    messages: [{
      id: 1,
      sender: 'me',
      text: "Hi Robert, I've accepted your bid on the art book collection.",
      time: '2 days ago'
    }, {
      id: 2,
      sender: 'other',
      text: 'Great news! Thanks for the quick response.',
      time: 'Yesterday'
    }, {
      id: 3,
      sender: 'me',
      text: "You're welcome! When would you like to arrange pickup?",
      time: 'Yesterday'
    }, {
      id: 4,
      sender: 'other',
      text: 'Would tomorrow afternoon work for you?',
      time: 'Yesterday'
    }, {
      id: 5,
      sender: 'me',
      text: 'Yes, that works. How about 3 PM?',
      time: 'Yesterday'
    }, {
      id: 6,
      sender: 'other',
      text: "Perfect. I'll see you then!",
      time: 'Yesterday'
    }]
  }];
  const activeChatMessages = chatMessages.find(chat => chat.contactId === activeChat)?.messages || [];
  const activeContact = contacts.find(contact => contact.id === activeChat);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [activeChatMessages]);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;
    const newMessage = {
      id: activeChatMessages.length + 1,
      sender: 'me',
      text: message,
      time: 'Just now'
    };
    const chatIndex = chatMessages.findIndex(chat => chat.contactId === activeChat);
    if (chatIndex >= 0) {
      chatMessages[chatIndex].messages.push(newMessage);
    } else {
      chatMessages.push({
        id: chatMessages.length + 1,
        contactId: activeChat,
        messages: [newMessage]
      });
    }
    setMessage('');
    setActiveChat(activeChat);
  };
  return <div className="bg-gray-50 min-h-screen w-full pb-12">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Messages</h1>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className={`${activeChat ? 'hidden md:block' : ''} border-r border-gray-200`}>
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" placeholder="Search messages" className="pl-10 w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div className="overflow-y-auto h-[calc(80vh-8rem)]">
                {contacts.map(contact => <div key={contact.id} onClick={() => setActiveChat(contact.id)} className={`px-4 py-3 border-b border-gray-100 flex items-center cursor-pointer hover:bg-gray-50 ${activeChat === contact.id ? 'bg-blue-50' : ''}`}>
                    <div className="relative mr-3">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                        {contact.avatar ? <img src={contact.avatar} alt={contact.name} className="h-12 w-12 rounded-full" /> : <UserIcon className="h-6 w-6" />}
                      </div>
                      {contact.online && <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium text-gray-900 truncate">
                          {contact.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {contact.time}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 truncate">
                          {contact.lastMessage}
                        </p>
                        {contact.unread > 0 && <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {contact.unread}
                          </span>}
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>
            <div className={`${!activeChat ? 'hidden' : ''} md:col-span-2`}>
              {activeChat ? <>
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      <button className="md:hidden mr-2 text-gray-600" onClick={() => setActiveChat(null)}>
                        <ChevronLeftIcon className="h-6 w-6" />
                      </button>
                      <div className="relative mr-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                          {activeContact?.avatar ? <img src={activeContact.avatar} alt={activeContact.name} className="h-10 w-10 rounded-full" /> : <UserIcon className="h-5 w-5" />}
                        </div>
                        {activeContact?.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white"></span>}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {activeContact?.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {activeContact?.online ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
                        <PhoneIcon className="h-5 w-5" />
                      </button>
                      <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
                        <MoreVerticalIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 overflow-y-auto h-[calc(80vh-14rem)]">
                    {activeChatMessages.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <UserIcon className="h-12 w-12 mb-4" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div> : <div className="space-y-4">
                        {activeChatMessages.map(msg => <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${msg.sender === 'me' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                              <p>{msg.text}</p>
                              <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-blue-200' : 'text-gray-500'}`}>
                                {msg.time}
                              </p>
                            </div>
                          </div>)}
                        <div ref={messagesEndRef} />
                      </div>}
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex items-center">
                      <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-grow px-4 py-2 border rounded-l-md focus:ring-blue-500 focus:border-blue-500" />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md">
                        <SendIcon className="h-5 w-5" />
                      </button>
                    </form>
                  </div>
                </> : <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <MessageSquareIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    Your Messages
                  </h3>
                  <p className="text-center mb-6">
                    Select a contact to start chatting
                  </p>
                </div>}
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Chat;