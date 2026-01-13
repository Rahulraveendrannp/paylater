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
  type: "game" | "photo";
  title: string;
  description: string;
}

const ACTIVITIES: ActivityCard[] = [
  {
    id: "game",
    type: "game",
    title: "Finish Line Frenzy",
    description: "Scan the QR code to start the game activity",
  },
  {
    id: "photo",
    type: "photo",
    title: "Your Marathon Moment",
    description: "Scan the QR code to start the photo activity",
  },
];

const Dashboard: React.FC<DashboardProps> = ({ name, onLogout }) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityCard | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameProgress, setGameProgress] = useState<{
    game?: {
      gameStarted?: boolean;
      completed: boolean;
      tier?: number;
      scanCount?: number;
    };
    photo?: {
      completed: boolean;
      scanCount?: number;
    };
    isRedeemed?: boolean;
  } | null>(null);
  const [isRedeemMode, setIsRedeemMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

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
    setSelectedActivity(activity);
    setShowScanner(true);
    setErrorMessage("");
    setIsRedeemMode(false);
  };

  const handleOpenRedeemScanner = () => {
    if (isSubmitting) {
      return;
    }
    // Create a temporary activity for redeem mode
    setSelectedActivity({ id: "redeem", type: "game", title: "Redeem Gift", description: "Scan a tier QR code to redeem your gift" });
    setShowScanner(true);
    setErrorMessage("");
    setIsRedeemMode(true);
  };

  const handleScanSuccess = async (scannedQRCode: string): Promise<{ success: boolean; message?: string }> => {
    if (!selectedActivity) {
      return { success: false, message: "No activity selected" };
    }

    // Validate QR code on frontend before sending to backend
    const trimmedQR = scannedQRCode.trim();
    let validQRCodes: string[] = [];

    if (isRedeemMode) {
      // In redeem mode, only allow tier QR codes
      validQRCodes = ['PAYLATER_GAME_TIER1', 'PAYLATER_GAME_TIER2'];
    } else if (selectedActivity.type === 'game') {
      // Check if game has been started and redeemed
      const gameStarted = gameProgress?.game?.gameStarted || false;
      const isRedeemed = gameProgress?.isRedeemed || false;
      
      if (isRedeemed) {
        // After redemption, only allow START QR to play game multiple times
        validQRCodes = ['PAYLATER_GAME_START'];
      } else if (gameStarted) {
        // After game started but before redemption, allow START QR (to play again) and TIER QR (to redeem)
        validQRCodes = ['PAYLATER_GAME_START', 'PAYLATER_GAME_TIER1', 'PAYLATER_GAME_TIER2'];
      } else {
        // Before game started, only allow start QR code
        validQRCodes = ['PAYLATER_GAME_START'];
      }
    } else if (selectedActivity.type === 'photo') {
      validQRCodes = ['PAYLATER_PHOTO'];
    }

    // Check if scanned QR code matches any valid code
    if (!validQRCodes.includes(trimmedQR)) {
      const errorMsg = isRedeemMode 
        ? "Invalid QR code. Please scan a tier QR code (TIER1 or TIER2)."
        : "Invalid QR code. Please scan the correct QR code for this activity.";
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
        setIsRedeemMode(false);
        // Show activity-specific success message
        if (isRedeemMode) {
          setSuccessMessage("Gift Redeemed!");
        } else if (selectedActivity.type === 'game') {
          const gameStarted = gameProgress?.game?.gameStarted || false;
          const isRedeemed = gameProgress?.isRedeemed || false;
          
          if (trimmedQR === 'PAYLATER_GAME_START') {
            if (isRedeemed) {
              setSuccessMessage("Game started! Enjoy playing again!");
            } else if (!gameStarted) {
              setSuccessMessage("Game started!");
            } else {
              setSuccessMessage("Game started!");
            }
          } else if (trimmedQR === 'PAYLATER_GAME_TIER1' || trimmedQR === 'PAYLATER_GAME_TIER2') {
            setSuccessMessage("Gift Redeemed!");
          } else {
            setSuccessMessage("Scan successful! You can play the game again.");
          }
        } else {
          setSuccessMessage("Scan successful!");
        }
        // Auto-dismiss success message after 2 seconds
        setTimeout(() => {
          setSuccessMessage("");
        }, 2000);
        // Reload progress to update UI
        await loadProgress();
        return { success: true };
      } else {
        // Check both error and message fields (backend returns message)
        const errorMsg = response.error || response.message || "Unable to record this scan. Please try again.";
        console.error("Scan error:", response);
        setErrorMessage(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch {
      const errorMsg = "Something went wrong while saving your scan. Please try again.";
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
    setIsRedeemMode(false);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center p-4 font-body"
      style={{
        background: `
          radial-gradient(ellipse 400px 200px at 50% 15%, rgba(107, 90, 205, 0.3) 0%, transparent 70%),
          radial-gradient(circle 250px at 35% 45%, rgba(107, 90, 205, 0.25) 0%, transparent 70%),
          radial-gradient(circle 250px at 65% 45%, rgba(107, 90, 205, 0.25) 0%, transparent 70%),
          radial-gradient(circle at center, #4D3AAA 0%, #1F1744 100%)
        `
      }}
    >
      {/* Header */}
      <div className="text-center mb-8 mt-12">
        <div className="flex flex-col items-center mb-4">
          {/* HELLO SVG */}
          <img
            src="/Hello.svg"
            alt="HELLO"
            className="w-full max-w-[130px] md:max-w-[180px] z-50"
          />
          {/* Dynamic Username styled to match */}
          <svg 
            className="mt-[-14px]"
            viewBox="0 0 400 80" 
            style={{
              width: 'clamp(280px, 70vw, 400px)',
              height: 'auto',
            }}
          >
            <text
              x="50%"
              y="60"
              textAnchor="middle"
              style={{
                fontFamily: "'Aspekta', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
                fontSize: '60px',
                fontWeight: 900,
                letterSpacing: '0.05em',
                fill: '#EDEDF7',
                stroke: '#291F5B',
                strokeWidth: '16px',
                strokeLinejoin: 'round',
                strokeLinecap: 'round',
                paintOrder: 'stroke fill',
              }}
            >
              {name.toUpperCase()}
            </text>
          </svg>
        </div>
        <p className="text-gray-200 text-base md:text-lg mt-8 text-center w-[80%] mx-auto font-extralight">
          Scan the QR code to start the activity of your choice.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-500/90 text-white border border-red-300 rounded-lg p-3 mb-4 text-sm shadow max-w-md w-full">
          {errorMessage}
        </div>
      )}

      {/* Activity Cards - In row for mobile and desktop */}
      <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-2xl">
        {ACTIVITIES.map((activity) => {
          // Split title into words for multi-line display
          const titleWords = activity.title.split(' ');
          const firstLine = titleWords[0];
          const secondLine = titleWords.slice(1, -1).join(' ');
          const thirdLine = titleWords[titleWords.length - 1];

          const progress = gameProgress?.[activity.type];
          const isCompleted = progress?.completed || false;
          const isRedeemed = gameProgress?.isRedeemed || false;
          const gameStarted = activity.type === 'game' ? (gameProgress?.game?.gameStarted || false) : false;

          // Photo: allow clicking always (multiple scans allowed)
          // Game: allow clicking always (can scan start QR, then tier QRs)
          const canClick = true;

          return (
            <div
              key={activity.id}
              className={`bg-purple-100 rounded-xl shadow-lg p-3 flex flex-col transition-shadow ${
                canClick ? 'cursor-pointer hover:shadow-xl' : 'cursor-not-allowed opacity-75'
              }`}
              style={{ backgroundColor: '#E8E0F5' }}
              onClick={() => canClick && handleOpenScanner(activity)}
            >
              {/* GAME/PHOTO label at top - centered */}
              <div className="mb-4 text-center">
                <span className="text-[#291F5B] text-sm font-semibold uppercase">
                  {activity.type === "game" ? "GAME" : "PHOTO"}
                </span>
              </div>
              
              {/* Title - centered, multi-line */}
              <div className="flex-1 flex flex-col justify-center mb-4 text-center">
                <h2 className="text-xl md:text-2xl font-heading font-black text-[#5933EB] leading-tight">
                  {firstLine}
                  {secondLine && <><br />{secondLine}</>}
                  {thirdLine && <><br />{thirdLine}</>}
                </h2>
              </div>
              
              {/* QR icon at bottom - centered, fixed position */}
              <div className="flex justify-center mb-2">
                <img
                  src="/qr-icon.svg"
                  alt="QR Code"
                  className="w-12 h-12"
                />
              </div>

              {/* Completion status text - always reserve space for alignment */}
              <div className="text-center h-5">
                {activity.type === 'game' && isRedeemed ? (
                  <p className="text-xs text-[#291F5B] font-semibold">
                    One-time gift redeemed
                  </p>
                ) : activity.type === 'game' && gameStarted && !isCompleted ? (
                  <p className="text-xs text-[#291F5B] font-semibold">
                    Game Started
                  </p>
                ) : activity.type === 'game' && isCompleted ? (
                  <p className="text-xs text-[#291F5B] font-semibold">
                    Completed
                  </p>
                ) : (
                  <div className="h-5"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Redeem Gift Button - Show if game started and not redeemed */}
      {gameProgress && gameProgress.game?.gameStarted && !gameProgress.isRedeemed && (
        <div className="w-full max-w-2xl grid grid-cols-2 gap-4 mb-4">
          <button
            onClick={handleOpenRedeemScanner}
            className="w-full text-white py-2 rounded-xl text-lg font-body font-semibold shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#7F6BEB' }}
          >
            Redeem Gift
          </button>
          <div></div>
        </div>
      )}

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-[90%] bg-[#61C9D6] text-white py-2 rounded-xl text-lg font-body shadow-lg hover:bg-[#4FB8C6] transition-colors mt-12 mb-8"
      >
        Logout
      </button>

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
              {isRedeemMode ? "Redeem Your Gift" : `Scan QR Code for ${selectedActivity.title}`}
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              {isRedeemMode ? "Scan a tier QR code (TIER1 or TIER2) to redeem your gift." : selectedActivity.description}
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

