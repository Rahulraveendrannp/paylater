import React, { useEffect, useState, useRef } from "react";
import { Search, LogOut, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PayLaterAPI } from "../api";
import AdminLogin from "./AdminLogin";
import QRCodeLib from "qrcode";

interface AdminUser {
  _id: string;
  phoneNumber: string;
  name: string;
  gameProgress: {
    game?: {
      gameStarted?: boolean;
      completed: boolean;
      tier?: number;
      scanCount?: number;
      gameStartCount?: number;
    };
    photo?: {
      completed: boolean;
      scanCount?: number;
    };
  };
  redemptionQRCode?: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  createdAt?: string;
}

interface AdminStatistics {
  totalUsers: number;
  redeemedUsers: number;
  unredeemedUsers: number;
  gameCompleted: number;
  photoCompleted: number;
  bothCompleted: number;
  tier1Count: number;
  tier2Count: number;
}

const ITEMS_PER_PAGE = 25;

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      Promise.all([loadUsers(1, ""), loadStatistics()]).finally(() => setIsLoading(false));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (showQRCode) {
      // Small delay to ensure canvas is rendered
      const timer = setTimeout(() => {
        if (qrCanvasRef.current) {
          // Generate QR code for the URL when modal opens
          QRCodeLib.toCanvas(
            qrCanvasRef.current,
            "https://paylater-marathon.online/",
            {
              width: 300,
              margin: 4,
              errorCorrectionLevel: 'H',
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            },
            (err) => {
              if (err) {
                console.error("Error generating QR code:", err);
              } else {
                console.log("QR code generated successfully");
              }
            }
          );
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [showQRCode]);

  const checkAuthentication = () => {
    const authenticated = localStorage.getItem("adminAuthenticated") === "true";
    const loginTime = localStorage.getItem("adminLoginTime");

    if (authenticated && loginTime) {
      const loginTimestamp = parseInt(loginTime, 10);
      const hoursSinceLogin = (Date.now() - loginTimestamp) / (1000 * 60 * 60);
      if (hoursSinceLogin < 24) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("adminAuthenticated");
        localStorage.removeItem("adminLoginTime");
      }
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminLoginTime");
    setIsAuthenticated(false);
    navigate("/admin");
  };

  const loadUsers = async (page: number, search: string) => {
    try {
      setIsLoadingUsers(true);
      const response = await PayLaterAPI.adminGetUsers(page, search);
      
      if (response.success && response.data) {
        setUsersList(response.data.users || []);
        setTotalPages(response.data.pagination?.totalPages || 0);
        setTotalUsers(response.data.pagination?.totalUsers || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await PayLaterAPI.adminGetStatistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
    }
  };

  const handleShowQRCode = () => {
    setShowQRCode(true);
  };

  useEffect(() => {
    if (showQRCode && qrCanvasRef.current) {
      // Generate QR code for the URL when modal opens
      QRCodeLib.toCanvas(
        qrCanvasRef.current,
        "https://paylater-marathon.online/",
        {
          width: 300,
          margin: 4,
          errorCorrectionLevel: 'H',
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (err) => {
          if (err) {
            console.error("Error generating QR code:", err);
          } else {
            console.log("QR code generated successfully");
          }
        }
      );
    }
  }, [showQRCode]);

  const handleCloseQRCode = () => {
    setShowQRCode(false);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadUsers(newPage, searchTerm);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadUsers(1, searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isAuthenticated]);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div 
      className="min-h-screen p-4 font-body"
      style={{
        background: 'radial-gradient(circle at center, #4D3AAA 0%, #1F1744 100%)'
      }}
    >
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading text-purple-600">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-2">Monitor progress, manage redemptions, and view statistics.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShowQRCode}
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-body shadow-lg"
            >
              <QrCode className="w-4 h-4" />
              Show QR Code
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-body shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>


      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-purple-600">{statistics.totalUsers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Redeemed</p>
            <p className="text-2xl font-bold text-green-600">{statistics.redeemedUsers}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Game Started</p>
            <p className="text-2xl font-bold text-blue-600">{statistics.gameCompleted}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Photo Completed</p>
            <p className="text-2xl font-bold text-pink-600">{statistics.photoCompleted}</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4 sm:mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xl font-heading text-gray-800">Users</h3>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-colors font-body"
              />
            </div>
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading users...</p>
          </div>
        ) : usersList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-purple-50 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-center py-3 px-3">Game Count</th>
                  <th className="text-center py-3 px-3">Photo</th>
                  <th className="text-center py-3 px-3">Tier</th>
                  <th className="text-center py-3 px-3">Redeemed</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-body">{user.name}</td>
                    <td className="py-3 px-4 text-sm font-body">{user.phoneNumber}</td>
                    <td className="py-3 px-3 text-center">
                      {user.gameProgress?.game?.gameStarted ? (
                        <span className="text-green-600 font-semibold">
                          {user.gameProgress.game.gameStartCount || 1}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {user.gameProgress?.photo?.completed ? (
                        <span className="text-green-600 font-semibold">
                          {user.gameProgress.photo.scanCount || 1}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {user.gameProgress?.game?.tier ? (
                        <span className="text-purple-600 font-semibold">Tier {user.gameProgress.game.tier}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {user.isRedeemed ? (
                        <span className="text-green-600 font-semibold">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-body"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 font-body">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-body"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* QR Code Display Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={handleCloseQRCode}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>

            <h3 className="text-xl font-heading mb-2 text-gray-800 text-center">
              Event QR Code
            </h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              https://paylater-marathon.online/
            </p>

            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg border-2 border-purple-600 mb-4">
                <canvas ref={qrCanvasRef} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;

