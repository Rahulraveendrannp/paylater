import React, { useState } from "react";
import { PayLaterAPI } from "../api";
import SimpleQRScanner from "./SimpleQRScanner";

interface RedeemGiftPopupProps {
  onClose: () => void;
}

const RedeemGiftPopup: React.FC<RedeemGiftPopupProps> = ({ onClose }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScanSuccess = async (scannedQRCode: string): Promise<{ success: boolean; message?: string }> => {
    const trimmedQR = scannedQRCode.trim();
    
    // Validate that it's a tier QR code
    if (trimmedQR !== 'PAYLATER_GAME_TIER1' && trimmedQR !== 'PAYLATER_GAME_TIER2') {
      const errorMsg = "Invalid QR code. Please scan a tier QR code (TIER1 or TIER2).";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await PayLaterAPI.scanQRCode(trimmedQR, 'game');

      if (response.success) {
        setIsScanning(false);
        // Close popup after successful scan - keep it longer so user can see the success message
        setTimeout(() => {
          onClose();
        }, 3500);
        return { success: true };
      } else {
        const errorMsg = response.error || "Unable to redeem. Please try again.";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch {
      const errorMsg = "Something went wrong. Please try again.";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseScanner = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] text-white rounded-2xl shadow-2xl w-full max-w-xl p-6 relative">
        <button
          onClick={handleCloseScanner}
          className="absolute top-4 right-4 text-gray-300 hover:text-white"
          disabled={isSubmitting}
        >
          ✕
        </button>

        <h2 className="text-xl font-heading mb-2">
          Redeem Your Gift
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          Scan a tier QR code (TIER1 or TIER2) to redeem your gift.
        </p>

        {error && (
          <div className="bg-red-500/90 text-white border border-red-300 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {isScanning && (
          <SimpleQRScanner
            title=""
            expectedQRCode=""
            onScan={handleScanSuccess}
            onClose={handleCloseScanner}
          />
        )}

        {!isScanning && !error && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full bg-[#14B8A6] flex items-center justify-center mb-4 mx-auto">
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
            <h3 className="text-xl font-heading text-white mb-2">
              Gift Redeemed!
            </h3>
            <p className="text-gray-300">
              Your gift has been successfully redeemed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RedeemGiftPopup;

