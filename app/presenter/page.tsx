'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface SlideNote {
  slideNum: number
  title: string
  body: string
}

function parseNotes(text: string): SlideNote[] {
  const lines = text.split('\n')
  const notes: SlideNote[] = []
  let current: SlideNote | null = null

  for (const line of lines) {
    const match = line.match(/^####\s+슬라이드\s+(\d+)(?:~\d+)?:\s*(.*)/)
    if (match) {
      if (current) notes.push(current)
      current = {
        slideNum: parseInt(match[1], 10),
        title: match[2].trim(),
        body: '',
      }
    } else if (current) {
      current.body += line + '\n'
    }
  }
  if (current) notes.push(current)
  return notes
}

export default function PresenterPage() {
  const [notes, setNotes] = useState<SlideNote[]>([])
  const [currentSlide, setCurrentSlide] = useState(1)
  const [totalSlides, setTotalSlides] = useState(0)
  const currentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/presenter-notes.md')
      .then((r) => r.text())
      .then((text) => setNotes(parseNotes(text)))
  }, [])

  const bcRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const bc = new BroadcastChannel('slide-sync')
    bcRef.current = bc
    bc.onmessage = (e) => {
      if (e.data.type === 'slide-change') {
        setCurrentSlide(e.data.slideNumber)
        setTotalSlides(e.data.totalSlides || 0)
      }
    }
    return () => bc.close()
  }, [])

  // Keyboard navigation from presenter notes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        bcRef.current?.postMessage({ type: 'slide-nav', direction: 'next' })
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        bcRef.current?.postMessage({ type: 'slide-nav', direction: 'prev' })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentSlide])

  // Find the note that matches current slide (or closest previous)
  const findNote = useCallback(
    (slideNum: number): SlideNote | undefined => {
      // Exact match first
      const exact = notes.find((n) => n.slideNum === slideNum)
      if (exact) return exact
      // Find closest previous (for range slides like 22~24)
      let closest: SlideNote | undefined
      for (const n of notes) {
        if (n.slideNum <= slideNum) closest = n
      }
      return closest
    },
    [notes],
  )

  const currentNote = findNote(currentSlide)
  const nextNote = findNote(currentSlide + 1)

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#1a1a1a',
        color: '#e0e0e0',
        minHeight: '100vh',
        padding: '20px 32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #333',
          paddingBottom: '12px',
          marginBottom: '24px',
        }}
      >
        <h1
          style={{ fontSize: '14px', fontWeight: 600, color: '#888', margin: 0 }}
        >
          발표자 노트
        </h1>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#fff',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {currentSlide} / {totalSlides}
        </span>
      </div>

      {/* Current slide notes */}
      <div ref={currentRef} style={{ marginBottom: '32px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b9fff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          현재 슬라이드 {currentSlide}
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#aaa',
            marginBottom: '12px',
          }}
        >
          {currentNote?.title || '(노트 없음)'}
        </div>
        <div
          style={{
            fontSize: '22px',
            lineHeight: 1.7,
            color: '#fff',
            whiteSpace: 'pre-wrap',
          }}
        >
          {currentNote?.body.trim() || ''}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          borderTop: '1px solid #333',
          paddingTop: '20px',
          marginTop: '20px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          다음 슬라이드
        </div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#555',
            marginBottom: '8px',
          }}
        >
          {nextNote?.title || ''}
        </div>
        <div
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: '#777',
            whiteSpace: 'pre-wrap',
          }}
        >
          {nextNote?.body.trim() || ''}
        </div>
      </div>
    </div>
  )
}
