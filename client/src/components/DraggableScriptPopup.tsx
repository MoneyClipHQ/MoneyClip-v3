import { useState, useRef, useEffect } from 'react';
import { X, GripVertical, Minimize2, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface DraggableScriptPopupProps {
  script: {
    chartTitle: string;
    scriptText: string;
    estimatedDuration: string;
    keyPoints?: string[] | null;
  };
  isVisible: boolean;
  onClose: () => void;
  onScriptOpened?: () => void;
}

export function DraggableScriptPopup({ 
  script, 
  isVisible, 
  onClose,
  onScriptOpened 
}: DraggableScriptPopupProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Check if speech synthesis is supported
  useEffect(() => {
    setSpeechSupported('speechSynthesis' in window);
  }, []);

  // Track script opened for analytics
  useEffect(() => {
    if (isVisible && onScriptOpened) {
      onScriptOpened();
    }
  }, [isVisible, onScriptOpened]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    
    const rect = dragRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setIsDragging(true);
  };

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - offsetRef.current.x;
      const newY = e.clientY - offsetRef.current.y;
      
      // Keep popup within viewport bounds
      const maxX = window.innerWidth - 400; // Assume popup width ~400px
      const maxY = window.innerHeight - 200; // Assume popup height ~200px
      
      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Text-to-speech functionality
  const handleSpeak = () => {
    if (!speechSupported) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(script.scriptText);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <Card
        ref={dragRef}
        className="absolute pointer-events-auto bg-white dark:bg-gray-900 border-2 shadow-xl min-w-[350px] max-w-[500px]"
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'default'
        }}
        data-testid="draggable-script-popup"
      >
        <CardHeader 
          className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          data-testid="script-popup-header"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <div className="flex flex-col">
              <h3 className="text-sm font-medium">{script.chartTitle}</h3>
              <p className="text-xs text-gray-500">~{script.estimatedDuration} sec script</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {speechSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSpeak}
                className="h-8 w-8 p-0"
                data-testid="button-speak-script"
                title={isSpeaking ? "Stop speaking" : "Read script aloud"}
              >
                {isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
              data-testid="button-minimize-script"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              data-testid="button-close-script"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        {!isMinimized && (
          <CardContent className="pt-0" data-testid="script-popup-content">
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto">
                <p className="text-sm leading-relaxed whitespace-pre-line" data-testid="text-script-content">
                  {script.scriptText}
                </p>
              </div>
              
              {script.keyPoints && script.keyPoints.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Key Points to Emphasize:
                  </h4>
                  <ul className="space-y-1" data-testid="list-key-points">
                    {script.keyPoints.map((point, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}