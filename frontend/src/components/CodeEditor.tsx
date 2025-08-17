import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Play, Terminal, X, Download, Copy, RotateCcw, Sun, Moon, Code, Zap, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

const languageNames = [
  { label: 'JavaScript', value: 'javascript', icon: '⚡' },
  { label: 'TypeScript', value: 'typescript', icon: '🔷' },
  { label: 'Python', value: 'python', icon: '🐍' },
  { label: 'Java', value: 'java', icon: '☕' },
  { label: 'C++', value: 'cpp', icon: '⚙️' },
  { label: 'HTML', value: 'html', icon: '🌐' },
  { label: 'CSS', value: 'css', icon: '🎨' },
  { label: 'SQL', value: 'sql', icon: '🗄️' },
  { label: 'JSON', value: 'json', icon: '📄' },
  { label: 'Markdown', value: 'markdown', icon: '📝' },
];

const defaultCode: Record<string, string> = {
  javascript: '// Write JavaScript code here\nconsole.log("Hello, World!");\n\n// Try some math\nconst result = 2 + 3 * 4;\nconsole.log("2 + 3 * 4 =", result);\n\n// Try a function\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet("Tuttora"));',
  typescript: '// Write TypeScript code here\nconsole.log("Hello, World!");\n\n// Try some typed code\nconst numbers: number[] = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2);\nconsole.log("Original:", numbers);\nconsole.log("Doubled:", doubled);',
  python: '# Write Python code here\nprint("Hello, World!")\n\n# Try some Python features\nnumbers = [1, 2, 3, 4, 5]\nsquared = [n**2 for n in numbers]\nprint("Original:", numbers)\nprint("Squared:", squared)\n\n# Try a function\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Tuttora"))',
  java: '// Write Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        \n        // Try some Java features\n        int[] numbers = {1, 2, 3, 4, 5};\n        int sum = 0;\n        for (int num : numbers) {\n            sum += num;\n        }\n        System.out.println("Sum of numbers: " + sum);\n    }\n}',
  cpp: '// Write C++ code here\n#include <iostream>\n#include <vector>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    \n    // Try some C++ features\n    std::vector<int> numbers = {1, 2, 3, 4, 5};\n    int sum = 0;\n    for (int num : numbers) {\n        sum += num;\n    }\n    std::cout << "Sum of numbers: " << sum << std::endl;\n    \n    return 0;\n}',
  html: '<!-- Write HTML here -->\n<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n    <style>\n        body { font-family: Arial, sans-serif; margin: 40px; }\n        .highlight { color: #007acc; }\n    </style>\n</head>\n<body>\n    <h1>Hello, <span class="highlight">World</span>!</h1>\n    <p>This is a sample HTML page.</p>\n    <ul>\n        <li>Feature 1</li>\n        <li>Feature 2</li>\n        <li>Feature 3</li>\n    </ul>\n</body>\n</html>',
  css: '/* Write CSS here */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n}\n\n.container {\n    max-width: 800px;\n    margin: 0 auto;\n    background: rgba(255, 255, 255, 0.1);\n    padding: 30px;\n    border-radius: 10px;\n    backdrop-filter: blur(10px);\n}\n\nh1 {\n    text-align: center;\n    margin-bottom: 30px;\n    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);\n}\n\n.button {\n    background: #007acc;\n    color: white;\n    padding: 10px 20px;\n    border: none;\n    border-radius: 5px;\n    cursor: pointer;\n    transition: background 0.3s;\n}\n\n.button:hover {\n    background: #005a9e;\n}',
  sql: '-- Write SQL here\n-- Sample database queries\n\n-- Create a sample table\nCREATE TABLE users (\n    id INT PRIMARY KEY,\n    name VARCHAR(100),\n    email VARCHAR(100),\n    age INT\n);\n\n-- Insert sample data\nINSERT INTO users (id, name, email, age) VALUES\n(1, \'John Doe\', \'john@example.com\', 25),\n(2, \'Jane Smith\', \'jane@example.com\', 30),\n(3, \'Bob Johnson\', \'bob@example.com\', 35);\n\n-- Query the data\nSELECT * FROM users;\n\n-- Find users over 25\nSELECT name, email FROM users WHERE age > 25;',
  json: '{\n  "name": "Tuttora",\n  "version": "1.0.0",\n  "description": "Peer-to-Peer Academic Assistance",\n  "features": [\n    "Real-time tutoring",\n    "Interactive whiteboard",\n    "Code editor",\n    "Video calls"\n  ],\n  "team": {\n    "developers": [\n      {\n        "name": "Chukwudi",\n        "role": "Full Stack Developer"\n      },\n      {\n        "name": "Jack",\n        "role": "Backend Developer"\n      }\n    ]\n  },\n  "technologies": {\n    "frontend": "Next.js",\n    "backend": "Node.js",\n    "database": "PostgreSQL"\n  }\n}',
  markdown: '# Write Markdown here\n\n## Welcome to Tuttora\n\nThis is a **markdown** example with various formatting options.\n\n### Features\n\n- ✅ Real-time tutoring\n- ✅ Interactive whiteboard\n- ✅ Code editor\n- ✅ Video calls\n\n### Code Example\n\n```javascript\nconsole.log("Hello, World!");\n```\n\n### Table Example\n\n| Feature | Status |\n|---------|--------|\n| Whiteboard | ✅ Complete |\n| Code Editor | ✅ Complete |\n| Video Calls | 🚧 In Progress |\n\n### Links\n\n[Visit our website](https://tuttora.com)\n\n---\n\n*Built with ❤️ by the Tuttora team*',
};

type Theme = 'light' | 'dark';

const DARK_BLUE = '#17223b';

// Register custom Monaco theme for dark mode
if (typeof window !== 'undefined') {
  loader.init().then(monaco => {
    if (monaco) {
      monaco.editor.defineTheme('tuttora-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': DARK_BLUE,
          'editorGutter.background': DARK_BLUE,
          'editorLineNumber.foreground': '#4b587c',
          'editorLineNumber.activeForeground': '#b3c0e0',
          'editor.foreground': '#e0e6f0',
        },
      });
    }
  });
}

const themes = {
  light: {
    container: 'bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl',
    header: 'bg-gradient-to-r from-gray-50/90 to-gray-100/90 border-gray-200',
    button: {
      run: 'bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200',
      download: 'bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200',
      copy: 'bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200',
      terminal: 'bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200',
      reset: 'bg-white border border-red-400 text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-200',
      theme: 'bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200',
    },
    terminal: {
      header: 'bg-gradient-to-r from-gray-100/90 to-gray-200/90 border-gray-300 text-gray-800',
      body: 'bg-white text-gray-800',
    },
    statusBar: 'bg-gray-50/80 border-gray-200/50 text-gray-600',
    select: 'border-gray-300 bg-white/80',
  },
  dark: {
    container: 'bg-[#23272f] backdrop-blur-sm border border-gray-700/60 shadow-xl',
    header: 'bg-[#23272f] border-[#23272f] text-white',
    button: {
      run: 'bg-[#23272f] border border-gray-500 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-400',
      download: 'bg-[#23272f] border border-gray-500 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-400',
      copy: 'bg-[#23272f] border border-gray-400 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-400',
      terminal: 'bg-[#23272f] border border-gray-400 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-400',
      reset: 'bg-[#23272f] border border-red-500 text-red-400 hover:bg-red-900 focus:ring-2 focus:ring-red-400',
      theme: 'bg-[#23272f] border border-gray-700 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-400',
    },
    terminal: {
      header: 'bg-[#23272f] border-[#23272f] text-white',
      body: 'bg-[#23272f] text-gray-100',
    },
    statusBar: 'bg-[#23272f] border-[#23272f] text-white',
    select: 'border-gray-500 bg-[#23272f] text-white',
  },
};

export default function CodeEditor() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(defaultCode['javascript']);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');

  // Collaborative functionality
  const { socket, isConnected } = useSocket();
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [lastCodeChange, setLastCodeChange] = useState<number>(0);
  const codeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLocalChange = useRef(false);

  // Get sessionId from URL if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const sessionIdFromPath = pathParts[pathParts.length - 1];
      if (sessionIdFromPath && sessionIdFromPath.length > 10) {
        setSessionId(sessionIdFromPath);
      }
    }
  }, []);

  // Join code room when sessionId is available and socket is connected
  useEffect(() => {
    if (sessionId && isConnected && socket) {
      socket.emit('joinCodeRoom', { sessionId });
      setIsCollaborating(true);
      console.log('Joined collaborative code room for session:', sessionId);

      // Listen for code changes from other users
      socket.on('codeChange', (data: { code: string; language: string; userId: string; username: string }) => {
        if (data.userId !== socket.id) {
          console.log('Received code change from other user:', data.username);
          isLocalChange.current = true;
          setCode(data.code);
          setLanguage(data.language);
          setLastCodeChange(Date.now());
        }
      });

      // Listen for language changes from other users
      socket.on('languageChange', (data: { language: string; userId: string; username: string }) => {
        if (data.userId !== socket.id) {
          console.log('Received language change from other user:', data.username);
          isLocalChange.current = true;
          setLanguage(data.language);
          setCode(defaultCode[data.language as keyof typeof defaultCode] || defaultCode.javascript);
        }
      });

      // Listen for code execution from other users
      socket.on('codeExecution', (data: { code: string; language: string; output: string; userId: string; username: string }) => {
        if (data.userId !== socket.id) {
          console.log('Received code execution from other user:', data.username);
          setOutput(data.output);
        }
      });

      // Listen for users joining/leaving the code room
      socket.on('userJoinedCodeRoom', (data: { userId: string; username: string }) => {
        console.log('User joined code room:', data.username);
        setCollaborators(prev => [...prev, data.username]);
      });

      socket.on('userLeftCodeRoom', (data: { userId: string; username: string }) => {
        console.log('User left code room:', data.username);
        setCollaborators(prev => prev.filter(name => name !== data.username));
      });

      // Cleanup listeners on unmount
      return () => {
        if (socket) {
          socket.emit('leaveCodeRoom', { sessionId });
          socket.off('codeChange');
          socket.off('languageChange');
          socket.off('codeExecution');
          socket.off('userJoinedCodeRoom');
          socket.off('userLeftCodeRoom');
        }
      };
    }
  }, [sessionId, isConnected, socket]);

  // Debounced code change broadcast
  const broadcastCodeChange = (newCode: string, newLanguage: string) => {
    if (!isCollaborating || !sessionId || !socket || isLocalChange.current) {
      isLocalChange.current = false;
      return;
    }

    // Clear existing timeout
    if (codeChangeTimeoutRef.current) {
      clearTimeout(codeChangeTimeoutRef.current);
    }

    // Set new timeout for debounced broadcast
    codeChangeTimeoutRef.current = setTimeout(() => {
      socket.emit('codeChange', {
        sessionId,
        code: newCode,
        language: newLanguage,
        userId: socket.id
      });
    }, 500); // 500ms debounce
  };

  const [lastRunTime, setLastRunTime] = useState<number | null>(null);

  const currentTheme = themes[theme];
  const currentLanguage = languageNames.find(l => l.value === language);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setCode(defaultCode[newLanguage as keyof typeof defaultCode] || defaultCode.javascript);
    setOutput('');
    
    // Broadcast language change to other users
    if (isCollaborating && sessionId && socket) {
      socket.emit('languageChange', {
        sessionId,
        language: newLanguage
      });
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const executeCode = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLastRunTime(Date.now());
    
    try {
      let result = '';
      
      switch (language) {
        case 'javascript':
          result = await executeJavaScript(code);
          break;
        case 'typescript':
          result = await executeTypeScript(code);
          break;
        case 'python':
          result = await executePython(code);
          break;
        case 'html':
          result = await executeHTML(code);
          break;
        case 'css':
          result = await executeCSS(code);
          break;
        case 'json':
          result = await executeJSON(code);
          break;
        case 'markdown':
          result = await executeMarkdown(code);
          break;
        default:
          result = 'Language not supported for execution';
      }
      
      setOutput(result);
      
      // Broadcast code execution to other users
      if (isCollaborating && sessionId && socket) {
        socket.emit('codeExecution', {
          sessionId,
          code,
          language,
          output: result
        });
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const executeJavaScript = async (code: string): Promise<string> => {
    return new Promise((resolve) => {
      let output = '';
      const originalConsoleLog = console.log;
      
      console.log = (...args) => {
        output += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n';
      };
      
      try {
        eval(code);
        resolve(output || '✅ Code executed successfully (no output)\n');
      } catch (error) {
        resolve(`❌ Error: ${error}\n`);
      } finally {
        console.log = originalConsoleLog;
      }
    });
  };

  const executeTypeScript = async (code: string): Promise<string> => {
    const jsCode = code.replace(/:\s*\w+(?:<[^>]*>)?/g, '');
    return executeJavaScript(jsCode);
  };

  const executePython = async (code: string): Promise<string> => {
    const lines = code.split('\n');
    let output = '';
    
    for (const line of lines) {
      if (line.trim().startsWith('print(')) {
        const match = line.match(/print\((.+)\)/);
        if (match) {
          output += match[1].replace(/['"]/g, '') + '\n';
        }
      }
    }
    
    return output || '🐍 Python code executed (simulated)\n';
  };

  const executeHTML = async (code: string): Promise<string> => {
    return `🌐 HTML Preview:\n\n${code}\n\n💡 Open in browser to see rendered result\n`;
  };

  const executeCSS = async (code: string): Promise<string> => {
    return `🎨 CSS Code:\n\n${code}\n\n💡 Apply to HTML elements to see styling\n`;
  };

  const executeJSON = async (code: string): Promise<string> => {
    try {
      const parsed = JSON.parse(code);
      return `✅ Valid JSON:\n\n${JSON.stringify(parsed, null, 2)}\n`;
    } catch (error) {
      return `❌ Invalid JSON: ${error}\n`;
    }
  };

  const executeMarkdown = async (code: string): Promise<string> => {
    return `📝 Markdown Preview:\n\n${code}\n\n💡 Convert to HTML to see rendered result\n`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'cpp' ? 'cpp' : language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCode(defaultCode[language]);
    setOutput('');
    setLastRunTime(null);
  };

  const clearOutput = () => {
    setOutput('');
    setLastRunTime(null);
  };

  const lineCount = code.split('\n').length;
  const charCount = code.length;
  const statusMessage = isRunning ? 'Running...' : output ? 'Ready' : 'No output';

  return (
    <div className={`flex flex-col h-full w-full rounded-xl shadow-2xl border ${currentTheme.container}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b rounded-t-xl ${currentTheme.header}`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Code className="w-3.5 h-3.5" style={{ color: theme === 'dark' ? '#60a5fa' : '#16a34a' }} />
            <label className={`text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Language:</label>
            <select
              value={language}
              onChange={handleLanguageChange}
              className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium leading-relaxed ${currentTheme.select}`}
            >
              {languageNames.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  <span style={{ color: theme === 'dark' ? '#60a5fa' : '#16a34a' }}>{lang.icon}</span> {lang.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Collaboration Indicator */}
          {isCollaborating && (
            <div className="flex items-center space-x-2">
              <Users className="w-3.5 h-3.5 text-green-500" />
              <span className={`text-xs font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                Collaborative Mode
              </span>
              {collaborators.length > 0 && (
                <span className={`text-xs opacity-75 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  ({collaborators.length} active)
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Primary Actions */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={executeCode}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg leading-relaxed ${currentTheme.button.run} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-green-600" />
                  <span>Run Code</span>
                </>
              )}
            </button>
            <button 
              onClick={() => setShowTerminal(!showTerminal)}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg leading-relaxed ${currentTheme.button.terminal}`}
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>{showTerminal ? 'Hide' : 'Show'} Terminal</span>
            </button>
          </div>
          {/* Secondary Actions */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleTheme}
              className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium rounded-lg leading-relaxed ${currentTheme.button.theme}`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-gray-700" /> : <Sun className="w-3.5 h-3.5 text-gray-700" />}
            </button>
            <button 
              onClick={handleCopy} 
              className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium rounded-lg leading-relaxed ${currentTheme.button.copy}`}
              title="Copy code"
            >
              <Copy className="w-3.5 h-3.5 text-blue-600" />
            </button>
            <button 
              onClick={handleDownload} 
              className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium rounded-lg leading-relaxed ${currentTheme.button.download}`}
              title="Download code"
            >
              <Download className="w-3.5 h-3.5 text-green-600" />
            </button>
            <button 
              onClick={handleReset} 
              className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium rounded-lg leading-relaxed ${currentTheme.button.reset}`}
              title="Reset to default code"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Code Editor */}
        <div className={`${showTerminal ? 'w-1/2' : 'w-full'} min-h-0 transition-all duration-300`}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            language={language}
            value={code}
            onChange={(value) => {
              const newCode = value || '';
              setCode(newCode);
              // Broadcast code change to other users
              broadcastCodeChange(newCode, language);
            }}
            theme={theme === 'light' ? 'vs' : 'tuttora-dark'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'Monaspace Argon', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              glyphMargin: true,
              useTabStops: false,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: false,
              trimAutoWhitespace: true,
              largeFileOptimizations: true,
              suggest: {
                showKeywords: true,
                showSnippets: true,
                showClasses: true,
                showFunctions: true,
                showVariables: true,
                showModules: true,
                showProperties: true,
                showEvents: true,
                showOperators: true,
                showUnits: true,
                showValues: true,
                showConstants: true,
                showEnums: true,
                showEnumMembers: true,
                showColors: true,
                showFiles: true,
                showReferences: true,
                showFolders: true,
                showTypeParameters: true,
                showWords: true,
              },
            }}
          />
        </div>

        {/* Terminal Output */}
        {showTerminal && (
          <div className="w-1/2 border-l border-gray-300 dark:border-gray-600 flex flex-col transition-all duration-300">
            <div className={`flex items-center justify-between px-4 py-2 text-xs font-medium ${currentTheme.terminal.header}`}>
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>Terminal Output</span>
                {lastRunTime && (
                  <span className="text-xs opacity-75">
                    ({lastRunTime}ms)
                  </span>
                )}
              </div>
              <button 
                onClick={clearOutput}
                className="text-gray-400 hover:text-white transition-colors duration-200"
                title="Clear output"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className={`flex-1 p-4 font-mono text-xs font-medium overflow-auto leading-relaxed ${currentTheme.terminal.body}`} style={{ fontFamily: "'Monaspace Argon', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace" }}>
              <pre className="whitespace-pre-wrap">
                {output || '💡 Ready to run code...\n\n💡 Click "Run Code" to execute your program\n'}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-t rounded-b-xl ${currentTheme.statusBar} text-xs font-medium leading-relaxed`}>
        <div className="flex items-center space-x-3">
          <span className="">Language:</span>
          <span className={`inline-flex items-center ${theme === 'dark' ? 'text-blue-400' : 'text-green-600'}`}>{languageNames.find(l => l.value === language)?.icon}</span>
          <span className="">{languageNames.find(l => l.value === language)?.label}</span>
          <span className="opacity-60">Lines:</span>
          <span>{lineCount}</span>
          <span className="opacity-60">Characters:</span>
          <span>{charCount}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="">{statusMessage}</span>
        </div>
      </div>
    </div>
  );
} 