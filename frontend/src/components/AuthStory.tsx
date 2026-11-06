import React, { useState } from 'react';
import { BrandMark } from './BrandMark';
import { ArrowUpRight, Bell, HeartHandshake, Check, Pause, Play } from 'lucide-react';

/** Original vector artwork, kept local and crisp at every viewport. */
export const CareIllustration: React.FC = () => (
  <div className="care-art" aria-hidden="true">
    <svg viewBox="0 0 600 380" fill="none" className="care-art-drawing">
      <circle cx="310" cy="190" r="157" stroke="currentColor" strokeOpacity=".15" />
      <circle cx="310" cy="190" r="123" stroke="currentColor" strokeOpacity=".12" strokeDasharray="2 8" />
      <path d="M90 302H520" stroke="currentColor" strokeOpacity=".18" />
      <circle cx="410" cy="89" r="46" fill="#D9AB85" />
      <g className="care-plant">
        <path d="M310 303V127M310 249L245 194M310 218L368 159M310 176L273 143" stroke="#D9DFBC" strokeWidth="3" strokeLinecap="round" />
        <path d="M310 252C244 257 202 224 201 173C251 167 298 193 310 252Z" fill="#91A885" />
        <path d="M310 220C312 158 345 122 393 122C394 170 365 212 310 220Z" fill="#C3CAA5" />
        <path d="M310 179C263 178 239 152 242 115C279 115 308 140 310 179Z" fill="#D9DFBC" />
        <path d="M310 145C287 116 294 80 322 57C344 89 339 122 310 145Z" fill="#91A885" />
        <path d="M310 252L219 189M310 220L378 137M310 179L253 127M310 145L321 74" stroke="#284C3E" strokeOpacity=".35" strokeWidth="1.2" />
      </g>
      <path d="M265 273H355L344 319H276L265 273Z" fill="#CA8D70" />
      <path d="M265 273H355M273 285H347" stroke="#E7B498" strokeWidth="2" />
      <path d="M288 291V310M300 291V312M312 291V312M324 291V312M336 291V310" stroke="#A86F56" strokeWidth="1.5" />
      <path d="M151 115V133M142 124H160M467 235V253M458 244H476" stroke="#D9DFBC" strokeWidth="1.5" />
      <circle cx="195" cy="75" r="3" fill="#D9DFBC" /><circle cx="464" cy="167" r="3" fill="#D9DFBC" />
      <path className="care-orbit" d="M139 268C105 231 151 140 253 92" stroke="#D9DFBC" strokeOpacity=".45" strokeWidth="1.5" strokeDasharray="3 7" />
    </svg>
    <div className="care-note care-note-reminder"><span className="care-note-icon"><Bell size={17} /></span><span><small>A gentle reminder</small><strong>One less thing to remember.</strong></span></div>
    <div className="care-note care-note-family"><span className="care-note-icon"><HeartHandshake size={18} /></span><span><small>A little closer</small><strong>Even when you’re apart.</strong></span><Check size={15} /></div>
    <span className="care-art-caption">SMALL ROUTINES. EVERYDAY REASSURANCE.</span>
  </div>
);

export const AuthStory: React.FC<{ register?: boolean }> = ({ register = false }) => {
  const [paused, setPaused] = useState(false);
  return (
    <section className="auth-story" data-motion-paused={paused} aria-label="About CareNest">
      <div className="auth-story-top"><BrandMark /><span className="auth-edition">A little help, every day <ArrowUpRight size={14} /></span></div>
      <div className="auth-story-body">
        <p className="auth-kicker"><span /> YOUR DAILY CARE, TOGETHER</p>
        <h2 className="auth-story-heading">{register ? <>Good care starts<br />with <em>connection.</em></> : <>A little care.<br />A <em>lighter</em> day.</>}</h2>
        <p className="auth-story-lede">Your medicines, a gentle nudge, and the people who care.<br className="hidden xl:block" /> A simpler way to feel on top of your day.</p>
        <CareIllustration />
        <button className="auth-motion-control" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? 'Play illustration motion' : 'Pause illustration motion'}>{paused ? <Play size={12} /> : <Pause size={12} />}<span>{paused ? 'Play motion' : 'Pause motion'}</span></button>
      </div>
      <div className="auth-story-bottom">
        <div><span>01</span><p>Keep your<br /><strong>routine.</strong></p></div>
        <div><span>02</span><p>Find your<br /><strong>answers.</strong></p></div>
        <div><span>03</span><p>Stay<br /><strong>connected.</strong></p></div>
      </div>
    </section>
  );
};
