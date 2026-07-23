import "./css/RolesCaja.css";
import { useNavigate } from "react-router-dom";

function RolesCaja({ingresar,rol, rolSelect, configuracion}){
    const navigate = useNavigate();
    

return(
    <div id="hero" className="m-3 ">
            <div  className="icon-box" onClick={()=>ingresar(rol.id)} style={{background: configuracion.fondo_barra_lateral, border: `1px solid ${configuracion.color_principal}`}}>
                <div className="icon d-flex justify-content-center" style={{color: configuracion.color_secundario}}><i className={rol.icono}></i></div>
                <h4 className="title d-flex justify-content-center" style={{ color:configuracion.color_texto_barra_lateral}}>{rol.nombre}</h4>
                <p className="description2"> </p>
            </div>
    </div>
    );
}

export default RolesCaja;