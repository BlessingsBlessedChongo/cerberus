import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const API_BASE = 'http://localhost:8000/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLine, setCurrentLine] = useState('');
  const [showTerminal, setShowTerminal] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const { saveToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const bootSequence = [
      '[CORE AGENT] C++ thread initialized on localhost:9000',
      '[SENTINEL] Running C11 CRC32 integrity check on watchdog.log... MATCH',
      '[ANALYTICS] Spring Boot anomaly detection active.',
      '[CERBERUS] Three Heads. One Mission. Watch. Predict. Protect.',
    ];

    // Timing configuration (in milliseconds)
    const TYPING_SPEED = 20;      // ms per character when typing
    const HOLD_TIME = 250;         // ms to hold full line before deletion
    const DELETION_SPEED = 10;     // ms per character when deleting
    const TERMINAL_FADE_DELAY = 300;   // ms after final deletion before terminal fades
    const TERMINAL_FADE_DURATION = 300; // ms for terminal fade transition
    const LOGIN_DELAY = 400;       // ms after terminal fades before login appears
    const LOGIN_FADE_DURATION = 500; // ms for login form fade transition

    let lineIndex = 0;
    let charIndex = 0;
    let timeoutId = null;

    const animateLine = () => {
      const currentSequence = bootSequence[lineIndex];

      // Phase 1: Typing - add one character at a time
      const typeNextChar = () => {
        if (charIndex < currentSequence.length) {
          setCurrentLine(currentSequence.substring(0, charIndex + 1));
          setShowCursor(true);
          charIndex++;
          timeoutId = setTimeout(typeNextChar, TYPING_SPEED);
        } else {
          // Typing complete, move to holding phase
          setTimeout(holdLine, HOLD_TIME);
        }
      };

      // Phase 2: Hold - keep line visible
      const holdLine = () => {
        // Line stays visible, cursor still blinking
        setShowCursor(true);
        timeoutId = setTimeout(deleteLine, 0);
      };

      // Phase 3: Deletion - remove one character at a time
      const deleteLine = () => {
        let deleteCharIndex = currentSequence.length;
        const deleteNextChar = () => {
          if (deleteCharIndex > 0) {
            deleteCharIndex--;
            setCurrentLine(currentSequence.substring(0, deleteCharIndex));
            setShowCursor(false); // Hide cursor during deletion
            timeoutId = setTimeout(deleteNextChar, DELETION_SPEED);
          } else {
            // Line fully deleted
            setCurrentLine('');
            charIndex = 0;
            lineIndex++;

            if (lineIndex < bootSequence.length) {
              // Proceed to next line immediately
              animateLine();
            } else {
              // All lines complete - fade out terminal
              timeoutId = setTimeout(() => {
                setShowCursor(false);
                timeoutId = setTimeout(() => {
                  setShowTerminal(false);
                  // After terminal fades out, wait before showing login
                  timeoutId = setTimeout(() => {
                    setShowLogin(true);
                  }, LOGIN_DELAY);
                }, TERMINAL_FADE_DURATION);
              }, TERMINAL_FADE_DELAY);
            }
          }
        };
        deleteNextChar();
      };

      typeNextChar();
    };

    animateLine();

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();

      if (data.token) {
        saveToken(data.token);
        navigate('/');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('[v0] Login error:', err);
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Boot Sequence Terminal */}
      {showTerminal && (
        <div className={`terminal-container ${!showLogin ? '' : 'fadeOut'}`}>
          <div className="terminal-box">
            <div className="terminal-line">
              {currentLine}
              {showCursor && <span className="cursor">_</span>}
            </div>
          </div>
        </div>
      )}

      {/* Login Interface */}
      {showLogin && (
        <div className={`login-interface ${showLogin ? 'fadeIn' : ''}`}>
          <div className="login-grid">
            {/* Left Side: Logo */}
            <div className="login-left">
              <div className="logo-section">
                <svg className="cerberus-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00FFCC" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <path d="M50 10 L75 25 L75 50 Q75 75 50 90 Q25 75 25 50 L25 25 Z" fill="url(#shieldGradient)" strokeWidth="1.5" stroke="#00FFCC" />
                  <circle cx="35" cy="45" r="6" fill="#0B0F19" />
                  <circle cx="50" cy="55" r="6" fill="#0B0F19" />
                  <circle cx="65" cy="45" r="6" fill="#0B0F19" />
                </svg>
                <h1 className="logo-text">CERBERUS</h1>
              </div>
              <p className="logo-subtitle">Watch. Predict. Protect.</p>
            </div>

            {/* Right Side: Form */}
            <div className="login-right">
              <form onSubmit={handleSubmit} className="login-form">
                <p className="form-label">Access the Cerberus Dashboard</p>

                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="form-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-button"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
