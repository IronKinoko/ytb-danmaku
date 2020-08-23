let playing = true
let timeKey
let prevID
let CM
function init(cb) {
  let prevVID
  let inited = false
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (location.pathname === '/watch') {
        const VID = getQueryString('v')
        if (prevVID !== VID) {
          prevVID = VID
          inject(cb)
        } else {
          if (!inited) {
            inited = true
            inject(cb)
          }
        }
      } else {
        inited = false
        prevVID = null
        clearInterval(timeKey)
      }
    })
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
function inject(cb) {
  try {
    console.log('ytb-danmaku-inited')
    const config = JSON.parse(
      localStorage.getItem('ytb-danmaku-config') ||
        JSON.stringify({
          use: true,
          scale: 0.5,
          opacity: 0.7,
        })
    )

    clearInterval(timeKey)
    document.getElementById('player-container').classList.add('abp')
    document.getElementById('ytd-player').classList.add('container')
    document
      .querySelector('div.ytp-left-controls')
      .setAttribute('style', 'overflow: unset;')
    CM = new CommentManager(document.querySelector('#ytd-player'))
    changeDanmakuSpeed(config.scale)
    changeDanmakuOpacity(config.opacity)
    CM.init() // 初始化

    buildControls()
    subEvent()
    cb && cb()
  } catch (e) {
    console.error(e)
    setTimeout(() => {
      init()
    }, 3000)
  }
}

function getQueryString(name) {
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i')
  var r = location.search.substr(1).match(reg)
  if (r != null) return unescape(decodeURI(r[2]))
  return null
}

function getDanmaku() {
  const iframe = document.querySelector('iframe#chatframe')
  if (iframe) {
    /**
     * @type {Document}
     */
    const idoc = iframe.contentDocument
    const messagesNode = Array.from(
      idoc.querySelectorAll('yt-live-chat-text-message-renderer')
    )
    const lastMessageNode = messagesNode.pop()
    if (lastMessageNode) {
      const nextID = lastMessageNode.id
      const message = lastMessageNode.querySelector('#message').textContent
      playing &&
        prevID !== nextID &&
        CM.send({ text: message, mode: 1, color: 0xffffff })
      prevID = nextID
    }
  }
}

function buildControls() {
  if (document.getElementById('ytb-danmaku-config')) return
  const div = document.createElement('div')
  div.style.width = 'auto'
  div.id = 'ytb-danmaku-config'
  document.querySelector('.ytp-left-controls').append(div)
}

function subEvent() {
  const video = document.querySelector('video')
  video.addEventListener('pause', () => {
    playing = false
    CM.stop()
    clearInterval(timeKey)
  })
  video.addEventListener('play', () => {
    playing = true
    CM.clear()
    CM.start()
    timeKey = setInterval(() => {
      getDanmaku()
    }, 100)
  })

  window.addEventListener('resize', () => {
    CM.init(document.querySelector('#ytd-player'))
  })

  video.addEventListener('fullscreenchange', () => {
    CM.init(document.querySelector('#ytd-player'))
  })
}

/**
 * @param {boolean} use
 */
function toggleDanmaku(use) {
  if (use) {
    playing = true
    CM.clear()
    CM.start()
    timeKey = setInterval(() => {
      getDanmaku()
    }, 100)
  } else {
    playing = false
    CM.stop()
    CM.clear()
    clearInterval(timeKey)
  }
}

/**
 * @param {number} scale
 */
function changeDanmakuSpeed(scale) {
  CM.options.global.scale = 3.1 - scale
}

/**
 * @param {number} opacity
 */
function changeDanmakuOpacity(opacity) {
  CM.options.global.opacity = opacity
}

export { init, toggleDanmaku, changeDanmakuSpeed, changeDanmakuOpacity }
