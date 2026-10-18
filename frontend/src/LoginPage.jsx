
import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onLogin) {
      const success = onLogin(gmail, password);

      if (success) {
        console.log('Welcome to Dashboard!');
      } else {
        alert('Wrong Gmail or password!');
      }
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '20px',
        boxSizing: 'border-box',
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(16, 185, 129, 0.16), transparent 40%),
          radial-gradient(ellipse at 85% 80%, rgba(52, 211, 153, 0.13), transparent 40%),
          radial-gradient(ellipse at 75% 15%, rgba(5, 150, 105, 0.10), transparent 35%),
          #080D14
        `,
        color: '#F8FAFC',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* Emerald Glow Background */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          animation: floatGlow 8s ease-in-out infinite alternate;
        }

        .glow-orb-one {
          width: 280px;
          height: 280px;
          background: rgba(16, 185, 129, 0.19);
          top: -100px;
          left: -70px;
        }

        .glow-orb-two {
          width: 320px;
          height: 320px;
          background: rgba(5, 150, 105, 0.17);
          bottom: -130px;
          right: -70px;
          animation-delay: -4s;
        }

        .glow-orb-three {
          width: 180px;
          height: 180px;
          background: rgba(52, 211, 153, 0.10);
          top: 45%;
          right: 12%;
          animation-delay: -2s;
        }

        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 390px;
          padding: 36px 32px;
          border-radius: 20px;
          background: rgba(17, 25, 35, 0.84);
          border: 1px solid rgba(52, 211, 153, 0.22);
          box-shadow:
            0 0 35px rgba(16, 185, 129, 0.08),
            0 20px 70px rgba(0, 0, 0, 0.40),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .login-card:hover {
          border-color: rgba(52, 211, 153, 0.42);
          box-shadow:
            0 0 45px rgba(16, 185, 129, 0.13),
            0 20px 70px rgba(0, 0, 0, 0.40);
        }

        .login-input {
          width: 100%;
          padding: 12px 14px;
          margin-top: 8px;
          background: rgba(8, 13, 20, 0.85);
          border: 1px solid #344153;
          border-radius: 9px;
          color: #F8FAFC;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          transition: border-color 0.25s, box-shadow 0.25s;
        }

        .login-input:focus {
          border-color: #34D399;
          box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.12);
        }

        .login-input::placeholder {
          color: #64748B;
        }

        .login-button {
          width: 100%;
          margin-top: 4px;
          padding: 13px;
          border: 1px solid rgba(167, 243, 208, 0.3);
          border-radius: 9px;
          background: linear-gradient(135deg, #10B981, #34D399);
          color: #06251C;
          font-family: inherit;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
          box-shadow: 0 4px 18px rgba(16, 185, 129, 0.19);
        }

        .login-button:hover {
          transform: translateY(-2px);
          filter: brightness(1.08);
          box-shadow: 0 6px 28px rgba(16, 185, 129, 0.34);
        }

        .login-button:active {
          transform: translateY(0);
        }

        .eye-button {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          padding: 4px;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .eye-button:hover {
          color: #34D399;
        }

        @keyframes floatGlow {
          from {
            transform: translate(0, 0) scale(1);
          }
          to {
            transform: translate(25px, -20px) scale(1.12);
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 30px 24px;
          }

          .glow-orb-one {
            width: 200px;
            height: 200px;
          }

          .glow-orb-two {
            width: 220px;
            height: 220px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .glow-orb {
            animation: none;
          }

          .login-card,
          .login-input,
          .login-button {
            transition: none;
          }
        }
      `}</style>

      <div className="glow-orb glow-orb-one" />
      <div className="glow-orb glow-orb-two" />
      <div className="glow-orb glow-orb-three" />

      <div className="login-card">
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background:
                'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(52,211,153,0.05))',
              border: '1px solid rgba(52,211,153,0.30)',
              boxShadow: '0 0 25px rgba(16,185,129,0.12)',
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34D399"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="15" rx="3" />
              <path d="M16 5V3H6a3 3 0 0 0-3 3" />
              <path d="M16 12h5" />
              <circle cx="16" cy="12" r="1" />
            </svg>
          </div>
        </div>

        <h2
          style={{
            color: '#f3f1f3',
            margin: '0 0 10px',
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: 1.35,
            letterSpacing: '-0.8px',
            textAlign: 'center',
          }}
        >
          Financial Portfolio & <span style={{ color: '#f1f5f3' }}>Budget Tracker</span>
        </h2>

        <p
          style={{
            color: '#94A3B8',
            fontSize: '13px',
            lineHeight: 1.6,
            textAlign: 'center',
            margin: '0 0 28px',
          }}
        >

        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {/* Gmail Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="gmail"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#CBD5E1',
              }}
            >
              Gmail Address
            </label>

            <input
              id="gmail"
              type="email"
              value={gmail}
              onChange={(e) => setGmail(e.target.value)}
              placeholder="Your Gmail Account"
              autoComplete="email"
              required
              className="login-input"
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '26px' }}>
            <label
              htmlFor="password"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#CBD5E1',
              }}
            >
              Password
            </label>

            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="login-input"
                style={{ paddingRight: '45px' }}
              />

              <button
                type="button"
                className="eye-button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button type="submit" className="login-button">
            Login <span style={{ marginLeft: '5px' }}>→</span>
          </button>
        </form>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '7px',
            marginTop: '25px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              backgroundColor: '#34D399',
              borderRadius: '50%',
              boxShadow: '0 0 8px rgba(52,211,153,0.7)',
            }}
          />
          <span style={{ color: '#64748B', fontSize: '11px' }}>
            Your finances, organized in one place
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;