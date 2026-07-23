import './css/GrupoChat.css';


import CONFIG from '../../config';

const URL_GRUPOS = `${CONFIG.API_URL}/operarGrupos.php`;

function GrupoChat({ chat, seleccionado = false, onClick}) { 
    
    const formatearFecha = (fecha) => {
        const d = new Date(fecha);
        return d.toLocaleDateString(
            'es-AR',
            {
                day:'2-digit',
                month:'2-digit'
            }
        );
    };

    const obtenerImagen = (tipo) => {
        switch(tipo){
            case 'GRUPOP':
                return chat.imagen_grupo
                    ? `${CONFIG.API_URL}/${chat.imagen_grupo}`
                    : null;
            case 'GRUPOC':
                return chat.imagen_curso
                    ? chat.imagen_curso
                    : `${CONFIG.API_URL}/uploads/espacios/escudo_solo_instituto.png`;
            case 'USR':
                return chat.foto_perfil
                    ? `${CONFIG.API_URL}/${chat.foto_perfil}`
                    : null;
            default:
                return null;
        }
    };

    const obtenerIniciales = () => {
        if (chat.tipo_chat === 'GRUPOP') {
            const nombre = chat.nombre_grupo || "GP";
            return `${nombre.charAt(0)}${nombre.length > 1 ? nombre.charAt(1) : ''}`.toUpperCase();
        }
        if (chat.tipo_chat === 'GRUPOC') {
            const nombre = chat.nombre_curso || "GC";
            return `${nombre.charAt(0)}${nombre.length > 1 ? nombre.charAt(1) : ''}`.toUpperCase();
        }

        const nombre = chat.nombre || "";
        const apellido = chat.apellido || "";

        return `${nombre.charAt(0)}${apellido.charAt(0)}`
            .toUpperCase();
    };

    const obtenerTitulo = (tipo) => {
        switch(tipo){
            case 'GRUPOP':
                return chat.nombre_grupo;
            case 'GRUPOC':
                return chat.nombre_curso;
            case 'USR':
                return `${chat.nombre} ${chat.apellido}`;
            case 'DIFUSION':
                return 'Difusión';
            default:
                return 'Chat';
        }
    };

    const limpiarMensaje = (texto) => {
        if (!texto) return '';
        let limpio = texto.replace(/\\r\\n|\\n|\\r|\r\n|\n|\r/g, ' '); // Eliminar saltos de línea (tanto reales como literales)
        limpio = limpio.replace(/<[^>]*>?/gm, ''); // Quitar etiquetas HTML
        limpio = limpio.replace(/\s+/g, ' ').trim(); // Quitar espacios múltiples
        return limpio;
    };

    return (
        <div
            className={`grupo-chat ${
                seleccionado ? 'grupo-chat-active' : ''
            }`}
            onClick={() =>
                onClick({
                    ...chat,
                    tipo: chat.tipo_chat,
                    nombre_chat: obtenerTitulo(chat.tipo_chat)
                })
            }
        >
            {/* Avatar */}
            <div className="grupo-chat-avatar">
                {chat.tipo_chat === 'DIFUSION'
                    ? (
                        <div className="avatar-difusion">
                            <i className="fa-solid fa-bullhorn"></i>
                        </div>
                    )
                    : (
                        <div className="chat-avatar">
                            {obtenerImagen(chat.tipo_chat) ? (
                                <img
                                    src={obtenerImagen(chat.tipo_chat)}
                                    alt=""
                                    className="chat-avatar-img"
                                />
                            ) : (
                                <div className={`chat-avatar-iniciales ${chat.tipo_chat === 'GRUPOP' ? 'avatar-personalizado' : ''}`}>
                                    {obtenerIniciales()}
                                </div>
                            )}
                        </div>
                    )
                }
            </div>
            {/* Contenido */}
            <div className="grupo-chat-body">
                <div className="grupo-chat-header">
                    <span className="grupo-chat-titulo">
                        {obtenerTitulo(chat.tipo_chat)}
                    </span>
                    <span className="grupo-chat-fecha">
                        {formatearFecha(chat.ultima_fecha)}
                    </span>
                </div>
                <div className="grupo-chat-footer">
                    <span className="grupo-chat-mensaje">
                        {chat.de && (
                            <>
                                <strong>{chat.de}: </strong>
                            </>
                        )}
                        {limpiarMensaje(chat.ultimo_mensaje)}
                    </span>
                    {chat.sin_leer > 0 && !seleccionado && (
                        <span className="grupo-chat-badge">
                            {chat.sin_leer}
                        </span>
                    )}
                              
                </div>
            </div>
        </div>
    );
}

export default GrupoChat;