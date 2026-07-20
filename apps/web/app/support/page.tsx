"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import { Mail, MessageSquare, Plus, Send, X, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
          alert('Failed to start conversation. Server returned an error page.');
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
      <div className="flex h-screen w-full items-center justify-center bg-ivory-50 text-ink-text p-6">
        <div className="max-w-md w-full bg-white shadow-editorial rounded-xl p-8 text-center border border-ivory-border">
          <div className="w-16 h-16 bg-brick/10 text-brick rounded-full flex items-center justify-center mx-auto mb-4 border border-brick/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-serif text-ink-text mb-2">Access Denied</h2>
          <p className="text-sm text-muted-ivory mb-6">You do not have permission to access the Support Module. Please contact your administrator if you need access.</p>
          <Link href="/" className="inline-flex items-center justify-center rounded-lg bg-ink-text px-5 py-3 text-sm font-medium text-ivory-text transition-colors hover:bg-ink-800">
            Return to Workspace
          </Link>
        </div>
      </div>
    );
  }

  const filteredTickets = tickets.filter(t => activeTab === 'email' ? t.customerNum.includes('@') : !t.customerNum.includes('@'));

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-ivory-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif tracking-tight text-ink-text">Support Hub</h1>
            <p className="text-xs text-muted-ivory font-mono uppercase tracking-wide">
              {filteredTickets.length} active tickets · {activeTab} channel
            </p>
          </div>

          <button
            onClick={() => setIsComposeOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brass px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-white transition-colors hover:bg-brass-hover active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        {/* Messaging Box Panel */}
        <div className="bg-white border border-ivory-border rounded-xl shadow-editorial flex h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden">
          
          {/* Inbox Sidebar (Tickets List) */}
          <div className="w-80 border-r border-ivory-border flex flex-col bg-ivory-50/50">
            {/* Tabs */}
            <div className="flex border-b border-ivory-border bg-white">
              <button 
                onClick={() => { setActiveTab('whatsapp'); setSelectedTicketId(null); }}
                className={`flex-1 py-3 text-xs font-mono uppercase tracking-wide transition-colors border-b-2 ${
                  activeTab === 'whatsapp' 
                    ? 'text-brass border-brass font-bold' 
                    : 'text-muted-ivory border-transparent hover:text-ink-text'
                }`}
              >
                WhatsApp
              </button>
              <button 
                onClick={() => { setActiveTab('email'); setSelectedTicketId(null); }}
                className={`flex-1 py-3 text-xs font-mono uppercase tracking-wide transition-colors border-b-2 ${
                  activeTab === 'email' 
                    ? 'text-brass border-brass font-bold' 
                    : 'text-muted-ivory border-transparent hover:text-ink-text'
                }`}
              >
                Email
              </button>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto divide-y divide-ivory-border">
              {filteredTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 cursor-pointer transition-colors relative ${
                    selectedTicketId === ticket.id 
                      ? 'bg-white border-l-2 border-brass' 
                      : 'hover:bg-ivory-100/50 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-ink-text truncate max-w-[70%]">{ticket.customerNum}</span>
                    <span className="text-[10px] font-mono text-muted-ivory">
                      {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-ivory">{ticket.status}</span>
                  </div>
                </div>
              ))}

              {filteredTickets.length === 0 && (
                <div className="p-12 flex flex-col items-center text-center justify-center h-full">
                  <div className="w-12 h-12 bg-white border border-ivory-border rounded-full flex items-center justify-center mb-4 text-muted-ivory shadow-editorial">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-ink-text text-sm font-semibold">Inbox Zero</h3>
                  <p className="text-muted-ivory text-xs mt-1">No open tickets right now.</p>
                </div>
              )}
            </div>
          </div>

          {/* Conversation Chat pane */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedTicketId ? (
              <>
                {/* Chat Panel Header */}
                <div className="h-16 px-6 border-b border-ivory-border flex items-center justify-between bg-ivory-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ivory-100 border border-ivory-border flex items-center justify-center text-xs font-bold text-ink-text font-serif">
                      {tickets.find(t => t.id === selectedTicketId)?.customerNum.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-ink-text">
                        {tickets.find(t => t.id === selectedTicketId)?.customerNum}
                      </h3>
                      <p className="text-[10px] text-moss font-mono uppercase tracking-wider flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-moss rounded-full"></span>
                        Active Session
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-lg text-xs leading-relaxed relative ${
                          msg.direction === 'outbound'
                            ? 'bg-brass text-white shadow-editorial rounded-tr-none'
                            : 'bg-ivory-100 text-ink-text border border-ivory-border rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <p className={`text-[9px] mt-1.5 font-mono text-right flex items-center justify-end gap-1 ${
                          msg.direction === 'outbound' ? 'text-white/80' : 'text-muted-ivory'
                        }`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply panel */}
                <div className="p-4 bg-ivory-50 border-t border-ivory-border">
                  <div className="flex flex-col gap-2">
                    {activeTab === 'email' && (
                      <input
                        type="text"
                        placeholder="Subject..."
                        value={replySubject}
                        onChange={(e) => setReplySubject(e.target.value)}
                        className="w-full rounded-lg border border-ivory-border bg-white px-4 py-2 text-xs text-ink-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                      />
                    )}
                    
                    <div className="flex items-end gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        className="flex-grow rounded-lg border border-ivory-border bg-white px-4 py-3 text-xs text-ink-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30 resize-none min-h-[52px] max-h-[120px]"
                        placeholder={activeTab === 'email' ? "Type email response..." : "Type message... (Press Enter to send)"}
                        rows={1}
                        disabled={loading}
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={loading || !replyText.trim()}
                        className="rounded-lg bg-ink-text px-4 py-3 text-white transition-colors hover:bg-ink-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 self-stretch"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Send className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-ivory bg-white">
                <div className="w-16 h-16 mb-4 text-ivory-100 flex items-center justify-center border border-ivory-border rounded-full bg-ivory-50 shadow-editorial">
                  <MessageSquare className="w-6 h-6 text-muted-ivory" />
                </div>
                <h2 className="text-sm font-semibold text-ink-text">Select a conversation</h2>
                <p className="text-xs text-muted-ivory mt-1">Choose a ticket from the sidebar to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal - Ink 900 */}
      <AnimatePresence>
        {isComposeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
            onClick={() => setIsComposeOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-ink-900 border border-ink-border rounded-2xl p-8 shadow-2xl text-ivory-text space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-ink-border pb-4">
                <h3 className="text-lg font-serif text-ivory-text">New Conversation</h3>
                <button onClick={() => setIsComposeOpen(false)} className="text-muted-ink hover:text-ivory-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="flex border border-ink-border rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setComposeChannel('whatsapp')} className={`flex-1 py-2 text-xs font-mono uppercase tracking-wide transition-colors ${composeChannel === 'whatsapp' ? 'bg-brass text-white' : 'bg-ink-850 text-muted-ink hover:bg-ink-800'}`}>WhatsApp</button>
                  <button type="button" onClick={() => setComposeChannel('email')} className={`flex-1 py-2 text-xs font-mono uppercase tracking-wide transition-colors ${composeChannel === 'email' ? 'bg-brass text-white' : 'bg-ink-850 text-muted-ink hover:bg-ink-800'}`}>Email</button>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">{composeChannel === 'email' ? 'Email Address' : 'WhatsApp Number'}</label>
                  <input
                    type={composeChannel === 'email' ? 'email' : 'text'}
                    required
                    placeholder={composeChannel === 'email' ? "customer@example.com" : "+1234567890"}
                    value={newCustomerNum}
                    onChange={(e) => setNewCustomerNum(e.target.value)}
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  />
                  {composeChannel === 'whatsapp' && <p className="mt-1.5 text-[10px] text-muted-ink font-mono">Include country code (e.g. +1234567890)</p>}
                </div>
                {composeChannel === 'email' && (
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Ticket Subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Initial Message</label>
                  <textarea
                    required
                    placeholder="Type your message here..."
                    value={newMessageBody}
                    onChange={(e) => setNewMessageBody(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t border-ink-border">
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98] disabled:opacity-50">
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                  <button type="button" onClick={() => setIsComposeOpen(false)} className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
