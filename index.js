const { ipcRenderer } = require('electron');

// Get the elements
const audio = document.querySelector('#audio');
const progressBar = document.querySelector('.progressBar');
const audioTime = document.querySelector('#audioTime');
const trackInfo = document.querySelector('#trackInfo');
const audioChannels = document.querySelector('#audioChannels');




async function updateTrackInfo(filePath) {
    try {
        const metadata = await ipcRenderer.invoke('get-audio-metadata', filePath);
        if (metadata) {
            console.log('Song metadata:', metadata);
            const artist = metadata.common.artist;
            const title = metadata.common.title;
            const duration = metadata.format.duration;
            const formattedDuration = formatTime(duration);

            const bitrate = metadata.format.bitrate;
            const sampleRate = metadata.format.sampleRate;
            const kbps = Math.round(bitrate / 1000);
            const khz = Math.round(sampleRate / 1000);
            const stereo = metadata.format.numberOfChannels;

            const fileName = metadata.fileName;

            const songInfo = `${artist} - ${title} (${formattedDuration}) *** ${fileName}`;
            trackInfo.textContent = songInfo;

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
}

const handlePlay = () => {
    document.getElementById('audio').play();
}

const handlePause = () => {
    document.getElementById('audio').pause();
}

const handleStop = () => {
    document.getElementById('audio').pause();
    document.getElementById('audio').currentTime = 0;
}

const handleForward = () => {
    document.getElementById('audio').currentTime += 10;
}

const handleBack = () => {
    document.getElementById('audio').currentTime -= 10;
}

const handleShuffle = () => {
    document.getElementById('audio').shuffle = !document.getElementById('audio').shuffle;
}

const handleRepeat = () => {
    document.getElementById('audio').repeat = !document.getElementById('audio').repeat;
}

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