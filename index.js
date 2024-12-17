const { ipcRenderer, webUtils } = require('electron');

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
const audioCtx = new AudioContext();
const sourceNode = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();
const gainNode = audioCtx.createGain();
sourceNode.connect(analyser);
analyser.connect(gainNode);
gainNode.connect(audioCtx.destination);
const canvas = document.querySelector('#visualizer');
const canvasCtx = canvas.getContext('2d');




async function updateTrackInfo(filePath) {
    try {
        const metadata = await ipcRenderer.invoke('get-audio-metadata', filePath);
        if (metadata) {
            console.log('Song metadata:', metadata);
            const artist = metadata.common.artist || null;
            const title = metadata.common.title || null;
            const duration = metadata.format.duration;
            const formattedDuration = await ipcRenderer.invoke('formatTime', duration);

            const bitrate = metadata.format.bitrate;
            const sampleRate = metadata.format.sampleRate;
            const kbps = Math.round(bitrate / 1000);
            const khz = Math.round(sampleRate / 1000);
            const stereo = metadata.format.numberOfChannels;

            const fileName = metadata.fileName;

            let songInfo = '';
            switch (true) {
                case artist === null && title === null:
                    songInfo = `(${formattedDuration}) *** ${fileName} ***`;
                    break;
                case artist === null && title !== null:
                    songInfo = `${title} (${formattedDuration}) *** ${fileName} ***`;
                    break;
                case artist !== null && title === null:
                    songInfo = `${artist} (${formattedDuration}) *** ${fileName} ***`;
                    break;
                default:
                    songInfo = `${artist} - ${title} (${formattedDuration}) *** ${fileName} ***`;
            }
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

const handleChooseFile = async () => {
    const filePath = await ipcRenderer.invoke('choose-file');
    if (filePath) {
        handleLoadFile(filePath);
    }
}

const handleLoadFile = (file) => {
    audio.src = file;
    audio.load();
    //console.log(audio);
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

// drag and drop
// Prevent default drag behaviors
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

// document.addEventListener('dragenter', (e) => {
//     e.preventDefault();
//     e.stopPropagation();
// });

// Handle the drop
document.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Dropped data:', e.dataTransfer);
    console.log('Files:', e.dataTransfer.files);
    console.log('items:', e.dataTransfer.items);

    const files = e.dataTransfer.files;
    // Get the file path using IPC
    if (files.length > 0) {

        const path = webUtils.getPathForFile(files[0]);
        if (path) {
            handleLoadFile(path);
        }
    }
});

function updateVisualizer() {
    // update the analyser
    // const dataArray = new Float32Array(analyser.fftSize);
    const dataArray = new Uint8Array(analyser.fftSize);

    analyser.getByteFrequencyData(dataArray);
    const bufferLength = analyser.frequencyBinCount;

    // Clear the canvas
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    // const barWidth = (canvas.width / bufferLength) * 2.5;
    // const barWidth = (canvas.width / bufferLength) * 2;
    // const barWidth = (canvas.width / ((bufferLength/50))) - 2;
    const barWidth = (canvas.width / 35) -2;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        // barHeight = dataArray[i] / 2;
        barHeight = (dataArray[i] / 255) * canvas.height;
        // canvasCtx.fillStyle = `rgb(${dataArray[i]}, 255, 0)`;
        canvasCtx.fillStyle = `rgb(10, ${dataArray[i]}, 10)`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        //every 30th bar, draw it
        if (i % 30 === 0) {
            // console.log('i', i);
            // console.log('barHeight', dataArray[i]);
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        }

        x += barWidth + 2;
    }
}

// Update progress bar as audio plays
audio.addEventListener('timeupdate', async () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progress;
    audioTime.textContent = await ipcRenderer.invoke('formatTime', audio.currentTime);
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
    // audio.volume = volumeBar.value / 100;
    gainNode.gain.value = volumeBar.value / 100;
});

panBar.addEventListener('input', () => {
    audio.pan = panBar.value / 100;
});

setInterval(() => {
    requestAnimationFrame(updateVisualizer);
}, 1000/30); // 30 fps
