import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, X, Sparkles, Mic, RotateCcw } from 'lucide-react';
import { birthdayConfig as config } from './birthdayConfig';
const Cake3D = lazy(() => import('./BirthdayObjects').then(m => ({ default: m.Cake3D })));
const Gift3D = lazy(() => import('./BirthdayObjects').then(m => ({ default: m.Gift3D })));

const scenes = ['The beginning', 'A universe', 'Memories', 'A letter', 'Make a wish', 'One more thing', 'Forever'];

class Scene3DErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('3D scene unavailable; rendering its non-WebGL fallback.', error); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function GiftFallback({ className = '' }: { className?: string }) {
  return <div className={`webgl-fallback ${className}`} aria-hidden="true"><div className="fallback-halo"/><div className="fallback-gift"><i/><b/><span>✦</span></div></div>;
}

function CakeFallback() {
  return <div className="webgl-fallback cake-fallback" aria-hidden="true"><div className="fallback-candles"><i/><i/><i/><i/><i/></div><div className="fallback-tier tier-a"/><div className="fallback-tier tier-b"/><div className="fallback-tier tier-c"><span>{config.name.toUpperCase()}</span></div><div className="fallback-plate"/></div>;
}

function Stars({ count = 100 }: { count?: number }) {
  return <div className="stars" aria-hidden="true">{Array.from({ length: count }, (_, i) => <i key={i} style={{ left: `${(i * 47.13) % 100}%`, top: `${(i * 29.71) % 100}%`, animationDelay: `${(i % 9) * -.7}s`, opacity: .25 + (i % 7) * .1, transform: `scale(${.5 + (i % 5) * .18})` }} />)}</div>;
}

function GlowOrb({ className = '' }: { className?: string }) { return <div aria-hidden="true" className={`orb ${className}`} />; }

function MemoryImage({ src, title, index, preview = false }: { src: string; title: string; index: number; preview?: boolean }) {
  const [failed, setFailed] = useState(!src);
  const symbol = ['✧', '☼', '✿', '∞', '✦'][index % 5];
  if (failed) {
    return <div className={`photo-placeholder p${index} ${preview ? 'modal-photo' : 'memory-image-frame'}`} role="img" aria-label={`${title} photo placeholder`}>
      <span>{symbol}</span><small>{src ? 'PHOTO NOT ADDED YET' : 'ADD YOUR PHOTO'}</small>
    </div>;
  }
  const image = <img className={preview ? 'modal-memory-image' : 'memory-image'} src={src} alt={title} onError={() => setFailed(true)} />;
  return preview ? image : <div className="memory-image-frame">{image}</div>;
}

function SceneContent({ index, next, replay }: { index: number; next: () => void; replay: () => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [blown, setBlown] = useState(false);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState('');
  const [envelope, setEnvelope] = useState(false);
  const audioRef = useRef<{ stream: MediaStream; ctx: AudioContext; raf: number } | null>(null);

  const extinguish = useCallback(() => { setBlown(true); setListening(false); if (audioRef.current) { audioRef.current.stream.getTracks().forEach(t => t.stop()); void audioRef.current.ctx.close(); cancelAnimationFrame(audioRef.current.raf); audioRef.current = null; } }, []);
  const startMic = async () => {
    setMicError('');
    let pendingStream: MediaStream | undefined;
    try {
      const stream = pendingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext(); const analyser = ctx.createAnalyser(); analyser.fftSize = 1024;
      await ctx.resume();
      ctx.createMediaStreamSource(stream).connect(analyser); const data = new Uint8Array(analyser.fftSize);
      let loudSince = 0; setListening(true);
      const check = () => { analyser.getByteTimeDomainData(data); let sum = 0; for (const n of data) sum += (n - 128) ** 2; const rms = Math.sqrt(sum / data.length) / 128;
        if (rms > .12) { if (!loudSince) loudSince = performance.now(); if (performance.now() - loudSince > 550) { extinguish(); return; } } else loudSince = 0;
        if (audioRef.current) audioRef.current.raf = requestAnimationFrame(check);
      };
      audioRef.current = { stream, ctx, raf: requestAnimationFrame(check) };
    } catch { pendingStream?.getTracks().forEach(track => track.stop()); setListening(false); setMicError('Microphone unavailable. You can still make a wish with the manual option.'); }
  };
  useEffect(() => () => { if (audioRef.current) { audioRef.current.stream.getTracks().forEach(t => t.stop()); void audioRef.current.ctx.close(); cancelAnimationFrame(audioRef.current.raf); } }, []);

  return <>
    {index === 0 && <section className="scene welcome"><div className="welcome-copy"><p className="eyebrow"><span className="tiny-star">✳</span> A LITTLE UNIVERSE, JUST FOR YOU</p><motion.p className="script" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .5 }}>Hey, {config.name}...</motion.p><motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>Tonight, the stars<br/><em>are all yours.</em></motion.h1><motion.p className="subcopy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}>{config.messages.welcome}</motion.p><motion.button className="button primary" onClick={() => { setOpen(true); window.setTimeout(next, 850); }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1 }}>ENTER YOUR UNIVERSE <ArrowRight size={16}/></motion.button></div><div className="gift-wrap"><div className="halo"/><Scene3DErrorBoundary fallback={<GiftFallback className="welcome-gift-canvas"/>}><Suspense fallback={<div className="canvas-loading">✦</div>}><Gift3D opened={open} onOpen={() => { setOpen(true); window.setTimeout(next, 850); }} className="welcome-gift-canvas"/></Suspense></Scene3DErrorBoundary></div><div className="vignette"/></section>}
    {index === 1 && <section className="scene universe"><div className="planet planet-a"/><div className="planet planet-b"/><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="universe-title"><p className="eyebrow">A CELESTIAL CELEBRATION</p><h1>THE UNIVERSE<br/><span>CELEBRATES</span><br/><em>{config.name.toUpperCase()}</em></h1><p className="subcopy">{config.messages.universe}</p><button className="button outline" onClick={next}>CONTINUE <ArrowRight size={16}/></button></div></section>}
    {index === 2 && <section className="scene memories"><div className="scene-heading"><p className="eyebrow">A COLLECTION OF LITTLE WONDERS</p><h1>Every picture<br/><em>has a story.</em></h1><p className="subcopy">A few spaces for the moments that make your universe yours.</p></div><div className="memory-grid">{config.memories.map((m, i) => <button className={`memory-card card-${i}`} key={m.title} onClick={() => setSelected(i)}><MemoryImage src={m.image} title={m.title} index={i}/><div className="memory-caption"><span>MEMORY 0{i + 1}</span><strong>{m.title}</strong></div></button>)}</div><p className="memory-outro">Some moments become memories.<br/><em>Some people become unforgettable.</em></p></section>}
    {index === 3 && <section className="scene letter-scene"><div className="letter-glow"/><div className="letter-intro"><p className="eyebrow">A NOTE FROM THE HEART</p><h1>Just for <em>you.</em></h1><p className="subcopy">A little something, written in the quiet between stars.</p><button className={`envelope ${envelope ? 'is-open' : ''}`} onClick={() => setEnvelope(true)} aria-label="Open birthday letter"><span className="env-flap"/><span className="env-seal">✦</span><span className="env-label">FOR {config.name.toUpperCase()}</span></button><span className="hint">{envelope ? 'WITH ALL MY LOVE' : 'TAP TO OPEN'}</span></div><AnimatePresence>{envelope && <motion.article className="letter" initial={{ opacity: 0, y: 35, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: .8 }}><button className="close" onClick={() => setEnvelope(false)}><X size={18}/></button><div className="letter-inner"><p className="script">Dear {config.name},</p><p>Some people make the world a little brighter just by being in it.</p><p>And today, the universe is celebrating someone truly special — <strong>YOU.</strong></p><p>I hope your life is always filled with beautiful surprises, endless laughter, unforgettable adventures, and countless reasons to smile.</p><p>May every dream you secretly hold find its way into reality.</p><p>Keep smiling, keep shining, and never stop being the wonderful person you are.</p><p>You deserve all the happiness in this universe.</p><p className="letter-happy">Happy Birthday, {config.name}! <span>♥</span></p><p className="signoff">With lots of love.</p></div></motion.article>}</AnimatePresence></section>}
    {index === 4 && <section className="scene cake-scene"><div className="cake-copy"><p className="eyebrow">MAKE A WISH, {config.name.toUpperCase()}</p><h1>{blown ? <>Your wish is<br/><em>on its way.</em></> : <>A moment<br/><em>just for you.</em></>}</h1><p className="subcopy">{blown ? 'May every little hope find its way to the stars.' : 'Close your eyes. Think of something wonderful.'}</p></div><div className={`cake-stage ${blown ? 'celebrate' : ''}`}><div className="cake-aura"/><Scene3DErrorBoundary fallback={<CakeFallback/>}><Suspense fallback={<div className="canvas-loading">Preparing your cake ✦</div>}><Cake3D blown={blown} candles={config.candleCount}/></Suspense></Scene3DErrorBoundary>{blown && <><div className="confetti">{Array.from({length: 35}, (_, i) => <i key={i} style={{left:`${(i*39)%100}%`, animationDelay:`${i%7*.08}s`}}/>)}</div><div className="smoke-clouds">{Array.from({length: 9}, (_, i) => <i key={i} style={{left:`${15+i*8}%`, animationDelay:`${(i%4)*.12}s`}}/>)}</div></>}</div><div className="cake-controls">{blown ? <div className="wish-success"><span>✦</span> YOUR WISH HAS BEEN SENT TO THE UNIVERSE <span>✦</span></div> : <><button className="button primary" onClick={startMic}><Mic size={16}/>{listening ? 'LISTENING FOR YOUR WISH…' : 'BLOW THE CANDLES'}</button><button className="button text-button" onClick={extinguish}>BLOW WITHOUT MICROPHONE</button>{micError && <p className="mic-error" role="status">{micError}</p>}</>}</div></section>}
    {index === 5 && <section className="scene surprise"><div className="surprise-copy"><p className="eyebrow">ONE LAST LITTLE WONDER</p><h1>Wait… there’s<br/><em>one more thing.</em></h1><button className="button primary" onClick={() => setOpen(true)}>OPEN YOUR FINAL GIFT <ArrowRight size={16}/></button></div><Scene3DErrorBoundary fallback={<GiftFallback className="surprise-gift-canvas"/>}><Suspense fallback={<div className="canvas-loading surprise-gift-canvas">✦</div>}><Gift3D opened={open} onOpen={() => setOpen(true)} className="surprise-gift-canvas"/></Suspense></Scene3DErrorBoundary><AnimatePresence>{open && <motion.div className="gift-reveal" initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} exit={{opacity:0}}><button className="close" onClick={() => setOpen(false)}><X size={18}/></button><Sparkles size={24}/><p className="eyebrow">A WISH FOR YOUR NEXT CHAPTER</p><h2>May this next trip<br/>around the sun bring<br/><em>beautiful beginnings.</em></h2><p>More laughter, more wonder, more reasons to look up at the stars.</p>{config.surpriseMedia && <img src={config.surpriseMedia} alt={`A surprise for ${config.name}`}/>}</motion.div>}</AnimatePresence></section>}
    {index === 6 && <section className="scene finale"><div className="final-orb">{config.name.toUpperCase()}</div><div className="fireworks">{Array.from({length: 7}, (_, i) => <span key={i} style={{left:`${10+i*13}%`, top:`${12+(i*31)%55}%`, animationDelay:`${i*.5}s`}}/>)}</div><div className="final-copy"><p className="eyebrow">YOUR VERY OWN CONSTELLATION</p><h1>HAPPY BIRTHDAY,<br/><em>{config.name.toUpperCase()}!</em></h1><p className="final-sub">{config.messages.final}</p><p className="final-note">Today, tomorrow, and always —<br/>you deserve the very best.</p><span className="final-sign">{config.messages.signoff}</span><button className="button outline" onClick={replay}><RotateCcw size={15}/> RELIVE THE MAGIC</button></div></section>}
    <AnimatePresence>{selected !== null && <motion.div className="photo-modal" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelected(null)}><button className="close" aria-label="Close photo preview"><X size={20}/></button><motion.div className="modal-content" initial={{scale:.92}} animate={{scale:1}} onClick={event => event.stopPropagation()}><MemoryImage src={config.memories[selected].image} title={config.memories[selected].title} index={selected} preview/><p className="eyebrow">MEMORY 0{selected+1}</p><h2>{config.memories[selected].title}</h2><p>{config.memories[selected].caption}</p></motion.div></motion.div>}</AnimatePresence>
  </>;
}

export default function App() {
  const [scene, setScene] = useState(() => Math.max(0, Math.min(6, (Number(location.hash.slice(2)) || 1) - 1))); const [muted, setMuted] = useState(true); const [loaded, setLoaded] = useState(false); const audio = useRef<HTMLAudioElement | null>(null); const skipHistory = useRef(false);
  useEffect(() => { const timer = setTimeout(() => setLoaded(true), 1450); const onPop = () => { skipHistory.current = true; setScene(Math.max(0, Math.min(6, (Number(location.hash.slice(2)) || 1) - 1))); }; window.addEventListener('popstate', onPop); return () => { clearTimeout(timer); window.removeEventListener('popstate', onPop); }; }, []);
  useEffect(() => { if (skipHistory.current) { skipHistory.current = false; return; } history.pushState({scene}, '', `#s${scene+1}`); }, [scene]);
  const move = (n: number) => setScene(Math.max(0, Math.min(6, n)));
  const startAudio = () => { setMuted(m => !m); if (audio.current) { if (muted) void audio.current.play().catch(() => {}); else audio.current.pause(); } };
  return <main className={`app scene-${scene}`}><audio ref={audio} src={config.audio.ambient || undefined} loop/><div className="cosmos-bg"><Stars count={scene === 6 ? 180 : 110}/><GlowOrb className="orb-one"/><GlowOrb className="orb-two"/><div className="nebula"/></div><AnimatePresence>{!loaded && <motion.div className="loader" exit={{opacity:0}} transition={{duration:.7}}><div className="loader-mark">✦</div><div className="loader-ring"/><p>PREPARING SOMETHING SPECIAL FOR {config.name.toUpperCase()}…</p></motion.div>}</AnimatePresence><AnimatePresence mode="wait" initial={false}><motion.div className="scene-shell" key={scene} initial={{opacity:0, scale:.985, filter:'blur(6px)'}} animate={{opacity:1, scale:1, filter:'blur(0px)'}} exit={{opacity:0, scale:1.015, filter:'blur(7px)'}} transition={{duration:.75, ease:[.22,1,.36,1]}}><SceneContent index={scene} next={() => move(scene+1)} replay={() => move(0)}/></motion.div></AnimatePresence><header className="topbar"><a className="brand" href="#s1" onClick={e=>{e.preventDefault();move(0)}}><span>✦</span> CHARU <small>✧</small></a><button className="sound-toggle" onClick={startAudio} title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX size={17}/> : <Volume2 size={17}/>}<span>{muted ? 'SOUND OFF' : 'SOUND ON'}</span></button></header>{loaded && <><div className="progress-area"><span>{String(scene+1).padStart(2,'0')}</span><div className="progress-track"><i style={{width:`${((scene+1)/7)*100}%`}}/></div><span>07</span></div><div className="scene-nav">{scene > 0 && <button onClick={() => move(scene-1)} aria-label="Previous scene"><ArrowLeft size={16}/></button>}<span>{scenes[scene]}</span>{scene < 6 && <button onClick={() => move(scene+1)} aria-label="Next scene"><ArrowRight size={16}/></button>}</div></>}</main>;
}
