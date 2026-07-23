import { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import './css/EmojiTextarea.css';

function EmojiTextarea({
    value,
    onChange,
    rows,
    placeholder = "",
    name = "",
}) {

    const [mostrarEmoji, setMostrarEmoji] = useState(false);
    const textareaRef = useRef(null);

    const esMobile = window.innerWidth < 576;

    const agregarEmoji = (emojiData) => {
        const emoji = emojiData.emoji;
        const textarea = textareaRef.current;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const nuevoValor =
            value.substring(0, start) +
            emoji +
            value.substring(end);

        onChange(nuevoValor);

        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
        }, 0);

        setMostrarEmoji(false);
    };
    useEffect(() => {
        if(textareaRef.current){
            textareaRef.current.focus();
        }
    }, []);
return (
    <div className="emoji-textarea-container">
        {rows === 1 ? (
            // 👉 MODO WHATSAPP (UNA LÍNEA)
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                
                {!esMobile && (
                    <div style={{ position: "relative" }}>
                        <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => setMostrarEmoji(!mostrarEmoji)}
                        >
                            😊
                        </button>

                        {mostrarEmoji && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: "120%",
                                    zIndex: 2000,
                                }}
                            >
                                <EmojiPicker
                                    width={Math.min(320, window.innerWidth - 20)}
                                    onEmojiClick={agregarEmoji}
                                />
                            </div>
                        )}
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    className="form-control mensaje-textarea una-linea"
                    rows={rows}
                    placeholder={placeholder}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            // enviar mensaje acá
                        }
                    }}
                />
            </div>

        ) : (
            // 👉 MODO NORMAL (MULTILÍNEA)
            <>
                {!esMobile && (
                    <div
                        className="mb-1"
                        style={{ position: "relative", display: "inline-block" }}
                    >
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => setMostrarEmoji(!mostrarEmoji)}
                        >
                            😊
                        </button>

                        {mostrarEmoji && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "100%",
                                    zIndex: 2000,
                                    left: esMobile ? "50%" : 0,
                                    transform: esMobile ? "translateX(-50%)" : "none",
                                    maxWidth: "100vw",
                                    overflow: "hidden"
                                }}
                            >
                                <EmojiPicker
                                    width={Math.min(320, window.innerWidth - 20)}
                                    onEmojiClick={agregarEmoji}
                                />
                            </div>
                        )}
                    </div>
                )}

                <textarea
                    ref={textareaRef}
                    className="form-control mensaje-textarea"
                    rows={rows}
                    placeholder={placeholder}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                />
            </>
        )}
    </div>
);
}

export default EmojiTextarea;
