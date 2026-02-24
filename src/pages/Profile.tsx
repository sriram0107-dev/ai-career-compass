import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, Target, ArrowRight, Zap, CheckCircle, Clock, TrendingUp, Download, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { points, level, tasksCompleted, studyHours, selectedCareer, analysisResult, badges, savedCareers } = useUserData();

  useEffect(() => {
    if (!isAuthenticated) navigate('/auth');
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const skills = selectedCareer?.skills || ['Critical Thinking', 'Communication', 'Problem Solving', 'Research', 'Teamwork'];
  const skillProgress = skills.map((s, i) => ({
    name: s,
    percentage: Math.min(100, Math.round((tasksCompleted / (i + 2)) * 25)),
  }));

  const alternativeCareers = analysisResult?.careers.slice(1, 4) || [];

  return (
    <PageTransition>
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="glass-card rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="h-20 w-20 rounded-full gradient-bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
              {user.name[0]}
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-start mt-1">
                <Calendar className="h-4 w-4" /> Joined {user.joinDate}
              </p>
              {selectedCareer && (
                <p className="text-sm mt-1 flex items-center gap-2 justify-center sm:justify-start">
                  <Target className="h-4 w-4 text-primary" /> Career Goal: <span className="text-primary font-medium">{selectedCareer.title}</span>
                </p>
              )}
            </div>
            <Link to="/quiz" className="px-5 py-2 rounded-lg border border-border hover:bg-secondary text-sm font-medium transition-colors">Switch Career Path</Link>
          </div>

          {/* AI Interest Profile */}
          {analysisResult && (
            <div className="glass-card rounded-xl p-6 mb-8">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Interest Profile</h2>
              <p className="text-sm text-muted-foreground italic mb-3">"{analysisResult.inputText.slice(0, 200)}{analysisResult.inputText.length > 200 ? '...' : ''}"</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {analysisResult.keywordsDetected.map(k => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{k}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysisResult.personality.map(p => (
                  <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{p}</span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Zap, label: 'Total XP', value: points, color: 'text-accent' },
              { icon: CheckCircle, label: 'Tasks Done', value: tasksCompleted, color: 'text-primary' },
              { icon: Clock, label: 'Study Hours', value: Math.round(studyHours * 10) / 10, color: 'text-primary' },
              { icon: TrendingUp, label: 'Career Progress', value: `Level ${level}`, color: 'text-accent' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass-card rounded-xl p-5 text-center">
                <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="font-bold text-lg mb-4">Skills Development</h2>
            <div className="space-y-3">
              {skillProgress.map(({ name, percentage }) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{name}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full gradient-bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="font-bold text-lg mb-4">Badges & Achievements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map(badge => (
                <div key={badge.id} className={`p-4 rounded-xl border text-center transition-all ${badge.earned ? 'border-primary/30 bg-primary/5' : 'border-border opacity-50'}`} title={badge.description}>
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className="text-xs font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.earned ? '✓ Earned' : `${badge.progress}/${badge.requirement}`}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Resume Builder */}
          <div className="glass-card rounded-xl p-6 mb-8">
            <h2 className="font-bold text-lg mb-2">AI Resume Builder</h2>
            <p className="text-sm text-muted-foreground mb-4">Generate a professional resume based on your career path and progress</p>
            <div className="bg-secondary rounded-xl p-6 mb-4">
              <h3 className="font-bold">{user.name}</h3>
              <p className="text-sm text-primary">{selectedCareer?.title || 'Career Explorer'}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Dedicated professional with demonstrated interest in {selectedCareer?.category || 'various fields'}.
                Completed {tasksCompleted} learning tasks and earned {badges.filter(b => b.earned).length} achievement badges.
                Skilled in {skills.slice(0, 3).join(', ')}.
              </p>
            </div>
            <button className="gradient-bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 flex items-center gap-2">
              <Download className="h-4 w-4" /> Download Resume
            </button>
          </div>

          {/* Career Alternatives */}
          {alternativeCareers.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="font-bold text-lg mb-4">AI-Recommended Alternatives</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {alternativeCareers.map(career => (
                  <div key={career.id} className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all">
                    <h3 className="font-semibold text-sm">{career.title}</h3>
                    <span className="text-xs text-primary">{career.matchPercentage}% match</span>
                    <p className="text-xs text-muted-foreground mt-1">{career.matchReason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Profile;
