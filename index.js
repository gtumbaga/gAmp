const { ipcRenderer } = require('electron');
// Get the elements
const audio = document.querySelector('#audio');
const progressBar = document.querySelector('.progressBar');


const handleChooseFile = async () => {
    const filePath = await ipcRenderer.invoke('choose-file');
    if (filePath) {
        handleLoadFile(filePath);
    }
}

const handleLoadFile = (file) => {
    document.getElementById('audio').src = file;
    document.getElementById('audio').load();
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
});

// Load metadata to set max value
audio.addEventListener('loadedmetadata', () => {
    progressBar.max = 100;
    progressBar.value = 0;
});

// Handle user seeking
progressBar.addEventListener('input', () => {
    const time = (progressBar.value / 100) * audio.duration;
    audio.currentTime = time;
});