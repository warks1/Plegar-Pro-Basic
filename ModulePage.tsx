import {Link} from 'react-router-dom';
import {AlertTriangle, ArrowRight, Boxes, FileQuestion} from 'lucide-react';
import {Page} from './Page';

type Props={title:string;route:string;detail?:string};
export function ModulePage({title,route,detail}:Props){
  return <Page title={title} subtitle="Estado del módulo y recuperación de la fuente">
    <section className="module-recovery-panel" role="status" aria-live="polite">
      <div className="module-recovery-icon"><FileQuestion size={28}/></div>
      <h2>Implementación original no encontrada</h2>
      <p>La ruta <code>{route}</code> ya está conectada, pero el repositorio no contiene la página fuente original de este módulo. Para evitar una pantalla en blanco o errores de importación, se muestra este aviso explícito en lugar de simular funciones que no están implementadas.</p>
      {detail&&<p>{detail}</p>}
      <div className="module-recovery-note"><AlertTriangle size={18}/><span>La interfaz de recuperación no sustituye la funcionalidad industrial del módulo. Para restaurarla hacen falta sus archivos fuente originales.</span></div>
      <h3>Continuar trabajando</h3>
      <p>Abre una sección cuya implementación sí está presente en el código fuente:</p>
      <nav className="module-recovery-links" aria-label="Módulos disponibles">
        <Link to="/"><Boxes size={17}/> Inicio <ArrowRight size={16}/></Link>
        <Link to="/desarrollo">Desarrollo <ArrowRight size={16}/></Link>
        <Link to="/colisiones">Colisiones <ArrowRight size={16}/></Link>
        <Link to="/ajustes">Ajustes <ArrowRight size={16}/></Link>
      </nav>
    </section>
  </Page>;
}
