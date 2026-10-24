import { useRef, useState } from 'react'
import { PITCH, uid, type Board } from '../../nucleo/model'
import { damagedPlays, deletePlay, listPlays, savePlay, type SavedPlay, type SaveResult } from '../../nucleo/storage'
import { backupFile, describeImport, downloadBackup, importBackup, lastBackup, markBackupDone, parseBackup } from '../../nucleo/backup'
import { lang, t } from '../../i18n'
import { Sheet } from './Hoja'

const saveError = (r: SaveResult) => !r.ok && r.reason === 'lleno'
  ? t('No se pudo guardar: este dispositivo no tiene espacio. Tu jugada sigue abierta: pulsa «Exportar copia de seguridad» para no perderla.')
  : t('No se pudo guardar: este navegador no deja guardar (¿modo incógnito?). Tu jugada sigue abierta: pulsa «Exportar copia de seguridad» para no perderla.')

export function PlaysSheet({ board, onOpen, onClose, onSaved, onImported }: { board: Board; onOpen: (b: Board) => void; onClose: () => void; onSaved: () => void; onImported: () => void }) {
  const [plays, setPlays] = useState<SavedPlay[]>(listPlays)
  const [name, setName] = useState('')
  const [confirm, setConfirm] = useState<string | null>(null)
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const n = name.trim() || t('Jugada {n}', { n: plays.length + 1 })
    const r = savePlay({ id: uid(), name: n, updated: Date.now(), board })
    setPlays(listPlays())
    // Solo se dice «guardada» si de verdad se escribió; si no, la jugada sigue abierta y se ofrece la copia.
    if (!r.ok) { setSaveErr(saveError(r)); return }
    setSaveErr(null)
    setName('')
    onSaved()
  }
  // Copia de seguridad: llevar las jugadas y «Mi identidad» a otro navegador o dispositivo con un archivo.
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const damaged = damagedPlays()
  const downloadDamaged = () => {
    const url = URL.createObjectURL(new Blob([damaged ?? ''], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'TacticalPro-jugadas-apartadas.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
  const fileRef = useRef<HTMLInputElement>(null)
  const [last, setLast] = useState(lastBackup)
  const exportBackup = async () => {
    // En iPhone y iPad la descarga directa no siempre deja el archivo a mano: se abre «Compartir» para guardarlo en Archivos.
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
    if (ios) {
      const f = backupFile(board)
      if (navigator.canShare?.({ files: [f] })) {
        try { await navigator.share({ files: [f], title: f.name }); markBackupDone(); setLast(lastBackup()); setBackupMsg({ ok: true, text: t('Elige «Guardar en Archivos» para conservar la copia.') }); return }
        catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return }
      }
    }
    try {
      const f = downloadBackup(board)
      setLast(lastBackup())
      setBackupMsg({ ok: true, text: t('Copia guardada en tus descargas como «{f}».', { f: f.name }) })
    } catch { setBackupMsg({ ok: false, text: t('No se pudo crear la copia en este navegador.') }) }
  }
  const pickBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const r = importBackup(parseBackup(await file.text()))
      setPlays(listPlays())
      onImported()
      setBackupMsg({ ok: true, text: describeImport(r) })
    } catch (err) {
      setBackupMsg({ ok: false, text: err instanceof Error ? err.message : t('No se pudo importar la copia.') })
    }
  }
  return (
    <Sheet title={t('Mis jugadas')} onClose={onClose}>
      <form className="saveform" onSubmit={save}>
        <input id="play-name" placeholder={t('Nombre, por ejemplo: Córner primer palo')} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="primary" type="submit">{t('Guardar la pizarra actual')}</button>
      </form>
      {saveErr && <p className="backup-msg error" role="alert">{saveErr}</p>}
      <p className="muted small">{t('Las jugadas se guardan en este dispositivo, con sus pasos de animación.')}</p>
      {damaged && (
        <div className="backup-msg error" role="status">
          <p>{t('Encontramos jugadas guardadas que no se pueden leer. Las apartamos sin borrarlas: descárgalas y escríbenos para ayudarte a recuperarlas.')}</p>
          <button onClick={downloadDamaged}>{t('Descargar lo apartado')}</button>
        </div>
      )}
      <div className="list">
        {plays.length === 0 && <p className="muted">{t('Todavía no hay jugadas guardadas.')}</p>}
        {plays.map((p) => (
          <div key={p.id} className="row play">
            <div>
              <b>{p.board.frames && '▶ '}{p.name}</b>
              <span className="muted small">{PITCH[p.board.pitch].name} · {new Date(p.updated).toLocaleDateString('es')}</span>
            </div>
            <button onClick={() => onOpen(p.board)}>{t('Abrir')}</button>
            {confirm === p.id ? (
              <button className="danger" onClick={() => { const r = deletePlay(p.id); setPlays(listPlays()); setConfirm(null); if (!r.ok) setBackupMsg({ ok: false, text: t('No se pudo eliminar: este navegador no deja guardar cambios.') }) }}>{t('Confirmar')}</button>
            ) : (
              <button onClick={() => setConfirm(p.id)}>{t('Eliminar')}</button>
            )}
          </div>
        ))}
      </div>
      <section className="backup" aria-labelledby="backup-title">
        <h3 id="backup-title">{t('Copia de seguridad')}</h3>
        <p className="muted small">{t('Guarda en un archivo tus jugadas (con sus pasos, movimientos y textos), la pizarra que tienes abierta aunque no la hayas guardado y «Mi identidad» con tu escudo. Ábrelo en otro navegador, móvil u ordenador para recuperarlo todo. No necesitas cuenta: el archivo es tuyo.')}</p>
        <p className={last ? 'muted small' : 'small backup-warn'}>{last ? t('Última copia: {d}.', { d: last.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es') }) : t('Aún no has hecho ninguna copia en este dispositivo. Si se borran los datos del navegador, se pierden tus jugadas.')}</p>
        <div className="backup-actions">
          <button className="primary" onClick={exportBackup}>{t('Exportar copia de seguridad')}</button>
          <button onClick={() => fileRef.current?.click()}>{t('Importar copia de seguridad')}</button>
          <input ref={fileRef} id="backup-file" type="file" accept=".json,application/json" hidden onChange={pickBackup} />
        </div>
        <p className="muted small">{t('Al importar se añade lo que falta y se conserva todo lo que ya tienes aquí. Lo repetido no se duplica.')}</p>
        {backupMsg && <p className={backupMsg.ok ? 'backup-msg' : 'backup-msg error'} role="status">{backupMsg.text}</p>}
      </section>
    </Sheet>
  )
}
