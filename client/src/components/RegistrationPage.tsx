import React, { useState } from "react";
import { PayLaterAPI } from "../api";

interface RegistrationPageProps {
  onSuccess: (phoneNumber: string, name: string) => void;
}

// Country codes list
const COUNTRY_CODES = [
  { code: "+971", country: "UAE" },
  { code: "+974", country: "Qatar" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+965", country: "Kuwait" },
  { code: "+973", country: "Bahrain" },
  { code: "+968", country: "Oman" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+91", country: "India" },
  { code: "+86", country: "China" },
  { code: "+81", country: "Japan" },
  { code: "+82", country: "South Korea" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+62", country: "Indonesia" },
  { code: "+66", country: "Thailand" },
  { code: "+84", country: "Vietnam" },
  { code: "+61", country: "Australia" },
  { code: "+64", country: "New Zealand" },
  { code: "+27", country: "South Africa" },
  { code: "+20", country: "Egypt" },
  { code: "+33", country: "France" },
  { code: "+49", country: "Germany" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+31", country: "Netherlands" },
  { code: "+32", country: "Belgium" },
  { code: "+41", country: "Switzerland" },
  { code: "+43", country: "Austria" },
  { code: "+46", country: "Sweden" },
  { code: "+47", country: "Norway" },
  { code: "+45", country: "Denmark" },
  { code: "+358", country: "Finland" },
  { code: "+7", country: "Russia" },
  { code: "+90", country: "Turkey" },
];

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSuccess }) => {
  const [localPhone, setLocalPhone] = useState("");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+974"); // Default to Qatar
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
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

    const phoneNumber = `${countryCode}${localPhone}`;

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
            <div className="w-[80px] md:w-[140px] px-2 py-3 bg-white border-r border-gray-300 text-[#5933EB] font-semibold flex items-center justify-center text-sm md:text-base">
              Name
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              className="flex-1 px-3 md:px-4 py-3 bg-white text-gray-800 focus:outline-none font-semibold text-sm md:text-base"
              placeholder=""
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Phone input - Country code in left section */}
        <div className="w-full">
          <div className="flex bg-white rounded-xl overflow-hidden">
            <div className="w-[80px] md:w-[140px] relative px-1 py-3 bg-white border-r border-gray-300 text-[#5933EB] font-body flex items-center justify-center">
              <select
                value={countryCode}
                onChange={(e) => {
                  setCountryCode(e.target.value);
                  if (error) setError("");
                }}
                className="text-[#5933EB] focus:outline-none cursor-pointer appearance-none pr-4 md:pr-6 bg-transparent w-full text-sm md:text-base text-center"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2361C9D6' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  textAlign: 'center',
                  textAlignLast: 'center',
                }}
                disabled={isLoading}
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.code}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="tel"
              value={localPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 15);
                setLocalPhone(val);
                if (error) setError("");
              }}
              className="flex-1 px-3 md:px-4 py-3 bg-white text-gray-800 focus:outline-none font-semibold text-sm md:text-base"
              placeholder=""
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
        disabled={isLoading || localPhone.length < 7 || !name.trim()}
        className="w-[90%] mt-auto mb-8 py-3 rounded-xl bg-[#61C9D6] text-white text-lg font-body font-bold shadow-lg hover:bg-[#0D9488] disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {isLoading ? "Registering..." : "Let's Go"}
      </button>
      </div>
    </div>
  );
};

export default RegistrationPage;

