import React, { useEffect, useState } from "react";
import { Home, User, Settings, Info } from "lucide-react"; // Example icons

const Navbar = () => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateCursor = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateCursor);
    return () => window.removeEventListener("mousemove", updateCursor);
  }, []);

  return (
    <>
      {/* Custom Cursor */}
      <div
        className={`fixed w-[1.5vw] h-[1.5vw] rounded-full border-2 border-pink-500 pointer-events-none transition-all duration-75 ${
          isHovering ? "w-[3vw] h-[3vw] animate-pulse" : ""
        }`}
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Sidebar Navbar */}
      <div className="fixed top-1/2 left-[1vw] -translate-y-1/2 bg-[#17171C] rounded-2xl shadow-lg h-[25vw] flex flex-col justify-center items-center p-4">
        <ul className="space-y-4">
          <NavItem icon={<Home size={28} />} label="Home" setIsHovering={setIsHovering} />
          <NavItem icon={<User size={28} />} label="Profile" setIsHovering={setIsHovering} />
          <NavItem icon={<Settings size={28} />} label="Settings" setIsHovering={setIsHovering} />
          <NavItem icon={<Info size={28} />} label="Info" setIsHovering={setIsHovering} />
        </ul>
      </div>
    </>
  );
};

const NavItem = ({ icon, label, setIsHovering }) => {
  return (
    <li
      className="relative flex items-center justify-center w-[2vw] h-[4.5vw] text-white transition duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {icon}
      <span className="absolute left-[2.5vw] opacity-0 text-pink-500 bg-white px-2 py-1 rounded-xl text-sm transition-all duration-300">
        {label}
      </span>
    </li>
  );
};

export default Navbar;
