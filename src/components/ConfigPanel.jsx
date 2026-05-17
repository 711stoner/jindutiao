import { secondsToTimeString, timeStringToSeconds } from '../utils/timeFormat'
import './ConfigPanel.css'

export default function ConfigPanel({ config, onChange, topics, onTopicsChange }) {
  const handleConfigChange = (key, value) => {
    onChange({
      ...config,
      [key]: value
    })
  }

  const handleAddTopic = () => {
    const newId = Math.max(...topics.map(t => t.id), 0) + 1
    onTopicsChange([
      ...topics,
      {
        id: newId,
        name: `话题${newId}`,
        startTime: config.totalDuration
      }
    ])
  }

  const handleUpdateTopic = (id, field, value) => {
    onTopicsChange(
      topics.map(t =>
        t.id === id ? { ...t, [field]: value } : t
      )
    )
  }

  const handleDeleteTopic = (id) => {
    if (topics.length > 1) {
      onTopicsChange(topics.filter(t => t.id !== id))
    }
  }

  return (
    <div className="config-panel">
      <div className="config-group">
        <label>总时长 <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>（可自己设置）</span></label>
        <input
          type="text"
          value={secondsToTimeString(config.totalDuration)}
          onChange={(e) => handleConfigChange('totalDuration', timeStringToSeconds(e.target.value))}
          placeholder="MM:SS 或 HH:MM:SS"
          style={{ fontFamily: 'monospace' }}
        />
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
          输入格式: 05:30 或 01:30:45
        </div>
      </div>

      <div className="config-group">
        <label>进度条高度 (px)</label>
        <input
          type="number"
          value={config.barHeight}
          onChange={(e) => handleConfigChange('barHeight', parseInt(e.target.value) || 60)}
          min="40"
          max="200"
        />
      </div>

      <div className="config-group">
        <label>字体大小 (px)</label>
        <input
          type="number"
          value={config.fontSize}
          onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value) || 18)}
          min="12"
          max="48"
        />
      </div>

      <div className="config-group">
        <label>文字颜色</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="color"
            value={config.textColor}
            onChange={(e) => handleConfigChange('textColor', e.target.value)}
            style={{ flex: 1, height: '36px', cursor: 'pointer' }}
          />
          <span style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
            {config.textColor}
          </span>
        </div>
      </div>

      <div className="config-group">
        <label>背景颜色</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="color"
            value={config.backgroundColor}
            onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
            style={{ flex: 1, height: '36px', cursor: 'pointer' }}
          />
          <span style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
            {config.backgroundColor}
          </span>
        </div>
      </div>

      <div className="config-group">
        <label>进度条颜色</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="color"
            value={config.progressColor}
            onChange={(e) => handleConfigChange('progressColor', e.target.value)}
            style={{ flex: 1, height: '36px', cursor: 'pointer' }}
          />
          <span style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
            {config.progressColor}
          </span>
        </div>
      </div>

      <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <div className="config-group">
        <label style={{ marginBottom: '12px' }}>话题列表</label>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {topics.map((topic, index) => (
            <div key={topic.id} style={{
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '8px',
              background: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={topic.name}
                  onChange={(e) => handleUpdateTopic(topic.id, 'name', e.target.value)}
                  placeholder="话题名称"
                  style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>开始时间:</label>
                <input
                  type="text"
                  value={secondsToTimeString(topic.startTime)}
                  onChange={(e) => handleUpdateTopic(topic.id, 'startTime', timeStringToSeconds(e.target.value))}
                  placeholder="MM:SS"
                  style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'monospace' }}
                />
              </div>
              {topics.length > 1 && (
                <button
                  onClick={() => handleDeleteTopic(topic.id)}
                  style={{
                    marginTop: '8px',
                    padding: '4px 12px',
                    background: '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  删除
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={handleAddTopic}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '10px',
            background: '#4ECDC4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          + 添加话题
        </button>
      </div>

      <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #ddd' }} />

      <div className="config-group">
        <label>导出设置</label>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>导出格式</label>
          <select
            value={config.exportFormat}
            onChange={(e) => handleConfigChange('exportFormat', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="sequence">📸 帧序列 (快速)</option>
            <option value="webm">🎬 WebM 视频 (完整)</option>
          </select>
          <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
            {config.exportFormat === 'sequence'
              ? '导出所有帧为PNG，在剪辑软件中导入序列'
              : '实时录制完整视频，需等待视频时长'}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>分辨率</label>
          <select
            value={config.exportResolution}
            onChange={(e) => handleConfigChange('exportResolution', e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="1920x1080">1920×1080 (高清)</option>
            <option value="1280x720">1280×720 (标清)</option>
            <option value="960x540">960×540 (小)</option>
          </select>
        </div>

        <button
          className="export-btn"
          onClick={() => window.progressBarExport?.()}
          title="导出为MP4视频，可直接在剪辑软件中使用"
        >
          📥 导出视频
        </button>
      </div>
    </div>
  )
}
