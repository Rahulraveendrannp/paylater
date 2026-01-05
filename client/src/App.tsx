import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import type { GameSession } from "./types";
import { PayLaterAPI } from "./api";

import LandingPage from "./components/LandingPage";
import RegistrationPage from "./components/RegistrationPage";
import Dashboard from "./components/Dashboard";
import AdminPage from "./components/AdminPage";

const AppContext = React.createContext<{
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  name: string;
  setName: (name: string) => void;
  gameSession: GameSession | null;
  setGameSession: (session: GameSession | null) => void;
}>({
  phoneNumber: "",
  setPhoneNumber: () => {},
  name: "",
  setName: () => {},
  gameSession: null,
  setGameSession: () => {},
});

const LandingPageWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/register");
  };

  return <LandingPage onStart={handleStart} />;
};

const RegistrationPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { setPhoneNumber, setName, setGameSession } = React.useContext(AppContext);

  const handleSuccess = (phoneNumber: string, name: string) => {
    setPhoneNumber(phoneNumber);
    setName(name);
    const session = {
      userId: phoneNumber,
      startTime: Date.now(),
    };
    setGameSession(session);
    navigate("/dashboard");
  };

  return <RegistrationPage onSuccess={handleSuccess} />;
};

const DashboardWrapper: React.FC = () => {
  const navigate = useNavigate();
  const {
    phoneNumber,
    name,
    setGameSession,
    setPhoneNumber,
    setName,
  } = React.useContext(AppContext);

  const handleLogout = () => {
    console.log("🔐 App: Logging out user...");

    PayLaterAPI.logout();
    localStorage.removeItem("paylater_phone_number");
    localStorage.removeItem("paylater_name");
    localStorage.removeItem("paylater_session");
    localStorage.removeItem("paylater_token");

    setGameSession(null);
    setPhoneNumber("");
    setName("");
    console.log("🔐 App: Logout completed, redirecting to landing");
    navigate("/");
  };

  return (
    <Dashboard
      phoneNumber={phoneNumber}
      name={name}
      onLogout={handleLogout}
    />
  );
};

const AppContent: React.FC = () => {
  const { phoneNumber, name, gameSession } = React.useContext(AppContext);

  const isAuthenticated = phoneNumber && name && gameSession;

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LandingPageWrapper />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegistrationPageWrapper />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <DashboardWrapper />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={<AdminPage />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
};

const App: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem("paylater_phone_number") || "";
  });
  const [name, setName] = useState(() => {
    return localStorage.getItem("paylater_name") || "";
  });
  const [gameSession, setGameSession] = useState<GameSession | null>(() => {
    const saved = localStorage.getItem("paylater_session");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem("paylater_token");
      const savedPhoneNumber = localStorage.getItem("paylater_phone_number");
      const savedName = localStorage.getItem("paylater_name");

      console.log("🔐 App: Checking authentication on load...");
      console.log("🔐 App: Token exists:", !!token);
      console.log("🔐 App: Phone number exists:", !!savedPhoneNumber);
      console.log("🔐 App: Name exists:", !!savedName);

      if ((token && (!savedPhoneNumber || !savedName)) || (!token && (savedPhoneNumber || savedName))) {
        console.log(
          "🔐 App: Inconsistent authentication state, clearing all data"
        );
        localStorage.clear();
        setPhoneNumber("");
        setName("");
        setGameSession(null);
        return false;
      }

      if (token && savedPhoneNumber && savedName) {
        console.log("🔐 App: Authentication found, verifying...");
        return true;
      }

      console.log("🔐 App: No authentication found");
      return false;
    };

    checkAuthentication();
  }, []);

  const setPhoneNumberWithPersistence = (phone: string) => {
    setPhoneNumber(phone);
    if (phone) {
      localStorage.setItem("paylater_phone_number", phone);
    } else {
      localStorage.removeItem("paylater_phone_number");
    }
  };

  const setNameWithPersistence = (nameValue: string) => {
    setName(nameValue);
    if (nameValue) {
      localStorage.setItem("paylater_name", nameValue);
    } else {
      localStorage.removeItem("paylater_name");
    }
  };

  const setGameSessionWithPersistence = (session: GameSession | null) => {
    setGameSession(session);
    if (session) {
      localStorage.setItem("paylater_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("paylater_session");
    }
  };

  return (
    <AppContext.Provider
      value={{
        phoneNumber,
        setPhoneNumber: setPhoneNumberWithPersistence,
        name,
        setName: setNameWithPersistence,
        gameSession,
        setGameSession: setGameSessionWithPersistence,
      }}
    >
      <Router>
        <AppContent />
      </Router>
    </AppContext.Provider>
  );
};

export default App;

