let ffmpeg = null

async function initFFmpeg(onProgress) {
  if (ffmpeg?.isLoaded?.()) return ffmpeg

  try {
    const { FFmpeg, toBlobURL } = await import('@ffmpeg/ffmpeg')
    ffmpeg = new FFmpeg()

    onProgress?.(0.08, '加载 FFmpeg 核心文件...')

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })

    return ffmpeg
  } catch (error) {
    throw new Error('FFmpeg 初始化失败: ' + error.message)
  }
}

export async function generateVideoWithFFmpeg(
  canvas,
  config,
  topics,
  exportOptions,
  onProgress
) {
  try {
    onProgress?.(0.05, '初始化 FFmpeg...')

    const ff = await initFFmpeg(onProgress)

    if (!ff) {
      throw new Error('FFmpeg 初始化失败')
    }

    // 计算导出分辨率
    const [width, height] = exportOptions.exportResolution.split('x').map(Number)
    const scaleX = width / config.width
    const scaleY = height / config.height

    // 计算比特率
    const bitrates = { low: '500k', medium: '2000k', high: '5000k' }
    const bitrate = bitrates[exportOptions.exportQuality] || '2000k'

    onProgress?.(0.2, '生成视频帧...')

    // 创建临时canvas用于缩放
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    const ctx = tempCanvas.getContext('2d')

    const fps = 30
    const totalFrames = Math.ceil(config.totalDuration * fps)
    const frameDuration = 1000 / fps

    // 收集所有帧数据
    const frameData = []
    let lastTime = 0

    for (let i = 0; i < totalFrames; i++) {
      const time = (i / fps)

      // 绘制帧
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      const barHeight = config.barHeight * scaleY
      const barY = height - barHeight - (20 * scaleY)

      // 绘制背景
      ctx.fillStyle = config.backgroundColor
      ctx.fillRect(0, barY, width, barHeight)

      // 绘制进度填充
      const progressRatio = Math.min(time / config.totalDuration, 1)
      const progressWidth = width * progressRatio
      ctx.fillStyle = config.progressColor
      ctx.fillRect(0, barY, progressWidth, barHeight)

      // 绘制话题文字
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

      // 绘制时间
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

      // 保存帧
      frameData.push({
        imageData: ctx.getImageData(0, 0, width, height),
        timestamp: time * 1000
      })

      if (i % 10 === 0) {
        onProgress?.(0.2 + (i / totalFrames) * 0.5, `生成帧 ${i}/${totalFrames}`)
      }
    }

    onProgress?.(0.7, '编码视频...')

    // 使用FFmpeg编码
    const inputFileName = 'input.png'
    const outputFileName = 'output.mp4'

    // 将帧写入FFmpeg
    for (let i = 0; i < frameData.length; i++) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const c = canvas.getContext('2d')
      c.putImageData(frameData[i].imageData, 0, 0)

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      await ff.writeFile(`frame_${String(i).padStart(6, '0')}.png`, new Uint8Array(await blob.arrayBuffer()))
    }

    // 运行FFmpeg命令
    await ff.exec([
      '-framerate', String(fps),
      '-pattern_type', 'glob',
      '-i', 'frame_*.png',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-b:v', bitrate,
      outputFileName
    ])

    onProgress?.(0.9, '生成文件...')

    // 读取输出文件
    const data = await ff.readFile(outputFileName)
    const blob = new Blob([data.buffer], { type: 'video/mp4' })

    // 清理FFmpeg中的文件
    for (let i = 0; i < frameData.length; i++) {
      try {
        ff.deleteFile(`frame_${String(i).padStart(6, '0')}.png`)
      } catch (e) {
        // ignore
      }
    }
    try {
      ff.deleteFile(outputFileName)
    } catch (e) {
      // ignore
    }

    onProgress?.(1, '完成！')
    return blob
  } catch (error) {
    console.error('视频生成失败:', error)
    throw error
  }
}
