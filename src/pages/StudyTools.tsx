import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, RotateCcw, ChevronLeft, ChevronRight, Shuffle, Loader2, BookOpen, Upload, FileText, Type } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { generateFlashcards, FlashcardDeck, Flashcard } from '@/utils/flashcardGenerator';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

const extractPdfText = async (file: File): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  const maxPages = Math.min(pdf.numPages, 30);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return text;
};

const StudyTools = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'topic' | 'pdf'>('topic');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [decks, setDecks] = useState<FlashcardDeck[]>(() => {
    const saved = localStorage.getItem('flashcardDecks');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth');
  }, [isAuthenticated, navigate]);

  const handleGenerate = async () => {
    if (mode === 'topic' && !topic.trim()) return;
    if (mode === 'pdf' && !pdfFile) return;
    setLoading(true);
    try {
      let body: Record<string, string> = {};
      let deckTopic = topic;

      if (mode === 'pdf' && pdfFile) {
        toast({ title: 'Extracting PDF text...', description: 'Please wait while we read your document.' });
        const pdfText = await extractPdfText(pdfFile);
        if (!pdfText.trim()) {
          toast({ title: 'Could not extract text', description: 'The PDF may be scanned or image-based.', variant: 'destructive' });
          setLoading(false);
          return;
        }
        body = { pdfText };
        deckTopic = pdfFile.name.replace('.pdf', '');
      } else {
        body = { topic };
      }

      const { data, error } = await supabase.functions.invoke('ai-flashcards', { body });
      if (error) throw error;
      const deck: FlashcardDeck = {
        id: `deck-${Date.now()}`,
        topic: deckTopic,
        cards: (data.cards || []).map((c: { front: string; back: string }, i: number) => ({
          id: `card-${Date.now()}-${i}`,
          front: c.front,
          back: c.back,
          confidence: 'none' as const,
        })),
        lastStudied: new Date().toLocaleDateString(),
        createdAt: new Date().toLocaleDateString(),
      };
      const updated = [deck, ...decks];
      setDecks(updated);
      localStorage.setItem('flashcardDecks', JSON.stringify(updated));
      setTopic('');
      setPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('AI flashcards failed, falling back to local:', err);
      toast({ title: 'AI generation unavailable', description: 'Using local generator instead. Cards may be less detailed.', variant: 'destructive' });
      const deck = generateFlashcards(mode === 'pdf' && pdfFile ? pdfFile.name.replace('.pdf', '') : topic);
      const updated = [deck, ...decks];
      setDecks(updated);
      localStorage.setItem('flashcardDecks', JSON.stringify(updated));
      setTopic('');
      setPdfFile(null);
    } finally {
      setLoading(false);
    }
  };

  const openDeck = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCardIndex(0);
    setFlipped(false);
  };

  const setConfidence = (confidence: 'hard' | 'medium' | 'easy') => {
    if (!activeDeck) return;
    const updated = {
      ...activeDeck,
      cards: activeDeck.cards.map((c, i) => i === cardIndex ? { ...c, confidence } : c),
    };
    setActiveDeck(updated);
    setDecks(prev => {
      const newDecks = prev.map(d => d.id === updated.id ? updated : d);
      localStorage.setItem('flashcardDecks', JSON.stringify(newDecks));
      return newDecks;
    });
    // Auto-advance
    if (cardIndex < activeDeck.cards.length - 1) {
      setFlipped(false);
      setTimeout(() => setCardIndex(i => i + 1), 300);
    }
  };

  const shuffleCards = () => {
    if (!activeDeck) return;
    const shuffled = { ...activeDeck, cards: [...activeDeck.cards].sort(() => Math.random() - 0.5) };
    setActiveDeck(shuffled);
    setCardIndex(0);
    setFlipped(false);
  };

  const getDeckProgress = (deck: FlashcardDeck) => {
    const rated = deck.cards.filter(c => c.confidence !== 'none').length;
    return Math.round((rated / deck.cards.length) * 100);
  };

  if (activeDeck) {
    const card = activeDeck.cards[cardIndex];
    return (
      <PageTransition>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
          <button onClick={() => setActiveDeck(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="h-4 w-4" /> Back to decks
          </button>
          <h2 className="text-2xl font-bold mb-6">{activeDeck.topic}</h2>

          {/* Flashcard */}
          <div onClick={() => setFlipped(!flipped)} className="glass-card rounded-2xl p-8 min-h-[250px] flex items-center justify-center cursor-pointer hover:border-primary/30 transition-all relative">
            <div className="absolute top-3 right-3 text-xs text-muted-foreground">{cardIndex + 1}/{activeDeck.cards.length}</div>
            <p className="text-center text-lg">{flipped ? card.back : card.front}</p>
            <span className="absolute bottom-3 text-xs text-muted-foreground">{flipped ? 'Answer' : 'Click to flip'}</span>
          </div>

          {/* Confidence */}
          {flipped && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center gap-3 mt-4">
              <button onClick={() => setConfidence('hard')} className="px-6 py-2 rounded-lg bg-destructive/10 text-destructive font-medium text-sm hover:bg-destructive/20">🔴 Hard</button>
              <button onClick={() => setConfidence('medium')} className="px-6 py-2 rounded-lg bg-accent/10 text-accent font-medium text-sm hover:bg-accent/20">🟡 Medium</button>
              <button onClick={() => setConfidence('easy')} className="px-6 py-2 rounded-lg bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20">🟢 Easy</button>
            </motion.div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={() => { setCardIndex(i => Math.max(0, i - 1)); setFlipped(false); }} disabled={cardIndex === 0} className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-30">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={shuffleCards} className="p-2 rounded-lg border border-border hover:bg-secondary">
              <Shuffle className="h-5 w-5" />
            </button>
            <button onClick={() => { setCardIndex(i => Math.min(activeDeck.cards.length - 1, i + 1)); setFlipped(false); }} disabled={cardIndex === activeDeck.cards.length - 1} className="p-2 rounded-lg border border-border hover:bg-secondary disabled:opacity-30">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-2">AI <span className="gradient-text">Flashcard Generator</span></h1>
          <p className="text-muted-foreground text-sm mb-8">Generate study cards on any topic</p>

          <div className="glass-card rounded-xl p-6 max-w-xl mb-10">
            {/* Mode toggle */}
            <div className="flex rounded-lg bg-secondary p-1 mb-4">
              <button onClick={() => setMode('topic')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'topic' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
                <Type className="h-4 w-4" /> Topic
              </button>
              <button onClick={() => setMode('pdf')} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${mode === 'pdf' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
                <FileText className="h-4 w-4" /> Upload PDF
              </button>
            </div>

            {mode === 'topic' ? (
              <div className="flex gap-3">
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  placeholder="Enter any topic..."
                  className="flex-1 bg-secondary rounded-lg px-4 py-2.5 text-sm border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button onClick={handleGenerate} disabled={loading || !topic.trim()} className="gradient-bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type === 'application/pdf') setPdfFile(file);
                    else if (file) toast({ title: 'Invalid file', description: 'Please upload a PDF file.', variant: 'destructive' });
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-foreground font-medium">{pdfFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{dragging ? 'Drop your PDF here' : 'Drag & drop or click to upload a PDF'}</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file && file.type === 'application/pdf') setPdfFile(file);
                      else if (file) toast({ title: 'Invalid file', description: 'Please upload a PDF file.', variant: 'destructive' });
                    }}
                  />
                </div>
                <button onClick={handleGenerate} disabled={loading || !pdfFile} className="w-full gradient-bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate from PDF
                </button>
              </div>
            )}
          </div>

          {/* Decks grid */}
          <h2 className="text-xl font-bold mb-4">Your Decks</h2>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="glass-card rounded-xl p-5">
                  <Skeleton className="h-5 w-32 mb-3" />
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-20 mt-1" />
                </div>
              ))}
            </div>
          )}

          {!loading && decks.length === 0 ? (
            <div className="glass-card rounded-xl p-10 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No decks yet. Generate your first flashcard deck!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map(deck => (
                <div key={deck.id} onClick={() => openDeck(deck)} className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all">
                  <h3 className="font-semibold mb-2">{deck.topic}</h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{deck.cards.length} cards</span>
                    <span>Last studied: {deck.lastStudied}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full gradient-bg-primary rounded-full" style={{ width: `${getDeckProgress(deck)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{getDeckProgress(deck)}% completed</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
};

export default StudyTools;
