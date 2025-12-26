'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { configApi, userApi, User } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDockerPassword, setShowDockerPassword] = useState(false);
  const [showHostPassword, setShowHostPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [userData, configData] = await Promise.all([
          userApi.getCurrentUser(),
          configApi.get().catch(() => null), // May fail if not root
        ]);
        setUser(userData);
        setConfig(configData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const smtpPort = config?.smtp_port || 1025;
  
  // URLs for different environments - from environment variables
  const dockerUrls = {
    api: process.env.NEXT_PUBLIC_DOCKER_API_URL || 'http://api.inmail.local:8080',
    smtp: process.env.NEXT_PUBLIC_DOCKER_SMTP_HOST || 'api.inmail.local',
    web: process.env.NEXT_PUBLIC_DOCKER_WEB_URL || 'http://web.inmail.local:3000'
  };
  
  const hostUrls = {
    api: process.env.NEXT_PUBLIC_HOST_API_URL || 'http://localhost:8080',
    smtp: process.env.NEXT_PUBLIC_HOST_SMTP_HOST || 'localhost',
    web: process.env.NEXT_PUBLIC_HOST_WEB_URL || 'http://localhost:3000',
    proxy: process.env.NEXT_PUBLIC_PROXY_URL || 'http://inmail.local'
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {user && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* SMTP Credentials Card - Docker Container Access */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">SMTP Credentials</h2>
                  <p className="text-sm text-gray-500 mb-4">For applications running in Docker containers</p>
                  
                  <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md">
                    <p className="text-xs font-semibold text-indigo-800 mb-1">🐳 Docker Container Access</p>
                    <p className="text-xs text-indigo-700">Use these URLs when your app runs in a Docker container on the inmail-network</p>
                  </div>
                  
                  {/* <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs font-semibold text-blue-800 mb-1">🔐 SMTP Authentication</p>
                    <p className="text-xs text-blue-700">These credentials are used for SMTP AUTH (PLAIN/LOGIN). Use the username and password below when configuring your email client or application.</p>
                  </div> */}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={dockerUrls.smtp}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(dockerUrls.smtp);
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={smtpPort}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(smtpPort));
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">API URL</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={dockerUrls.api}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(dockerUrls.api);
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={user.username}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.username);
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type={showDockerPassword ? "text" : "password"}
                          readOnly
                          value={user.role === 'root' && config?.root_password ? config.root_password : '••••••••'}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm font-mono"
                        />
                        <button
                          onClick={() => setShowDockerPassword(!showDockerPassword)}
                          className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                          title={showDockerPassword ? "Hide password" : "Show password"}
                        >
                          {showDockerPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                        <button
                          onClick={() => {
                            const password = user.role === 'root' && config?.root_password ? config.root_password : '';
                            if (password) {
                              navigator.clipboard.writeText(password);
                            }
                          }}
                          disabled={!(user.role === 'root' && config?.root_password)}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Copy
                        </button>
                      </div>
                      {user.role !== 'root' && (
                        <p className="mt-1 text-xs text-gray-500">Password cannot be displayed (stored securely as hash). Use the password that was set when your account was created. Contact admin if you need to reset it.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mailbox Name</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={user.mailbox_name}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.mailbox_name);
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMTP Credentials Card - Host Machine Access */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">SMTP Credentials</h2>
                  <p className="text-sm text-gray-500 mb-4">For applications running on your host machine</p>
                  
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs font-semibold text-green-800 mb-1">💻 Host Machine Access</p>
                    <p className="text-xs text-green-700">Use these URLs when your app runs directly on your Mac/PC</p>
                  </div>
                  
                  {/* <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs font-semibold text-blue-800 mb-1">🔐 SMTP Authentication</p>
                    <p className="text-xs text-blue-700">These credentials are used for SMTP AUTH (PLAIN/LOGIN). Use the username and password below when configuring your email client or application.</p>
                  </div> */}
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={hostUrls.smtp}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(hostUrls.smtp);
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={smtpPort}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(smtpPort));
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">API URL</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={hostUrls.api}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(hostUrls.api);
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={user.username}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.username);
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Password</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type={showHostPassword ? "text" : "password"}
                          readOnly
                          value={user.role === 'root' && config?.root_password ? config.root_password : '••••••••'}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm font-mono"
                        />
                        <button
                          onClick={() => setShowHostPassword(!showHostPassword)}
                          className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                          title={showHostPassword ? "Hide password" : "Show password"}
                        >
                          {showHostPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                        <button
                          onClick={() => {
                            const password = user.role === 'root' && config?.root_password ? config.root_password : '';
                            if (password) {
                              navigator.clipboard.writeText(password);
                            }
                          }}
                          disabled={!(user.role === 'root' && config?.root_password)}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Copy
                        </button>
                      </div>
                      {user.role !== 'root' && (
                        <p className="mt-1 text-xs text-gray-500">Password cannot be displayed (stored securely as hash). Use the password that was set when your account was created. Contact admin if you need to reset it.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mailbox Name</label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          readOnly
                          value={user.mailbox_name}
                          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 bg-gray-50 text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.mailbox_name);
                          }}
                          className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

