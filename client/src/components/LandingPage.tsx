import React from "react";

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div 
      className="min-h-screen flex flex-col items-center p-4 font-body relative"
      style={{
        backgroundImage: 'url(/bg.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* PayLater Logo - More at the top */}
      <div className="flex flex-col items-center h-[80vh] my-auto">
      <div className="mt-12 md:mt-16 mb-2 text-center">
        <img
          src="/paylater.svg"
          alt="PayLater"
          className="w-48 md:w-64 mx-auto"
        />
      </div>

      {/* Main Title - Smart Slasher SVG */}
      <div className="text-center mb-2 flex-1 flex items-center justify-center">
        <img
          src="/smart slasher.svg"
          alt="Smart Slasher"
          className="w-full max-w-md md:max-w-lg mx-auto"
        />
      </div>

      {/* CTA Button - 90% width */}
      <button
        onClick={onStart}
        className="w-[90%] bg-[#61C9D6] text-white py-2 rounded-xl text-xl font-body font-semibold hover:bg-[#4FB8C6] transition-colors shadow-lg mb-8"
      >
        Let&apos;s Get Started
      </button>
      </div>
    </div>
  );
};

export default LandingPage;

