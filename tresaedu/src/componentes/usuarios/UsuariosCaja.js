import './css/UsuariosCaja.css';
import { Link } from 'react-router-dom';


function UsuariosCaja({ rolNombre, cantidad, icon, info, id, configuracion }) {


    return (
        <Link to={`/Usuarios/${id}`} className='caja text-decoration-none' style={{ border: `1px solid ${configuracion.color_principal}`, display: 'block' }}>
            <div className='caja-circulo-logo' style={{
                backgroundColor: configuracion.color_secundario,
                color: configuracion.color_sterciario,
                border: `1px solid ${configuracion.color_principal}`
            }}
            ><i className={icon}></i></div>
            <h6 className='caja-titulo mb-1' style={{ color: configuracion.color_principal }}><strong>Rol {rolNombre}</strong></h6>
            <hr className="my-1 text-black-50" />
            <div className='caja-cantidades my-2' style={{ color: configuracion.color_principal }}><span>{cantidad}</span> usuario/s </div>
            <div className='caja-info mt-3' style={{ color: configuracion.color_principal }}><span><b>info reciente:</b><br /> {info}</span></div>
        </Link>
    );
}

export default UsuariosCaja;