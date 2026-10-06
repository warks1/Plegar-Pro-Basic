import {isRouteErrorResponse,useNavigate,useRouteError} from 'react-router-dom';

export function AppErrorPage(){
  const error=useRouteError();
  const navigate=useNavigate();
  const message=isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error?error.message:'Se produjo un error inesperado.';
  const details=error instanceof Error?error.stack:'';
  return <main className="app-error" role="alert">
    <section className="panel app-error-card">
      <div className="error-symbol">!</div>
      <h1>Plegar Pro ha detenido este módulo</h1>
      <p>No se ha cerrado toda la aplicación. Puedes volver al inicio o limpiar únicamente los datos locales si el error procede de un estado guardado antiguo.</p>
      <pre>{message}</pre>
      <div className="actions">
        <button type="button" onClick={()=>navigate('/')}>Volver al inicio</button>
        <button type="button" onClick={()=>location.reload()}>Reintentar</button>
        <button type="button" className="danger" onClick={()=>{
          localStorage.removeItem('plegar-pro-modern-v12');
          location.assign('/');
        }}>Restablecer datos locales</button>
      </div>
      <details><summary>Detalles técnicos</summary><pre>{details||message}</pre></details>
    </section>
  </main>;
}
