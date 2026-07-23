import "./EsperaFull.css";

function EsperaFull({ visible }) {
    if (!visible) return null;

    return (
        <div className="espera-overlay">
            <img
                src="https://media.tenor.com/On7kvXhzml4AAAAi/loading-gif.gif"
                alt="Cargando..."
                className="espera-loader"
            />
        </div>
    );
}

export default EsperaFull;