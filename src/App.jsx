import { useState } from 'react'
import './App.css'

const BACKEND_URL =
  'https://data-server-axhf.onrender.com/send-notification'

const CHANNELS = [
  { id: 'others', label: 'General' },
  { id: 'events', label: 'Special Events' },
  { id: 'offers', label: 'Offers' },
  { id: 'appUpdates', label: 'App Updates' }
]

function App() {
  const [unlocked, setUnlocked] = useState(
    () => !!sessionStorage.getItem('gb_notif_key')
  )

  const [secretKey, setSecretKey] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [channel, setChannel] = useState(CHANNELS[0].id)
  const [type, setType] = useState('simple')
  const [link, setLink] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  const [selectedFile, setSelectedFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

  const unlockPortal = () => {
    const key = secretKey.trim()

    if (!key) {
      setStatus({
        type: 'error',
        message: 'Enter a secret key.',
      })
      return
    }

    sessionStorage.setItem('gb_notif_key', key)
    setUnlocked(true)
    setStatus(null)
  }

  const logout = () => {
    sessionStorage.removeItem('gb_notif_key')
    setUnlocked(false)
    setSecretKey('')
    setStatus(null)
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    setSelectedFile(file)

    const reader = new FileReader()

    reader.onload = (e) => {
      setImagePreview(e.target.result)
    }

    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setSelectedFile(null)
    setImagePreview(null)

    const input = document.getElementById('fileInput')

    if (input) {
      input.value = ''
    }
  }

  const sendNotification = async () => {
    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const cleanLink = link.trim()

    if (!channel) {
      setStatus({
        type: 'error',
        message: 'Please select a channel.',
      })
      return
    }

    if (!cleanTitle || !cleanDescription) {
      setStatus({
        type: 'error',
        message: 'Title and description are required.',
      })
      return
    }

    if ((type === 'link' || type === 'page') && !cleanLink) {
      setStatus({
        type: 'error',
        message: 'Please provide the link / page ID.',
      })
      return
    }

    setSending(true)
    setStatus(null)

    const form = new FormData()

    form.append('channel', channel)
    form.append('title', cleanTitle)
    form.append('description', cleanDescription)
    form.append('type', type)

    if (cleanLink) {
      form.append('link', cleanLink)
    }

    if (selectedFile) {
      form.append('image', selectedFile)
    }

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'X-Secret-Key': sessionStorage.getItem('gb_notif_key') || '',
        },
        body: form,
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setStatus({
            type: 'error',
            message: 'Invalid secret key. Logging out...',
          })

          setTimeout(logout, 1200)
        } else {
          setStatus({
            type: 'error',
            message: data.error || 'Failed to send notification.',
          })
        }

        return
      }

      setStatus({
        type: 'success',
        message: `Sent to "${data.topic}" successfully.`,
      })

      setTitle('')
      setDescription('')
      setLink('')
      removeImage()
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Network error: ${error.message}`,
      })
    } finally {
      setSending(false)
    }
  }

  // =========================
  // Secret key gate
  // =========================

  if (!unlocked) {
    return (
      <div className="portal">
        <div className="gate">
          <div className="brand">GoldBase</div>

          <div className="gate-sub">
            Notification Manager — enter access key
          </div>

          <div className="secret-input-wrapper">
            <input
              type={showSecret ? 'text' : 'password'}
              placeholder="Secret key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  unlockPortal()
                }
              }}
              autoComplete="off"
            />

            <button
              type="button"
              className="eye-button"
              onClick={() => setShowSecret(!showSecret)}
            >
              {showSecret ? '◉' : '○'}
            </button>
          </div>

          <button className="primary-btn" onClick={unlockPortal}>
            Unlock
          </button>

          {status && (
            <div className="gate-error">
              {status.message}
            </div>
          )}
        </div>
      </div>
    )
  }

  // =========================
  // Main portal
  // =========================

  return (
    <div className="portal">
      <main className="app">
        <header className="header">
          <div>
            <div className="brand">GoldBase</div>
            <div className="sub">Notification Manager</div>
          </div>

          <button className="logout" onClick={logout}>
            Log out
          </button>
        </header>

        <section className="card">

          {/* Channel */}
          <div className="field">
            <label htmlFor="channel">
              Select Channel
            </label>

            <select
              id="channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {CHANNELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="field">
            <label htmlFor="title">
              Title
            </label>

            <input
              id="title"
              type="text"
              placeholder="e.g. Gold prices just dropped"
              maxLength={65}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="field">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              placeholder="Short notification body text"
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Notification Type */}
          <div className="field">
            <label htmlFor="type">
              Notification Type
            </label>

            <select
              id="type"
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                setLink('')
              }}
            >
              <option value="simple">
                Simple (no action)
              </option>

              <option value="link">
                External Link
              </option>

              <option value="page">
                In-App Page
              </option>
            </select>
          </div>

          {/* Link / Page */}
          {type !== 'simple' && (
            <div className="field">
              <label htmlFor="link">
                {type === 'link'
                  ? 'External Link URL'
                  : 'In-App Page ID'}
              </label>

              <input
                id="link"
                type="text"
                placeholder={
                  type === 'link'
                    ? 'https://...'
                    : 'Enter in-app page ID'
                }
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
          )}

          {/* Photo */}
          <div className="field">
            <label>
              Photo <span>(optional)</span>
            </label>

            <label
              className={`upload-box ${
                imagePreview ? 'has-image' : ''
              }`}
              htmlFor="fileInput"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Selected notification"
                  className="img-preview"
                />
              ) : (
                <span>Tap to choose an image</span>
              )}
            </label>

            <input
              id="fileInput"
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />

            {imagePreview && (
              <button
                type="button"
                className="remove-img"
                onClick={removeImage}
              >
                Remove photo
              </button>
            )}
          </div>

          {/* Send */}
          <button
            className="primary-btn"
            id="sendBtn"
            onClick={sendNotification}
            disabled={sending}
          >
            {sending ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              'Send Notification'
            )}
          </button>

          {/* Status */}
          {status && (
            <div
              className={`status-msg ${
                status.type === 'success'
                  ? 'ok'
                  : 'err'
              }`}
            >
              {status.message}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App