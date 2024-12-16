const { ipcRenderer } = require('electron');

// Get the elements
const audio = document.querySelector('#audio');
const progressBar = document.querySelector('.progressBar');
const audioTime = document.querySelector('#audioTime');
const trackInfo = document.querySelector('#trackInfo');
const audioChannels = document.querySelector('#audioChannels');
const fileSpeedKbps = document.querySelector('#fileSpeedKbps');
const fileSpeedKhz = document.querySelector('#fileSpeedKhz');
const volumeBar = document.querySelector('#volumeBar');
const panBar = document.querySelector('#panBar');




async function updateTrackInfo(filePath) {
    try {
        const metadata = await ipcRenderer.invoke('get-audio-metadata', filePath);
        if (metadata) {
            console.log('Song metadata:', metadata);
            const artist = metadata.common.artist || 'Unknown Artist';
            const title = metadata.common.title || 'Unknown Title';
            const duration = metadata.format.duration;
            const formattedDuration = formatTime(duration);

            const bitrate = metadata.format.bitrate;
            const sampleRate = metadata.format.sampleRate;
            const kbps = Math.round(bitrate / 1000);
            const khz = Math.round(sampleRate / 1000);
            const stereo = metadata.format.numberOfChannels;

            const fileName = metadata.fileName;

            const songInfo = `${artist} - ${title} (${formattedDuration}) *** ${fileName} ***`;
            trackInfo.textContent = songInfo;
            // reset the marquee after new load
            trackInfo.scrollAmount = 0;
            trackInfo.scrollAmount = 2;


            fileSpeedKbps.textContent = kbps;
            fileSpeedKhz.textContent = khz;

            if (stereo === 2) {
                audioChannels.classList.add('stereo');
                audioChannels.classList.remove('mono');
            } else {
                audioChannels.classList.add('mono');
                audioChannels.classList.remove('stereo');
            }
            // console.log(`${artist} - ${title} (${duration}) - ${bitrate}`);
        } else {
            console.error('No metadata found');
        }
    } catch (error) {
        console.error('Error reading metadata:', error);
    }
}

// Function to format time from seconds to MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}


const handleChooseFile = async () => {
    const filePath = await ipcRenderer.invoke('choose-file');
    if (filePath) {
        handleLoadFile(filePath);
    }
}

const handleLoadFile = (file) => {
    audio.src = file;
    audio.load();
    console.log(audio);
    updateTrackInfo(file);
    handlePlay();
}

const handlePlay = () => {
    audio.play();
    document.getElementById('current-function-icon').className = 'play';
}

const handlePause = () => {
    audio.pause();
    document.getElementById('current-function-icon').className = 'pause';
}

const handleStop = () => {
    audio.pause();
    audio.currentTime = 0;
    document.getElementById('current-function-icon').className = 'stop';
}

const handleForward = () => {
    audio.currentTime += 10;
}

const handleBack = () => {
    audio.currentTime -= 10;
}

const handleShuffle = () => {
    audio.shuffle = !audio.shuffle;
}

const handleRepeat = () => {
    audio.repeat = !audio.repeat;
}

document.getElementById('btn-quit').addEventListener('click', () => {
    console.log('quit has been clicked');
    ipcRenderer.send('quit-app');
});

document.getElementById('btn-minimize').addEventListener('click', () => {
    console.log('minimize has been clicked');
    ipcRenderer.send('minimize-app');
});

document.getElementById('open-playlist-window').addEventListener('click', () => {
    ipcRenderer.send('toggle-playlist-window');
});

ipcRenderer.on('playlist-window-status', (event, status) => {
    if (status) {
        document.getElementById('open-playlist-window').classList.add('on');
    } else {
        document.getElementById('open-playlist-window').classList.remove('on');
    }
});

document.getElementById('btn-eject').addEventListener('click', handleChooseFile);
document.getElementById('btn-play').addEventListener('click', handlePlay);
document.getElementById('btn-pause').addEventListener('click', handlePause);
document.getElementById('btn-stop').addEventListener('click', handleStop);
document.getElementById('btn-forward').addEventListener('click', handleForward);
document.getElementById('btn-back').addEventListener('click', handleBack);
document.getElementById('btn-shuffle').addEventListener('click', handleShuffle);
document.getElementById('btn-repeat').addEventListener('click', handleRepeat);

// Update progress bar as audio plays
audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progress;
    audioTime.textContent = formatTime(audio.currentTime);
});

// Load metadata to set max value
audio.addEventListener('loadedmetadata', (e) => {
    progressBar.max = 100;
    progressBar.value = 0;
});

// Handle user seeking
progressBar.addEventListener('input', () => {
    const time = (progressBar.value / 100) * audio.duration;
    audio.currentTime = time;
});

volumeBar.addEventListener('input', () => {
    audio.volume = volumeBar.value / 100;
});

panBar.addEventListener('input', () => {
    audio.pan = panBar.value / 100;
});
