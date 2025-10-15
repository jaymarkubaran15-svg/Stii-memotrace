import { useEffect, useState } from "react";
import HTMLFlipBook from "react-pageflip";

const YearbookViewer = ({ yearbook, onClose }) => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch(`/yearbook/${yearbook.id}/images`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch((err) => console.error("Error fetching images:", err));
  }, [yearbook.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
      <div className="bg-white p-5 rounded-lg relative w-[60vw] h-[80vh]">
        <button onClick={onClose} className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded">
          Close
        </button>
        {images.length > 0 ? (
          <HTMLFlipBook width={500} height={700} className="shadow-lg">
            {images.map((img, index) => (
              <div key={index} className="w-full h-full flex justify-center items-center">
                <img src={`/${img.file_path}`} alt={`Page ${index + 1}`} className="max-w-full max-h-full" />
              </div>
            ))}
          </HTMLFlipBook>
        ) : (
          <p className="text-center text-gray-500">No images found.</p>
        )}
      </div>
    </div>
  );
};

export default YearbookViewer;
