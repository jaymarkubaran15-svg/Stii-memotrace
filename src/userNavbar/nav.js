import { useNavigate } from "react-router-dom";
import { FaHome, FaFileAlt, FaBell, FaTimes, FaUser } from "react-icons/fa";
import { useEffect, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function NavItem({ Icon, label, onClick, imageUrl }) {
  return (
    <button
      className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition duration-300"
      onClick={onClick}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Profile" className="w-8 h-8 rounded-full" />
      ) : (
        <>
          <Icon className="text-2xl" />
          {label && <span className="text-xs font-medium mt-1">{label}</span>}
        </>
      )}
    </button>
  );
}

const YearbookViewer = ({ yearbook, onClose }) => {
  const [images, setImages] = useState([]);
  const [bookSize, setBookSize] = useState({ width: 500, height: 700 });
  const [singlePage, setSinglePage] = useState(false);

  useEffect(() => {
    const yearbookId = yearbook.related_id;
    if (!yearbookId) return;

    fetch(`https://server-1-gjvd.onrender.com/yearbook/${yearbookId}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch((err) => console.error("Error fetching images:", err));

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width < 200 || height < 300) {
        setBookSize({ width: 240, height: 340 });
        setSinglePage(true);
      } else if (width < 768 || height < 700) {
        setBookSize({ width: 320, height: 460 });
        setSinglePage(true);
      } else if (width < 1024 || height < 900) {
        setBookSize({ width: 420, height: 600 });
        setSinglePage(true);
      } else {
        setBookSize({ width: 600, height: 800 });
        setSinglePage(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [yearbook.related_id]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center sm:p-6 mt-20">
      <div className="sm:p-6 rounded-lg relative w-full max-w-6xl h-full flex flex-col justify-center items-center">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded shadow-lg hover:bg-red-600 transition"
        >
          Close
        </button>

        {images.length > 0 ? (
          <div className="flex justify-center items-center w-full pb-0 h-full">
            <HTMLFlipBook
              width={bookSize.width}
              height={bookSize.height}
              minWidth={400}
              maxWidth={1200}
              minHeight={340}
              maxHeight={900}
              showCover={true}
              drawShadow={true}
              flippingTime={800}
              useMouseEvents={true}
              className="shadow-lg rounded-lg"
              startPage={0}
              autoSize={true}
              clickEventForward={true}
              usePortrait={true}
              singlePage={singlePage}
            >
              {images.map((img, index) => (
                <div
                  key={index}
                  className="w-auto h-auto flex justify-center items-center"
                >
                  <img
                    src={`/${img.file_path}`}
                    alt={`Page ${index + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ))}
            </HTMLFlipBook>
          </div>
        ) : (
          <p className="text-center text-gray-500">No images found.</p>
        )}
      </div>
    </div>
  );
};

export default function Navbar() {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [relatedContent, setRelatedContent] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const [showYearbookViewer, setShowYearbookViewer] = useState(false);
  const [selectedYearbook, setSelectedYearbook] = useState(null);
  // For image preview modal
const [showPreview, setShowPreview] = useState(false);
const [previewImages, setPreviewImages] = useState([]);
const [currentIndex, setCurrentIndex] = useState(0);


const getValidImages = (images) =>
  images
    .filter((img) => img && img.trim() !== "")
    .map((img) =>
      img.startsWith("http") || img.startsWith("data:")
        ? img
        : `data:image/jpeg;base64,${img}`
    );

  const handleNotificationClick = async (notif) => {
    setSelectedNotification(notif);

    if (notif.type === "event" || notif.type === "post") {
      try {
        const res = await fetch(`https://server-1-gjvd.onrender.com/api/${notif.type}s/${notif.related_id}`);
        const data = await res.json();
        setRelatedContent(data);
      } catch (err) {
        console.error("Failed to fetch related content", err);
        setRelatedContent(null);
      }
    } else {
      setRelatedContent(null);
    }
  };

  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        const parsedData = data.map((notif) => ({
          ...notif,
          post_images: notif.post_images || [],
          event_images: notif.event_images || [],
        }));

        setNotifications(parsedData);

        const viewedIds = JSON.parse(localStorage.getItem("viewedNotifications") || "[]");
        const unread = parsedData.filter((notif) => !viewedIds.includes(notif.id)).length;
        setUnreadCount(unread);
      })
      .catch((err) => console.error("Error loading notifications", err));
  }, []);

  useEffect(() => {
    if (showDrawer && notifications.length > 0) {
      const viewedIds = notifications.map((notif) => notif.id);
      localStorage.setItem("viewedNotifications", JSON.stringify(viewedIds));
      setUnreadCount(0);
    }
  }, [showDrawer, notifications]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("https://server-1-gjvd.onrender.com/api/user", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch user data");
        const userData = await response.json();
        setProfileImage(userData.profileImage);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const notifRaw = localStorage.getItem("newPostNotif");
    if (notifRaw) {
      const notif = JSON.parse(notifRaw);
      setNotifications((prev) => [notif, ...prev]);
      localStorage.removeItem("newPostNotif");
    }
  }, []);

  return (
    <>
      {/* Notification Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 flex justify-center items-end z-50">
          <div className="cursor-pointer w-full max-w-sm fixed bottom-28 h-80 bg-white p-4 rounded-t-2xl shadow-2xl z-50 animate-slide-up">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">Notifications</h2>
              <button onClick={() => setShowDrawer(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto h-[14rem] pr-1 gap-2">
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No notification</p>
              ) : (
                notifications.map((notif, index) => (
                  <div
                    key={index}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-2 bg-gray-100 rounded flex gap-2 items-start cursor-pointer transform transition-transform duration-200 hover:scale-105"
                  >
                    {notif.type !== "yearbook" && (
                      notif.profile ? (
                        <img
                          src={notif.profile}
                          alt="Profile"
                          className="w-10 h-10 rounded-full object-cover border-4 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex justify-center items-center text-white font-bold">
                          {notif.first_name?.charAt(0)}
                        </div>
                      )
                    )}

                    <div className="flex-1">
                      <h1 className="px-2 text-sm font-medium">
                        {notif.first_name} {notif.message}
                      </h1>

                    

                      {/* Yearbook Preview */}
                      {notif.type === "yearbook" && notif.yearbook_image && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <img
                            src={notif.yearbook_image}
                            alt="Yearbook Preview"
                            className="w-full h-32 object-cover rounded-lg border p-2 cursor-pointer hover:opacity-80 transition"
                            onClick={() => {
                              setSelectedYearbook({ id: notif.related_id, ...notif });
                              setShowYearbookViewer(true);
                            }}
                          />
                        </div>
                      )}

                      <h1 className="text-xs text-blue-600 pl-2">
                        {notif.created_at && new Date(notif.created_at).toLocaleString()}
                      </h1>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg w-full max-w-md max-h-screen overflow-y-auto relative space-y-4 shadow-lg">
            <button
              className="absolute top-2 right-2 text-black hover:text-red-600 text-2xl"
              onClick={() => setSelectedNotification(null)}
            >
              &times;
            </button>

            <h1 className="text-center text-lg font-bold text-gray-800 dark:text-gray-200">
              {selectedNotification.first_name}
              {selectedNotification.type !== "yearbook" ? "'s" : ""}{" "}
              {selectedNotification.type === "yearbook"
                ? "Yearbook"
                : selectedNotification.type === "event"
                ? "Event"
                : "Post"}
            </h1>

            <div className="flex gap-3 items-start">
              {selectedNotification.profile && selectedNotification.type !== "yearbook" && (
                <img
                  src={selectedNotification.profile}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                />
              )}

              <div className="flex-1">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                  {selectedNotification.first_name}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {selectedNotification.created_at &&
                    new Date(selectedNotification.created_at).toLocaleString()}
                </p>

{/* Post Content */}
{selectedNotification.type === "post" && (
  <>
    {selectedNotification.post_content ? (
      <>
        <p className="text-gray-700 dark:text-gray-300">{selectedNotification.post_content}</p>

        {/* Images */}
        {selectedNotification.post_images &&
          selectedNotification.post_images
            .filter((img) => img && img !== "") // ✅ remove empty or null images
            .map((img, idx) => {
              // Determine correct src
              const src =
                img.startsWith("http") || img.startsWith("data:")
                  ? img
                  : `data:image/jpeg;base64,${img}`;

              return (
                <img
                  key={idx}
                  src={src}
                  alt={`Post Image ${idx + 1}`}
                  className="w-full h-48 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition"
                onClick={() => {
                    const validImages = getValidImages(selectedNotification.post_images);
                    if (validImages.length === 0) return; // nothing to preview

                    setPreviewImages(validImages);
                    setCurrentIndex(idx);
                    setShowPreview(true);
                  }}


                  onError={(e) => (e.currentTarget.style.display = "none")} // ✅ hide broken images
                />
              );
            })}
      </>
    ) : (
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>🔒</span> This content isn't available right now.
      </div>
    )}
  </>
)}

{/* 🖼️ Preview Modal */}
{showPreview && previewImages.length > 0 && (
  <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
    <button
      onClick={() => setShowPreview(false)}
      className="absolute top-4 right-6 text-white text-3xl"
    >
      <FaTimes />
    </button>

    <div className="flex items-center justify-center relative w-full max-w-3xl">
      {previewImages.length > 1 && (
        <button
          onClick={() =>
            setCurrentIndex((prev) =>
              prev === 0 ? previewImages.length - 1 : prev - 1
            )
          }
          className="absolute left-4 text-white text-3xl p-2 bg-black bg-opacity-40 rounded-full hover:bg-opacity-70"
        >
          <FaChevronLeft />
        </button>
      )}

      <img
        src={previewImages[currentIndex]}
        alt="Preview"
        className="max-h-[80vh] w-auto object-contain rounded-lg shadow-lg"
        onError={() => {
          // remove broken image from array
          setPreviewImages((prev) =>
            prev.filter((_, i) => i !== currentIndex)
          );

          // adjust currentIndex if needed
          setCurrentIndex((prev) =>
            prev >= previewImages.length - 1 ? 0 : prev
          );
        }}
      />




      {previewImages.length > 1 && (
        <button
          onClick={() =>
            setCurrentIndex((prev) =>
              prev === previewImages.length - 1 ? 0 : prev + 1
            )
          }
          className="absolute right-4 text-white text-3xl p-2 bg-black bg-opacity-40 rounded-full hover:bg-opacity-70"
        >
          <FaChevronRight />
        </button>
      )}
    </div>

    <p className="text-gray-300 mt-3 text-sm">
      {currentIndex + 1} / {previewImages.length}
    </p>
  </div>
)}

                {/* Event Content */}
                {selectedNotification.type === "event" && (
                  <>
                    {selectedNotification.event_content ? (
                      <>
                        <p className="text-gray-700 dark:text-gray-300">{selectedNotification.event_content}</p>
                        {selectedNotification.event_location && (
                          <p className="text-sm text-blue-500 mt-1">
                            📍 {selectedNotification.event_location}
                          </p>
                        )}
                        {selectedNotification.event_images &&
                          selectedNotification.event_images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Event Image ${idx + 1}`}
                              onClick={() => {
                                setModalImageSrc(img);
                                setShowImageModal(true);
                              }}
                              className="mt-3 w-full max-h-[70vh] object-contain rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition"
                            />
                          ))}
                      </>
                    ) : (
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>🔒</span> This content isn't available right now.
                      </div>
                    )}
                  </>
                )}

                {/* Yearbook full view */}
                {selectedNotification.type === "yearbook" && selectedNotification.yearbook_image && (
                  <img
                    src={selectedNotification.yearbook_image}
                    alt="Yearbook Image"
                    className="mt-3 w-full h-48 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition"
                    onClick={() => {
                      setSelectedYearbook({ id: selectedNotification.related_id, ...selectedNotification });
                      setShowYearbookViewer(true);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {showImageModal && modalImageSrc && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative max-w-3xl w-full mx-4">
            <button
              className="absolute top-2 right-2 text-white text-4xl"
              onClick={() => setShowImageModal(false)}
            >
              &times;
            </button>
            <img
              src={modalImageSrc}
              alt="Full View"
              className="w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Yearbook Viewer */}
      {showYearbookViewer && selectedYearbook && (
        <YearbookViewer
          yearbook={selectedYearbook}
          onClose={() => setShowYearbookViewer(false)}
        />
      )}

      {/* Bottom Navbar */}
      <nav className="fixed bottom-4 left-1/2 z-40 transform -translate-x-1/2 bg-white shadow-lg rounded-full p-3 flex justify-between w-[90%] max-w-md">
        <NavItem Icon={FaHome} label="Home" onClick={() => navigate("/userhome")} />
        <NavItem Icon={FaFileAlt} label="Post" onClick={() => navigate("/userpost")} />
        <NavItem
          Icon={() => (
            <div className="relative">
              <FaBell className="text-2xl" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          )}
          label="Alerts"
          onClick={() => setShowDrawer(true)}
        />
        {profileImage ? (
          <NavItem imageUrl={profileImage} onClick={() => navigate("/userprofile")} />
        ) : (
          <NavItem Icon={FaUser} label="Profile" onClick={() => navigate("/userprofile")} />
        )}
      </nav>

      {/* Optional animation */}
      <style>{`
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
