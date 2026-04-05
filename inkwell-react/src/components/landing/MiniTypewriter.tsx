import { useState, useRef, useEffect, useCallback } from 'react';

export function MiniTypewriter() {
  const [text, setText] = useState("");
  const [isSweeping, setIsSweeping] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clackBufferRef = useRef<AudioBuffer | null>(null);
  
  const returnAudioRef = useRef<HTMLAudioElement | null>(null);
  const dingAudioRef = useRef<HTMLAudioElement | null>(null);

  const prevLengthRef = useRef(0);
  const dingPlayedForLineRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus trick so the element stays somewhat engaging
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    returnAudioRef.current = new Audio('/sounds/carriage_return_lever.mp3');
    dingAudioRef.current = new Audio('/sounds/typewriter_ding_sound.wav');

    const initAudio = async () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        const response = await fetch('/sounds/typewriter_key_clack.mp3');
        const arrayBuffer = await response.arrayBuffer();
        clackBufferRef.current = await audioCtxRef.current.decodeAudioData(arrayBuffer);
      } catch (err) {
        console.warn("AudioContext init failed", err);
      }
    };
    initAudio();
  }, []);

  const playClack = useCallback(() => {
    if (audioCtxRef.current && clackBufferRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = clackBufferRef.current;
      source.playbackRate.value = 0.85 + Math.random() * 0.3; // Randomized pitch
      source.connect(audioCtxRef.current.destination);
      source.start();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (returnAudioRef.current) {
        returnAudioRef.current.currentTime = 0;
        returnAudioRef.current.play().catch(()=>{});
      }
      
      setIsSweeping(true);
      setTimeout(() => setIsSweeping(false), 600);
      
      setText(prev => prev + '\n');
      dingPlayedForLineRef.current = false;
      return;
    }
    
    if (e.key.length === 1 || e.key === 'Backspace') {
        playClack();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    
    const lines = val.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Ring bell at 35 characters
    if (currentLine.length >= 35 && !dingPlayedForLineRef.current && val.length >= prevLengthRef.current) {
       if (dingAudioRef.current) {
           dingAudioRef.current.currentTime = 0;
           dingAudioRef.current.play().catch(()=>{});
       }
       dingPlayedForLineRef.current = true;
    }
    if (currentLine.length < 35) {
       dingPlayedForLineRef.current = false;
    }
    
    prevLengthRef.current = val.length;
  };

  return (
    <div className={`mini-typewriter ${isSweeping ? 'sweeping' : ''}`} onClick={() => textareaRef.current?.focus()}>
      <div className="mini-typewriter-paper">
         <div className="mini-text-display">
            {text}
            <span className="mini-cursor">█</span>
         </div>
         <textarea 
            ref={textareaRef}
            className="mini-textarea"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={(e) => e.preventDefault()}
            spellCheck={false}
            placeholder={text.length === 0 ? "Type something..." : ""}
         />
      </div>
    </div>
  );
}
