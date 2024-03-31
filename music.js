const elements = {
    musicImg: document.getElementById('music_img'),
    music: document.getElementById('music'),
    pauseButton: document.getElementById('pauseButton'),
    lyricContainer: document.getElementById('lyricContainer'),
    musicKjImg: document.getElementById('music_kj_img')
};

let isPaused = false;
let lrcObject = {};

elements.pauseButton.addEventListener('click', function () {
    const { musicImg, music } = elements;
    musicImg.classList.toggle('paused');
    isPaused = !isPaused;
    if (isPaused) {
        music.pause();
        elements.musicKjImg.src='./asset/ico/播放.png'
    } else {
        music.play();
        elements.musicKjImg.src='./asset/ico/暂停.png'
    }
});

const lrcFileUrl = './asset/bgmusic/music-1.lrc';

fetch(lrcFileUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(parseLRC)
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });

function parseLRC(content) {
    const lines = content.split('\n');
    lines.forEach(line => {
        const timeRegex = /^\[(\d{2}):(\d{2}).(\d{2})]/;
        const match = line.match(timeRegex);
        if (match) {
            const [_, minutes, seconds, milliseconds] = match.map(Number);
            const totalMilliseconds = (minutes * 60000) + (seconds * 1000) + milliseconds;
            // 找到时间戳中 ']' 的位置  
            const timeStampEndIndex = match.index + match[0].length;
            // 从 ']' 后面开始截取歌词  
            const lyrics = line.substring(timeStampEndIndex + 1);
            lrcObject[totalMilliseconds] = lyrics;
        }
    });

    const audio = elements.music
    let currentLyrics = ''; // 初始化当前歌词  
    let updateInterval; // 用于存储setInterval的返回值，以便稍后清除它  

    // 当音频开始播放时，开始更新歌词  
    audio.onplay = function () {
        updateInterval = setInterval(updateLyrics, 100); // 每100毫秒检查一次是否需要更新歌词  
    };

    // 当音频暂停或停止时，停止更新歌词  
    audio.onpause = audio.onended = function () {
        clearInterval(updateInterval); // 清除更新歌词的间隔  
    };

    function updateLyrics() {
        if (!isPaused) {
            const currentTimeMillis = Math.floor(audio.currentTime * 1000);
            console.log('Current Time (ms):', currentTimeMillis); // 调试信息  

            let closestTimestamp = null;
            let diff = Infinity;
            for (const timestamp of Object.keys(lrcObject)) {
                const timestampMillis = parseInt(timestamp, 10);
                if (timestampMillis > currentTimeMillis) {
                    const newDiff = timestampMillis - currentTimeMillis;
                    if (newDiff > 100 && newDiff < diff) { // 只有当超过500毫秒时才切换歌词
                        diff = newDiff;
                        closestTimestamp = timestamp;
                    }
                }
            }

            // 如果有找到合适的时间戳，则更新歌词  
            if (closestTimestamp !== null) {
                currentLyrics = lrcObject[closestTimestamp];
                console.log(currentLyrics);
                elements.lyricContainer.textContent = currentLyrics;
            }
        }
    }



    audio.addEventListener('timeupdate', updateLyrics);
}