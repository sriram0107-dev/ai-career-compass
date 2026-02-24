import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Users, BarChart3, Wrench, Lightbulb, Building2, Trees, MonitorSmartphone, GraduationCap, BookOpen, Hammer, Brain, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import AIAnalysisBox from '@/components/AIAnalysisBox';
import { analyzeInterests, AnalysisResult } from '@/utils/careerData';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';

const hints = [
  '"I love helping people and I\'m fascinated by the human body..."',
  '"I enjoy building things with code and solving complex puzzles..."',
  '"I\'m passionate about art, design, and creating visual experiences..."',
  '"I want to teach children and make education fun and engaging..."',
  '"I love nature, science experiments, and understanding how things work..."',
  '"I\'m interested in business, startups, and leading teams..."',
];

const Quiz = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { setAnalysisResult } = useUserData();
  const [text, setText] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [analysisResult, setLocalResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState<{ workStyle?: string; environment?: string; education?: string }>({});
  const section2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const interval = setInterval(() => setHintIndex(i => (i + 1) % hints.length), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const result = analyzeInterests(text, quizAnswers);
      setLocalResult(result);
      setAnalysisResult(result);
      setLoading(false);
    }, 1500);
  };

  const handleRefine = () => {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const result = analyzeInterests(text, quizAnswers);
      setLocalResult(result);
      setAnalysisResult(result);
      setLoading(false);
      navigate('/results', { state: { fromAnalysis: true } });
    }, 1000);
  };

  const scrollToQuiz = () => {
    setStep(2);
    setTimeout(() => section2Ref.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const workStyles = [
    { id: 'people', icon: Users, label: 'With people' },
    { id: 'data', icon: BarChart3, label: 'With data/systems' },
    { id: 'hands', icon: Wrench, label: 'With my hands' },
    { id: 'ideas', icon: Lightbulb, label: 'With ideas' },
  ];

  const environments = [
    { id: 'office', icon: Building2, label: 'Office/Indoor' },
    { id: 'clinical', icon: Sparkles, label: 'Clinical/Lab' },
    { id: 'outdoor', icon: Trees, label: 'Outdoor/Field' },
    { id: 'remote', icon: MonitorSmartphone, label: 'Flexible/Remote' },
  ];

  const educationOptions = [
    { id: 'university', icon: GraduationCap, label: 'University Degree' },
    { id: 'college', icon: BookOpen, label: 'College/Diploma' },
    { id: 'trade', icon: Hammer, label: 'Trade/Vocational' },
    { id: 'self', icon: Brain, label: 'Self-taught' },
  ];

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-10">
        {/* Section 1: Interest Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Discover Your <span className="gradient-text">Ideal Career</span></h1>
            <p className="text-muted-foreground">Tell us about your interests and we'll match you with careers</p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Describe what you're passionate about, what you enjoy doing, your hobbies, subjects you love, or what you imagine yourself doing in the future..."
              className="w-full h-40 bg-secondary rounded-xl p-4 text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border"
            />
            <p className="text-xs text-muted-foreground mt-2 h-5 italic transition-all">
              Example: {hints[hintIndex]}
            </p>
            <button onClick={handleAnalyze} disabled={loading || !text.trim()} className="mt-4 w-full gradient-bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {loading ? 'Analyzing...' : 'Analyze My Interests'}
            </button>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
              <AIAnalysisBox result={analysisResult} />
              <div className="flex flex-wrap gap-3">
                <button onClick={scrollToQuiz} className="flex-1 py-3 rounded-xl font-semibold border border-border hover:bg-secondary transition-colors text-sm">
                  Continue to Detailed Quiz
                </button>
                <button onClick={() => navigate('/results', { state: { fromAnalysis: true } })} className="flex-1 gradient-bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm">
                  Skip to Results
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Section 2: Quick Quiz */}
        {step === 2 && (
          <motion.div ref={section2Ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-center mb-2">Quick <span className="gradient-text">Questions</span></h2>
            <p className="text-muted-foreground text-center text-sm mb-8">For more precise results, answer these quick questions:</p>

            <div className="space-y-8">
              {/* Work Style */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">1. Work Style Preference</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {workStyles.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setQuizAnswers(p => ({ ...p, workStyle: id }))} className={`p-4 rounded-xl border text-center transition-all ${quizAnswers.workStyle === id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                      <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Environment */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">2. Work Environment</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {environments.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setQuizAnswers(p => ({ ...p, environment: id }))} className={`p-4 rounded-xl border text-center transition-all ${quizAnswers.environment === id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                      <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="font-semibold mb-4">3. Education Preference</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {educationOptions.map(({ id, icon: Icon, label }) => (
                    <button key={id} onClick={() => setQuizAnswers(p => ({ ...p, education: id }))} className={`p-4 rounded-xl border text-center transition-all ${quizAnswers.education === id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                      <Icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => setStep(1)} className="py-3 px-6 rounded-xl border border-border hover:bg-secondary text-sm">Back</button>
                <button onClick={() => navigate('/results', { state: { fromAnalysis: true } })} className="py-3 px-6 rounded-xl border border-border hover:bg-secondary text-sm flex-1">Skip to Results</button>
                <button onClick={handleRefine} className="py-3 px-6 rounded-xl gradient-bg-primary text-primary-foreground font-semibold hover:opacity-90 text-sm flex-1">See My Career Matches</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </PageTransition>
  );
};

export default Quiz;
