import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellIcon, MessageSquareIcon, UserIcon, MenuIcon, XIcon } from 'lucide-react';
interface NavbarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}
const Navbar = ({
  isAuthenticated,
  onLogout
}: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleNotifications = () => setNotificationsOpen(!notificationsOpen);
  const notifications = [{
    id: 1,
    message: 'New bid on your camera auction',
    time: '2 min ago'
  }, {
    id: 2,
    message: 'Your bid was outbid on vintage watch',
    time: '1 hour ago'
  }, {
    id: 3,
    message: 'Auction ending soon: Antique Vase',
    time: '3 hours ago'
  }];
  return <header className="bg-white drop-shadow-2xl ">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            BidMaster
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            
            {isAuthenticated ? <>
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                <Link to="/create-auction" className="text-gray-700 hover:text-blue-600">
                  Create Auction
                </Link>
              </> : null}
          </div>
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? <>
                <div className="relative">
                  <button onClick={toggleNotifications} className="p-2 rounded-full hover:bg-gray-100">
                    <BellIcon className="w-6 h-6 text-gray-600" />
                  </button>
                  {notificationsOpen && <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10">
                      <div className="p-3 border-b">
                        <h3 className="text-lg font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map(notification => <div key={notification.id} className="p-3 border-b hover:bg-gray-50">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {notification.time}
                            </p>
                          </div>)}
                      </div>
                      <div className="p-2 text-center">
                        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
                          View All
                        </Link>
                      </div>
                    </div>}
                </div>
                <Link to="/chat" className="p-2 rounded-full hover:bg-gray-100">
                  <MessageSquareIcon className="w-6 h-6 text-gray-600" />
                </Link>
                <Link to="/profile" className="p-2 rounded-full hover:bg-gray-100">
                  <UserIcon className="w-6 h-6 text-gray-600" />
                </Link>
                <button onClick={onLogout} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Logout
                </button>
              </> : <>
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
                  Login
                </Link>
                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Register
                </Link>
              </>}
          </div>
          <button onClick={toggleMobileMenu} className="md:hidden p-2">
            {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && <nav className="md:hidden mt-3 pb-3">
            <Link to="/" className="block py-2 text-gray-700">
              Home
            </Link>
            {isAuthenticated ? <>
                <Link to="/dashboard" className="block py-2 text-gray-700">
                  Dashboard
                </Link>
                <Link to="/create-auction" className="block py-2 text-gray-700">
                  Create Auction
                </Link>
                <Link to="/chat" className="block py-2 text-gray-700">
                  Messages
                </Link>
                <Link to="/profile" className="block py-2 text-gray-700">
                  Profile
                </Link>
                <button onClick={onLogout} className="w-full text-left py-2 text-gray-700">
                  Logout
                </button>
              </> : <>
                <Link to="/login" className="block py-2 text-gray-700">
                  Login
                </Link>
                <Link to="/register" className="block py-2 text-gray-700">
                  Register
                </Link>
              </>}
          </nav>}
      </div>
    </header>;
};
export default Navbar;