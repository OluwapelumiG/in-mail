'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import { messageApi, Message } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function MessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showRaw, setShowRaw] = useState(false);
  const [showHeaders, setShowHeaders] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const limit = 50;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    loadMessages();
  }, [router, page]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageApi.list({
        limit,
        offset: (page - 1) * limit,
      });
      setMessages(response.messages);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Load full message details when selected
  const handleMessageClick = async (message: Message) => {
    // If message already has full content loaded (check if raw_content or headers exist, as they're only in full details)
    if (message.raw_content !== undefined || message.headers !== undefined) {
      setSelectedMessage(message);
      setShowRaw(false);
      setShowHeaders(false);
      return;
    }

    // Otherwise, load full details
    try {
      setLoadingMessage(true);
      const fullMessage = await messageApi.get(message.id);
      setSelectedMessage(fullMessage);
      setShowRaw(false);
      setShowHeaders(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load message details');
    } finally {
      setLoadingMessage(false);
    }
  };

  // Reset view when message changes
  useEffect(() => {
    if (selectedMessage) {
      setShowRaw(false);
      setShowHeaders(false);
    }
  }, [selectedMessage]);

  // Determine which content to display (HTML preferred, fallback to text)
  const getDisplayContent = () => {
    if (!selectedMessage) return null;
    if (showRaw) {
      return { type: 'raw', content: selectedMessage.raw_content || '(No raw content)' };
    }
    if (selectedMessage.html_body && selectedMessage.html_body.trim() && selectedMessage.html_body !== '"') {
      return { type: 'html', content: selectedMessage.html_body };
    }
    if (selectedMessage.text_body && selectedMessage.text_body.trim() && selectedMessage.text_body !== '"') {
      return { type: 'text', content: selectedMessage.text_body };
    }
    return { type: 'empty', content: 'No content available' };
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await messageApi.delete(id);
      loadMessages();
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'permanent':
        return 'bg-red-100 text-red-800';
      case 'temporary':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-full mx-auto py-4 sm:px-4 lg:px-6">
          {error && (
            <div className="mb-4 mx-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 bg-white shadow-lg rounded-lg overflow-hidden mx-4">
              {/* Messages List - Email-like sidebar */}
              <div className="lg:col-span-1 border-r border-gray-200 bg-gray-50">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
                    <button
                      onClick={loadMessages}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                      title="Refresh"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {total} message{total !== 1 ? 's' : ''}
                  </p>
                </div>
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>No messages</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        onClick={() => handleMessageClick(message)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'bg-indigo-50 border-l-4 border-indigo-600'
                            : 'hover:bg-gray-100 border-l-4 border-transparent'
                        } ${loadingMessage && selectedMessage?.id === message.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {message.from.split('@')[0] || message.from}
                              </p>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(message.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate mb-1">
                              {message.subject || '(No Subject)'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {selectedMessage?.id === message.id && (message.text_body || message.html_body)
                                ? (message.text_body?.substring(0, 60) || message.html_body?.replace(/<[^>]*>/g, '').substring(0, 60) || 'No preview') + 
                                  ((message.text_body?.length || message.html_body?.length || 0) > 60 ? '...' : '')
                                : 'Click to view message'}
                            </p>
                          </div>
                          {message.attachments && message.attachments.length > 0 && (
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-3 border-t border-gray-200 bg-white flex justify-between items-center">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Message Detail - Email-like view */}
              <div className="lg:col-span-2 bg-white">
                {selectedMessage ? (
                  <>
                    {/* Email Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
                            {selectedMessage.subject || '(No Subject)'}
                          </h1>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">From:</span>
                              <span>{selectedMessage.from}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">To:</span>
                              <span>{selectedMessage.to}</span>
                            </div>
                            <div className="text-gray-400">
                              {formatDate(selectedMessage.received_at)}
                            </div>
                          </div>
                          {selectedMessage.cc && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">CC:</span> {selectedMessage.cc}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              selectedMessage.status
                            )}`}
                          >
                            {selectedMessage.status}
                          </span>
                          <button
                            onClick={() => handleDelete(selectedMessage.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="p-6">
                      {showRaw ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-700">Raw Email Content</h3>
                            <button
                              onClick={() => setShowRaw(false)}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              Close
                            </button>
                          </div>
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto max-h-96 overflow-y-auto">
                            {selectedMessage.raw_content || '(No raw content)'}
                          </pre>
                        </div>
                      ) : (
                        <>
                          {/* Headers Toggle */}
                          {selectedMessage.headers && (
                            <div className="mb-4">
                              <button
                                onClick={() => setShowHeaders(!showHeaders)}
                                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                {showHeaders ? (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                                {showHeaders ? 'Hide' : 'Show'} headers
                              </button>
                              {showHeaders && (
                                <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
                                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                    {selectedMessage.headers}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Email Content - Modern email styling */}
                          <div className="email-content">
                            {(() => {
                              const display = getDisplayContent();
                              if (display?.type === 'html') {
                                return (
                                  <div
                                    className="prose prose-sm max-w-none text-gray-900"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: display.content }}
                                  />
                                );
                              } else if (display?.type === 'text') {
                                return (
                                  <div
                                    className="text-gray-900 whitespace-pre-wrap"
                                    style={{
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                      fontSize: '14px',
                                      lineHeight: '1.6',
                                    }}
                                  >
                                    {display.content}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-center text-gray-500 py-12">
                                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <p>{display?.content || 'No content available'}</p>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </>
                      )}

                      {/* Attachments */}
                      {!showRaw && selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            {selectedMessage.attachments.length} Attachment{selectedMessage.attachments.length !== 1 ? 's' : ''}
                          </h3>
                          <div className="space-y-2">
                            {selectedMessage.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded flex items-center justify-center">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{attachment.filename}</p>
                                    <p className="text-xs text-gray-500">
                                      {(attachment.size / 1024).toFixed(2)} KB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const token = localStorage.getItem('token');
                                    fetch(messageApi.getAttachmentUrl(attachment.message_id, attachment.id), {
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                    })
                                      .then((res) => res.blob())
                                      .then((blob) => {
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = attachment.filename;
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        document.body.removeChild(a);
                                      })
                                      .catch((err) => {
                                        console.error('Download failed:', err);
                                        alert('Failed to download attachment');
                                      });
                                  }}
                                  className="ml-4 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                                >
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw Content Link */}
                      {!showRaw && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowRaw(true)}
                            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            Preview raw email
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-500">Select a message to view</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </>
  );
}

