import React, { useState, useEffect, useRef } from "react";
import { PayLaterAPI } from "../api";
import QRCodeLib from "qrcode";

interface RedeemGiftPopupProps {
  onClose: () => void;
}

const RedeemGiftPopup: React.FC<RedeemGiftPopupProps> = ({ onClose }) => {
  const [qrCode, setQRCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadQRCode();
  }, []);

  useEffect(() => {
    if (qrCode && canvasRef.current) {
      QRCodeLib.toCanvas(
        canvasRef.current,
        qrCode,
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
            setError("Failed to generate QR code");
          }
        }
      );
    }
  }, [qrCode]);

  const loadQRCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await PayLaterAPI.getUserQRCode();
      
      if (response.success && response.data) {
        setQRCode(response.data.redemptionQRCode);
      } else {
        setError(response.error || "Failed to load QR code");
      }
    } catch (error) {
      setError("Failed to load QR code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-heading text-center text-gray-800 mb-4">
          Redeem Your Gift
        </h2>
        
        <p className="text-center text-gray-600 mb-6 text-sm">
          Show this QR code to the admin to claim your reward.
        </p>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Loading QR code...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadQRCode}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg border-2 border-purple-600 mb-4">
              <canvas ref={canvasRef} />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2 w-full">
              <p className="text-xs text-yellow-800 text-center font-semibold">
                ⚠️ This is a one-time gift redeem. You can only redeem once.
              </p>
            </div>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="w-full mt-6 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors font-body"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default RedeemGiftPopup;

