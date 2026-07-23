function EsperaElimina({ ver }) {
    return (
        <>
            {ver && (
                <div 
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(0,0,0,0.5)", // overlay oscuro
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999
                    }}
                >
                    <div className="card border-0 bg-transparent shadow-none rounded-4">
                        <img 
                            src="https://i.pinimg.com/originals/ff/fa/9b/fffa9b880767231e0d965f4fc8651dc2.gif" 
                            alt="Cargando..." 
                            style={{ width: "200px" }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export default EsperaElimina;
