import { useEffect, useState } from "react";

function AlertaTarjeta({titulo, subtitulo, datos}) {
    const [estilo, setEstilo] = useState('success');
    const [icono, setIcono] = useState(''); 

    useEffect(() => {
        if(titulo=='Inasistencias'){
            setEstilo('danger');
            setIcono('fa-solid fa-calendar-day')
        }
        if(titulo=='Logros'){
            setEstilo('success');
            setIcono('fa-solid fa-star text-warning')
        }
    }, [titulo, subtitulo, datos]);
    return ( 
        <>
            <div className={`card shadow text-bg-${estilo} mb-3 p-3`} >
                <div className="row">
                    <div className="col-2">
                    <h1 className="pe-1"><i className={`${icono} me-2`}></i></h1>
                    </div>
                    <div className="col-6">
                        <div>{titulo}</div>
                        <div>{subtitulo}</div>
                    </div>
                    <div className="col-4">
                        <h2 className="d-flex d-wrap justify-content-center">1</h2>
                    </div>
                </div>
                <div className="border-top border-dark">
                {datos.map((d, index)=>(
                    <div key={index}><i className={`${icono} me-1`} ></i>{d.fecha} {d.espacio}</div>
                ))}
                </div>
            </div>
        </>
     );
}

export default AlertaTarjeta;