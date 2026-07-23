function MostrarEncabezadosActividades({actividades}) {       
    return (  
        <>
        {actividades.length>0 ? actividades.map((a) => (
            <th key={a.id} className='text-center'> {a.titulo} ({a.id})</th>
        ))
        :
        ''
        }
        </>
    );
}

export default MostrarEncabezadosActividades;        