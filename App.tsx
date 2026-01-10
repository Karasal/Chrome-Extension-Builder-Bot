
import React, { useState, useEffect } from 'react';
import CodeBlock from './components/CodeBlock';
import { generateExtensionProject, getExtensionAdvice } from './services/geminiService';
import { ChatMessage, ExtensionProject } from './types';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [project, setProject] = useState<ExtensionProject | null>(null);
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'ai'>('guide');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    // Check if API key is available
    if (!process.env.API_KEY || process.env.API_KEY === '') {
      console.warn("API_KEY environment variable is missing.");
      setHasApiKey(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (!idea.trim() || isLoading) return;
    if (!hasApiKey) {
      alert("API Key is missing. Please set the API_KEY environment variable in Vercel.");
      return;
    }
    setIsLoading(true);
    const newProject = await generateExtensionProject(idea);
    if (newProject) {
      setProject(newProject);
      setActiveTab('guide');
      setChatHistory([]); 
    } else {
      alert("Failed to generate project. Please check your API key and network connection.");
    }
    setIsLoading(false);
  };

  const handleDownloadZip = async () => {
    if (!project || isDownloading) return;
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      project.files.forEach(file => {
        zip.file(file.name, file.content);
      });
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.extensionName.replace(/\s+/g, '_')}_Project.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("ZIP Generation Error:", error);
      alert("Failed to generate ZIP file.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading || !project) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);
    const context = JSON.stringify(project);
    const advice = await getExtensionAdvice(chatInput, context);
    setChatHistory(prev => [...prev, { role: 'model', text: advice || 'Error communicating with AI.' }]);
    setIsChatLoading(false);
  };

  if (!project && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617]">
        {!hasApiKey && (
          <div className="fixed top-6 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-sm flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Deployment Notice: Remember to add your API_KEY to Vercel environment variables.
          </div>
        )}
        
        <div className="max-w-4xl w-full space-y-12 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent pb-2 leading-tight">
              Chrome Extension Builder Bot
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 font-light max-w-3xl mx-auto leading-relaxed">
              Your AI partner for architecting, coding, and exporting production-ready Chrome Extensions in seconds.
            </p>
          </div>

          <div className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
            <div className="relative flex flex-col md:flex-row gap-4 bg-slate-900/50 backdrop-blur-sm p-3 rounded-2xl border border-slate-800">
              <input
                type="text"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="What extension should I build for you?"
                className="flex-1 bg-transparent border-none text-slate-100 p-4 focus:ring-0 text-lg outline-none placeholder:text-slate-600"
              />
              <button
                onClick={handleGenerate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] whitespace-nowrap flex items-center justify-center"
              >
                Launch Bot
              </button>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-sm pt-4">
            {['AI Summary Tool', 'Dark Mode Toggle', 'Tab Organizer', 'Price Tracker'].map(preset => (
              <button 
                key={preset}
                onClick={() => setIdea(preset)}
                className="px-5 py-2.5 rounded-full border border-slate-800 bg-slate-900/40 text-slate-500 hover:border-indigo-500 hover:text-indigo-400 hover:bg-slate-900 transition-all"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-slate-100">
        <div className="relative mb-10">
          <div className="w-24 h-24 border-[3px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-full animate-pulse blur-sm"></div>
          </div>
        </div>
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">Bot is Building Your Project...</h2>
          <p className="text-indigo-400/60 font-mono text-sm uppercase tracking-widest">Generating manifest, logic, and UI assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617]">
      {/* Header */}
      <header className="bg-slate-900/40 backdrop-blur-xl border-b border-slate-800/60 py-4 px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <button 
              onClick={() => setProject(null)}
              className="p-2.5 bg-slate-800/50 hover:bg-indigo-600/20 hover:text-indigo-400 rounded-xl text-slate-400 transition-all border border-slate-700/50 shadow-sm"
              title="Start New Build"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white tracking-tight">{project?.extensionName}</h1>
                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-indigo-500/20 tracking-tighter">Manifest V3</span>
              </div>
              <p className="text-slate-500 text-xs truncate max-w-[400px] mt-0.5">{project?.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex space-x-1 bg-slate-950/50 p-1 rounded-xl border border-slate-800/60">
              {(['guide', 'code', 'ai'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.02]' 
                      : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </nav>

            <div className="h-8 w-[1px] bg-slate-800 mx-2 hidden md:block"></div>

            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="group flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-900/20 active:scale-95 whitespace-nowrap"
            >
              {isDownloading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              {isDownloading ? 'Packing...' : 'Download ZIP'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {activeTab === 'guide' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-slate-900/40 border border-slate-800/60 p-10 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" /></svg>
              </div>
              <h2 className="text-3xl font-black mb-10 flex items-center text-white tracking-tight">
                <span className="bg-gradient-to-br from-indigo-500 to-indigo-700 w-12 h-12 rounded-2xl flex items-center justify-center text-lg mr-5 shadow-xl shadow-indigo-500/20 border border-indigo-400/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </span>
                Bot Deployment Sequence
              </h2>
              <div className="space-y-8 relative">
                {project?.guideSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start group/step">
                    <div className="bg-slate-800 border border-slate-700 text-indigo-400 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black mr-6 mt-0.5 group-hover/step:border-indigo-500 group-hover/step:bg-indigo-600 group-hover/step:text-white transition-all duration-300">
                      {idx + 1}
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xl font-medium">{step}</p>
                  </div>
                ))}
              </div>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-indigo-900/10 border border-indigo-500/20 p-8 rounded-3xl group hover:border-indigo-500/40 transition-all">
                <div className="bg-indigo-500/20 w-10 h-10 rounded-xl flex items-center justify-center mb-6 text-indigo-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <h3 className="text-xl font-bold text-indigo-300 mb-3">Unpack Instructions</h3>
                <p className="text-slate-400 leading-relaxed">
                  Extract the bot-generated ZIP. Open <code className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded font-mono">chrome://extensions</code>, toggle <span className="text-white font-bold">Developer Mode</span>, and select the project folder.
                </p>
              </div>
              <div className="bg-purple-900/10 border border-purple-500/20 p-8 rounded-3xl group hover:border-purple-500/40 transition-all">
                <div className="bg-purple-500/20 w-10 h-10 rounded-xl flex items-center justify-center mb-6 text-purple-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <h3 className="text-xl font-bold text-purple-300 mb-3">AI Export</h3>
                <p className="text-slate-400 leading-relaxed">
                  The green <span className="text-white font-bold">Download ZIP</span> button provides the full file hierarchy the bot just architected.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'code' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
              <div className="space-y-1">
                <h2 className="text-4xl font-black text-white tracking-tight">Bot-Architected Modules</h2>
                <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Compiled {project?.files.length} project assets</p>
              </div>
              <button
                onClick={handleDownloadZip}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-2xl font-bold transition-all border border-slate-700 flex items-center gap-3 shadow-sm hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export Bot Output
              </button>
            </div>
            <div className="grid grid-cols-1 gap-12">
              {project?.files.map((file) => (
                <div key={file.name} className="group relative">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs text-indigo-400 font-black shadow-inner">
                        {file.name.split('.').pop()?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-100">{file.name}</h4>
                        <p className="text-sm text-slate-500">{file.description}</p>
                      </div>
                    </div>
                  </div>
                  <CodeBlock fileName={file.name} content={file.content} language={file.language} />
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="flex flex-col h-[78vh] max-w-5xl mx-auto animate-in zoom-in-[0.98] duration-500 bg-slate-900/30 backdrop-blur-md rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-20">
                  <div className="w-24 h-24 bg-indigo-600/10 rounded-[2rem] flex items-center justify-center border border-indigo-500/20 shadow-2xl shadow-indigo-500/5 rotate-3">
                    <svg className="w-12 h-12 text-indigo-400 -rotate-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black text-white tracking-tight">Bot Chatbot Mode</h3>
                    <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                      Ask questions about the current build. Request code tweaks, permission changes, or feature explanations directly from the bot.
                    </p>
                  </div>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-7 py-5 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-xl shadow-indigo-600/10' 
                        : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-bl-none'
                    }`}>
                      <p className="text-base whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/40 text-indigo-400 border border-slate-700/50 rounded-2xl rounded-bl-none px-7 py-5 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-900/50 border-t border-slate-800/80">
              <div className="flex gap-4 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask the bot for build adjustments..."
                  className="flex-1 bg-transparent border-none text-slate-100 px-5 py-3 text-base outline-none placeholder:text-slate-600"
                />
                <button
                  disabled={isChatLoading}
                  onClick={handleSendMessage}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-black transition-all flex items-center shadow-lg active:scale-95 text-sm uppercase tracking-wider"
                >
                  Prompt Bot
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="bg-slate-950/50 border-t border-slate-800/40 py-10 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-slate-600 text-[10px] gap-6 uppercase tracking-[0.3em] font-black">
          <div className="flex items-center gap-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p>© {new Date().getFullYear()} CHROME EXTENSION BUILDER BOT</p>
          </div>
          <div className="flex space-x-10">
            <button onClick={() => setProject(null)} className="hover:text-indigo-400 transition-colors">Abort Build</button>
            <a href="https://developer.chrome.com/docs/extensions" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">Manifest Schema</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Bot Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
