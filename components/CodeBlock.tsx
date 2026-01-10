
import React, { useState } from 'react';

interface CodeBlockProps {
  content: string;
  language: string;
  fileName: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ content, language, fileName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700 mb-6 shadow-xl">
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{language}</span>
          <span className="text-sm font-semibold text-slate-200">{fileName}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto code-font text-sm leading-relaxed text-indigo-300">
        <code>{content}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
