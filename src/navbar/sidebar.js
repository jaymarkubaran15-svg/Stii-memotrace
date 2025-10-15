import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { RiSurveyFill } from "react-icons/ri";
import { MdOutlinePostAdd } from "react-icons/md";
import {
  FaBook,
  FaUsers,
  FaAngleDown,
  FaAngleUp,
  FaBars,
  FaTimes,
  FaChartArea,
  FaUserGraduate,
} from "react-icons/fa";
import { IoCreateOutline } from "react-icons/io5";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formDropdownOpen, setFormDropdownOpen] = useState(
    location.pathname.startsWith("/formbuilder") ||
      location.pathname.startsWith("/gtsadmin") ||
      location.pathname.startsWith("/feedbackmgr")
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  return (
    <div className="relative z-50">
      {/* Mobile Toggle Button */}
      <button
        className="md:hidden p-3 text-gray-600 fixed top-5 left-5 z-50 bg-white shadow-lg rounded-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar Container */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg p-6 flex flex-col justify-between transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0`}
      >
        {/* Top Section */}
        <div>
          <h1 className="text-2xl font-bold mb-6 text-blue-600">Admin Panel</h1>

          <nav className="flex flex-col gap-2">
            <NavItem
              icon={<FaChartArea />}
              title="Dashboard"
              onClick={() => navigate("/dashboard")}
              active={location.pathname.startsWith("/dashboard")}
            />
            <NavItem
              icon={<FaBook />}
              title="Yearbooks"
              onClick={() => navigate("/home")}
              active={location.pathname.startsWith("/home")}
            />
            <NavItem
              icon={<FaUsers />}
              title="Users"
              onClick={() => navigate("/users")}
              active={location.pathname.startsWith("/users")}
            />
             <NavItem
              icon={<FaUserGraduate />}
              title="Career Path"
              onClick={() => navigate("/CareerPath")}
              active={location.pathname.startsWith("/CareerPath")}
            />

            <NavItem
              icon={<MdOutlinePostAdd />}
              title="Post"
              onClick={() => navigate("/post")}
              active={location.pathname.startsWith("/post")}
            />

            {/* Form Builder Nested Menu */}
            <div>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                  formDropdownOpen
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                 onClick={() => {
                  setFormDropdownOpen(!formDropdownOpen);
                  if (!formDropdownOpen) setDropdownOpen(false); // Close profile dropdown when form opens
                }}
              >
                <IoCreateOutline />
                <span>Form Builder</span>
                {formDropdownOpen ? (
                  <FaAngleUp className="ml-auto" />
                ) : (
                  <FaAngleDown className="ml-auto" />
                )}
              </div>

              {formDropdownOpen && (
                <div className="ml-6 flex flex-col gap-2 mt-2">
                  <NavItem
                    icon={<span className="w-3" />}
                    title="GTS Admin"
                    onClick={() => navigate("/formbuilder")}
                    active={location.pathname === "/formbuilder"}
                  />
                  <NavItem
                    icon={<span className="w-3" />}
                    title="Survey Admin"
                    onClick={() => navigate("/SurveyAdmin")}
                    active={location.pathname === "/SurveyAdmin"}
                  />
                  <NavItem
                    icon={<span className="w-3" />}
                    title="Feedback Admin"
                    onClick={() => navigate("/feedbackmgr")}
                    active={location.pathname === "/feedbackmgr"}
                  />
                </div>
              )}
            </div>

            <NavItem
              icon={<RiSurveyFill />}
              title="Survey Result"
              onClick={() => navigate("/survey")}
              active={location.pathname.startsWith("/survey")}
            />
          </nav>
        </div>

        {/* Profile Section */}
        <div className="mt-6 relative">
       
          <div
            className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              if (!dropdownOpen) setFormDropdownOpen(false); // Close form dropdown when profile opens
            }}
          >
            {user?.profile ? (
              <img
                src={user.profile}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-full flex justify-center items-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div className="flex flex-col">
              <p className="font-semibold">{user?.name || "Guest"}</p>
              <p className="text-sm text-gray-500">{user?.role || "Unknown"}</p>
            </div>
            {dropdownOpen ? (
              <FaAngleUp className="ml-auto text-gray-500" />
            ) : (
              <FaAngleDown className="ml-auto text-gray-500" />
            )}
          </div>


          {dropdownOpen && (
            <div className="mt-2 bg-white shadow-lg rounded-lg overflow-hidden">
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => navigate("/adminprofile")}
              >
                Profile
              </div>
              <div
                className="p-2 hover:bg-gray-100 cursor-pointer text-red-500"
                onClick={handleLogout}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// NavItem Component
const NavItem = ({ icon, title, onClick, active }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
      active ? "bg-blue-500 text-white" : "text-gray-700 hover:bg-gray-100"
    }`}
    onClick={onClick}
  >
    {icon}
    <span>{title}</span>
  </div>
);

export default Sidebar;
