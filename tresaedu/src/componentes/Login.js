import React, { useState } from 'react';
import './Login.css'; // Importar los estilos

function Login(){
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-left">
          <h2>TresaTec</h2>
          <div className="rocket-icon">
            🚀
          </div>
        </div>
        <div className="login-right">
          <div className="form-header">
            <span 
              className={!isSignUp ? 'active ingresar' : 'ingresar'} 
              onClick={() => setIsSignUp(false)}
            >
              Ingresar
            </span>
            <span 
              className={isSignUp ? 'active registrar' : 'registrar'} 
              onClick={() => setIsSignUp(true)}
            >
              Registrar
            </span>
          </div>
          <form>
						<div class="form-floating mb-3">
							<input type="etextmail" class="form-control" id="floatingInput" placeholder="nombre de usuario" required />
							<label for="floatingInput">Nombre de Usuario</label>
						</div>
						<div class="form-floating">
							<input type="password" class="form-control" id="floatingPassword" placeholder="contraseña" required />
							<label for="floatingPassword">Contraseña</label>
						</div>
            {isSignUp && 
							<>
								<div class="form-floating">
									<input type="password" class="form-control" id="floatingPassword" placeholder="reingrese contraseña" required />
									<label for="floatingPassword">Reingrese Contraseña</label>
								</div>
								<div class="form-floating">
									<input type="password" class="form-control" id="floatingPassword" placeholder="reingrese contraseña" required />
									<label for="floatingPassword">Nombre</label>
								</div>
								<div class="form-floating">
									<input type="password" class="form-control" id="floatingPassword" placeholder="reingrese contraseña" required />
									<label for="floatingPassword">Apellido</label>
								</div>
								<div class="form-floating">
									<input type="password" class="form-control" id="floatingPassword" placeholder="reingrese contraseña" required />
									<label for="floatingPassword">Correo Electronico</label>
								</div>
							</>
						}
            
						<div class="mb-3 form-check terms">
    					<input type="checkbox" class="form-check-input" id="exampleCheck1" />
    					<label class="form-check-label text-white" for="exampleCheck1">Acepto los terminos y condiciones del servicio</label>
 			 			</div>
            <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
