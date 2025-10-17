import { useState, useEffect, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import Navbar from "../userNavbar/nav";
import bg from "../assets/images/bg.png";
import Surveyq from "./surveyq"; 
import { useNavigate } from "react-router-dom";

const YearbookCard = ({ yearbook }) => {
  const { id, folder_name, date_uploaded } = yearbook;
  const [imageSrc, setImageSrc] = useState("");
  const [isOpen, setIsOpen] = useState(false);

useEffect(() => {
  fetch(`https://server-1-gjvd.onrender.com/yearbook/${id}/images`)
    .then((res) => res.json())
    .then((images) => {
      if (images.length > 0) {
        let imageUrl = images[0].file_path;
        if (!imageUrl.startsWith("http")) {
          imageUrl = `https://server-1-gjvd.onrender.com/${imageUrl}`;
        }
        setImageSrc(imageUrl);

      }
    })
    .catch((err) => console.error("Error fetching images:", err));
}, [id]);


  return (
    <>
     <div className="bg-gradient-to-br from-blue-300 via-indigo-200 to-purple-300 p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 w-72 text-center">

  {imageSrc ? (
    <img
      src={imageSrc}
      alt={`Yearbook ${folder_name}`}
      className="h-56 w-full object-cover rounded-md"
    />
  ) : (
    <div className="h-56 w-full bg-gray-200 flex items-center justify-center text-gray-400 rounded-md">
      No Preview Available
    </div>
  )}

  <h2 className="font-bold text-lg text-gray-800 mt-4 truncate">{folder_name}</h2>
  <p className="text-gray-500 text-sm mt-1">{new Date(date_uploaded).toLocaleDateString()}</p>

  <button
    onClick={() => setIsOpen(true)}
    className="mt-4 w-full bg-gradient-to-r from-green-400 to-green-600 text-white py-2 rounded-md font-medium hover:from-green-500 hover:to-green-700 transition duration-300"
  >
    View
  </button>
</div>

      {isOpen && <YearbookViewer yearbook={yearbook} onClose={() => setIsOpen(false)} />}
    </>
  );
};



const YearbookViewer = ({ yearbook, onClose }) => {
  const [images, setImages] = useState([]);
  const [bookSize, setBookSize] = useState({ width: 500, height: 700 });
  const [singlePage, setSinglePage] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch images
  useEffect(() => {
    fetch(`https://server-1-gjvd.onrender.com/yearbook/${yearbook.id}/images`)
      .then((res) => res.json())
      .then((data) => {
        setImages(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching images:", err);
        setLoading(false);
      });
  }, [yearbook.id]);

  // Update layout based on screen size
  const updateLayout = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let bookHeight = Math.floor(vh * 0.8); // use 80% height
    let bookWidth = Math.floor(bookHeight * 0.75);

    if (vw < 640) {
      // Mobile: prioritize width
      bookWidth = Math.floor(vw * 0.95);
      bookHeight = Math.floor(bookWidth * 1.3);
    }

    setBookSize({
      width: Math.min(bookWidth, vw - 20), // prevent overflow
      height: Math.min(bookHeight, vh - 100),
    });

    setSinglePage(vw < 768); // force single page under md
  }, []);

  useEffect(() => {
    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [updateLayout]);

  // ESC to close
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target.id === "yearbook-backdrop") onClose();
  };

  return (
    <div
      id="yearbook-backdrop"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center p-2 sm:p-6 overflow-hidden"
    >
      <div className="relative w-full max-w-7xl flex flex-col items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded shadow hover:bg-red-600 transition text-xs sm:text-base z-10"
        >
          ✕
        </button>

        {/* Flipbook or Spinner */}
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-white"></div>
          </div>
        ) : images.length > 0 ? (
          <div className="flex justify-center items-center w-full overflow-hidden">
            <HTMLFlipBook
              width={bookSize.width}
              height={bookSize.height}
              minWidth={280}
              maxWidth={1400}
              minHeight={320}
              maxHeight={1000}
              showCover
              drawShadow
              flippingTime={800}
              useMouseEvents
              className="shadow-xl rounded-md"
              startPage={0}
              autoSize
              clickEventForward
              usePortrait
              singlePage={singlePage}
              useKeyboardNavigation
              mobileScrollSupport
            >
              {images.map((img, index) => (
                <div
                  key={index}
                  style={{
                    width: `${bookSize.width}px`,
                    height: `${bookSize.height}px`,
                  }}
                  className="flex justify-center items-center bg-white"
                >
                  <img
                    src={img.file_path.startsWith("http") ? img.file_path : `https://server-1-gjvd.onrender.com/${img.file_path}`}
                    alt={`Page ${index + 1}`}
                    className="w-full h-full object-contain sm:object-cover rounded"
                    draggable={false}
                  />


                </div>
              ))}
            </HTMLFlipBook>
          </div>
        ) : (
          <p className="text-center text-white text-lg py-10">No images found.</p>
        )}
      </div>
    </div>
  );
};


export default function Dashboard() {
  const [yearbooks, setYearbooks] = useState([]);
  const [showBlur, setShowBlur] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch user session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("https://server-1-gjvd.onrender.com/api/user", {
          method: "GET",
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);

          // ✅ If survey already submitted → show dashboard only
          if (data.has_submitted_survey) {
            setHasSubmitted(true);
            setShowSurvey(false);
            setShowBlur(false);
            return;
          }

          // ✅ If user clicked “Later” before → skip showing survey this session
          if (data.later_count > 0) {
            setHasSubmitted(false);
            setShowSurvey(false);
            setShowBlur(false);
            return;
          }

          // ✅ Otherwise, show the survey immediately after login
          setHasSubmitted(false);
          setShowSurvey(true);
          setShowBlur(true);
        } else {
          console.error("Failed to fetch user");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  // ✅ Fetch yearbooks
  useEffect(() => {
    fetch("https://server-1-gjvd.onrender.com/yearbooks")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setYearbooks(data);
        else {
          console.error("Unexpected API response:", data);
          setYearbooks([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching yearbooks:", err);
        setYearbooks([]);
      });
  }, []);

  return (
    <div>
      <Navbar />

      {/* 🟢 Survey modal (shown only when not submitted) */}
      {!hasSubmitted && showSurvey && (
        <div className="fixed inset-0 flex justify-center items-center z-50">
          <Surveyq
            onSurveySubmit={() => setHasSubmitted(true)}
            onClose={() => {
              setShowSurvey(false);
              setShowBlur(false);
            }}
          />
        </div>
      )}

      {/* 🌀 Background blur (active when survey is shown) */}
      {!hasSubmitted && showBlur && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />
      )}

      {/* 🏠 Dashboard content */}
      <div className="flex">
        <div
          className="fixed inset-0 bg-cover bg-center opacity-40 z-0"
          style={{ backgroundImage: `url(${bg})` }}
        />
        <div className="flex-1 p-10 z-10">
          <div className="mt-12">
            <h1 className="text-2xl font-bold">Welcome to Home</h1>
            <h1 className="ml-2 text-lg">
              Here are some yearbooks for you to explore:
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 justify-start mt-5 mb-24 z-50">
            {yearbooks.map((yearbook) => (
              <YearbookCard key={yearbook.id} yearbook={yearbook} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}