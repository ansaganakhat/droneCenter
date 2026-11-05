import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const presentationTypes = { '.pdf': 'pdf', '.ppt': 'ppt', '.pptx': 'pptx', '.html': 'html', '.htm': 'html' }
const videoTypes = { '.mp4': 'mp4', '.webm': 'webm' }

async function readOptionalJson(filename) {
  try { return JSON.parse(await readFile(filename, 'utf8')) }
  catch (error) { if (error.code === 'ENOENT') return {}; throw new Error(`${filename}: ${error.message}`) }
}

async function scanFiles(directory, types, prefix) {
  let entries
  try { entries = await readdir(directory, { withFileTypes: true }) }
  catch (error) { if (error.code === 'ENOENT') return []; throw error }
  const result = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'kk'))) {
    if (entry.name.startsWith('.')) continue
    const encodedName = encodeURIComponent(entry.name)
    if (entry.isDirectory()) result.push(...await scanFiles(path.join(directory, entry.name), types, `${prefix}/${encodedName}`))
    else if (entry.isFile()) {
      const extension = path.extname(entry.name).toLowerCase()
      if (!types[extension]) continue
      result.push({ title: path.basename(entry.name, path.extname(entry.name)).replace(/[_-]+/g, ' ').trim(), type: types[extension], path: `${prefix}/${encodedName}` })
    }
  }
  return result
}

async function validateMaterial(material, group, prefix) {
  if (!material || typeof material.title !== 'string' || !material.title.trim()) throw new Error(`${prefix}: материал атауы керек`)
  const normalized = { ...material, title: material.title.trim() }
  if (typeof normalized.path === 'string' && normalized.path) {
    let decoded
    try { decoded = decodeURIComponent(normalized.path) } catch { throw new Error(`${prefix}: файл жолы қате`) }
    if (decoded.startsWith('/') || decoded.includes('\\') || decoded.split('/').includes('..') || /^[a-z][a-z\d+.-]*:/i.test(decoded)) throw new Error(`${prefix}: тек public ішіндегі салыстырмалы файл жолын көрсетіңіз`)
    const relativePath = decoded.startsWith('content/') ? decoded : `${prefix}/${decoded}`
    const filename = path.join(root, 'public', relativePath)
    if (!(await stat(filename).catch(() => null))?.isFile()) throw new Error(`${prefix}: файл табылмады: ${relativePath}`)
    normalized.path = relativePath.split('/').map(encodeURIComponent).join('/')
    delete normalized.url
    const types = group === 'videos' ? videoTypes : presentationTypes
    normalized.type = types[path.extname(relativePath).toLowerCase()]
    if (!normalized.type) throw new Error(`${prefix}: бұл файл форматы ${group} бөлімінде қолдау таппайды`)
  } else {
    let url
    try { url = new URL(normalized.url) } catch { throw new Error(`${prefix}: файл жолын немесе дұрыс сілтемені көрсетіңіз`) }
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`${prefix}: тек https/http сілтемелерін қолданыңыз`)
    normalized.url = url.href
    delete normalized.path
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) {
      const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : /^\/(embed|shorts|live)\//.test(url.pathname) ? url.pathname.split('/')[2] : url.searchParams.get('v')
      if (group !== 'videos' || !/^[a-zA-Z0-9_-]{11}$/.test(id || '')) throw new Error(`${prefix}: дұрыс YouTube бейне сілтемесін көрсетіңіз`)
      normalized.type = 'youtube'
    } else {
      const types = group === 'videos' ? videoTypes : presentationTypes
      normalized.type ||= types[path.extname(url.pathname).toLowerCase()] || 'link'
      if (!Object.values(types).includes(normalized.type) && normalized.type !== 'link') throw new Error(`${prefix}: ${normalized.type} форматы ${group} бөліміне сәйкес емес`)
    }
  }
  return normalized
}

async function prepareMaterials() {
  const database = JSON.parse(await readFile(path.join(root, 'public/data/lectures.json'), 'utf8'))
  if (!Array.isArray(database.lectures)) throw new Error('lectures.json: дәрістер тізімі қате')
  let presentations = 0, videos = 0
  for (const lecture of database.lectures) {
    if (!/^\d{2}$/.test(lecture.id)) throw new Error('Дәріс идентификаторы екі саннан тұруы керек')
    const prefix = `content/lecture-${lecture.id}`
    const directory = path.join(root, 'public', prefix)
    const extra = await readOptionalJson(path.join(directory, 'materials.json'))
    for (const [group, types] of [['presentations', presentationTypes], ['videos', videoTypes]]) {
      if (extra[group] !== undefined && !Array.isArray(extra[group])) throw new Error(`${prefix}/materials.json: ${group} тізім болуы керек`)
      const discovered = await scanFiles(path.join(directory, group), types, `${prefix}/${group}`)
      const merged = new Map()
      for (const item of [...(lecture.materials[group] || []), ...discovered, ...(extra[group] || [])]) {
        const material = await validateMaterial(item, group, prefix)
        merged.set(material.path || material.url, material)
      }
      lecture.materials[group] = [...merged.values()]
    }
    presentations += lecture.materials.presentations.length
    videos += lecture.materials.videos.length
  }
  await writeFile(path.join(root, 'public/data/lectures.generated.json'), `${JSON.stringify(database, null, 2)}\n`)
  console.log(`Материалдар дайын: ${presentations} презентация, ${videos} бейнематериал.`)
}

prepareMaterials().catch(error => { console.error(error.message); process.exitCode = 1 })
