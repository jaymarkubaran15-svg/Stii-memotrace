// NotificationContext.jsx
import { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const toggleNotification = () => setOpen(prev => !prev);

  return (
    <NotificationContext.Provider value={{ open, toggleNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
