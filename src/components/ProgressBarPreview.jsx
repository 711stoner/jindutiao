import { useEffect, useRef, useState } from 'react'

export default function ProgressBarPreview({ config, topics, onExportGif }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState('')

  const generateFrameSequence = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        const fps = 30
        const totalFrames = Math.ceil(config.totalDuration * fps)
        const frames = []

        // 生成所有帧
        for (let i = 0; i < totalFrames; i++) {
          const time = i / fps
          const canvas = canvasRef.current

          // 获取当前帧的canvas图像数据
          const imageData = canvas.toDataURL('image/png')
          frames.push({ data: imageData, index: i })

          // 更新进度
          setExportProgress(i / totalFrames * 0.9)

          // 让UI有机会更新
          if (i % 10 === 0) {
            await new Promise(r => setTimeout(r, 0))
          }
        }

        // 下载帧序列
        // 由于浏览器限制，分批下载而不是ZIP
        setExportStatus('下载帧...')

        // 创建一个包含所有帧数据的JSON
        const frameListJSON = {
          totalFrames,
          fps,
          resolution: config.exportResolution,
          frames: frames.map(f => f.index)
        }

        // 下载帧列表
        const listBlob = new Blob([JSON.stringify(frameListJSON, null, 2)], { type: 'application/json' })
        const listUrl = URL.createObjectURL(listBlob)
        const listLink = document.createElement('a')
        listLink.href = listUrl
        listLink.download = `progress-bar-frames-info.json`
        document.body.appendChild(listLink)
        listLink.click()
        document.body.removeChild(listLink)

        // 逐个下载每一帧
        for (let i = 0; i < frames.length; i++) {
          const frame = frames[i]
          const link = document.createElement('a')
          link.href = frame.data
          link.download = `frame_${String(i).padStart(6, '0')}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setExportProgress(0.9 + (i / frames.length) * 0.1)

          // 下载之间延迟避免浏览器卡顿
          if (i % 5 === 0) {
            await new Promise(r => setTimeout(r, 100))
          }
        }

        setExportStatus('帧序列已导出！')
        setExportProgress(1)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  const recordWebM = async () => {
    return new Promise((resolve, reject) => {
      const stream = canvasRef.current.captureStream(30)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      })

      const chunks = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.onstop = () => {
        resolve(new Blob(chunks, { type: 'video/webm' }))
      }
      mediaRecorder.onerror = (e) => reject(e)

      mediaRecorder.start()

      // 更新进度
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / (config.totalDuration * 1000)) * 0.95, 0.95)
        setExportProgress(progress)
      }, 100)

      setTimeout(() => {
        clearInterval(interval)
        setExportProgress(0.95)
        mediaRecorder.stop()
      }, config.totalDuration * 1000)
    })
  }

  const handleExportVideo = async () => {
    if (isExporting) return

    setIsExporting(true)
    setExportProgress(0)

    try {
      if (config.exportFormat === 'sequence') {
        setExportStatus('生成帧序列...')
        await generateFrameSequence()
      } else {
        setExportStatus('正在录制...')
        const blob = await recordWebM()

        // 下载视频
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `progress-bar-${Date.now()}.webm`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setExportProgress(1)
        setExportStatus('导出成功！')
      }

      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
        setExportStatus('')
        onExportGif?.()
      }, 1500)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败: ' + error.message)
      setIsExporting(false)
      setExportProgress(0)
      setExportStatus('')
    }
  }

  useEffect(() => {
    // 将导出函数暴露给父组件
    window.progressBarExport = handleExportVideo
  }, [config, topics])

  const getCurrentTopic = (time) => {
    for (let i = topics.length - 1; i >= 0; i--) {
      if (time >= topics[i].startTime) {
        return i
      }
    }
    return 0
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !topics.length) return

    canvas.width = 960
    canvas.height = 540

    const ctx = canvas.getContext('2d')
    const scaleX = canvas.width / config.width
    const scaleY = canvas.height / config.height

    const barHeight = config.barHeight * scaleY
    const barY = canvas.height - barHeight - 20

    // 绘制背景
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制背景时间线
    const topicWidth = canvas.width / topics.length
    const progressRatio = currentTime / config.totalDuration

    // 绘制背景
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, barY, canvas.width, barHeight)

    // 绘制进度填充（从左到右推进）
    const progressWidth = canvas.width * progressRatio
    ctx.fillStyle = config.progressColor
    ctx.fillRect(0, barY, progressWidth, barHeight)

    // 绘制话题文字
    topics.forEach((topic, index) => {
      const x = index * topicWidth
      const textX = x + topicWidth / 2
      const textY = barY + barHeight / 2

      ctx.font = `bold ${Math.round(config.fontSize * scaleX)}px ${config.fontFamily}`
      ctx.fillStyle = config.textColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const maxWidth = topicWidth - 10
      let displayText = topic.name
      while (
        ctx.measureText(displayText).width > maxWidth &&
        displayText.length > 0
      ) {
        displayText = displayText.slice(0, -1)
      }
      if (displayText.length < topic.name.length) {
        displayText = displayText.slice(0, -2) + '..'
      }

      ctx.fillText(displayText, textX, textY)
    })

    // 绘制时间显示
    const minutes = Math.floor(currentTime / 60)
    const seconds = Math.floor(currentTime % 60)
    const totalMinutes = Math.floor(config.totalDuration / 60)
    const totalSeconds = Math.floor(config.totalDuration % 60)
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} / ${String(totalMinutes).padStart(2, '0')}:${String(totalSeconds).padStart(2, '0')}`

    ctx.font = `${Math.round(14 * scaleX)}px ${config.fontFamily}`
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(timeStr, 20, 20)
  }, [config, topics, currentTime])

  // 动画循环
  useEffect(() => {
    let startTime = Date.now()

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000
      let newTime = elapsed

      if (newTime >= config.totalDuration) {
        newTime = config.totalDuration
        startTime = Date.now()
      }

      setCurrentTime(newTime)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [config.totalDuration])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden',
        background: '#000',
        aspectRatio: '16 / 9',
        position: 'relative'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
        {isExporting && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            gap: '12px'
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{exportStatus}</div>
            <div style={{
              width: '200px',
              height: '6px',
              background: '#333',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                background: '#00ff00',
                width: `${Math.min(exportProgress * 100, 100)}%`,
                transition: 'width 0.3s'
              }} />
            </div>
            <div style={{ fontSize: '12px' }}>{Math.min(Math.round(exportProgress * 100), 100)}%</div>
          </div>
        )}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        当前时间: {Math.floor(currentTime)}s / 总时长: {config.totalDuration}s
      </div>
    </div>
  )
}
