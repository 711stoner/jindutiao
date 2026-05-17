export async function generateVideoFast(canvas, config, topics, onProgress) {
  // 检查浏览器是否支持 WebCodecs
  if (!window.VideoEncoder) {
    throw new Error('浏览器不支持快速视频编码，请用最新版Chrome/Edge')
  }

  const width = parseInt(config.exportResolution.split('x')[0])
  const height = parseInt(config.exportResolution.split('x')[1])
  const fps = 30

  // 创建临时canvas用于渲染
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const ctx = tempCanvas.getContext('2d')

  // 初始化编码器
  const chunks = []
  const encoder = new VideoEncoder({
    output(chunk) {
      chunks.push(chunk)
    },
    error(e) {
      console.error('编码错误:', e)
    }
  })

  encoder.configure({
    codec: 'vp9',
    width: width,
    height: height,
    bitrate: 2000000,
  })

  const totalFrames = Math.ceil(config.totalDuration * fps)

  // 快速生成所有帧
  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps

    // 绘制帧（使用和预览相同的逻辑）
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    const scaleX = width / config.width
    const scaleY = height / config.height
    const barHeight = config.barHeight * scaleY
    const barY = height - barHeight - (20 * scaleY)

    // 背景
    ctx.fillStyle = config.backgroundColor
    ctx.fillRect(0, barY, width, barHeight)

    // 进度
    const progressRatio = Math.min(time / config.totalDuration, 1)
    const progressWidth = width * progressRatio
    ctx.fillStyle = config.progressColor
    ctx.fillRect(0, barY, progressWidth, barHeight)

    // 文字
    const topicWidth = width / topics.length
    topics.forEach((topic, index) => {
      const x = index * topicWidth
      const textX = x + topicWidth / 2
      const textY = barY + barHeight / 2

      ctx.font = `bold ${Math.round(config.fontSize * scaleX)}px ${config.fontFamily}`
      ctx.fillStyle = config.textColor
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const maxWidth = topicWidth - 10 * scaleX
      let displayText = topic.name
      while (ctx.measureText(displayText).width > maxWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1)
      }
      if (displayText.length < topic.name.length) {
        displayText = displayText.slice(0, -2) + '..'
      }

      ctx.fillText(displayText, textX, textY)
    })

    // 时间
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const totalMinutes = Math.floor(config.totalDuration / 60)
    const totalSeconds = Math.floor(config.totalDuration % 60)
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} / ${String(totalMinutes).padStart(2, '0')}:${String(totalSeconds).padStart(2, '0')}`

    ctx.font = `${Math.round(14 * scaleX)}px ${config.fontFamily}`
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(timeStr, 20 * scaleX, 20 * scaleY)

    // 编码帧
    const frame = new VideoFrame(tempCanvas, { timestamp: (i / fps) * 1e6 })
    encoder.encode(frame)
    frame.close()

    onProgress?.(i / totalFrames)
  }

  // 完成编码
  await encoder.flush()

  // 组装成 MP4
  return new Promise((resolve, reject) => {
    const muxer = new MP4Muxer({
      tracks: [{
        type: 'video',
        codec: 'vp9',
        width: width,
        height: height,
      }],
      bitrate: 2000000,
    })

    chunks.forEach(chunk => {
      muxer.addVideoChunk(chunk)
    })

    muxer.end()
    const blob = muxer.result
    resolve(blob)
  })
}
