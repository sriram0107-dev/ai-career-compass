import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, MessageSquare, Search, Sparkles, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const DocumentTools = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<'summarize' | 'ask'>('summarize');
  const [option, setOption] = useState<'summary' | 'keyTerms' | 'studyGuide'>('summary');
  const [documentText, setDocumentText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{ title: string; points: string[]; terms: string[]; actions: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth');
  }, [isAuthenticated, navigate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDocumentText(ev.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleSummarize = async () => {
    if (!documentText.trim()) return;
    setLoading(true);
    setShowResult(false);
    try {
      const { data, error } = await supabase.functions.invoke('ai-document', {
        body: { action: 'summarize', documentText, option },
      });
      if (error) throw error;
      setResult(data);
      setShowResult(true);
    } catch (err) {
      console.error('Summarize failed:', err);
      toast({ title: 'Analysis failed', description: 'Could not analyze document. Please try again.', variant: 'destructive' });
      setResult({ title: 'Error', points: ['Failed to analyze document. Please try again.'], terms: [], actions: [] });
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !documentText.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-document', {
        body: { action: 'chat', documentText, chatHistory, question: userMsg },
      });
      if (error) throw error;
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err) {
      toast({ title: 'Chat error', description: 'Failed to get a response. Please try again.', variant: 'destructive' });
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">Document <span className="gradient-text">Tools</span></h1>
          <p className="text-muted-foreground text-sm mb-8">AI-powered document analysis and Q&A</p>

          {/* Tabs */}
          <div className="flex rounded-lg bg-secondary p-1 mb-8 max-w-md">
            <button onClick={() => setTab('summarize')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${tab === 'summarize' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
              <FileText className="h-4 w-4" /> Summarize
            </button>
            <button onClick={() => setTab('ask')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${tab === 'ask' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
              <MessageSquare className="h-4 w-4" /> Ask AI
            </button>
          </div>

          {/* Document Input */}
          <div className="max-w-3xl mb-6">
            <div className="glass-card rounded-2xl p-6 border-dashed border-2 border-border hover:border-primary/30 transition-colors mb-4">
              <textarea
                value={documentText}
                onChange={e => setDocumentText(e.target.value)}
                placeholder="Paste your document text here, or upload a text file below..."
                className="w-full h-32 bg-secondary rounded-xl p-4 text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border mb-3"
              />
              <div className="flex items-center gap-3">
                <label className="cursor-pointer gradient-bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2">
                  <Upload className="h-4 w-4" /> Upload .txt File
                  <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                </label>
                {documentText && <span className="text-xs text-muted-foreground">{documentText.length} characters loaded</span>}
              </div>
            </div>
          </div>

          {tab === 'summarize' ? (
            <div className="max-w-3xl">
              {/* Options */}
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { key: 'summary' as const, label: 'Summarize for my career path' },
                  { key: 'keyTerms' as const, label: 'Extract key terms' },
                  { key: 'studyGuide' as const, label: 'Create study guide' },
                ].map(o => (
                  <button key={o.key} onClick={() => setOption(o.key)} className={`px-4 py-2 rounded-lg text-sm transition-all ${option === o.key ? 'gradient-bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                    {o.label}
                  </button>
                ))}
              </div>

              <button onClick={handleSummarize} disabled={loading || !documentText.trim()} className="gradient-bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold hover:opacity-90 flex items-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {loading ? 'Analyzing...' : 'Summarize'}
              </button>

              {/* Result */}
              {loading && !showResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 mt-6 space-y-4">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="space-y-2">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-4 w-full" />)}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}
                  </div>
                </motion.div>
              )}
              {showResult && result && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 mt-6">
                  <h3 className="font-bold text-lg mb-4">{result.title}</h3>
                  <div className="space-y-4">
                    {result.points.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Key Points</h4>
                        <ul className="space-y-2">
                          {result.points.map((p, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.terms.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Key Terms</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {result.terms.map(t => (
                            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.actions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Action Items</h4>
                        <ul className="space-y-1">
                          {result.actions.map((a, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="text-accent">✓</span> {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl">
              {/* Chat */}
              <div className="glass-card rounded-xl p-6 mb-4 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4">
                {chatHistory.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-10">Paste a document above, then ask questions about it here.</p>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'ai' && <div className="h-8 w-8 rounded-full gradient-bg-primary flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-primary-foreground" /></div>}
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-primary/10 text-foreground' : 'bg-secondary text-foreground'}`}>
                      {msg.text}
                    </div>
                    {msg.role === 'user' && <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0"><UserIcon className="h-4 w-4" /></div>}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full gradient-bg-primary flex items-center justify-center flex-shrink-0"><Bot className="h-4 w-4 text-primary-foreground" /></div>
                    <div className="p-3 rounded-xl bg-secondary"><Loader2 className="h-4 w-4 animate-spin" /></div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder="Ask about your document..."
                  disabled={!documentText.trim()}
                  className="flex-1 bg-secondary rounded-lg px-4 py-2.5 text-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <button onClick={handleChat} disabled={chatLoading || !chatInput.trim() || !documentText.trim()} className="gradient-bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50">
                  <Search className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ask: "What are the key takeaways?", "Explain the methodology", "Create a quiz from this document"</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
};

export default DocumentTools;
