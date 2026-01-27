import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Giriş uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-orange-100">
          <div className="md:flex min-h-[600px]">
            {/* Left side - Login Form */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                {/* Logo Section */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl mb-4 shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                    <img
                      src="/Logo-2.png"
                      alt="Simba Logo"
                      className="w-16 h-16 object-contain filter brightness-110 drop-shadow-md"
                      onError={(e) => {
                        // Fallback to emoji if image not found
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent && !parent.querySelector('.emoji-fallback')) {
                          const fallback = document.createElement('span');
                          fallback.className = 'emoji-fallback text-5xl';
                          fallback.textContent = '🦁';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    Simba Oyuncaq Aləmi
                  </h1>
                  <h2 className="text-xl font-semibold text-gray-700 mb-1">Mağaza Sistemi</h2>
                </div>

                {/* Login Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg flex items-center gap-2 animate-shake">
                      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Username Field */}
                    <div className="group">
                      <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                        İstifadəçi Adı
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          id="username"
                          name="username"
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="İstifadəçi adınızı daxil edin"
                          className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-gray-900 placeholder-gray-400"
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="group">
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                        Şifrə
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Şifrənizi daxil edin"
                          className="block w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-gray-900 placeholder-gray-400"
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 focus:outline-none focus:ring-4 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Giriş edilir...</span>
                        </>
                      ) : (
                        <>
                          <span>Giriş Et</span>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Footer Text */}
                  <div className="text-center pt-4">
                    <p className="text-xs text-gray-500">
                      Sistemə giriş üçün məlumatlarınızı daxil edin
                    </p>
                  </div>
                </form>
              </div>
            </div>

            {/* Right side - Simba Mascot */}
            <div className="hidden md:flex w-full md:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent items-center justify-center p-8 relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>

              <div className="text-center relative z-10">
                <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
                  <img
                    src="/Simba.png"
                    alt="Simba Mascot"
                    className="w-full max-w-xs mx-auto drop-shadow-2xl filter brightness-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <h3 className="text-white text-2xl font-bold mb-2 drop-shadow-lg">
                  Xoş Gəlmisiniz! 👋
                </h3>
                <p className="text-white/90 text-base max-w-xs mx-auto leading-relaxed drop-shadow-md">
                  Simba Oyuncaq Mağazasının idarəetmə sisteminə xoş gəlmisiniz
                </p>

                {/* Feature badges */}
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-semibold">
                    📦 İnventar
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-semibold">
                    💰 POS
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-xs font-semibold">
                    📊 Hesabatlar
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

