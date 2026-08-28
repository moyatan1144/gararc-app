import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newId, nowIso } from '../db'
import { readImageAsDataUrl } from '../lib/image'
import BackHeader from '../components/BackHeader'
import ConfirmDeleteButton from '../components/ConfirmDeleteButton'

export default function VehicleFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const existing = useLiveQuery(
    () => (id ? db.vehicles.get(id) : undefined),
    [id],
  )

  const [name, setName] = useState('')
  const [model, setModel] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [displacementCc, setDisplacementCc] = useState('')
  const [modelYear, setModelYear] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [currentOdometer, setCurrentOdometer] = useState('0')
  const [purchaseOdometer, setPurchaseOdometer] = useState('')
  const [specNotes, setSpecNotes] = useState('')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined)
  const [loaded, setLoaded] = useState(!isEdit)

  if (isEdit && existing && !loaded) {
    setName(existing.name)
    setModel(existing.model ?? '')
    setManufacturer(existing.manufacturer ?? '')
    setDisplacementCc(existing.displacementCc !== undefined ? String(existing.displacementCc) : '')
    setModelYear(existing.modelYear !== undefined ? String(existing.modelYear) : '')
    setPlateNumber(existing.plateNumber ?? '')
    setCurrentOdometer(String(existing.currentOdometer))
    setPurchaseOdometer(
      existing.purchaseOdometer !== undefined ? String(existing.purchaseOdometer) : '',
    )
    setSpecNotes(existing.specNotes ?? '')
    setPhotoDataUrl(existing.photoDataUrl)
    setLoaded(true)
  }

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readImageAsDataUrl(file)
    setPhotoDataUrl(dataUrl)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const now = nowIso()

    const fields = {
      name,
      model: model || undefined,
      manufacturer: manufacturer || undefined,
      displacementCc: displacementCc ? Number(displacementCc) : undefined,
      modelYear: modelYear ? Number(modelYear) : undefined,
      plateNumber: plateNumber || undefined,
      currentOdometer: Number(currentOdometer) || 0,
      purchaseOdometer: purchaseOdometer ? Number(purchaseOdometer) : undefined,
      specNotes: specNotes || undefined,
      photoDataUrl,
    }

    if (isEdit && id) {
      await db.vehicles.update(id, { ...fields, updatedAt: now })
      navigate(`/vehicles/${id}`)
    } else {
      const vehicleId = newId()
      await db.vehicles.add({
        id: vehicleId,
        ...fields,
        createdAt: now,
        updatedAt: now,
      })
      navigate(`/vehicles/${vehicleId}`)
    }
  }

  async function handleDelete() {
    if (!id) return
    await db.transaction(
      'rw',
      db.vehicles,
      db.bikeLogRecords,
      db.fuelRecords,
      db.deadlines,
      async () => {
        await db.bikeLogRecords.where('vehicleId').equals(id).delete()
        await db.fuelRecords.where('vehicleId').equals(id).delete()
        await db.deadlines.where('vehicleId').equals(id).delete()
        await db.vehicles.delete(id)
      },
    )
    navigate('/')
  }

  return (
    <div className="p-4">
      <BackHeader
        title={isEdit ? '車両を編集' : '車両を追加'}
        to={isEdit && id ? `/vehicles/${id}` : '/'}
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="車体の写真（任意）">
          <input
            id="vehicle-photo-input"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
          {photoDataUrl ? (
            <div className="flex items-center gap-3">
              <img
                src={photoDataUrl}
                alt=""
                className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-800"
              />
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="vehicle-photo-input"
                  className="btn-secondary text-sm py-2 px-4 cursor-pointer text-center"
                >
                  写真を変更
                </label>
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(undefined)}
                  className="text-red-600 text-sm"
                >
                  写真を削除
                </button>
              </div>
            </div>
          ) : (
            <label
              htmlFor="vehicle-photo-input"
              className="flex flex-col items-center justify-center gap-1 h-28 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 cursor-pointer active:bg-slate-100 dark:active:bg-slate-800"
            >
              <span className="text-2xl leading-none">📷</span>
              <span className="text-sm">タップして写真を選択</span>
            </label>
          )}
        </Field>
        <Field label="車両名（例: マイCB400）">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="愛車の呼び名"
          />
        </Field>
        <div className="flex flex-col sm:flex-row gap-3">
          <Field label="メーカー（任意）">
            <input
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="input"
              placeholder="例: Honda"
            />
          </Field>
          <Field label="車種（任意）">
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="input"
              placeholder="例: CB400SF"
            />
          </Field>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Field label="排気量 (cc・任意)">
            <input
              type="number"
              inputMode="numeric"
              value={displacementCc}
              onChange={(e) => setDisplacementCc(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="年式（任意）">
            <input
              type="number"
              inputMode="numeric"
              value={modelYear}
              onChange={(e) => setModelYear(e.target.value)}
              className="input"
              placeholder="例: 2015"
            />
          </Field>
        </div>
        <Field label="ナンバー（任意）">
          <input
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            className="input"
          />
        </Field>
        <div className="flex flex-col sm:flex-row gap-3">
          <Field label="現在の走行距離 (km)">
            <input
              required
              type="number"
              inputMode="numeric"
              value={currentOdometer}
              onChange={(e) => setCurrentOdometer(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="購入時の走行距離 (km・任意)">
            <input
              type="number"
              inputMode="numeric"
              value={purchaseOdometer}
              onChange={(e) => setPurchaseOdometer(e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="メモ（任意）">
          <textarea
            value={specNotes}
            onChange={(e) => setSpecNotes(e.target.value)}
            className="input"
            rows={4}
            placeholder="例: 保管場所、任意保険の連絡先、気になる症状など自由にメモ"
          />
          <span className="text-xs text-slate-500">
            マフラーやミラーなどのカスタム内容は「バイクログ」タブで記録できます。
          </span>
        </Field>

        <button type="submit" className="btn-primary mt-2">
          {isEdit ? '更新する' : '登録する'}
        </button>

        {isEdit && (
          <ConfirmDeleteButton
            onConfirm={handleDelete}
            label="この車両を削除する"
            confirmMessage="この車両と関連する記録をすべて削除します。よろしいですか？"
          />
        )}
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm flex-1 min-w-0">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      {children}
    </label>
  )
}
