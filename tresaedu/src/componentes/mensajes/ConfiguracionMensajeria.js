import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CONFIG from "../../config.js";

const URL_ROLES = `${CONFIG.API_URL}/operarRoles.php`;
const URL_MENSAJERIA = `${CONFIG.API_URL}/operarRolesReglas.php`;

function ConfiguracionMensajeria({acceder, rol, configuracion }) {
    const navigate = useNavigate();
    const [roles, setRoles] = useState([]);
    const [reglas, setReglas] = useState([]);
    const [rolOrigen, setRolOrigen] = useState("");
    const [rolDestino, setRolDestino] = useState("");
    const [noPermitido, setNoPermitido] = useState(true);

     useEffect(() => {
            if(!acceder){
                localStorage.clear();
                navigate('/');
            }
    }, [acceder]);

    useEffect(() => {
        obtenerRoles();
        obtenerReglas();
    }, []);

    const obtenerRoles = async () => {
        try {
            const res = await axios.get(URL_ROLES);
            if (!res.data.resultado) {
                setRoles(res.data);
            }
        } catch (err) {
        console.error("Error al obtener roles", err);
        }
    };

    const obtenerReglas = async () => {
        try {
            const res = await axios.get(URL_MENSAJERIA);
            if (!res.data.resultado) {
                setReglas(res.data);
            }
        } catch (err) {
        console.error("Error al obtener reglas", err);
        }
    };
    //funcion para guardar una nueva regla
    const guardarRegla = async () => {
        if (!rolOrigen || !rolDestino) {
            alert("Debe seleccionar rol origen y destino");
            return;
        }
        try {
        const formData = new FormData();
        formData.append("rol_origen", rolOrigen);
        formData.append("rol_destino", rolDestino);
        formData.append("noPermitido", noPermitido ? 1 : 0);

        const res = await axios.post(URL_MENSAJERIA, formData);
        console.log(res.data);
        if (res.data) {
            alert("Regla guardada correctamente");
            obtenerReglas();
        } else {
            alert("Error: " + res.data.message);
        }
        } catch (err) {
        console.error("Error al guardar regla", err);
        }
    };

    //funcion para eliminar una regla
    const eliminaRegla = async (id_regla) => {
        const res = await axios.delete(URL_MENSAJERIA,  {
      params: {
        accion: 'eliminarTema',
        id: id_regla
      }
    });
        console.log(res.data);
        if (res.data[0] === 'success') {
            alert("Regla eliminada correctamente");
            obtenerReglas();
        } else {
            alert("Error: " + res.data[1]);
        }
    };

    return (
        <div className="container mb-4 pb-4">
            <h3>Reglas de comunicacion por Rol</h3>

            <div className="row mb-3">
                <div className="col-md-4">
                <label>Rol Origen</label>
                <select
                    className="form-select"
                    value={rolOrigen}
                    onChange={(e) => setRolOrigen(e.target.value)}
                >
                    <option value="">Seleccione</option>
                    {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                    {r.nombre}
                    </option>
                    ))}
                </select>
                </div>

                <div className="col-md-4">
                <label>Rol Destino</label>
                <select
                    className="form-select"
                    value={rolDestino}
                    onChange={(e) => setRolDestino(e.target.value)}
                >
                    <option value="">Seleccione</option>
                    {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                        {r.nombre}
                    </option>
                    ))}
                </select>
                </div>

                <div className="col-md-2 d-flex align-items-center">
                <div className="form-check mt-4">
                    <input
                    className="form-check-input"
                    type="checkbox"
                    checked={noPermitido}
                    onChange={(e) => setNoPermitido(e.target.checked)}
                    />
                    <label className="form-check-label">No Permitido</label>
                </div>
                </div>

                <div className="col-md-2 d-flex align-items-end">
                <button className="btn btn-success w-100" onClick={guardarRegla}>
                    Guardar regla
                </button>
                </div>
            </div>

            <h4> </h4>
            <div class="list-group">
                <button type="button" class="list-group-item list-group-item-action active" aria-current="true">
                    🚫 Reglas Cargadas
                </button>
                {reglas.map((r,index) => (
                <button key={r.id}type="button" class="list-group-item list-group-item-action">{index+1}. {r.rol_origen == r.rol_destino ? (
                    <>No pueden enviarse mensajes entre <strong>{r.rol_origen_nombre}s</strong> </>
                ) : (
                    <>Un usuario con el rol <strong>{r.rol_origen_nombre}</strong> no puede enviar mensajes a usaurios con el rol <strong>{r.rol_destino_nombre}</strong></>
                )}
                    <button className="btn btn-sm btn-outline-danger mx-2" onClick={()=>eliminaRegla(r.id)}>Eliminar regla</button>
                </button>
            ))}
            </div>
        </div>
    );
}

export default ConfiguracionMensajeria;