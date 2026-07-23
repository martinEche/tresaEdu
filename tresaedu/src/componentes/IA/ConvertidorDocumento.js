import { useState } from "react";
import axios from "axios";

import CONFIG from '../../config';
const URL_CONVERTIR = `${CONFIG.API_URL}/convertirDocumento.php`;
//const URL_CONVERTIR = `${CONFIG.API_URL}/convertirDocumentoDeepSeek.php`;

function ConvertidorDocumento (){

  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setArchivo(file);
    setPreview(URL.createObjectURL(file));
  };

  const enviarDocumento = async () => {

    if (!archivo) return alert("Seleccione una imagen");

    const formData = new FormData();
    formData.append("archivo", archivo);

    try {
      setLoading(true);

      const res = await axios.post( URL_CONVERTIR, formData );

      if(!res.data.error) {
        setHtml(res.data.html);
      } else {
        alert(res.data.error);
      }

    } catch (err) {
      console.error(err);
      alert("Error al convertir documento."+err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>

      <h2>Convertir Documento a HTML</h2>

      <input type="file" accept="image/*" onChange={handleFile} />

      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{ width: 300, marginTop: 10 }}
        />
      )}

      <br /><br />

      <button onClick={enviarDocumento}>
        {loading ? "Procesando..." : "Convertir"}
      </button>

      <hr />

      {html && (
        <div
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

    </div>
  );
};

export default ConvertidorDocumento;
