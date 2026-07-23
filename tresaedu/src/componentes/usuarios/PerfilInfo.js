function PerfilInfo({perfil}) {
    return (    
        <>
            <table className='table table-striped table-hover'>
                <tbody>
                    <tr><th>Email principal:</th><td>{perfil.email}</td></tr>
                    <tr><th>Email alternativo:</th><td>{perfil.email2 || <span className="text-muted">No registrado</span>}</td></tr>
                    <tr><th>Genero:</th><td>{perfil.genero}</td></tr>
                    <tr><th>Telefono:</th><td>{perfil.telefono}</td></tr>
                    <tr><th>Calle:</th><td>{perfil.calle} N°:{perfil.numero}</td></tr>
                    <tr><th>Piso:</th><td>{perfil.piso}</td></tr>
                    <tr><th>Dpto:</th><td>{perfil.depto}</td></tr>
                    <tr><th>Ciudad:</th><td>{perfil.ciudad}</td></tr>
                    <tr><th>Provincia:</th><td>{perfil.provincia}</td></tr>                                  
                </tbody>
            </table>
        </>
     );
}

export default PerfilInfo;