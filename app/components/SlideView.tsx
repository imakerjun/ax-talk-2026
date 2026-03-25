'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

function getSlideFromHash(): number | null {
  if (typeof window === 'undefined') return null
  const match = window.location.hash.match(/^#slide-(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

function setSlideHash(slideNumber: number) {
  const newHash = `#slide-${slideNumber}`
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', newHash)
  }
}

export function SlideView({ children }: { children: React.ReactNode }) {
  const [isSlideMode, setIsSlideMode] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideCount, setSlideCount] = useState(0)
  const [chromeHidden, setChromeHidden] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  // Sync dark mode with html class
  useEffect(() => {
    if (!isSlideMode) return
    const html = document.documentElement
    if (isDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    return () => {
      // Restore on unmount — let Nextra manage it
    }
  }, [isDark, isSlideMode])

  // Read initial dark mode state
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

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

  const fitSlideContent = useCallback(() => {
    const frame = slideRef.current
    if (!frame) return
    frame.style.transform = ''
    frame.style.transformOrigin = ''
    requestAnimationFrame(() => {
      const scrollH = frame.scrollHeight
      const clientH = frame.clientHeight
      if (scrollH > clientH) {
        const scale = clientH / scrollH
        frame.style.transformOrigin = 'top center'
        frame.style.transform = `scale(${scale})`
      }
    })
  }, [])

  const renderSlide = useCallback(
    (index: number) => {
      const groups = getSlideGroups()
      if (!slideRef.current || !groups[index]) return
      while (slideRef.current.firstChild) {
        slideRef.current.removeChild(slideRef.current.firstChild)
      }
      for (const el of groups[index]) {
        slideRef.current.appendChild(el.cloneNode(true))
      }
      fitSlideContent()
    },
    [getSlideGroups, fitSlideContent],
  )

  useEffect(() => {
    const slideNum = getSlideFromHash()
    if (slideNum !== null) {
      const groups = getSlideGroups()
      const index = slideNum - 1
      if (index >= 0 && index < groups.length) {
        setCurrentSlide(index)
        setIsSlideMode(true)
      }
    }
  }, [getSlideGroups])

  useEffect(() => {
    if (isSlideMode) {
      setSlideHash(currentSlide + 1)
    }
  }, [isSlideMode, currentSlide])

  useEffect(() => {
    const handleHashChange = () => {
      const slideNum = getSlideFromHash()
      if (slideNum !== null && isSlideMode) {
        const index = slideNum - 1
        if (index >= 0 && index < slideCount) {
          setCurrentSlide(index)
        }
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [isSlideMode, slideCount])

  useEffect(() => {
    if (isSlideMode) {
      const groups = getSlideGroups()
      setSlideCount(groups.length)
      renderSlide(currentSlide)
    }
  }, [isSlideMode, currentSlide, chromeHidden, getSlideGroups, renderSlide])

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
        exitSlideMode()
      } else if (e.key === 'h' || e.key === 'H') {
        setChromeHidden((prev) => !prev)
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDark((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSlideMode, slideCount])

  const exitSlideMode = useCallback(() => {
    setIsSlideMode(false)
    setChromeHidden(false)
    history.replaceState(null, '', window.location.pathname)
  }, [])

  if (isSlideMode) {
    return (
      <>
        <div style={{ display: 'none' }} ref={contentRef}>
          {children}
        </div>
        <div className={`slide-overlay${chromeHidden ? ' slide-chrome-hidden' : ''}`}>
          <div className="slide-controls">
            <span className="slide-counter">
              {currentSlide + 1} / {slideCount}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setIsDark((p) => !p)}
                className="slide-exit-btn"
                title="다크모드 토글 (D)"
              >
                {isDark ? '☀︎ 라이트' : '● 다크'}
              </button>
              <button
                onClick={() => setChromeHidden(true)}
                className="slide-exit-btn"
                title="UI 숨기기 (H)"
              >
                UI 숨기기 (H)
              </button>
              <button
                onClick={exitSlideMode}
                className="slide-exit-btn"
              >
                문서 모드 (ESC)
              </button>
            </div>
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
