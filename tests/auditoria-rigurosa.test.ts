// Pruebas de la auditoría de Codex (24-10-2026, versión 8118d93). Dos casos de guardado esperaban una excepción:
// se aceptan con un resultado explícito { ok: false }, que la interfaz muestra al usuario (acordado en el plan de acción).
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { makeBackup, parseBackup, importBackup } from '../src/nucleo/backup'
import { listPlays, savePlay, deletePlay, saveLast, loadLast } from '../src/nucleo/storage'
import { PITCH, player, ballAt, line, posAt, type Board, type PitchKind } from '../src/nucleo/model'
import { carrier, movesFromArrows } from '../src/nucleo/steps'
import { paceAt, paceTotal, sampleAt, caption } from '../src/nucleo/motion'
import { TEMPLATES } from '../src/contenido/templates'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Scene } from '../src/pantalla/Scene'
import { DEFAULT_END, saveIdentity, loadIdentity } from '../src/nucleo/identity'

const play = (id: string, board = TEMPLATES[0].build()) => ({ id, name: `QA ${id} Ñ ⚽`, updated: 1, board })
const pack = (board: unknown) => JSON.stringify({app:'TacticalPro',kind:'copia-de-seguridad',version:1,plays:[{id:'qa',name:'QA',updated:1,board}]})
const base = (): Board => ({pitch:'full',tokens:[player('home','11',20,20),player('home','2',50,40),player('away','1',65,30),ballAt(21,20.3)],drawings:[]})
beforeEach(()=>localStorage.clear())
afterEach(()=>vi.restoreAllMocks())

describe('Auditoría: guardado y recuperación',()=>{
 it('conserva textos especiales y la pizarra exacta',()=>{const p=play('1');savePlay(p);expect(listPlays()).toEqual([p])})
 it('actualiza el mismo identificador sin duplicar',()=>{savePlay(play('1'));const p={...play('1'),name:'Corregida',updated:2};savePlay(p);expect(listPlays()).toEqual([p])})
 it('elimina solo la jugada elegida',()=>{savePlay(play('1'));savePlay(play('2'));deletePlay('1');expect(listPlays().map(p=>p.id)).toEqual(['2'])})
 it('recupera exactamente la pizarra abierta',()=>{const b=base();saveLast(b);expect(loadLast()).toEqual(b)})
 it('al agotar espacio debe comunicar que no guardó',()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Llena','QuotaExceededError')});expect(savePlay(play('1'))).toEqual({ok:false,reason:'lleno'})})
 it('el autoguardado también debe comunicar un fallo de escritura',()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Bloqueado','SecurityError')});expect(saveLast(base())).toEqual({ok:false,reason:'bloqueado'})})
 it.each(['{}','null','"texto"'])('tolera datos locales inválidos: %s',(raw)=>{localStorage.setItem('pizarra.jugadas.v1',raw);expect(()=>listPlays()).not.toThrow();expect(listPlays()).toEqual([])})
 it('el guardado de identidad sí informa del error',()=>{vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new DOMException('Llena','QuotaExceededError')});expect(saveIdentity({profiles:[],active:null})).toBe(false)})
})

describe('Auditoría: copias, integridad y errores',()=>{
 it.each(['{','null','[]','{}','"hola"'])('rechaza JSON ajeno o inválido: %s',s=>expect(()=>parseBackup(s)).toThrow())
 it('rechaza una versión futura',()=>expect(()=>parseBackup(JSON.stringify({app:'TacticalPro',kind:'copia-de-seguridad',version:2}))).toThrow())
 it('restaura tras fallar la segunda escritura de una importación',()=>{savePlay(play('original'));const before=localStorage.getItem('pizarra.jugadas.v1');const original=Storage.prototype.setItem;let failed=false;vi.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,k,v){if(k==='pizarra.identidad.v1'&&!failed){failed=true;throw new DOMException('Llena','QuotaExceededError')}return original.call(this,k,v)});const b=parseBackup(pack(base()));expect(()=>importBackup(b)).toThrow();expect(localStorage.getItem('pizarra.jugadas.v1')).toBe(before)})
 it('importar 100 veces la misma copia no duplica nada',()=>{savePlay(play('1'));const b=parseBackup(JSON.stringify(makeBackup()));for(let i=0;i<100;i++)importBackup(b);expect(listPlays()).toHaveLength(1)})
 it('conserva la identidad local al importar otra',()=>{saveIdentity({profiles:[{id:'local',coach:'Local',role:'Analista',club:'A',slogan:''}],active:'local'});const b=parseBackup(JSON.stringify({...makeBackup(),identity:{profiles:[{id:'nuevo',coach:'Nuevo',role:'Entrenador',club:'B',slogan:''}],active:'nuevo'}}));importBackup(b);expect(loadIdentity().active).toBe('local');expect(loadIdentity().profiles).toHaveLength(2)})
 it.each([
 ['campo inexistente',{pitch:'inventado',tokens:[],drawings:[]}],
 ['ficha nula',{pitch:'full',tokens:[null],drawings:[]}],
 ['pasos vacíos',{pitch:'full',tokens:[],drawings:[],frames:[]}],
 ['trazo nulo',{pitch:'full',tokens:[],drawings:[null]}],
 ['coordenadas de texto',{pitch:'full',tokens:[{id:'x',kind:'player',team:'home',label:'1',x:'mal',y:20}],drawings:[]}],
 ])('descarta una jugada dañada: %s',(_,b)=>{expect(parseBackup(pack(b)).plays).toHaveLength(0)})
 it('rechaza o normaliza favoritos dañados del cierre',()=>{const b=parseBackup(JSON.stringify({...makeBackup(),end:{...DEFAULT_END,favorites:null}}));expect(b.end?.favorites).toBeInstanceOf(Array)})
})

describe('Auditoría: pasos, movimientos y tiempos',()=>{
 it.each(['full','half','grid'] as PitchKind[])('pase y carrera coordinados en %s',pitch=>{const b=base();b.pitch=pitch;const a=b.tokens[0],r=b.tokens[1],ball=b.tokens[3];const target:[number,number]=[PITCH[pitch].w*.7,PITCH[pitch].h*.7];const out=movesFromArrows(b,0,[line('pass',[[a.x,a.y],target]),line('run',[[r.x,r.y],target])]);expect(out[r.id]).toEqual(target);expect(Math.hypot(out[ball.id][0]-target[0],out[ball.id][1]-target[1])).toBeLessThan(PITCH[pitch].r)})
 it('una carrera dibujada lejos no mueve al jugador',()=>{const b=base();expect(movesFromArrows(b,0,[line('run',[[100,65],[90,60]])])).toEqual({})})
 it('un trazo con un solo punto no mueve fichas',()=>{expect(movesFromArrows(base(),0,[line('pass',[[20,20]])])).toEqual({})})
 it('sin balón no hay poseedor',()=>{const b=base();b.tokens=b.tokens.filter(t=>t.kind!=='ball');expect(carrier(b,0)).toBeNull()})
 it('no modifica el tablero de entrada al calcular movimientos',()=>{const b=base(),before=JSON.stringify(b);movesFromArrows(b,0,[line('run',[[20,20],[30,25]])]);expect(JSON.stringify(b)).toBe(before)})
 it.each([3,5,8,10])('tiempos finitos, monótonos y acotados con pasos de %s s',step=>{for(const speed of ['lenta','normal','rapida'] as const){const p={step,speed};let prev=0;for(let k=0;k<=1000;k++){const s=paceAt(5,p,k*paceTotal(5,p)/1000);expect(Number.isFinite(s)).toBe(true);expect(s).toBeGreaterThanOrEqual(prev);expect(s).toBeLessThanOrEqual(4);prev=s}expect(prev).toBe(4)}})
 it('en todas las plantillas el muestreo no modifica posiciones ni dibujos',()=>{for(const t of TEMPLATES){const b=t.build(),before=JSON.stringify(b),n=b.frames?.length??1;for(const tok of b.tokens)for(let s=0;s<=Math.max(0,n-1);s+=.5)sampleAt(b,tok,s);expect(JSON.stringify(b),t.name).toBe(before)}})
 it('todas las plantillas dibujan SVG en cada paso y en sus transiciones',()=>{for(const t of TEMPLATES){const b=t.build(),n=b.frames?.length??1;for(let s=0;s<n;s+=.5){const text=renderToStaticMarkup(createElement(Scene,{board:b,s}));expect(text,t.name).not.toMatch(/NaN|Infinity|undefined/);expect(text.length).toBeGreaterThan(0)}}})
 it('las notas apuntan a pasos existentes en todas las plantillas',()=>{for(const t of TEMPLATES){const b=t.build(),n=b.frames?.length??0;if(!n)continue;for(let s=0;s<n;s+=.125){const c=caption(b,s);expect(c.k).toBeGreaterThanOrEqual(0);expect(c.k).toBeLessThan(n);expect(c.prev).toBeLessThan(n);expect(Number.isFinite(c.fade)).toBe(true)}}})
 it('posAt conserva los valores exactos de cada paso',()=>{for(const t of TEMPLATES){const b=t.build();for(let i=1;i<(b.frames?.length??0);i++)for(const tok of b.tokens){const expected=b.frames![i].pos[tok.id];if(expected)expect(posAt(b,tok,i)).toEqual(expected)}}})
})
