import { useRef, useState, useEffect } from "react";
import "./AudioBurbuja.css";

function AudioBurbuja({ src, esPropio, onPlayGlobal }) {

    const audioRef = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // 🔥 velocidad
    const [speed, setSpeed] = useState(1);

    useEffect(() => {

        const audio = audioRef.current;

        if (!audio) return;

        const handlePause = () => setPlaying(false);
        const handlePlay = () => setPlaying(true);

        audio.addEventListener("pause", handlePause);
        audio.addEventListener("play", handlePlay);
        audio.addEventListener("ended", () => setPlaying(false));

        const updateProgress = () => {
            setProgress((audio.currentTime / audio.duration) * 100 || 0);
        };

        const setMeta = () => {
            setDuration(audio.duration || 0);
        };

        audio.addEventListener("timeupdate", updateProgress);
        audio.addEventListener("loadedmetadata", setMeta);

        return () => {
            audio.removeEventListener("timeupdate", updateProgress);
            audio.removeEventListener("loadedmetadata", setMeta);

            audio.removeEventListener("pause", handlePause);
            audio.removeEventListener("play", handlePlay);
        };

    }, []);

    // 🔥 aplicar velocidad
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = speed;
        }
    }, [speed]);

    const togglePlay = () => {

        if (!audioRef.current) return;

        if (playing) {

            audioRef.current.pause();

        } else {

            if (onPlayGlobal) {
                onPlayGlobal(audioRef.current);
            }

            audioRef.current.play().catch(() => {});
        }
    };

    const formatTime = (sec) => {

        if (!sec) return "0:00";

        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);

        return `${m}:${s < 10 ? "0" : ""}${s}`;
    };

    return (

        <div className={`audio-bubble ${esPropio ? "propio" : "recibido"}`}>

            {/* PLAY */}
            <button className="play-btn" onClick={togglePlay}>
                {playing
                    ? <i className="fa-solid fa-pause"></i>
                    : <i className="fa-solid fa-play"></i>
                }
            </button>

            {/* CUERPO */}
            <div className="audio-body">

                {/* BARRA */}
                <div className="progress-bar" style={{'background': "#d4d4d4d9"}}>
                    <div
                        className="progress"
                        style={{ 'width': `${progress}%`, 'background': "#0AC694" }}
                    ></div>
                </div>

                {/* FOOTER */}
                <div className="audio-footer">

                    <div className="time">
                        {formatTime(audioRef.current?.currentTime)} / {formatTime(duration)}
                    </div>

                    {/* VELOCIDAD */}
                    <select
                        className="speed-select"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                    >
                        <option value={1}>1x</option>
                        <option value={1.5}>1.5x</option>
                        <option value={2}>2x</option>
                    </select>

                </div>
            </div>

            <audio ref={audioRef} src={src} />

        </div>
    );
}

export default AudioBurbuja;