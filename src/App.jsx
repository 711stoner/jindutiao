import { useState } from 'react'
import ProgressBarPreview from './components/ProgressBarPreview'
import ConfigPanel from './components/ConfigPanel'
import './App.css'

export default function App() {
  const [topics, setTopics] = useState([
    { id: 1, name: '话题一', startTime: 0 },
    { id: 2, name: '话题二', startTime: 120 },
    { id: 3, name: '话题三', startTime: 240 },
  ])

  const [config, setConfig] = useState({
    totalDuration: 600,
    width: 1920,
    height: 1080,
    barHeight: 80,
    textColor: '#FFFFFF',
    backgroundColor: '#1a1a1a',
    progressColor: '#00FF00',
    fontSize: 18,
    fontFamily: 'Arial',
    exportResolution: '1920x1080',
    exportQuality: 'medium',
    exportFormat: 'mp4',
  })

  return (
    <div className="app">
      <header className="header">
        <h1>📹 播客话题进度条工具</h1>
      </header>

      <main className="main">
        <div className="preview-container">
          <div className="preview-section">
            <h2>预览</h2>
            <ProgressBarPreview config={config} topics={topics} onExportGif={() => {}} />
          </div>
        </div>

        <div className="config-container">
          <div className="config-section">
            <h2>配置</h2>
            <ConfigPanel
              config={config}
              onChange={setConfig}
              topics={topics}
              onTopicsChange={setTopics}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
