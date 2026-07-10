import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const API_BASE = 'http://localhost:8000/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [currentLineText, setCurrentLineText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { saveToken, saveUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const bootSequence = [
      '[CORE AGENT] C++ thread initialized on localhost:9000',
      '[SENTINEL] Running C11 CRC32 integrity check on watchdog.log... MATCH',
      '[ANALYTICS] Spring Boot anomaly detection active.',
      '[CERBERUS] Three Heads. One Mission. Watch. Predict. Protect.',
    ];

    let lineIndex = 0;
    let charIndex = 0;
    const typingSpeed = 50; // 50ms per character as specified
    const delayBetweenLines = 300; // delay after line completes before next line starts
    const processingDelay = 500; // artificial processing delay mentioned in spec

    const typeCharacter = () => {
      if (lineIndex < bootSequence.length) {
        const currentLine = bootSequence[lineIndex];
        
        if (charIndex < currentLine.length) {
          // Type one character
          setCurrentLineText(currentLine.substring(0, charIndex + 1));
          charIndex++;
          setTimeout(typeCharacter, typingSpeed);
        } else {
          // Line complete, add to terminal lines
          setTerminalLines((prev) => [...prev, currentLine]);
          setCurrentLineText('');
          charIndex = 0;
          lineIndex++;

          // Add processing delay after line 2 (after ANALYTICS line)
          const delayAfterThisLine = lineIndex === 3 ? processingDelay : delayBetweenLines;

          if (lineIndex < bootSequence.length) {
            setTimeout(typeCharacter, delayAfterThisLine);
          } else {
            // Boot sequence complete, reveal form
            setTimeout(() => setShowForm(true), delayAfterThisLine);
          }
        }
      }
    };

    // Start typing animation on mount
    setTimeout(typeCharacter, 300);

    return () => {
      // Cleanup any pending timeouts if needed
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await response.json();

      if (data.token) {
        saveToken(data.token);
        if (data.username) {
          saveUser({ username: data.username, user_id: data.user_id });
        }
        navigate('/');
      } else {
        setError('No authentication token received');
      }
    } catch (err) {
      console.error('[v0] Login error:', err);
      setError(err.message || 'Login failed. Ensure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-grid">
        {/* Left Side: Brand & Terminal */}
        <div className="login-left">
          <div className="brand-section">
            <div className="cerberus-logo">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
            </div>
            <h1 className="brand-title">CERBERUS</h1>
            <p className="brand-tagline">Three Heads. One Mission.<br />Watch. Predict. Protect.</p>
          </div>

          {/* Terminal Window */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-buttons">
                <span className="terminal-btn red"></span>
                <span className="terminal-btn yellow"></span>
                <span className="terminal-btn green"></span>
              </div>
              <span className="terminal-title">system_logs.terminal</span>
            </div>
            <div className="terminal-body">
              {terminalLines.map((line, idx) => (
                <div key={idx} className="terminal-line">
                  <span className="terminal-prompt">$</span> {line}
                </div>
              ))}
              {currentLineText && (
                <div className="terminal-line">
                  <span className="terminal-prompt">$</span> {currentLineText}<span className="terminal-cursor">_</span>
                </div>
              )}
              {currentLineText === '' && terminalLines.length > 0 && <div className="terminal-cursor">_</div>}
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-right">
          <div className={`login-card ${showForm ? 'visible' : 'hidden'}`}>
            <div className="login-card-inner">
              <h2 className="login-title">System Access</h2>
              <p className="login-subtitle">Authenticate to continue</p>

              {error && (
                <div className="error-alert">
                  <span className="error-icon">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    id="username"
                    type="text"
                    className="form-input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-button"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Authenticating...
                    </>
                  ) : (
                    'Access Dashboard'
                  )}
                </button>
              </form>

              <p className="login-footer">
                Enterprise monitoring platform v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
