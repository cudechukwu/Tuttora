'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  Eraser, 
  Type, 
  Undo, 
  Redo, 
  Download, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Save,
  Plus,
  ChevronLeft,
  ChevronRight,
  Highlighter
} from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';

interface Point {
  x: number;
  y: number;
}

interface DrawingStroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'highlighter';
  userId: string;
  timestamp: number;
}

interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  userId: string;
  timestamp: number;
}

interface WhiteboardPage {
  strokes: DrawingStroke[];
  texts: TextElement[];
  background?: string;
}

interface InteractiveWhiteboardProps {
  theme?: {
    primary: string;
    primaryHover: string;
    primaryBg: string;
    primaryBgHover: string;
  };
  sessionId?: string;
}

const InteractiveWhiteboard: React.FC<InteractiveWhiteboardProps> = ({ 
  theme = {
    primary: 'text-gray-700',
    primaryHover: 'hover:text-gray-500',
    primaryBg: 'bg-gray-100',
    primaryBgHover: 'hover:bg-gray-50'
  },
  sessionId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [selectedTool, setSelectedTool] = useState<'pen' | 'eraser' | 'highlighter' | 'text'>('pen');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<WhiteboardPage[]>([
    { strokes: [], texts: [] }
  ]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [userId] = useState(() => {
    // Generate a unique user ID for this session
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  });

  const { socket, isConnected } = useSocket();

  // Load whiteboard data from localStorage on component mount
  useEffect(() => {
    if (sessionId) {
      const savedData = localStorage.getItem(`whiteboard_${sessionId}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setPages(parsedData.pages || [{ strokes: [], texts: [] }]);
          setCurrentPageIndex(parsedData.currentPageIndex || 0);
        } catch (error) {
          console.error('Error loading whiteboard data:', error);
          // Fallback to default state
          setPages([{ strokes: [], texts: [] }]);
          setCurrentPageIndex(0);
        }
      }
    }
  }, [sessionId]);

  // Save whiteboard data to localStorage whenever it changes
  useEffect(() => {
    if (sessionId && pages.length > 0) {
      const dataToSave = {
        pages,
        currentPageIndex,
        lastUpdated: Date.now()
      };
      localStorage.setItem(`whiteboard_${sessionId}`, JSON.stringify(dataToSave));
    }
  }, [pages, currentPageIndex, sessionId]);

  // Collaborative functionality
  useEffect(() => {
    if (sessionId && isConnected && socket) {
      // Join the whiteboard room for this session
      const roomName = `whiteboard-${sessionId}`;
      socket.emit('joinRoom', { room: roomName });
      setIsCollaborating(true);
      console.log('Joined collaborative whiteboard room:', roomName);

      // Listen for drawing updates from other users
      socket.on('whiteboardStroke', (data: { stroke: DrawingStroke; pageIndex: number }) => {
        if (data.stroke.userId !== userId) {
          console.log('Received stroke from other user:', data);
          setPages(prev => {
            const newPages = [...prev];
            if (newPages[data.pageIndex]) {
              newPages[data.pageIndex] = {
                ...newPages[data.pageIndex],
                strokes: [...newPages[data.pageIndex].strokes, data.stroke]
              };
            }
            return newPages;
          });
        }
      });

      // Listen for text updates from other users
      socket.on('whiteboardText', (data: { text: TextElement; pageIndex: number }) => {
        if (data.text.userId !== userId) {
          console.log('Received text from other user:', data);
          setPages(prev => {
            const newPages = [...prev];
            if (newPages[data.pageIndex]) {
              newPages[data.pageIndex] = {
                ...newPages[data.pageIndex],
                texts: [...newPages[data.pageIndex].texts, data.text]
              };
            }
            return newPages;
          });
        }
      });

      // Listen for clear events from other users
      socket.on('whiteboardClear', (data: { pageIndex: number }) => {
        console.log('Received clear event from other user:', data);
        setPages(prev => {
          const newPages = [...prev];
          if (newPages[data.pageIndex]) {
            newPages[data.pageIndex] = {
              ...newPages[data.pageIndex],
              strokes: [],
              texts: []
            };
          }
          return newPages;
        });
      });

      // Listen for page change events from other users
      socket.on('whiteboardPageChange', (data: { pageIndex: number }) => {
        console.log('Received page change from other user:', data);
        setCurrentPageIndex(data.pageIndex);
      });

      return () => {
        socket.off('whiteboardStroke');
        socket.off('whiteboardText');
        socket.off('whiteboardClear');
        socket.off('whiteboardPageChange');
      };
    }
  }, [sessionId, isConnected, socket, userId]);

  // Ensure current page exists
  useEffect(() => {
    if (currentPageIndex >= pages.length) {
      setPages(prev => {
        const newPages = [...prev];
        while (newPages.length <= currentPageIndex) {
          newPages.push({ strokes: [], texts: [] });
        }
        return newPages;
      });
    }
  }, [currentPageIndex, pages.length]);

  const getCurrentPage = (): WhiteboardPage => {
    if (currentPageIndex >= pages.length) {
      return { strokes: [], texts: [] };
    }
    return pages[currentPageIndex] || { strokes: [], texts: [] };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'text') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const newStroke: DrawingStroke = {
      id: Date.now().toString(),
      points: [{ x, y }],
      color: selectedColor,
      width: strokeWidth,
      tool: selectedTool as 'pen' | 'eraser' | 'highlighter',
      userId,
      timestamp: Date.now()
    };

    setCurrentStroke(newStroke);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke || selectedTool === 'text') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    setCurrentStroke(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, { x, y }]
      };
    });
  };

  const stopDrawing = () => {
    if (currentStroke) {
      setPages(prev => {
        const newPages = [...prev];
        // Ensure the current page exists
        if (!newPages[currentPageIndex]) {
          newPages[currentPageIndex] = { strokes: [], texts: [] };
        }
        newPages[currentPageIndex] = {
          ...newPages[currentPageIndex],
          strokes: [...newPages[currentPageIndex].strokes, currentStroke]
        };
        return newPages;
      });

      // Broadcast stroke to other users if collaborating
      if (isCollaborating && sessionId && socket) {
        socket.emit('whiteboardStroke', {
          stroke: currentStroke,
          pageIndex: currentPageIndex,
          sessionId
        });
      }

      setCurrentStroke(null);
    }
    setIsDrawing(false);
  };

  const addText = (text: string, position?: Point) => {
    const coords = position || { x: 0, y: 0 };
    
    const newText: TextElement = {
      id: Date.now().toString(),
      x: coords.x,
      y: coords.y,
      text,
      fontSize: 16,
      color: selectedColor,
      userId,
      timestamp: Date.now()
    };

    setPages(prev => {
      const newPages = [...prev];
      // Ensure the current page exists
      if (!newPages[currentPageIndex]) {
        newPages[currentPageIndex] = { strokes: [], texts: [] };
      }
      newPages[currentPageIndex] = {
        ...newPages[currentPageIndex],
        texts: [...newPages[currentPageIndex].texts, newText]
      };
      return newPages;
    });

    // Broadcast text to other users if collaborating
    if (isCollaborating && sessionId && socket) {
      socket.emit('whiteboardText', {
        text: newText,
        pageIndex: currentPageIndex,
        sessionId
      });
    }
  };

  const clearCanvas = () => {
    setPages(prev => {
      const newPages = [...prev];
      // Ensure the current page exists
      if (!newPages[currentPageIndex]) {
        newPages[currentPageIndex] = { strokes: [], texts: [] };
      }
      newPages[currentPageIndex] = {
        ...newPages[currentPageIndex],
        strokes: [],
        texts: []
      };
      return newPages;
    });

    // Broadcast clear event to other users if collaborating
    if (isCollaborating && sessionId && socket) {
      socket.emit('whiteboardClear', {
        pageIndex: currentPageIndex,
        sessionId
      });
    }
  };

  const goToPage = (index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPageIndex(index);

      // Broadcast page change to other users if collaborating
      if (isCollaborating && sessionId && socket) {
        socket.emit('whiteboardPageChange', {
          pageIndex: index,
          sessionId
        });
      }
    }
  };

  const addPage = () => {
    setPages(prev => [...prev, { strokes: [], texts: [] }]);
    setCurrentPageIndex(pages.length);
  };

  const removePage = () => {
    if (pages.length > 1) {
      setPages(prev => prev.filter((_, index) => index !== currentPageIndex));
      setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

      const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
      link.click();
  };

  // Draw everything to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom
    ctx.save();
    ctx.scale(zoom, zoom);

    const currentPage = getCurrentPage();

    // Draw all strokes
    currentPage.strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.3;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke && currentStroke.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentStroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.3;
      } else if (currentStroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
      currentStroke.points.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    // Draw all texts
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    currentPage.texts.forEach(textElement => {
      ctx.font = `${textElement.fontSize}px Arial`;
      ctx.fillStyle = textElement.color;
      ctx.fillText(textElement.text, textElement.x, textElement.y);
    });

    ctx.restore();
  }, [pages, currentStroke, zoom, currentPageIndex]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTool('pen')}
            className={`p-2 rounded ${selectedTool === 'pen' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
            <PenTool size={20} />
            </button>
            <button
              onClick={() => setSelectedTool('highlighter')}
            className={`p-2 rounded ${selectedTool === 'highlighter' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
            <Highlighter size={20} />
            </button>
            <button
              onClick={() => setSelectedTool('eraser')}
            className={`p-2 rounded ${selectedTool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
            <Eraser size={20} />
            </button>
            <button
            onClick={() => setSelectedTool('text')}
            className={`p-2 rounded ${selectedTool === 'text' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Type size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-8 h-8 rounded border border-gray-300"
          />
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
          <span className="text-sm text-gray-600">{strokeWidth}px</span>
          </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            <ZoomIn size={20} />
          </button>
      </div>

        <div className="flex items-center space-x-2">
              <button
            onClick={clearCanvas}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
            title="Clear Canvas"
              >
            <Trash2 size={20} />
              </button>
                  <button
            onClick={downloadCanvas}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            title="Download"
          >
            <Download size={20} />
                  </button>
                </div>
              </div>

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(currentPageIndex - 1)}
              disabled={currentPageIndex === 0}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
            >
            <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPageIndex + 1} of {pages.length}
            </span>
            <button
              onClick={() => goToPage(currentPageIndex + 1)}
              disabled={currentPageIndex === pages.length - 1}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
            >
            <ChevronRight size={20} />
            </button>
          </div>
          
        <div className="flex items-center space-x-2">
          <button
            onClick={addPage}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            title="Add Page"
          >
            <Plus size={20} />
          </button>
          {pages.length > 1 && (
            <button
              onClick={removePage}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
              title="Remove Page"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <span>Tool: {selectedTool === 'pen' ? 'Brush' : selectedTool === 'highlighter' ? 'Highlighter' : selectedTool === 'eraser' ? 'Eraser' : 'Text'}</span>
        <span className="mx-2">|</span>
        <span>Color: {selectedColor}</span>
        <span className="mx-2">|</span>
        <span>Width: {strokeWidth}px</span>
        <span className="mx-2">|</span>
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className="mx-2">|</span>
        <span>Strokes: {getCurrentPage().strokes.length}</span>
        <span className="mx-2">|</span>
        <span>Texts: {getCurrentPage().texts.length}</span>
        {isCollaborating && (
          <>
        <span className="mx-2">|</span>
            <span className="text-green-600">🔄 Collaborative Mode</span>
          </>
        )}
      </div>
    </div>
  );
};

export default InteractiveWhiteboard; 