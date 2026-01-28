import React, { useState, useEffect } from "react";
import { PayLaterAPI } from "../api";
import SimpleQRScanner from "./SimpleQRScanner";

interface DashboardProps {
  phoneNumber: string;
  name: string;
  onLogout: () => void;
}

interface ActivityCard {
  id: string;
  type: "game";
  title: string;
  description: string;
}

const ACTIVITIES: ActivityCard[] = [
  {
    id: "game",
    type: "game",
    title: "Redeem Gift",
    description: "Scan the QR code to redeem the gift",
  },
];

const Dashboard: React.FC<DashboardProps> = ({ name, onLogout }) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityCard | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameProgress, setGameProgress] = useState<{
    isRedeemed?: boolean;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Process name: extract first name and truncate if too long
  const getDisplayName = (fullName: string): string => {
    // Split by space and get first name
    const firstName = fullName.trim().split(/\s+/)[0] || fullName;
    
    // Truncate if longer than 15 characters and add ellipsis
    const maxLength = 8;
    if (firstName.length > maxLength) {
      return firstName.substring(0, maxLength) + '...';
    }
    
    return firstName;
  };

  useEffect(() => {
    loadProgress();
    
    // Reload progress when window regains focus (in case admin redeemed while user was away)
    const handleFocus = () => {
      loadProgress();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadProgress = async () => {
    try {
      const response = await PayLaterAPI.getProgress();
      if (response.success && response.data) {
        setGameProgress(response.data.gameProgress);
      }
    } catch (error) {
      console.error("Failed to load progress:", error);
    }
  };

  const handleOpenScanner = (activity: ActivityCard) => {
    if (isSubmitting) {
      return;
    }
    // Check if already redeemed - don't allow opening scanner
    const isRedeemed = gameProgress?.isRedeemed || false;
    if (isRedeemed) {
      return;
    }
    setSelectedActivity(activity);
    setShowScanner(true);
    setErrorMessage("");
  };

  const handleScanSuccess = async (scannedQRCode: string): Promise<{ success: boolean; message?: string }> => {
    if (!selectedActivity) {
      return { success: false, message: "No activity selected" };
    }

    // Check if already redeemed
    const isRedeemed = gameProgress?.isRedeemed || false;
    if (isRedeemed) {
      setErrorMessage("You have already redeemed your gift.");
      return { success: false, message: "You have already redeemed your gift." };
    }

    // Validate QR code - only accept TIER1
    const trimmedQR = scannedQRCode.trim();
    if (trimmedQR !== 'PAYLATER_GAME_TIER1') {
      const errorMsg = "Invalid QR code. Please scan the correct QR code.";
      setErrorMessage(errorMsg);
      return { success: false, message: errorMsg };
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const response = await PayLaterAPI.scanQRCode(trimmedQR, selectedActivity.type);

      if (response.success) {
        setShowScanner(false);
        setSelectedActivity(null);
        setSuccessMessage("Gift redeemed successfully!");
        // Auto-dismiss success message after 2 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 2000);
        // Reload progress to update UI
        await loadProgress();
        return { success: true };
      } else {
        const errorMsg = response.error || response.message || "Unable to redeem. Please try again.";
        console.error("Scan error:", response);
        setErrorMessage(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch {
      const errorMsg = "Something went wrong. Please try again.";
      setErrorMessage(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseScanner = () => {
    if (isSubmitting) return;
    setShowScanner(false);
    setSelectedActivity(null);
    setErrorMessage("");
  };

  return (
    <div 
      className="h-screen flex flex-col items-center p-4 font-body overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 400px 200px at 50% 15%, rgba(107, 90, 205, 0.3) 0%, transparent 70%),
          radial-gradient(circle 250px at 35% 45%, rgba(107, 90, 205, 0.25) 0%, transparent 70%),
          radial-gradient(circle 250px at 65% 45%, rgba(107, 90, 205, 0.25) 0%, transparent 70%),
          radial-gradient(circle at center, #4D3AAA 0%, #1F1744 100%)
        `
      }}
    >
      <div className="flex flex-col items-center w-full flex-1 justify-between">
      {/* Header */}
      <div className="text-center mb-8 mt-12">
        <div className="flex flex-col items-center mb-4">
          {/* Hello and Username with embossed text styling */}
          <div className="flex flex-col items-center">
            {/* Hello text */}
            <svg 
              viewBox="0 0 400 80" 
              style={{
                width: '100%',
                maxWidth: '95vw',
                height: 'auto',
                marginBottom: '0',
              }}
            >
              <text
                x="50%"
                y="60"
                textAnchor="middle"
                style={{
                  fontFamily: "'Aspekta', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
                  fontSize: '72px',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  fill: '#EEECF8',
                  stroke: '#806AEA',
                  strokeWidth: '14px',
                  strokeLinejoin: 'round',
                  strokeLinecap: 'round',
                  paintOrder: 'stroke fill',
                }}
              >
                Hello
              </text>
            </svg>
            {/* Username text */}
            <svg 
              viewBox="0 0 400 80" 
              style={{
                width: '100%',
                maxWidth: '95vw',
                height: 'auto',
                marginTop: '0',
              }}
            >
              <text
                x="50%"
                y="60"
                textAnchor="middle"
                style={{
                  fontFamily: "'Aspekta', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
                  fontSize: '72px',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  fill: '#EEECF8',
                  stroke: '#806AEA',
                  strokeWidth: '14px',
                  strokeLinejoin: 'round',
                  strokeLinecap: 'round',
                  paintOrder: 'stroke fill',
                }}
              >
                {getDisplayName(name).charAt(0).toUpperCase() + getDisplayName(name).slice(1)}
              </text>
            </svg>
          </div>
        </div>
        <p className="text-gray-200 text-base md:text-lg mt-8 text-center w-[80%] mx-auto font-extralight whitespace-nowrap">
          {gameProgress?.isRedeemed ? "You have already redeemed the gift." : "Scan the QR code to redeem the gift."}
        </p>
      </div>

      {errorMessage && (
        <div className="text-center mb-4">
          <p className="text-blue-400 text-base md:text-lg underline">
            {errorMessage}
          </p>
        </div>
      )}

      {/* Activity Cards - Single game */}
      <div className="flex justify-center mb-8 w-full max-w-2xl">
        {ACTIVITIES.map((activity) => {
          // Game: only allow clicking if not redeemed
          const isRedeemed = gameProgress?.isRedeemed || false;
          const canClick = !isRedeemed;

          return (
            <div
              key={activity.id}
              className={`bg-purple-100 rounded-xl shadow-lg p-4 md:p-6 flex flex-row items-center justify-between transition-shadow w-[90%] ${
                canClick ? 'cursor-pointer hover:shadow-xl' : 'cursor-default'
              }`}
              style={{ backgroundColor: '#E8E0F5', minHeight: '90px' }}
              onClick={() => canClick && handleOpenScanner(activity)}
            >
              {/* Left side - Text content */}
              <div className="flex flex-col flex-1 h-full justify-center">
                {/* GAME label at top */}
                <div className="mb-2">
                  <span className="text-[#291F5B] text-xs md:text-sm font-semibold uppercase">
                    GAME
                  </span>
                </div>
                
                {/* Title - Show "One-time gift redeemed" if redeemed, otherwise "Redeem Gift" */}
                <div className="flex-1">
                  {gameProgress?.isRedeemed ? (
                    <h2 className="text-xl md:text-2xl font-heading font-black text-[#5933EB] leading-tight">
                      One-time gift redeemed
                    </h2>
                  ) : (
                    <h2 className="text-xl md:text-2xl font-heading font-black text-[#5933EB] leading-tight">
                      {activity.title}
                    </h2>
                  )}
                </div>
              </div>
              
              {/* Right side - QR icon - only show if not redeemed */}
              {!isRedeemed && (
                <div className="flex items-center ml-4 h-full">
                  <div 
                    className="w-12 h-12 md:w-16 md:h-16"
                    style={{
                      backgroundColor: '#40388F',
                      WebkitMask: 'url(/qr-icon.svg) no-repeat center / contain',
                      mask: 'url(/qr-icon.svg) no-repeat center / contain',
                      height: '100%',
                      minHeight: '80px',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>


      {/* Logout button - at bottom */}
      <button
        onClick={onLogout}
        className="w-[90%] bg-[#61C9D6] text-white py-3 rounded-xl text-lg font-body font-bold shadow-lg hover:bg-[#4FB8C6] transition-colors mb-20 mt-auto"
      >
        Logout
      </button>
      </div>

      {showScanner && selectedActivity && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] text-white rounded-2xl shadow-2xl w-full max-w-xl p-6 relative">
            <button
              onClick={handleCloseScanner}
              className="absolute top-4 right-4 text-gray-300 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-xl font-heading mb-2">
              Scan QR Code for {selectedActivity.title}
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Scan the QR code to redeem your gift.
            </p>

            <SimpleQRScanner
              title=""
              expectedQRCode=""
              onScan={handleScanSuccess}
              onClose={handleCloseScanner}
            />
          </div>
        </div>
      )}

      {/* Success Popup Modal (SweetAlert style) */}
      {successMessage && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex flex-col items-center text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 rounded-full bg-[#14B8A6] flex items-center justify-center mb-4 animate-bounce-in">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              
              {/* Message */}
              <h3 className="text-xl font-heading text-gray-800 mb-2">
                Success!
              </h3>
              <p className="text-gray-600 font-body text-base">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

