'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Sparkles as R3FSparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowDown, ArrowRight, CalendarDays, Check, ChevronRight, Clock3, Heart, MapPin, Music, Send, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const weddingDate = new Date('2026-12-23T09:00:00+05:00');

const gallery = [
  { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=90', alt: 'Couple outdoors', caption: 'The beginning' },
  { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=90', alt: 'Wedding portrait', caption: 'Two souls' },
  { src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=90', alt: 'Wedding details', caption: 'Little details' },
  { src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?auto=format&fit=crop&w=1600&q=90', alt: 'Wedding celebration', caption: 'A new chapter' },
];

const moments = [
  { no: '01', time: '09:00', title: 'Nikkah', text: 'With duas, family, and hearts full of gratitude.' },
  { no: '02', time: '10:00', title: 'Celebration', text: 'A warm gathering with the people we love most.' },
  { no: '03', time: '11:00', title: 'Rukhsati', text: 'A tender goodbye and the beginning of forever.' },
];

function pad(value: number) {
  return String(Math.max(0, value)).padStart(2, '0');
}

function triggerCustomConfetti() {
  const count = 150;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#e0a8b3', '#c98a96', '#f2d6dc', '#d2ab72', '#ffffff', '#b99159']
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
}

function addToCalendar() {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//NimraOwais//Wedding//EN', 'BEGIN:VEVENT',
    'UID:nimra-owais-wedding-2026@invite.local', 'DTSTAMP:20260818T000000Z', 'DTSTART:20261223T090000', 'DTEND:20261223T120000',
    'SUMMARY:Nimra & Owais — Wedding', 'LOCATION:C-184, Block J, North Nazimabad, Karachi', 'DESCRIPTION:Wedding celebration of Nimra & Owais.',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nimra-owais-wedding.ics';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function Reveal({ children, className = '', delay = 0, from = 'up' }: { children: React.ReactNode; className?: string; delay?: number; from?: 'up'|'left'|'right' }) {
  const x = from === 'left' ? -40 : from === 'right' ? 40 : 0;
  const y = from === 'up' ? 20 : 0;
  return (
    <motion.div 
      className={className} 
      initial={{ opacity: 0, x, y }} 
      whileInView={{ opacity: 1, x: 0, y: 0 }} 
      viewport={{ once: true, amount: 0.1 }} 
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Atmosphere() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.02;
  });
  return (
    <group ref={group}>
      <Float speed={0.2} rotationIntensity={0.03} floatIntensity={0.2}>
        <mesh><torusGeometry args={[2.2, 0.014, 8, 80]} /><meshBasicMaterial color="#d2ab72" transparent opacity={0.2} /></mesh>
        <mesh rotation={[Math.PI / 2, 0.5, 0.7]}><torusGeometry args={[2.75, 0.01, 8, 80]} /><meshBasicMaterial color="#efc3cb" transparent opacity={0.18} /></mesh>
      </Float>
      <R3FSparkles count={25} scale={6} size={0.8} speed={0.04} color="#ead5c2" />
      <Environment preset="studio" environmentIntensity={0.3} />
    </group>
  );
}

type IntroPhase = 'cover' | 'opening' | 'questions';

export default function Home() {
  const [phase, setPhase] = useState<IntroPhase>('cover');
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [siteVisible, setSiteVisible] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [soundOn, setSoundOn] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, mass: 0.1 });
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 60]);
  const heroScale = useTransform(scrollYProgress, [0, 0.22], [1, 0.98]);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, weddingDate.getTime() - Date.now());
      const total = Math.floor(diff / 1000);
      setTimeLeft({ days: Math.floor(total / 86400), hours: Math.floor((total % 86400) / 3600), mins: Math.floor((total % 3600) / 60), secs: total % 60 });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const audio = new Audio('backgroundmusic.mp4');
    audio.loop = true;
    audio.volume = 0.25;
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => { audio.pause(); audio.currentTime = 0; };
  }, []);

  const countdown = useMemo(() => [
    ['DAYS', timeLeft.days], ['HOURS', timeLeft.hours], ['MINUTES', timeLeft.mins], ['SECONDS', timeLeft.secs],
  ] as const, [timeLeft]);

  async function openInvitation() {
    setPhase('opening');
    const audio = audioRef.current;
    if (audio) {
      try { 
        audio.currentTime = 0;
        await audio.play(); 
        setSoundOn(true); 
      } catch (err) { 
        console.log("Audio autoplay prevented:", err);
        setSoundOn(false); 
      }
    }
    // 2.5 seconds pause for the opening slide animation before showing questions
    window.setTimeout(() => setPhase('questions'), 2500);
  }

  async function toggleSound() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { 
        await audio.play(); 
        setSoundOn(true); 
      } catch (err) { 
        setSoundOn(false); 
      }
    } else {
      audio.pause();
      setSoundOn(false);
    }
  }

  function choose(value: string) {
    setAnswers((current) => [...current, value]);
    if (question < 2) {
      setQuestion((q) => q + 1);
      return;
    }
    setPhase('cover');
    window.setTimeout(() => {
      setSiteVisible(true);
      triggerCustomConfetti();
      window.setTimeout(() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, 400);
  }

  function skipPrelude() {
    setPhase('cover');
    setSiteVisible(true);
    triggerCustomConfetti();
    window.setTimeout(() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
        triggerCustomConfetti();
      } else {
        alert('Something went wrong, please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to send message.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="vip-page">
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />

      <AnimatePresence mode="wait">
        {!siteVisible && (
          <motion.section className="experience-intro" key={phase} initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <div className="intro-canvas">
              <Canvas camera={{ position: [0, 0, 8], fov: 38 }} dpr={[1, 1]} gl={{ powerPreference: 'high-performance', antialias: false }}>
                <ambientLight intensity={0.68} />
                <pointLight position={[2, 3, 4]} intensity={6} color="#f9d7df" />
                <Atmosphere />
              </Canvas>
            </div>
            <div className="intro-overlay" />

            <AnimatePresence mode="wait">
              {phase === 'cover' && (
                <motion.div 
                  className="card-stage" 
                  key="cover" 
                  initial={{ opacity: 0, scale: 0.96 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 1.05 }} 
                  transition={{ duration: 0.5 }}
                >
                  <div className="card-aura" />
                  <div className="invitation-card real-card-wrap">
                    <div className="card-shadow" />
                    <motion.div 
                      className="real-card-container" 
                      onClick={openInvitation}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <img 
                        src="/envlop.jpg" 
                        alt="Elegant Wedding Envelope Flap with N O Wax Seal" 
                        className="real-card-img"
                        loading="eager"
                      />
                      <div className="envelope-overlay-shade" />
                      <div className="envelope-tap-hint"><span>Click to Open</span></div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {phase === 'opening' && (
                <motion.div 
                  className="opened-card-stage" 
                  key="opening" 
                  initial={{ opacity: 0, y: 0 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -50 }} 
                  transition={{ duration: 0.6 }}
                >
                  <motion.div 
                    className="opened-card sliding-envelope-card"
                    initial={{ y: 0, scale: 1 }}
                    animate={{ y: -400, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                  >
                    <div className="card-inside">
                      <div className="inside-border" />
                      <div className="inside-topline"><span /><Heart size={12} fill="currentColor" /><span /></div>
                      <div className="inside-script">A beautiful</div>
                      <div className="inside-title">beginning</div>
                      <p>Your invitation<br />is ready.</p>
                      <div className="inside-mark">N <i>&</i> O</div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {phase === 'questions' && (
                <motion.div className="question-stage" key="questions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                  <div className="question-progress"><span>THE PRELUDE</span><b>0{question + 1}</b><i>/ 03</i></div>
                  <AnimatePresence mode="wait">
                    <motion.div key={question} className="question-card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                      <div className="question-ornament"><span /><Heart size={13} fill="currentColor" /><span /></div>
                      {question === 0 && <>
                        <div className="question-kicker">BEFORE WE BEGIN</div>
                        <h1>Will you be joining us<br /><em>in person?</em></h1>
                        <p>We’ve kept one little question before the doors open. Answer from the heart.</p>
                        <div className="question-options">
                          <button onClick={() => choose('joining')}><span>01</span><b>Happily, I’ll be there</b><ArrowRight size={17} /></button>
                          <button onClick={() => choose('afar')}><span>02</span><b>Sending love from afar</b><ArrowRight size={17} /></button>
                        </div>
                      </>}
                      {question === 1 && <>
                        <div className="question-kicker">ONE MORE THING</div>
                        <h1>What should we<br /><em>show you first?</em></h1>
                        <p>Choose the part of our celebration you’re most curious to discover.</p>
                        <div className="question-options">
                          <button onClick={() => choose('story')}><span>01</span><b>Our story & little moments</b><ArrowRight size={17} /></button>
                          <button onClick={() => choose('details')}><span>02</span><b>The day, place & details</b><ArrowRight size={17} /></button>
                        </div>
                      </>}
                      {question === 2 && <>
                        <div className="question-kicker">THE LAST LITTLE STEP</div>
                        <h1>Ready to make this<br /><em>day beautiful?</em></h1>
                        <p>Take a breath. Open the celebration. Everything else can wait.</p>
                        <div className="question-options single"><button onClick={() => choose('enter')}><span>03</span><b>Let’s enter the celebration</b><ArrowRight size={17} /></button></div>
                      </>}
                    </motion.div>
                  </AnimatePresence>
                  <button className="skip-prelude" onClick={skipPrelude}>Skip this little prelude</button>
                </motion.div>
              )}
            </AnimatePresence>

            {phase !== 'questions' && (
              <div className="intro-footer"><span>WITH LOVE</span><span className="footer-dot" /><span>WITH DUAS</span></div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {siteVisible && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <header className="site-nav">
            <div className="nav-mark">N <span>&</span> O</div>
            <div className="nav-center">23 · 12 · 2026</div>
            <button onClick={toggleSound} aria-label="Toggle music" className={`nav-music-pill ${soundOn ? 'playing' : ''}`}>
              <div className="music-icon-wrap"><Music size={14} /></div>
              <div className="equalizer-bars"><span /><span /><span /></div>
              <span className="music-label">{soundOn ? 'Playing Music' : 'Play Music'}</span>
            </button>
          </header>

          <section id="hero" className="hero-section">
            <div className="hero-aura aura-a" /><div className="hero-aura aura-b" />
            <motion.div className="hero-inner" style={{ y: heroY, scale: heroScale }}>
              <Reveal className="hero-kicker">WE’RE GETTING MARRIED</Reveal>
              <Reveal delay={0.05}><div className="hero-script">a beautiful new beginning</div></Reveal>
              <Reveal delay={0.1}><h1 className="hero-names"><span>Nimra</span><i>&</i><span>Owais</span></h1></Reveal>
              <Reveal delay={0.15}><p className="hero-message">Two hearts. One promise. A lifetime waiting to unfold.</p></Reveal>
              <Reveal delay={0.2} className="hero-detail-row"><span>WEDNESDAY</span><b>23</b><span>DECEMBER</span><b>2026</b><span>KARACHI</span></Reveal>
              <Reveal delay={0.25}><button className="hero-discover" onClick={() => document.getElementById('countdown')?.scrollIntoView({ behavior: 'smooth' })}>Begin the story <ArrowDown size={16} /></button></Reveal>
            </motion.div>
            <div className="hero-side-label left">KARACHI · PAKISTAN</div><div className="hero-side-label right">WITH LOVE, ALWAYS</div>
            <div className="hero-bottom-cue"><span>SCROLL TO DISCOVER</span><i /></div>
          </section>

          <section id="countdown" className="editorial-section blush-section">
            <div className="section-inner">
              <div className="section-topline"><span>01</span><i /><span>COUNTING THE DAYS</span></div>
              <Reveal from="left"><h2 className="editorial-heading">Until the day becomes<br /><em>our forever.</em></h2></Reveal>
              <Reveal from="right" delay={0.05}><p className="editorial-lede">Soon, our favourite people will gather in one place, prayers will be whispered, photographs will be taken, and one beautiful chapter will begin.</p></Reveal>
              <div className="lux-countdown">
                {countdown.map(([label, value], index) => (
                  <div key={label} className="lux-unit">
                    <span className="unit-no">0{index + 1}</span>
                    <b>{pad(value as number)}</b>
                    <span className="unit-label">{label}</span>
                  </div>
                ))}
              </div>
              <Reveal className="center-cta"><button className="gold-outline" onClick={addToCalendar}><CalendarDays size={16} /> Add to calendar</button></Reveal>
            </div>
          </section>

          <section className="editorial-section story-section">
            <div className="section-inner story-layout">
              <Reveal from="left" className="story-copy">
                <div className="section-topline"><span>02</span><i /><span>A NOTE FROM US</span></div>
                <h2 className="editorial-heading">Some stories are meant to be <em>celebrated.</em></h2>
                <p>Ours grew quietly — through conversations, laughter, family, and the thousand little moments that made two lives feel like one.</p>
                <p>Now we’re opening the doors to one day we know we’ll remember forever. And having you there would make it even more special.</p>
                <div className="signature"><span>With love, always</span><b>Nimra & Owais</b></div>
              </Reveal>
              <div className="story-photo-wrap">
                <img src={gallery[1].src} alt={gallery[1].alt} loading="lazy" />
                <div className="photo-float-card"><span>CHAPTER I</span><b>Forever starts here.</b></div>
              </div>
            </div>
          </section>

          <section className="editorial-section gallery-section">
            <div className="section-inner">
              <div className="gallery-heading">
                <Reveal from="left">
                  <div className="section-topline"><span>03</span><i /><span>THE MOMENTS</span></div>
                  <h2 className="editorial-heading">A little glimpse of<br /><em>our story.</em></h2>
                </Reveal>
                <Reveal from="right" delay={0.05}><p>Four frames. A hundred memories. And many more waiting for us.</p></Reveal>
              </div>
              <div className="gallery-mosaic">
                {gallery.map((item, i) => (
                  <button key={item.src} className={`mosaic-item item-${i + 1}`} onClick={() => setLightbox(i)}>
                    <img src={item.src} alt={item.alt} loading="lazy" />
                    <div className="mosaic-shade" />
                    <div className="mosaic-caption"><span>0{i + 1}</span><b>{item.caption}</b></div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="editorial-section venue-section">
            <div className="section-inner">
              <Reveal from="left">
                <div className="section-topline light"><span>04</span><i /><span>THE VENUE</span></div>
                <h2 className="editorial-heading light">Where the day becomes a<br /><em>memory.</em></h2>
              </Reveal>
              <div className="venue-grid-wrap">
                <div className="venue-art-real">
                  <iframe 
                    title="C-184 Block J North Nazimabad Karachi Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3618.3944686255755!2d67.0315!3d24.9262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33f972b260907%3A0x1cbd28990d0b7410!2sBlock%20J%20North%20Nazimabad%2C%20Karachi%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy" 
                  />
                </div>
                <Reveal from="right" className="venue-copy">
                  <div className="venue-kicker">JOIN US</div>
                  <h3>Wednesday,<br />23 December 2026</h3>
                  <div className="venue-line"><Clock3 size={16} /> 09:00 AM onwards</div>
                  <div className="venue-line"><MapPin size={16} /> C-184, Block J, North Nazimabad, Karachi</div>
                  <p>Come as you are. Stay a little longer. Celebrate with the people who mean the most.</p>
                  <a href="https://www.google.com/maps/search/?api=1&query=C-184%2C%20Block%20J%2C%20North%20Nazimabad%2C%20Karachi" target="_blank" rel="noopener noreferrer">Open in Google Maps <ChevronRight size={16} /></a>
                </Reveal>
              </div>
            </div>
          </section>

          <section className="editorial-section timeline-section">
            <div className="section-inner narrow">
              <Reveal>
                <div className="section-topline"><span>05</span><i /><span>THE DAY</span></div>
                <h2 className="editorial-heading">A few moments we’ll<br /><em>never forget.</em></h2>
              </Reveal>
              <div className="lux-timeline">
                {moments.map((item, i) => (
                  <div className="timeline-row" key={item.title}>
                    <div className="timeline-left"><span>{item.no}</span><b>{item.time}</b></div>
                    <div className="timeline-marker"><i /></div>
                    <div className="timeline-right"><span>THE MOMENT</span><h3>{item.title}</h3><p>{item.text}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="editorial-section rsvp-section">
            <div className="section-inner narrow">
              <Reveal from="left">
                <div className="section-topline"><span>06</span><i /><span>RSVP</span></div>
                <h2 className="editorial-heading">Save us a seat<br /><em>in your heart.</em></h2>
                <p className="editorial-lede">A simple response is all we need. We cannot wait to celebrate this beautiful day with you.</p>
              </Reveal>
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form key="form" className="rsvp-card" onSubmit={submit} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                    <div className="rsvp-head">
                      <div><span>YOUR RESPONSE</span><h3>We’d love to hear from you.</h3></div>
                      <Heart size={19} />
                    </div>
                    <label>Full name<input name="name" required placeholder="Your full name" /></label>
                    <label>Email <small>(optional)</small><input name="email" type="email" placeholder="you@example.com" /></label>
                    <div className="field-title">Will you be joining us?</div>
                    <div className="rsvp-choice">
                      <button type="button" className={attending === 'yes' ? 'selected' : ''} onClick={() => setAttending('yes')}><Check size={16} /> Happily, yes</button>
                      <button type="button" className={attending === 'no' ? 'selected' : ''} onClick={() => setAttending('no')}><X size={16} /> With love, no</button>
                    </div>
                    <label>Message <small>(optional)</small><textarea name="message" rows={5} placeholder="Leave us a little note..." /></label>
                    <button className="submit-rsvp" type="submit" disabled={loading}>
                      {loading ? 'Sending...' : 'Send'} <Send size={16} />
                    </button>
                  </motion.form>
                ) : (
                  <motion.div key="success" className="rsvp-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="success-seal"><Heart size={22} fill="currentColor" /></div>
                    <span>RESPONSE RECEIVED</span>
                    <h3>Thank you for being part of our story.</h3>
                    <p>We’re so happy to share this beautiful chapter with you.</p>
                    <button className="gold-outline" onClick={() => setSubmitted(false)}>Edit response</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <footer className="lux-footer">
            <div className="footer-ornament"><i /><Heart size={13} fill="currentColor" /><i /></div>
            <div className="footer-names">Nimra <em>&</em> Owais</div>
            <p>23 · 12 · 2026 · Karachi</p>
            <small>Made for a lifetime of memories.</small>
          </footer>
        </motion.div>
      )}

      <AnimatePresence>{lightbox !== null && <div className="lightbox" onClick={() => setLightbox(null)}><div className="lightbox-inner" onClick={(e) => e.stopPropagation()}><img src={gallery[lightbox].src} alt={gallery[lightbox].alt} /><button onClick={() => setLightbox(null)} className="lightbox-close" aria-label="Close"><X /></button><div className="lightbox-label"><span>0{lightbox + 1}</span><b>{gallery[lightbox].caption}</b></div></div></div>}</AnimatePresence>

      <style jsx global>{`
        .experience-intro{position:fixed;inset:0;z-index:11000;overflow:hidden;background:radial-gradient(circle at 50% 38%,#60434b 0%,#3c262d 42%,#21161b 82%);display:grid;place-items:center}
        .intro-canvas{position:absolute;inset:0;opacity:.8}
        .intro-overlay{position:absolute;inset:0;background:radial-gradient(circle at 50% 44%,rgba(252,229,221,.1),transparent 34%),linear-gradient(180deg,rgba(26,13,18,.12),rgba(26,13,18,.48))}
        .card-stage{position:relative;width:min(900px,100vw);display:grid;place-items:center}
        .card-aura{position:absolute;width:min(680px,82vw);height:min(680px,82vw);border-radius:50%;background:radial-gradient(circle,rgba(221,174,180,.16),transparent 69%);filter:blur(10px)}
        .invitation-card{position:relative;width:min(450px,calc(100vw - 40px));height:min(650px,calc(100vh - 40px));min-height:500px;perspective:1500px}
        .card-shadow{position:absolute;inset:4% 6% -5%;background:rgba(0,0,0,.45);filter:blur(30px);transform:translateY(20px);border-radius:18px}
        
        .real-card-container{position:absolute;inset:0;z-index:2;cursor:pointer;border-radius:12px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.4);border:2px solid rgba(212,175,55,0.4);display:flex;align-items:center;justify-content:center;transition:transform 0.3s ease}
        .real-card-img{width:100%;height:100%;object-fit:cover}
        .envelope-overlay-shade{position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.3) 100%);pointer-events:none}
        .envelope-tap-hint{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.6);border:1px solid rgba(212,175,55,0.5);padding:6px 16px;border-radius:20px;color:#f2d6dc;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;backdrop-filter:blur(4px);pointer-events:none}
        
        .opened-card-stage{position:relative;width:min(900px,100vw);display:grid;place-items:center;overflow:hidden}
        .opened-card{width:min(650px,calc(100vw - 52px));height:min(780px,calc(100vh - 52px));min-height:600px;position:relative}
        .card-inside{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;background:linear-gradient(145deg,#fffaf4,#f6e9df 58%,#ecdcd8);box-shadow:0 34px 90px rgba(0,0,0,.25);color:#3d2d32;border-radius:12px}
        .inside-border{position:absolute;inset:18px;border:1px solid rgba(170,118,101,.24)}
        .inside-topline{display:flex;align-items:center;gap:9px;color:#b99159}
        .inside-topline span{width:52px;height:1px;background:linear-gradient(90deg,transparent,#b99159,transparent)}
        .inside-script{font-family:'Great Vibes',cursive;color:#ae6878;font-size:49px;margin-top:28px}
        .inside-title{font-family:'Cormorant Garamond',serif;font-size:88px;line-height:.82;letter-spacing:-.05em}
        .card-inside p{font-size:13px;line-height:1.75;color:#79696d;margin:22px 0 0}
        .inside-mark{margin-top:25px;font-family:'Cormorant Garamond',serif;font-size:37px;color:#7d5c66}
        .inside-mark i{font-family:'Great Vibes',cursive;color:#b99159;font-style:normal;padding:0 4px}

        .question-stage{position:relative;z-index:5;width:min(830px,calc(100vw - 28px));display:flex;flex-direction:column;align-items:center}
        .question-progress{margin-bottom:22px;display:flex;align-items:baseline;gap:10px;font-size:9px;letter-spacing:.18em;color:rgba(255,244,236,.72)}
        .question-progress b{font-family:'Cormorant Garamond',serif;color:#edc99a;font-size:24px;font-weight:500}
        .question-progress i{font-style:normal;opacity:.55}
        .question-card{width:min(720px,calc(100vw - 36px));min-height:560px;padding:54px 54px 46px;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;background:linear-gradient(145deg,rgba(255,250,246,.98),rgba(245,233,225,.98));border:1px solid rgba(194,145,129,.28);box-shadow:0 35px 92px rgba(0,0,0,.22);color:#3e2c31}
        .question-ornament{display:flex;align-items:center;gap:10px;color:#b99159}
        .question-ornament span{width:58px;height:1px;background:linear-gradient(90deg,transparent,#b99159,transparent)}
        .question-kicker{margin-top:21px;font-size:9px;letter-spacing:.27em;color:#9d7079}
        .question-card h1{margin:13px 0 14px;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(48px,7vw,78px);line-height:.93;letter-spacing:-.045em}
        .question-card h1 em{font-family:'Great Vibes',cursive;color:#ab6878;font-size:1em;font-style:normal;letter-spacing:0}
        .question-card>p{max-width:500px;margin:0;font-size:13px;line-height:1.85;color:#766469}
        .question-options{width:100%;max-width:585px;margin-top:29px;display:grid;gap:10px}
        .question-options.single{max-width:500px}
        .question-options button{width:100%;min-height:68px;display:grid;grid-template-columns:40px 1fr 25px;align-items:center;gap:10px;text-align:left;padding:0 18px;border:1px solid rgba(121,83,93,.15);background:rgba(255,255,255,.58);color:#60454d;cursor:pointer}
        .question-options button>span{font-size:10px;letter-spacing:.14em;color:#b08b72}
        .question-options button b{font-size:14px;font-weight:500}
        .question-options button svg{color:#a06876}
        .skip-prelude{margin-top:17px;border:0;background:none;color:rgba(255,244,237,.62);font-size:9px;letter-spacing:.12em;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
        .intro-footer{position:absolute;z-index:5;bottom:20px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;color:rgba(255,244,236,.47);font-size:8px;letter-spacing:.24em;white-space:nowrap}
        .footer-dot{width:3px;height:3px;border-radius:50%;background:#b99159}
        .submit-rsvp:disabled {opacity: 0.7;cursor: not-allowed;}
        .venue-art-real{position:relative;width:100%;height:100%;min-height:360px;border-radius:12px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.3);border:1px solid rgba(212,175,55,0.3)}

        .site-nav{display:flex;justify-content:space-between;align-items:center;padding:15px 30px;position:relative;z-index:100}
        .nav-music-pill{display:inline-flex;width:auto;align-items:center;gap:10px;background:rgba(255,255,255,0.1);border:1px solid rgba(212,175,55,0.4);padding:6px 16px;border-radius:30px;color:#fff;cursor:pointer;flex:none}
        .nav-music-pill.playing{border-color:#d2ab72;background:rgba(210,171,114,0.15)}
        .music-icon-wrap{display:flex;align-items:center;color:#d2ab72}
        .equalizer-bars{display:flex;align-items:flex-end;gap:3px;height:12px;width:16px}
        .equalizer-bars span{display:block;width:3px;background:#d2ab72;border-radius:2px;height:4px}
        .nav-music-pill.playing .equalizer-bars span:nth-child(1){animation:bounceBar 0.6s infinite alternate ease-in-out}
        .nav-music-pill.playing .equalizer-bars span:nth-child(2){animation:bounceBar 0.4s infinite alternate ease-in-out 0.2s}
        .nav-music-pill.playing .equalizer-bars span:nth-child(3){animation:bounceBar 0.5s infinite alternate ease-in-out 0.1s}
        @keyframes bounceBar{0%{height:4px}100%{height:12px}}
        .music-label{font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-family:'Cormorant Garamond',serif;white-space:nowrap}
      `}</style>
    </main>
  );
}