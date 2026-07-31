import React from 'react';

export function RenderTexto({ texto }) {
    if (!texto) return null;
    
    let textoProcesado = texto
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '');

    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/gi;
    const parts = textoProcesado.split(urlRegex);

    return (
        <>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    let href = part;
                    if (href.toLowerCase().startsWith('www.')) {
                        href = 'http://' + href;
                    }
                    return (
                        <a 
                            key={i} 
                            href={href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ color: '#0dcaf0', textDecoration: 'underline' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            })}
        </>
    );
}
