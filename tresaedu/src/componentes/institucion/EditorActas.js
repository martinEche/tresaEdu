import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

function EditorActas() {

    const fechaActual = new Date();

    const formatearFecha = (fecha) => {
        return fecha.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatearHora = (fecha) => {
        return fecha.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const contenidoInicial = `
        <div style="padding:20px; font-family:Arial; line-height:1.6;">
            
            <h2 style="text-align:center;">
                ACTA N° xx/${fechaActual.getFullYear()}
            </h2>

            <p>
                <strong>Institución:</strong> 
            </p>

            <p>
                <strong>Lugar:</strong>
            </p>

            <p>
                <strong>Fecha:</strong> ${formatearFecha(fechaActual)}
            </p>

            <p>
                <strong>Hora de inicio:</strong> ${formatearHora(fechaActual)} hs
            </p>

            <p>
                <strong>Participantes:</strong>
            </p>

            <br/>

            <p>
                Siendo las __________ hs, se da inicio a la reunión con el objetivo de ________________________________________________.
            </p>

            <p>
                Durante el encuentro se abordaron los siguientes temas:
            </p>

            <ul>
                <li></li>
                <li></li>
                <li></li>
            </ul>

            <p>
                Luego del intercambio realizado, se acuerda:
            </p>

            <ol>
                <li></li>
                <li></li>
                <li></li>
            </ol>

            <br/><br/>

            <table style="width:100%; margin-top:50px;">
                <tr>
                    <td style="text-align:center;">
                        ___________________________
                        <br/>
                        Firma
                    </td>

                    <td style="text-align:center;">
                        ___________________________
                        <br/>
                        Firma
                    </td>
                </tr>
            </table>

        </div>
    `;

    const [contenido, setContenido] = useState(contenidoInicial);

    return (
        <div className="container-fluid">

            <Editor
                apiKey="no-api-key"
                value={contenido}
                onEditorChange={(newValue) => setContenido(newValue)}
                init={{
                    height: 700,
                    menubar: true,

                    plugins: [
                        'advlist',
                        'autolink',
                        'lists',
                        'link',
                        'image',
                        'charmap',
                        'preview',
                        'anchor',
                        'searchreplace',
                        'visualblocks',
                        'code',
                        'fullscreen',
                        'insertdatetime',
                        'media',
                        'table',
                        'help',
                        'wordcount'
                    ],

                    toolbar:
                        'undo redo | ' +
                        'blocks fontfamily fontsize | ' +
                        'bold italic underline forecolor | ' +
                        'alignleft aligncenter alignright alignjustify | ' +
                        'bullist numlist outdent indent | ' +
                        'table | removeformat | fullscreen | code',

                    content_style: `
                        body {
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                            padding: 20px;
                        }

                        table {
                            border-collapse: collapse;
                        }

                        td, th {
                            border: 1px solid #ccc;
                            padding: 8px;
                        }
                    `
                }}
            />

        </div>
    );
}

export default EditorActas;