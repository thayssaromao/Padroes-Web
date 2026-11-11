// Descarta o banco em db/ e recria a partir dos dados iniciais em data/.
import { inicializarBanco } from './banco.js';

await inicializarBanco({ resetar: true });
console.log('Banco recriado a partir de data/.');
