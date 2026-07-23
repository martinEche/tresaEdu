import '../usuarios/css/fichaUsuario.css';
import CONFIG from '../../config';


function InfoPersona({datosUser, datosCurso, anioActual, configuracion}) {
    const defaultFilePerfil='https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
   
    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return 'N/A';
        const hoy = new Date();
        const [dia, mes, anio] = fechaNacimiento.split("/");
        const nacimiento = new Date(`${anio}-${mes}-${dia}`);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const m = hoy.getMonth() - nacimiento.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return edad;
    };

    // Busca si hay un registro con el año actual
    const registroActual = datosCurso.find(d => d.cohorte === anioActual);

    const obtenerIniciales = (nombre, apellido) => {
        const n = nombre ? nombre.charAt(0).toUpperCase() : "";
        const a = apellido ? apellido.charAt(0).toUpperCase() : "";
        return n + a;
    };

    const generarColor = (texto) => {
        const colores = ["#0d6efd", "#198754", "#dc3545", "#fd7e14", "#6f42c1"];
        let index = texto ? texto.charCodeAt(0) % colores.length : 0;
        return colores[index];
    };
    return (        
        <div className="m-3 d-flex flex-column align-items-center text-center">
            <div className="avatar-wrapper">
                {(datosUser.imagen_perfil && datosUser.imagen_perfil !== '') ? (
                    <div className="imagen-circular-estudiante">
                        <img 
                                src={`${CONFIG.API_URL}/${datosUser.imagen_perfil}`} 
                                alt="perfil"
                            />
                        </div>
                ) : (
                   <div 
                        className="imagen-circular-estudiante"
                        style={{ backgroundColor: generarColor(datosUser.nombre) }}
                    >
                        {obtenerIniciales(datosUser.nombre, datosUser.apellido)}
                    </div>
                )}

                {/* 🔽 LOGO */}
                {configuracion?.logo_solo && (
                    <img 
                        src={`${CONFIG.BASE_URL}/img/${configuracion.logo_solo}`}
                        className="logo-inferior"
                        alt="Logo"
                    />
                )}
            </div>
            <div className='card shadow border-0 opacity-75 p-2 mt-2 '>
                <h4 className="titulo-nombre">
                    {datosUser.nombre} {datosUser.apellido} 
                    {registroActual? (
                        <i className="text-success bi bi-house-heart ms-1"></i>
                    ) : (
                        <i className="text-danger bi bi-house-x-fill ms-1"></i>
                    )}
                </h4>
                <div className='datos'>
                 {datosUser.apodo} 
                </div>
                <div className='datos'>
                    <i className="bi bi-calendar3-event me-1"></i>
        
                    {datosUser.fecnac} ({calcularEdad(datosUser.fecnac)} años)
                </div>
            </div>
           
        </div>
     );
}

export default InfoPersona;