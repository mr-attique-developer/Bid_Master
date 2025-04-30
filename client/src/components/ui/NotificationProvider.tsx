import React, { useState, createContext, useContext } from 'react';
interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: number) => void;
}
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
interface NotificationProviderProps {
  children: ReactNode;
}
const NotificationProvider = ({
  children
}: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, {
      id,
      message,
      type
    }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };
  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  return <NotificationContext.Provider value={{
    notifications,
    addNotification,
    removeNotification
  }}>
      {children}
      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map(notification => <div key={notification.id} className={`px-4 py-3 rounded-md shadow-lg flex items-start justify-between max-w-xs animate-fade-in-up ${notification.type === 'success' ? 'bg-green-500 text-white' : notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
            <p>{notification.message}</p>
            <button onClick={() => removeNotification(notification.id)} className="ml-3 text-white">
              &times;
            </button>
          </div>)}
      </div>
    </NotificationContext.Provider>;
};
export default NotificationProvider;