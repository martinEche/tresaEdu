import { Link, useNavigate } from "react-router-dom";
import PerfilLogo from "../usuarios/PerfilLogo";

function NavBarEstudianteTutor({ estudiante, configuracion, setVerEstudiante}) {    
    const navigate = useNavigate();

    const salirVista=()=>{
        localStorage.removeItem('kte');
        if (setVerEstudiante) setVerEstudiante(0);
        navigate('/Principal');
        return;
    };

    return (    
        <>
        <nav className="navbar bg-body-tertiary mb-2">
            <div className="d-flex d-wrap justify-content-center">
                <div className="mx-3"><PerfilLogo id={estudiante.estudiante_id} version="logo_solo" configuracion={configuracion} /></div>
                <div>{estudiante.apellido}, {estudiante.nombre }</div>
                <Link className="btn btn-sm btn-outline-secondary mx-2" to={'/Principal'} >
                    <i className="wrap-icon fa-solid fa-home mr-3 me-1"></i>
                    <span className="menu-text">Principal </span>
                </Link>
                <Link className="btn btn-sm btn-outline-secondary mx-2" to={'/Calificaciones'}>
                    <i className="wrap-icon fa-regular text-warning fa-star mr-3 me-1"></i>
                    <span className="menu-text">Calificaciones</span>
                </Link>
                
            </div>
            <div className="d-flex d-wrap justify-content-end ms-auto align-items-center">
                <div className="badge bg-success mx-2 px-2 py-2">Modo Tutor Activo</div>
                <button type="button" className="btn btn-sm btn-danger mx-2" onClick={() => salirVista()}><i className="fa-solid fa-xmark me-1"></i>Cerrar vista</button>
            </div>
        </nav>
        </>
     );
}

export default NavBarEstudianteTutor;