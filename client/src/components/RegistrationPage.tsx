import React, { useState } from "react";
import { PayLaterAPI } from "../api";

interface RegistrationPageProps {
  onSuccess: (phoneNumber: string, name: string) => void;
}


const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSuccess }) => {
  const [localPhone, setLocalPhone] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState(""); // Empty to show placeholder
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    // Validate country code (must have 1-3 digits)
    if (!/^\d{1,3}$/.test(countryCode)) {
      setError("Please enter a valid country code (e.g., 974)");
      return;
    }

    // Validate phone number format (at least 7 digits, max 15)
    if (!/^\d{7,15}$/.test(localPhone)) {
      setError("Please enter a valid phone number");
      return;
    }

    // Validate name
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const phoneNumber = `+${countryCode}${localPhone}`;

    setIsLoading(true);
    setError("");

    try {
      console.log("Registering user:", phoneNumber, name);

      const response = await PayLaterAPI.registerUser(phoneNumber, name.trim());

      if (response.success) {
        console.log("Registration successful");
        onSuccess(phoneNumber, name.trim());
      } else {
        console.error("Registration failed:", response.error);
        setError(response.error || "Failed to register. Please try again.");
      }
    } catch (err) {
      console.error("Network error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="h-screen w-screen flex flex-col items-center p-4 font-body overflow-hidden fixed inset-0"
      style={{
        background: 'radial-gradient(circle at center, #4D3AAA 0%, #1F1744 100%)'
      }}
    >
      <div className="flex flex-col items-center h-[80vh] my-auto w-full">
      {/* Main Title - Smart Slasher SVG */}

        <img
          src="/howtoplay.svg"
          alt="How to Play"
          className="w-full max-w-[200px] md:max-w-[250px] mx-auto mt-8"
        />

      {/* Form section - Centered in middle - 90% width */}
      <div className="w-[90%] space-y-2 mt-20">
        {/* Name input - Label inside left section */}
        <div className="w-full">
          <div className="flex bg-white rounded-xl overflow-hidden">
            <div className="w-[80px] md:w-[140px] px-2 py-3 bg-white border-r border-gray-300 text-[#5933EB] font-semibold flex items-center justify-center text-base md:text-base">
              Name
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className="flex-1 px-3 md:px-4 py-3 bg-white text-gray-800 focus:outline-none font-semibold text-base md:text-base"
              placeholder=""
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Phone input - Country code in left section */}
        <div className="w-full">
          <div className="flex bg-white rounded-xl overflow-hidden">
            <div className="w-[80px] md:w-[140px] px-2 py-3 bg-white border-r border-gray-300 text-[#5933EB] font-semibold flex items-center justify-center">
              <input
                type="text"
                value={countryCode}
                onChange={(e) => {
                  // Allow only digits
                  const val = e.target.value.replace(/\D/g, "");
                  // Limit to 3 digits
                  if (val.length <= 3) {
                    setCountryCode(val);
                    if (error) setError("");
                  }
                }}
                className="text-[#5933EB] focus:outline-none bg-transparent w-full text-base md:text-base text-center font-semibold placeholder:text-[#5933EB] placeholder:opacity-50"
                placeholder="974"
                disabled={isLoading}
                maxLength={3}
                inputMode="numeric"
              />
            </div>
            <input
              type="tel"
              value={localPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 15);
                setLocalPhone(val);
                if (error) setError("");
              }}
              className="flex-1 px-3 md:px-4 py-3 bg-white text-gray-800 focus:outline-none font-semibold text-base md:text-base placeholder:text-gray-400"
              placeholder="12345678"
              disabled={isLoading}
              maxLength={15}
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-300 text-sm text-center">{error}</p>
        )}
      </div>

      {/* Submit button - At bottom - 90% width */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || localPhone.length < 7 || !name.trim() || !/^\d{1,3}$/.test(countryCode)}
        className="w-[90%] mt-auto mb-8 py-3 rounded-xl bg-[#61C9D6] text-white text-lg font-body font-bold shadow-lg hover:bg-[#0D9488] disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {isLoading ? "Registering..." : "Let's Go"}
      </button>
      </div>
    </div>
  );
};

export default RegistrationPage;

