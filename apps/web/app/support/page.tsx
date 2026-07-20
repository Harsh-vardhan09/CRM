"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type Ticket = {
  id: number;
  customerNum: string;
  status: string;
  updatedAt: string;
};

type Message = {
  id: number;
  direction: 'inbound' | 'outbound';
  body: string;
  createdAt: string;
  subject?: string;
  sender?: string;
  recipient?: string;
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  roleName: string | null;
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replySubject, setReplySubject] = useState('');
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeChannel, setComposeChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [newCustomerNum, setNewCustomerNum] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessageBody, setNewMessageBody] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = 'http://localhost:5000/api';

  const checkAuthAndFetchData = async () => {
    try {
      // Fetch user profile
      const userRes = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
      if (userRes.status === 401 || userRes.status === 403) {
        setErrorStatus(userRes.status);
        return;
      }
      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user);
      }

      // Fetch tickets
      const res = await fetch(`${API_BASE}/support/tickets`, { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setErrorStatus(res.status);
        return;
      }
      if (res.ok) setTickets(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async () => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`${API_BASE}/support/tickets/${selectedTicketId}/messages`, { credentials: 'include' });
      if (res.status === 401 || res.status === 403) {
        setErrorStatus(res.status);
        return;
      }
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAuthAndFetchData();
    const interval = setInterval(() => {
      if (errorStatus === null) checkAuthAndFetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [errorStatus]);

  useEffect(() => {
    if (selectedTicketId) {
      fetchMessages();
      const interval = setInterval(() => {
        if (errorStatus === null) fetchMessages();
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [selectedTicketId, errorStatus]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicketId) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/support/tickets/${selectedTicketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ body: replyText, channel: activeTab, subject: replySubject }),
      });

      if (res.status === 401 || res.status === 403) {
        setErrorStatus(res.status);
        return;
      }

      if (res.ok) {
        setReplyText('');
        setReplySubject('');
        fetchMessages();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to send reply.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending reply.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerNum.trim() || !newMessageBody.trim()) return;
    if (composeChannel === 'email' && !newSubject.trim()) return;

    setLoading(true);
    
    try {
      const res = await fetch(`${API_BASE}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customerNum: newCustomerNum, body: newMessageBody, channel: composeChannel, subject: newSubject }),
      });

      if (res.status === 401 || res.status === 403) {
        setErrorStatus(res.status);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setIsComposeOpen(false);
        setNewCustomerNum('');
        setNewMessageBody('');
        setNewSubject('');
        
        // Auto-switch to the appropriate tab based on the new ticket's channel
        setActiveTab(composeChannel);
        
        await checkAuthAndFetchData();
        setSelectedTicketId(data.ticket.id);
      } else {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          alert(errorData.message || 'Failed to start conversation.');
        } else {
          alert('Failed to start conversation. Server returned an error page (Did you restart your backend?).');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error starting conversation.');
    } finally {
      setLoading(false);
    }
  };

  if (errorStatus === 401 || errorStatus === 403) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="max-w-md w-full backdrop-blur-xl bg-slate-900/60 shadow-xl rounded-2xl p-8 text-center border border-slate-800">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-10a4 4 0 110 8 4 4 0 010-8z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-200 mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">You do not have permission to access the Support Module. Please contact your administrator if you need access.</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-500 hover:bg-indigo-600 transition-colors shadow-md">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans overflow-hidden text-slate-200 relative">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      
      {/* Left Pane - Tickets List */}
      <div className="w-1/3 max-w-sm bg-slate-900/60 border-r border-slate-800 flex flex-col shadow-xl z-10 backdrop-blur-md">
        <div className="p-6 border-b border-slate-800 flex flex-col bg-slate-900/80">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 mb-4 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-100">Support Hub</h2>
            <div className="flex space-x-2 items-center">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full shadow-sm">{tickets.filter(t => activeTab === 'email' ? t.customerNum.includes('@') : !t.customerNum.includes('@')).length} Open</span>
              <button onClick={() => setIsComposeOpen(true)} className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-indigo-500 rounded-md transition-colors" title="New Conversation">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
          <div className="flex border-b border-slate-700">
            <button 
              onClick={() => { setActiveTab('whatsapp'); setSelectedTicketId(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'whatsapp' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              WhatsApp
            </button>
            <button 
              onClick={() => { setActiveTab('email'); setSelectedTicketId(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === 'email' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Email
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tickets.filter(t => activeTab === 'email' ? t.customerNum.includes('@') : !t.customerNum.includes('@')).map(ticket => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className={`p-5 border-b border-slate-800/50 cursor-pointer transition-all duration-200 ${
                selectedTicketId === ticket.id 
                  ? 'bg-slate-800/80 border-l-4 border-l-indigo-500' 
                  : 'hover:bg-slate-800/40 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-slate-200 truncate">{ticket.customerNum}</span>
                <span className="text-xs text-slate-400 font-medium bg-slate-900 border border-slate-700 px-2 py-1 rounded-md">
                  {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-sm text-slate-400 capitalize">{ticket.status}</p>
              </div>
            </div>
          ))}
          {tickets.filter(t => activeTab === 'email' ? t.customerNum.includes('@') : !t.customerNum.includes('@')).length === 0 && (
            <div className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-slate-900/50 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <h3 className="text-slate-300 font-medium">Inbox Zero</h3>
              <p className="text-slate-500 text-sm mt-1">No open tickets right now.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-950/50 relative">
        {selectedTicketId ? (
          <>
            {/* Chat Header */}
            <div className="h-20 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shadow-sm sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {tickets.find(t => t.id === selectedTicketId)?.customerNum.substring(1, 3)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    {tickets.find(t => t.id === selectedTicketId)?.customerNum}
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                    {tickets.find(t => t.id === selectedTicketId)?.customerNum.includes('@') ? 'Email Active' : 'WhatsApp Active'}
                  </p>
                </div>
                </div>
              </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-sm relative group ${
                      msg.direction === 'outbound'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-[11px] mt-2 font-medium flex items-center justify-end space-x-1 ${msg.direction === 'outbound' ? 'text-indigo-200' : 'text-slate-400'}`}>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.direction === 'outbound' && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat / Email Input */}
            {activeTab === 'email' ? (
              <div className="p-6 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 flex flex-col space-y-3">
                <input
                  type="text"
                  placeholder={`Subject (Default: ${[...messages].reverse().find(m => m.subject)?.subject?.startsWith('Re:') ? [...messages].reverse().find(m => m.subject)?.subject : `Re: ${[...messages].reverse().find(m => m.subject)?.subject || `Support Ticket #${selectedTicketId}`}`})`}
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-200 bg-slate-950 placeholder-slate-500 transition-colors font-medium"
                />
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-200 bg-slate-950 resize-none placeholder-slate-500 transition-colors"
                  placeholder="Type your email reply..."
                  rows={5}
                  disabled={loading}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSendReply}
                    disabled={loading || !replyText.trim()}
                    className="px-6 py-2 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {loading ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
                <div className="max-w-4xl mx-auto flex flex-col space-y-2">
                  <div className="flex items-end space-x-3">
                  {/* Agent Avatar */}
                  <div className="hidden sm:flex flex-col items-center justify-end pb-1">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="Agent" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-300 font-bold text-sm bg-gradient-to-tr from-indigo-500 to-violet-500 w-full h-full flex items-center justify-center">{currentUser?.name?.charAt(0) || 'A'}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 relative">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      className="w-full pl-5 pr-14 py-3 border border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-slate-200 bg-slate-800/80 resize-none placeholder-slate-500 transition-colors"
                      placeholder="Type a message... (Press Enter to send)"
                      rows={1}
                      disabled={loading}
                      style={{ minHeight: '52px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={loading || !replyText.trim()}
                      className="absolute right-2 bottom-2 p-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center shadow-md shadow-indigo-500/20"
                    >
                      {loading ? (
                         <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5 translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      )}
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-transparent">
            <div className="w-24 h-24 mb-6 text-slate-700">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-300">Select a conversation</h2>
            <p className="mt-2 text-sm text-slate-500">Choose a ticket from the sidebar to start chatting</p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-100">New Conversation</h3>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6">
              <div className="space-y-4">
                <div className="flex border border-slate-700 rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setComposeChannel('whatsapp')} className={`flex-1 py-2 text-sm font-medium transition-colors ${composeChannel === 'whatsapp' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>WhatsApp</button>
                  <button type="button" onClick={() => setComposeChannel('email')} className={`flex-1 py-2 text-sm font-medium transition-colors ${composeChannel === 'email' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Email</button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{composeChannel === 'email' ? 'Email Address' : 'WhatsApp Number'}</label>
                  <input
                    type={composeChannel === 'email' ? 'email' : 'text'}
                    required
                    placeholder={composeChannel === 'email' ? "customer@example.com" : "+1234567890"}
                    value={newCustomerNum}
                    onChange={(e) => setNewCustomerNum(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 placeholder-slate-600"
                  />
                  {composeChannel === 'whatsapp' && <p className="mt-1 text-xs text-slate-500">Include country code (e.g. +1234567890)</p>}
                </div>
                {composeChannel === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Ticket Subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 placeholder-slate-600"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Initial Message</label>
                  <textarea
                    required
                    placeholder="Type your message here..."
                    value={newMessageBody}
                    onChange={(e) => setNewMessageBody(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-200 placeholder-slate-600 resize-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsComposeOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
