'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

export function SlideView({ children }: { children: React.ReactNode }) {
  const [isSlideMode, setIsSlideMode] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideCount, setSlideCount] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  const getSlideGroups = useCallback(() => {
    if (!contentRef.current) return []
    const elements = Array.from(contentRef.current.children) as HTMLElement[]
    const groups: HTMLElement[][] = [[]]
    for (const el of elements) {
      if (el.tagName === 'HR') {
        groups.push([])
      } else {
        groups[groups.length - 1].push(el)
      }
    }
    return groups.filter((g) => g.length > 0)
  }, [])

  const renderSlide = useCallback(
    (index: number) => {
      const groups = getSlideGroups()
      if (!slideRef.current || !groups[index]) return
      // Clear existing children safely
      while (slideRef.current.firstChild) {
        slideRef.current.removeChild(slideRef.current.firstChild)
      }
      // Append cloned nodes from trusted MDX content
      for (const el of groups[index]) {
        slideRef.current.appendChild(el.cloneNode(true))
      }
    },
    [getSlideGroups],
  )

  useEffect(() => {
    if (isSlideMode) {
      const groups = getSlideGroups()
      setSlideCount(groups.length)
      renderSlide(currentSlide)
    }
  }, [isSlideMode, currentSlide, getSlideGroups, renderSlide])

  useEffect(() => {
    if (!isSlideMode) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        setCurrentSlide((prev) => Math.min(prev + 1, slideCount - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setCurrentSlide((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Escape') {
        setIsSlideMode(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSlideMode, slideCount])

  if (isSlideMode) {
    return (
      <>
        <div style={{ display: 'none' }} ref={contentRef}>
          {children}
        </div>
        <div className="slide-overlay">
          <div className="slide-controls">
            <span className="slide-counter">
              {currentSlide + 1} / {slideCount}
            </span>
            <button
              onClick={() => setIsSlideMode(false)}
              className="slide-exit-btn"
            >
              문서 모드로 돌아가기 (ESC)
            </button>
          </div>
          <div className="slide-frame" ref={slideRef} />
          <div className="slide-nav">
            <button
              onClick={() => setCurrentSlide((p) => Math.max(p - 1, 0))}
              disabled={currentSlide === 0}
              className="slide-nav-btn"
            >
              ← 이전
            </button>
            <button
              onClick={() =>
                setCurrentSlide((p) => Math.min(p + 1, slideCount - 1))
              }
              disabled={currentSlide === slideCount - 1}
              className="slide-nav-btn"
            >
              다음 →
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => {
          setCurrentSlide(0)
          setIsSlideMode(true)
        }}
        className="slide-toggle-btn"
      >
        ▶ 슬라이드 모드
      </button>
      <div ref={contentRef}>{children}</div>
    </>
  )
}
