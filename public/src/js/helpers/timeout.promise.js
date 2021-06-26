const timeoutAsync = t => new Promise( r => setTimeout( () => r(), t ?? 0 ) );
export default timeoutAsync;