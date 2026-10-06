import {Component,type ErrorInfo,type ReactNode} from 'react';

type Props={children:ReactNode;moduleKey:string};
type State={error:Error|null};

export class ModuleBoundary extends Component<Props,State>{
  state:State={error:null};
  static getDerivedStateFromError(error:Error):State{return{error}}
  componentDidCatch(error:Error,info:ErrorInfo){
    try{localStorage.setItem('plegar-pro-last-module-error',JSON.stringify({module:this.props.moduleKey,message:error.message,stack:error.stack,componentStack:info.componentStack,at:new Date().toISOString()}))}catch{/* storage optional */}
  }
  componentDidUpdate(prev:Props){if(prev.moduleKey!==this.props.moduleKey&&this.state.error)this.setState({error:null})}
  render(){
    if(!this.state.error)return this.props.children;
    return <section className="panel module-recovery"><h2>Este módulo no ha podido cargarse</h2><p>El resto de Plegar Pro continúa disponible. Puedes reiniciar únicamente esta pantalla o volver al módulo anterior.</p><pre>{this.state.error.message}</pre><div className="form-actions"><button type="button" onClick={()=>this.setState({error:null})}>Reiniciar módulo</button><button type="button" onClick={()=>history.back()}>← Volver</button><button type="button" onClick={()=>location.assign('/')}>Ir a Inicio</button></div></section>;
  }
}
