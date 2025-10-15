// NotificationDrawer.jsx
import { useNotification } from "./NotificationContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function NotificationDrawer() {
  const { open, toggleNotification } = useNotification();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white p-4 rounded-t-2xl shadow-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Notifications</h2>
            <button onClick={toggleNotification}>
              <FaTimes />
            </button>
          </div>
          <div className="space-y-2">
            <div className="p-2 bg-gray-100 rounded">🔔 New comment on your post</div>
            <div className="p-2 bg-gray-100 rounded">👤 Someone followed you</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
